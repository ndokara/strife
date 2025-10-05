import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { Channel } from '../models/channel';
import { Role } from '../models/role';
import { Member } from '../models/member';
import { Guild } from '../models/guild';
import { ALL_PERMISSIONS } from '../models/permissions';
import { Id } from '../models/common';

const router = Router();

router.post('/create', verifyToken, async (req, res): Promise<void> => {
  const session = await Channel.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const userId = req.user.id;
    const {
      _id,
      guildId,
      name,
      slug,
      type,
      topic,
      position,
      moderation,
      mediaSettings,
      syncPermissionsWithParent,
      ownerIds: extraOwnerIds = [],
    } = req.body;

    const guild = await Guild.exists({ _id: guildId }).session(session);
    if (!guild) {
      res.status(404).json({ message: 'Guild not found' });
      return;
    }

    const channel = await Channel.create(
      [
        {
          _id,
          guildId,
          name,
          slug,
          type,
          topic,
          ownership: {
            founderId: userId,
            ownerIds: [userId],
          },
          roles: { order: [] },
          position: position ?? 0,
          moderation: {
            nsfw: moderation?.nsfw ?? false,
            rateLimitPerUser: moderation?.rateLimitPerUser ?? undefined,
            isLocked: moderation?.isLocked ?? false,
            archivedAt: null,
          },
          mediaSettings: {
            bitrate: mediaSettings?.bitrate ?? undefined,
            userLimit: mediaSettings?.userLimit ?? undefined,
            rtcRegion: mediaSettings?.rtcRegion ?? null,
            videoQualityMode: mediaSettings?.videoQualityMode ?? 'auto',
          },
          syncPermissionsWithParent:
            syncPermissionsWithParent ?? true,
          members: [
            {
              userId,
              roles: [],
            },
          ],
          activity: {},
        },
      ],
      { session }
    ).then((docs) => docs[0]);

    const [ownerRole, defaultRole] = await Role.insertMany(
      [
        {
          parent: { kind: 'Channel', id: channel._id },
          name: 'Channel Owner',
          appearance: { color: '#00ff00', hoist: true },
          position: 1,
          //TODO: after i differentiate channel permissions, it should be all_channel_permissions here
          permissions: ALL_PERMISSIONS.toString(),
          mentionable: false,
        },
        {
          name: '@everyone',
          permissions: '0',
          parent: { kind: 'Channel', id: channel._id },
          position: 0,
        },
      ],
      { session }
    );

    channel.roles.order = [ownerRole._id as Id];
    channel.roles.defaultRoleId = defaultRole._id as Id;

    const allOwnerIds = new Set([
      ...channel.ownership.ownerIds.map((id) => id.toString()),
      ...extraOwnerIds.map((id: string) => id.toString()),
    ]);
    channel.ownership.ownerIds = Array.from(allOwnerIds);

    const founder = channel.members.find(
      (m) => m.userId.toString() === userId.toString()
    );
    if (founder) {
      founder.roles.push(ownerRole._id as Id, defaultRole._id as Id);
    }

    const foundingMember = await Member.create(
      [
        {
          userId,
          parent: { kind: 'Channel', id: channel._id },
          roles: [ownerRole._id, defaultRole._id],
          joinedAt: Date.now(),
        },
      ],
      { session }
    ).then((docs) => docs[0]);

    await channel.save({ session });
    await foundingMember.save({ session });

    await session.commitTransaction();
    await session.endSession();

    res.status(201).json({ channel, ownerRole, defaultRole });
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();

    console.error('Error creating channel:', err);
    res.status(400).json({ message: 'Failed to create channel' });
  }
});

router.delete('/:channelId', async (req, res): Promise<void> => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findByIdAndUpdate(
      channelId,
      { deletedAt: new Date() }
    );

    if (!channel) {
      res.status(404).json({ message: 'Channel not found' });
      return;
    }

    res.json({ message: 'Channel soft-deleted successfully' });
  } catch (err) {
    console.error('Error soft-deleting channel:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/restore/:channelId', async (req, res): Promise<void> => {
  try {
    const { channelId } = req.params;

    const channel = await (Channel.findOneAndUpdate(
      { _id: channelId },
      { deletedAt: null },
      { new: true }
    ) as any).withDeleted();

    if (!channel) {
      res.status(404).json({ message: 'Channel not found' });
      return;
    }
    res.json({ message: 'Channel restored successfully' });
  } catch (err) {
    console.error('Error soft-deleting channel:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/hard/:channelId', verifyToken, async (req, res): Promise<void> => {
  const session = await Channel.startSession();
  try {
    await session.withTransaction(async (): Promise<void> => {
      const { channelId } = req.params;

      await Role.deleteMany({ 'parent.id': channelId }, { session });
      await Member.deleteMany({ 'parent.id': channelId }, { session });

      const channel = await Channel.findByIdAndDelete(channelId, { session });
      if (!channel) {
        throw new Error('Channel not found');
      }
    });

    res.json({ message: 'Channel hard-deleted successfully' });
  } catch (err) {
    console.error('Error hard-deleting channel:', err);
    if (err instanceof Error && err.message === 'Channel not found') {
      res.status(404).json({ message: 'Channel not found' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  } finally {
    await session.endSession();
  }
});


export default router;
