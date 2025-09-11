import mongoose, { Document, Model, Schema } from 'mongoose';
import { Id, IHasSlug, IHasTimestamps, ISoftDeletable, validateSlug } from './common';

export type ChannelType = 'text' | 'voice' | 'category';

export interface IChannel extends Document<Id>, IHasSlug, IHasTimestamps, ISoftDeletable {
  guildId: Id;
  name: string;
  slug: string;
  type: ChannelType;
  topic?: string;
  ownerIds: Id[];
  position: number;

  // moderation / UX
  nsfw: boolean;
  rateLimitPerUser?: number; // seconds
  isLocked: boolean;
  archivedAt: Date | null;

  // TODO: consider a nested object like MediaSettings, mongo does it nicely
  // voice-only
  bitrate?: number;     // kbps
  userLimit?: number;   // 0..99
  rtcRegion?: string | null;
  videoQualityMode?: 'auto' | 'full';

  // complete inheritance of permissions
  syncPermissionsWithParent: boolean;

  // activity
  lastMessageAt?: Date;
  lastPinnedAt?: Date;
}

const ChannelSchema = new Schema<IChannel>(
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
    ownerIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    position: { type: Number, default: 0 },

    nsfw: { type: Boolean, default: false },
    rateLimitPerUser: { type: Number, min: 0, max: 21600 },
    isLocked: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },

    bitrate: { type: Number, min: 8, max: 384 },
    userLimit: { type: Number, min: 0, max: 99, default: 0 },
    rtcRegion: { type: String, default: null },
    videoQualityMode: { type: String, enum: ['auto', 'full'], default: 'auto' },

    syncPermissionsWithParent: { type: Boolean, default: true },

    lastMessageAt: { type: Date },
    lastPinnedAt: { type: Date },

    deletedAt: { type: Date, default: null }, // are you using the mongoose soft-delete plugin?
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

export const ChannelModel: Model<IChannel> = mongoose.model<IChannel>('Channel', ChannelSchema);
