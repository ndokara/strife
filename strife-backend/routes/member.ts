import { Router } from 'express';
import { Member } from '../models/member';
import { Id } from '../models/common';
import { Guild, IGuild } from '../models/guild';
import { Channel, IChannel } from '../models/channel';
import User from '../models/user';
import { Model } from 'mongoose';
import { verifyToken } from '../middleware/verifyToken';

const router = Router();

const parentModels: Record<'Guild' | 'Channel', Model<IGuild> | Model<IChannel>> = {
  Guild,
  Channel,
};

router.post('/create', async (req, res): Promise<void> => {

  const session = await Member.startSession();
  session.startTransaction();

  try {
    const {
      _id,
      userId,
      parent,
      nickname,
      roles,
      moderation,
      presence
    } = req.body;

    if (!userId) {
      res.status(400).json({ message: 'userId is required.' });
      return;
    }

    if (!parent?.id || !parent?.kind) {
      res.status(400).json({ message: 'Parent (id and kind) are required' });
      return;
    }

    if (parent.kind !== 'Guild' && parent.kind !== 'Channel') {
      res.status(400).json({ message: 'Invalid parent kind. Must be "Guild" or "Channel".' });
      return;
    }

    const kind: 'Guild' | 'Channel' = parent.kind;

    const memberExists = await Member.exists({'userId': userId, 'parent.kind': parent.kind});
    console.log(memberExists);
    if(memberExists) {
      res.status(400).json({ message: `This user is already a member of this ${kind}.` });
      return;
    }

    const ParentModel = (parent.kind === 'Guild' ? Guild : Channel) as Model<unknown>;

    const user = await User.findById(userId, { 'username:': 1 });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const parentDoc: IGuild | IChannel | null = await ParentModel.findById(
      parent.id,
      { 'roles.defaultRoleId': 1 }
    );

    if (!parentDoc) {
      res.status(404).json({ message: `${kind} not found` });
      return;
    }

    const finalRoles: Id[] = [
      ...(roles ?? []),
      ...(parentDoc.roles?.defaultRoleId ? [parentDoc.roles.defaultRoleId] : [])
    ];

    const [member] = await Member.create(
      [{
        _id,
        userId: userId as Id,
        parent: {
          id: parent.id as Id,
          kind: parent.kind,
        },
        nickname: nickname ?? user.username,
        roles: finalRoles,
        joinedAt: new Date(),
        moderation: {
          mute: {
            isMuted: moderation?.mute?.isMuted ?? false,
            expiresAt: moderation?.mute?.expiresAt ?? null,
          },
          ban: {
            isBanned: moderation?.ban?.isBanned ?? false,
            reason: moderation?.ban?.reason ?? null,
          },
        },
        presence: {
          status: presence?.status ?? 'offline',
          customStatus: presence?.customStatus ?? null,
          lastActiveAt: new Date(),
        },
      }],
      { session }
    );

    await ParentModel.updateOne(
      { _id: parent.id },
      {
        $push: {
          members: {
            userId: userId as Id,
            roles: finalRoles,
            nickname: nickname ?? user.username,
            joinedAt: new Date(),
          }
        },
        $inc: { 'stats.memberCount': 1 }
      },
      { session }
    );

    res.status(201).json({ message: 'Member created successfully', member });

    await session.commitTransaction();
    await session.endSession();

  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    console.error('Error creating member:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:parentId/members', verifyToken, async (req, res): Promise<void> => {
  try {
    const parentId = req.params.parentId;
    const kind = req.query.kind;

    if (kind !== 'Guild' && kind !== 'Channel') {
      res.status(400).json({ message: 'Invalid parent kind.' });
      return;
    }

    const ParentModel = parentModels[kind];
    console.log('here', parentId);
    const parentExists = await ParentModel.exists({ _id: parentId });
    if (!parentExists) {
      res.status(404).json({ message: `${kind} not found` });
      return;
    }
    const members = await Member.find({
      'parent.kind': kind,
      'parent.id': parentId,
    }).sort({ position: 1 });

    res.status(200).json(members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

router.get('/:memberId', verifyToken, async (req, res): Promise<void> => {
  try {
    const { memberId } = req.params;
    const member = await Member.findById(memberId);

    if (!member) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    res.status(200).json(member);
  } catch (err) {
    console.error('Error fetching member:', err);
    res.status(500).json({ message: 'Failed to fetch member' });
  }
});

router.delete('/:memberId', async (req, res): Promise<void> => {
  const session = await Member.startSession();
  session.startTransaction();

  try {
    const { memberId } = req.params;

    const deletedMember = await Member.findOneAndDelete({ _id: memberId, }, { session });
    if(!deletedMember) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    const kind: 'Guild' | 'Channel' = deletedMember.parent.kind;
    const ParentModel = (kind === 'Guild' ? Guild : Channel) as Model<unknown>;

    const parentDoc = await ParentModel.findById(deletedMember.parent.id);
    if (!parentDoc) {
      res.status(404).json({ message: `${kind} not found` });
      return;
    }

    await ParentModel.updateOne(
      { _id: deletedMember.parent.id },
      {
        $pull: { members: { userId: deletedMember.userId } },
        $inc: { 'stats.memberCount': -1 }
      },
      { session }
    );

    await session.commitTransaction();
    await session.endSession();

    res.status(200).json({ message: 'Member deleted successfully', deletedMember });

  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    console.error('Error deleting member:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
