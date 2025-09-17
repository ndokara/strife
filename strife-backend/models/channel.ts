import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  ensureDefaultState,
  Id,
  IHasOwnership,
  IHasRoles,
  IHasSlug,
  IHasTimestamps,
  IMemberSummary,
  ISoftDeletable, isOwner,
  validateSlug
} from './common';
import { softDeletePlugin, SoftDeleteQueryHelpers } from '../plugins/softDeletePlugin';
import { Guild } from './guild';

export type ChannelType = 'text' | 'voice' | 'category';

export interface IChannel extends Document<Id>,
  IHasSlug,
  IHasTimestamps,
  ISoftDeletable,
  IHasOwnership,
  IHasRoles
{
  guildId: Id;
  name: string;
  slug: string;
  type: ChannelType;
  topic?: string;

  ownership: {
    founderId: Id;
    ownerIds: Id[];
  };

  roles: {
    defaultRoleId: Id;
    order: Id[];
  };

  position: number;

  moderation: {
    nsfw: boolean;
    rateLimitPerUser?: number; // seconds
    isLocked: boolean;
    archivedAt: Date | null;
  };

  mediaSettings: {
    bitrate?: number;     // kbps
    userLimit?: number;   // 0..99
    rtcRegion?: string | null;
    videoQualityMode?: 'auto' | 'full';
  };

  syncPermissionsWithParent: boolean;

  // lightweight embedded members (summary info only)
  members: IMemberSummary[];

  activity: {
    lastMessageAt?: Date;
    lastPinnedAt?: Date;
  };
}
export interface ChannelMethods {
  isOwner(userId: Id | string): boolean;
  canManageChannel(userId: Id | string): Promise<boolean>;
}

export type ChannelModel = Model<IChannel, SoftDeleteQueryHelpers<IChannel>, ChannelMethods>;

const ChannelSchema = new Schema<IChannel, ChannelModel>(
  {
    guildId: { type: Schema.Types.ObjectId, ref: 'Guild', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // kebab-case
      index: true,
    },
    type: { type: String, enum: ['text', 'voice', 'category'], required: true },
    topic: { type: String, maxlength: 1024 },
    ownership: {
      founderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      ownerIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    },

    position: { type: Number, default: 0 },

    moderation: {
      nsfw: { type: Boolean, default: false },
      rateLimitPerUser: { type: Number, min: 0, max: 21600 },
      isLocked: { type: Boolean, default: false },
      archivedAt: { type: Date, default: null },
    },

    mediaSettings: {
      bitrate: { type: Number, min: 8, max: 384 },
      userLimit: { type: Number, min: 0, max: 99, default: 0 },
      rtcRegion: { type: String, default: null },
      videoQualityMode: { type: String, enum: ['auto', 'full'], default: 'auto' },
    },

    syncPermissionsWithParent: { type: Boolean, default: true },

    members: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
          nickname: { type: String, maxlength: 32 },
          joinedAt: { type: Date, default: Date.now },
        }
      ],
      default: []
    },

    activity: {
      lastMessageAt: { type: Date },
      lastPinnedAt: { type: Date },
    },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// within a single guild, no two channels can share the same slug
ChannelSchema.index({ guildId: 1, slug: 1 }, { unique: true });

ChannelSchema.index({ guildId: 1, parentId: 1, position: 1 }); // sorting
ChannelSchema.index({ guildId: 1, type: 1 });

ChannelSchema.pre('validate', function(next) {
  validateSlug(this, next);
});

ChannelSchema.post('save', async function(channel: Document, next) {
  try {
    await ensureDefaultState(channel);
    next();
  } catch (err) {
    next(err as Error);
  }
});

//methods
ChannelSchema.methods.isOwner = function(userId: Types.ObjectId | string): boolean {
  return isOwner(this, userId);
};

ChannelSchema.methods.canManageChannel = async function(userId: Types.ObjectId | string): Promise<boolean> {
  const userIdStr = userId.toString();

  if (this.isOwner(userIdStr)) {
    return true;
  }

  if (this.guild) {
    const guild = await Guild.findById(this.guild).select('ownership');
    if (guild) {
      const { founderId, ownerIds } = guild.ownership;

      if (founderId.toString() === userIdStr) {
        return true;
      }

      if (ownerIds.some((id: Types.ObjectId) => id.toString() === userIdStr)) {
        return true;
      }
    }
  }

  return false;
};

ChannelSchema.plugin(softDeletePlugin);

export const ChannelModel: Model<IChannel> = mongoose.model<IChannel>('Channel', ChannelSchema);
