import { Router } from 'express';
import { Guild } from '../models/guild';
import { verifyToken } from '../middleware/verifyToken';
import { Role } from '../models/role';
import { ALL_PERMISSIONS } from '../models/permissions';
import { Member } from '../models/member';
import { Id } from '../models/common';
import { Channel } from '../models/channel';
import mongoose from 'mongoose';
import User from '../models/user';

const router = Router();

router.post('/create', verifyToken, async (req, res) => {
  const session = await Guild.startSession();
  session.startTransaction();

  try {

    const userId = req.user!.id;
    const {
      _id,
      name,
      slug,
      media,
      settings,
      premiumTier,
      ownerIds: extraOwnerIds = [],
    } = req.body;

    const guild = await Guild.create(
      [
        {
          _id: _id,
          name,
          slug,
          media: { iconUrl: media?.iconUrl, bannerUrl: media?.bannerUrl },
          ownership: {
            founderId: userId,
            ownerIds: [userId],
          },
          members: [
            {
              userId,
              roles: [],
            },
          ],
          stats: { memberCount: 1, premiumTier: premiumTier ?? 0 },
          settings: {
            verificationLevel: settings?.verificationLevel ?? 'none',
            explicitContentFilter: settings?.explicitContentFilter ?? 'disabled',
            defaultNotifications: settings?.defaultNotifications ?? 'mentions',
            discoverable: settings?.discoverable ?? false,
            community: settings?.community ?? false,
            locale: settings?.locale ?? 'en-US',
          },
        },
      ],
      { session }
    ).then((docs) => docs[0]);

    const [ownerRole, defaultRole] = await Role.insertMany(
      [
        {
          parent: { kind: 'Guild', id: guild._id },
          name: 'Owner',
          appearance: { color: '#ff0000', hoist: true },
          position: 1,
          permissions: ALL_PERMISSIONS.toString(),
          mentionable: false,
        },
        {
          name: '@everyone',
          permissions: '0',
          parent: { kind: 'Guild', id: guild._id },
          position: 0,
        },
      ],
      { session }
    );

    guild.roles.order = [...(guild.roles.order || []), <Id>ownerRole._id, <Id>defaultRole._id];
    guild.roles.defaultRoleId = <Id>defaultRole._id;

    const allOwnerIds = new Set([
      ...guild.ownership.ownerIds.map((id) => id.toString()),
      ...extraOwnerIds.map((id: string) => id.toString()),
    ]);
    guild.ownership.ownerIds = Array.from(allOwnerIds);

    const founder = guild.members.find(
      (m) => m.userId.toString() === userId.toString()
    );
    if (founder) {
      founder.roles.push(<Id>ownerRole._id, <Id>defaultRole._id);
    }

    const owner = await User.findById(userId, 'username');
    const foundingMember = await Member.create(
      [
        {
          userId,
          nickname: owner!.username,
          parent: { kind: 'Guild', id: guild._id },
          roles: [ownerRole._id, defaultRole._id],
          joinedAt: Date.now(),
        },
      ],
      { session }
    ).then((docs) => docs[0]);

    await guild.save({ session });
    await foundingMember.save({ session });

    await session.commitTransaction();
    await session.endSession();

    res.status(201).json({ guild, ownerRole, defaultRole });
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();

    console.error('Error creating guild:', err);
    res.status(400).json({ message: 'Failed to create guild' });
  }
});

//TODO: should soft/hard deleting a guild soft/hard delete its: channels, members, roles? Probably not.
router.delete('/:guildId', verifyToken, async (req, res): Promise<void> => {
  try {
    const { guildId } = req.params;

    const guild = await Guild.findByIdAndUpdate(
      guildId,
      { deletedAt: new Date() }
    );

    if (!guild) {
      res.status(404).json({ message: 'Guild not found' });
      return;
    }

    res.json({ message: 'Guild soft-deleted successfully' });
  } catch (err) {
    console.error('Error soft-deleting guild:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/restore/:guildId', verifyToken, async (req, res): Promise<void> => {
  try {
    const { guildId } = req.params;

    //TODO: fix this ts stuff. I cant figure it out.
    const guild = await (Guild.findOneAndUpdate(
      { _id: guildId },
      { deletedAt: null },
      { new: true }
    ) as any).withDeleted();

    if (!guild) {
      res.status(404).json({ message: 'Guild not found' });
      return;
    }
    res.json({ message: 'Guild restored successfully' });
  } catch (err) {
    console.error('Error soft-deleting guild:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//TODO: we should also delete channel's members and roles
router.delete('/hard/:guildId', verifyToken, async (req, res): Promise<void> => {
  async function hardDeleteChannel(channelId: string, session: mongoose.ClientSession) {
    await Role.deleteMany({ 'parent.id': channelId }, { session });
    await Member.deleteMany({ 'parent.id': channelId }, { session });
    await Channel.findByIdAndDelete(channelId, { session });
  }

  async function hardDeleteGuild(guildId: string, session: mongoose.ClientSession) {
    const channels = await Channel.find({ guildId }, null, { session });
    for (const channel of channels) {
      await hardDeleteChannel(channel._id.toString(), session);
    }
    await Role.deleteMany({ 'parent.id': guildId }, { session });
    await Member.deleteMany({ 'parent.id': guildId }, { session });
    await Guild.findByIdAndDelete(guildId, { session });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await hardDeleteGuild(req.params.guildId, session);
    });

    res.json({ message: 'Guild hard-deleted successfully' });
  } catch (err) {
    console.error('Error hard-deleting guild:', err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await session.endSession();
  }

});

export default router;
