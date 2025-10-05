import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { IRole, Role } from '../models/role';
import { normalize, Permission, PermissionKey, validatePermissionKeys } from '../models/permissions';
import { Guild, IGuild } from '../models/guild';
import { Channel, IChannel } from '../models/channel';
import { Model } from 'mongoose';
import { Member } from '../models/member';
import { Id, IHasRoles } from '../models/common';

const router = Router();

const parentModels: Record<'Guild' | 'Channel', Model<IGuild> | Model<IChannel>> = {
  Guild,
  Channel,
};

router.post('/create', verifyToken, async (req, res): Promise<void> => {
  const session = await Role.startSession();
  session.startTransaction();

  try {
    const {
      _id,
      parent,
      name,
      appearance,
      position,
      basePermissions,
      allowedPermissions,
      disallowedPermissions,
      mentionable,
    } = req.body;

    if (!parent || !parent.kind || !parent.id) {
      res.status(400).json({ message: 'Parent kind and id are required' });
      return;
    }

    if (parent.kind !== 'Guild' && parent.kind !== 'Channel') {
      res.status(400).json({ message: 'Invalid parent kind. Must be "Guild" or "Channel".' });
      return;
    }

    if (!name || typeof name !== 'string') {
      res.status(400).json({ message: 'Role name is required' });
      return;
    }

    const kind: 'Channel' | 'Guild' = parent.kind;
    const ParentModel = (kind === 'Guild' ? Guild: Channel) as Model<unknown>;
    const parentDoc = await ParentModel.findById(parent.id).session(session);

    if (!parentDoc) {
      res.status(404).json({ message: `${kind} not found` });
      return;
    }

    const combinedPermissions = [
      ...(allowedPermissions ?? []),
      ...(disallowedPermissions ?? [])
    ];
    validatePermissionKeys(combinedPermissions);

    let perms = basePermissions ? normalize(basePermissions) : 0n;

    if (Array.isArray(allowedPermissions)) {
      for (const key of allowedPermissions as PermissionKey[]) {
        perms |= Permission[key];
      }
    }
    if (Array.isArray(disallowedPermissions)) {
      for (const key of disallowedPermissions as PermissionKey[]) {
        perms &= ~Permission[key];
      }
    }

    const [role] = await Role.create(
      [{
        _id,
        parent,
        name,
        appearance,
        position,
        permissions: perms.toString(),
        mentionable,
      }],
      { session }
    );

    const parentDocWithRoles = await ParentModel.findById(parent.id)
      .select('roles.order')
      .session(session) as (Document & IHasRoles) | null;

    const order = parentDocWithRoles!.roles.order;

    // Binary search for insertion point
    let left = 0, right = order.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midRole = await Role.findById(order[mid]).session(session).select('permissions');
      if (BigInt(midRole!.permissions) > perms) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    order.splice(left, 0, <Id>role._id);

    await ParentModel.updateOne(
      { _id: parent.id },
      { $set: { 'roles.order': order } },
      { session }
    );

    await session.commitTransaction();
    await session.endSession();

    res.status(201).json(role);
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    console.error('Error creating role:', err);

    if (err instanceof Error) {
      res.status(400).json({ message: err.message });
    } else {
      res.status(400).json({ message: 'Failed to create role' });
    }
  }
});

router.get('/:parentId/roles', verifyToken, async (req, res): Promise<void> => {
  try {
    const { parentId } = req.params;
    const kind = req.query.kind;

    if (kind !== 'Guild' && kind !== 'Channel') {
      res.status(400).json({ message: 'Invalid parent kind.' });
      return;
    }

    const ParentModel = parentModels[kind];
    const parentExists = await ParentModel.exists({ _id: parentId });
    if (!parentExists) {
      res.status(404).json({ message: `${kind} not found` });
      return;
    }

    const roles = await Role.find({
      'parent.kind': kind,
      'parent.id': parentId,
    });

    res.status(200).json(roles);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
});

router.get('/:roleId', verifyToken, async (req, res): Promise<void> => {
  try {
    const { roleId } = req.params;
    const role = await Role.findById(roleId);

    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    res.status(200).json(role);
  } catch (err) {
    console.error('Error fetching role:', err);
    res.status(500).json({ message: 'Failed to fetch role' });
  }
});

router.delete('/roles/:roleId', verifyToken, async (req, res): Promise<void> => {
  const session = await Role.startSession();
  session.startTransaction();

  try {
    const { roleId } = req.params;

    const role: IRole | null = await Role.findById(roleId).session(session);
    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    const ParentModel = (role.parent.kind === 'Guild' ? Guild : Channel) as Model<unknown>;
    const parentId = role.parent.id;

    await ParentModel.updateOne(
      { _id: parentId },
      {
        $pull: { 'roles.order': role._id },
      },
      { session }
    );

    // Fix defaultRoleId only if it was this role
    await ParentModel.updateOne(
      { '_id': parentId, 'roles.defaultRoleId': role._id },
      { $set: { 'roles.defaultRoleId': null } },
      { session }
    );

    await ParentModel.updateMany(
      { '_id': parentId, 'members.roles': role._id },
      { $pull: { 'members.$[].roles': role._id } },
      { session }
    );

    await Member.updateMany(
      { parent: parentId, roles: role._id },
      { $pull: { roles: role._id } },
      { session }
    );

    await Role.deleteOne({ _id: roleId }, { session });

    await session.commitTransaction();
    await session.endSession();

    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    console.error('Error deleting role:', err);
    res.status(500).json({ message: 'Failed to delete role' });
  }
});

router.post('/assign-role', verifyToken, async (req, res): Promise<void> => {
  const session = await Role.startSession();
  session.startTransaction();

  try {
    const { parent, memberId, roleId } = req.body;

    if (!parent || !parent.kind || !parent.id) {
      res.status(400).json({ message: 'Parent kind and id are required' });
      return;
    }

    if (parent.kind !== 'Guild' && parent.kind !== 'Channel') {
      res.status(400).json({ message: 'Invalid parent kind. Must be "Guild" or "Channel".' });
      return;
    }

    if (!memberId || !roleId) {
      res.status(400).json({ message: 'memberId and roleId are required' });
      return;
    }

    const kind: 'Guild' | 'Channel' = parent.kind;
    const ParentModel = (parent.kind === 'Guild' ? Guild : Channel) as Model<unknown>;

    const parentDoc = await ParentModel.findById(parent.id).session(session);
    if (!parentDoc) {
      res.status(404).json({ message: `${kind} not found` });
      return;
    }

    const role = await Role.findById(roleId).session(session);
    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    await ParentModel.updateOne(
      { '_id': parent.id, 'members._id': memberId },
      { $addToSet: { 'members.$.roles': role._id } },
      { session }
    );

    await Member.updateOne(
      { _id: memberId, parent: parent.id },
      { $addToSet: { roles: role._id } },
      { session }
    );

    await session.commitTransaction();
    await session.endSession();

    res.status(200).json({ message: 'Role assigned to member successfully' });
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    console.error('Error assigning role to member:', err);
    res.status(500).json({ message: 'Failed to assign role to member' });
  }
});

export default router;
