import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  Id,
  IHasOwnership,
  IHasRoles,
  IHasSlug,
  IHasTimestamps,
  IMemberSummary,
  ISoftDeletable,
  isOwner,
  validateSlug
} from './common';
import { softDeletePlugin, SoftDeleteQueryHelpers } from '../plugins/softDeletePlugin';

export interface IGuild
  extends Document<Id>,
    IHasSlug,
    IHasTimestamps,
    ISoftDeletable,
    IHasOwnership,
    IHasRoles {
  name: string;
  slug: string;

  media?: {
    iconUrl?: string;
    bannerUrl?: string;
  };

  ownership: {
    founderId: Id;
    ownerIds: Id[];
  };

  roles: {
    defaultRoleId: Id;
    order: Id[];
  };

  systemChannels?: {
    system?: Id;
    rules?: Id;
    publicUpdates?: Id;
    afk?: Id;
    afkTimeoutSec?: number;
  };

  settings: {
    verificationLevel: 'none' | 'low' | 'medium' | 'high';
    explicitContentFilter: 'disabled' | 'members_without_roles' | 'all_members';
    defaultNotifications: 'all' | 'mentions';
    discoverable: boolean;
    community: boolean;
    locale: string;
  };
  members: IMemberSummary[];

  stats?: {
    memberCount: number;
    premiumTier?: number;
  };
}

export interface GuildMethods {
  isOwner(userId: Id | string): boolean;
  canManageGuild(userId: Id | string): boolean;
}

export type GuildModel = Model<IGuild, SoftDeleteQueryHelpers<IGuild>, GuildMethods>;

const GuildSchema = new Schema<IGuild, GuildModel, GuildMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
      validate: [
        {
          validator: (v: string) => v.trim().length > 0,
          message: 'Name cannot be blank.'
        },
        {
          validator: (v: string) => v.trim().length <= 100,
          message: 'Name must be at most 100 characters.'
        }
      ],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      minlength: 3,
      maxlength: 120,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // kebab-case
    },

    //TODO: add these two default images in minio
    media: {
      iconUrl: { type: String, default: null },
      bannerUrl: { type: String, default: null },
    },

    ownership: {
      founderId: { type: Schema.Types.ObjectId, ref: 'User' },
      ownerIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    },

    roles: {
      defaultRoleId: { type: Schema.Types.ObjectId, ref: 'Role' },
      order: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    },

    systemChannels: {
      system: { type: Schema.Types.ObjectId, ref: 'Channel' },
      rules: { type: Schema.Types.ObjectId, ref: 'Channel' },
      publicUpdates: { type: Schema.Types.ObjectId, ref: 'Channel' },
      afk: { type: Schema.Types.ObjectId, ref: 'Channel' },
      afkTimeoutSec: {
        type: Number,
        default: 300,
        min: 60,
        max: 3600,
      },
    },

    settings: {
      verificationLevel: {
        type: String,
        enum: ['none', 'low', 'medium', 'high'],
        default: 'none',
      },
      explicitContentFilter: {
        type: String,
        enum: ['disabled', 'members_without_roles', 'all_members'],
        default: 'disabled',
      },
      defaultNotifications: {
        type: String,
        enum: ['all', 'mentions'],
        default: 'mentions',
      },
      discoverable: { type: Boolean, default: false },
      community: { type: Boolean, default: false },
      locale: { type: String, default: 'en-US' },
    },
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

    stats: {
      memberCount: { type: Number, default: 1 },
      premiumTier: { type: Number, default: 0 },
    },

    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

GuildSchema.index({ name: 'text' });

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

GuildSchema.pre('validate', function(next) {
  return validateSlug(this, next);
});

GuildSchema.methods.isOwner = function(userId: Types.ObjectId | string): boolean {
  return isOwner(this, userId);
};

GuildSchema.methods.canManageGuild = function(userId: Types.ObjectId | string) {
  return this.isOwner(userId);
};

GuildSchema.plugin(softDeletePlugin);

export const Guild = mongoose.model<IGuild, GuildModel>('Guild', GuildSchema);
