import { Router } from 'express';
import mongoose from 'mongoose';
import { Guild } from '../models/guild';
import { RoleModel } from '../models/role';
import { MemberModel } from '../models/member';
import { addPermission, listPermissions, Permission } from '../models/permissions';
import { ChannelModel } from '../models/channel';

// most bare-bones routes so I can test out creations

const router = Router();

router.post('/guild', async (req, res) => {
  try {
    const {founderId} = req.body;
    const guild = await Guild.create({
      name: 'Test Guild',
      // slug: 'test-guild',
      founderId:founderId,
    });

    res.json(guild);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

router.post('/role', async (req, res) =>{
  try {
    const { guildId } = req.body;

    if (!guildId) {
      res.status(400).json({ error: 'guildId is required' });
    }

    const role = await RoleModel.create({
      name: 'Member',
      guild: guildId,
      permissions: '0', // no permissions
      position: 1,
    });

    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

router.post('/member', async (req, res): Promise<any> => {
  try {
    const { userId, guildId, roleIds } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!guildId) {
      return res.status(400).json({ error: 'guildId is required' });
    }

    let roleObjectIds: mongoose.Types.ObjectId[] = [];
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      roleObjectIds = roleIds.map((id: string) => new mongoose.Types.ObjectId(id));
    }

    const member = await MemberModel.create({
      userId: userId,
      guildId: guildId,
      roleIds: roleObjectIds,
      joinedAt: new Date(),
    });

    res.json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create member', details: err });
  }
});

router.post('/permission', async (req, res): Promise<any> => {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ error: 'roleId is required' });
    }
    const role = await RoleModel.findById(roleId);
    role!.permissions = addPermission(role!.permissions, Permission.SEND_MESSAGES).toString();
    role!.permissions = addPermission(role!.permissions, Permission.MUTE_MEMBERS).toString();
    role!.save();
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});
router.post('/check-permission', async (req, res): Promise<any> => {
  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ error: 'roleId is required' });
  }
  const role = await RoleModel.findById(roleId);
  res.json(listPermissions(role!.permissions));
});

router.post('/channel', async (req, res): Promise<any> => {
  try {
    const { guildId, name, type } = req.body;

    if (!guildId) {
      return res.status(400).json({ error: 'guildId is required' });
    }
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }

    const channel = await ChannelModel.create({
      guildId: new mongoose.Types.ObjectId(guildId),
      name,
      type,
    });

    res.json(channel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create channel', details: err });
  }
});

export default router;
