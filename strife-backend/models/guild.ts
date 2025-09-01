import mongoose, { HydratedDocument, Model, Schema, Types, } from 'mongoose';
import { RoleModel } from './role';

export interface IGuild {
  name: string;
  slug: string; // unique and URL-safe
  iconUrl?: string;
  bannerUrl?: string;

  founderId: Types.ObjectId; // original creator
  ownerIds: Types.ObjectId[]; // superadmins

  defaultRoleId: Types.ObjectId; // "@everyone"
  roleOrder?: Types.ObjectId[]; // optional UI ordering only

  systemChannelId?: Types.ObjectId;
  rulesChannelId?: Types.ObjectId;
  publicUpdatesChannelId?: Types.ObjectId;
  afkChannelId?: Types.ObjectId;
  afkTimeoutSec?: number; // 60..3600

  settings: {
    verificationLevel: 'none' | 'low' | 'medium' | 'high';
    explicitContentFilter:
      | 'disabled'
      | 'members_without_roles'
      | 'all_members';
    defaultNotifications: 'all' | 'mentions';
    discoverable: boolean;
    community: boolean;
    locale: string; // e.g., 'en-US'
  };

  stats?: {
    memberCount: number;
    premiumTier?: number;
  };

  isDeleted: boolean;
  deletedAt?: Date;
}

export interface GuildMethods {
  isOwner(userId: Types.ObjectId | string): boolean;
  canManageGuild(userId: Types.ObjectId | string): boolean;
}

export type GuildDoc = HydratedDocument<IGuild, GuildMethods>;
export type GuildModel = Model<IGuild, object, GuildMethods>;


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

    iconUrl: { type: String },
    bannerUrl: { type: String },

    founderId: { type: Schema.Types.ObjectId, ref: 'User', required: true},
    ownerIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],

    defaultRoleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: false,
    },
    roleOrder: [{ type: Schema.Types.ObjectId, ref: 'Role' }],

    systemChannelId: { type: Schema.Types.ObjectId, ref: 'Channel' },
    rulesChannelId: { type: Schema.Types.ObjectId, ref: 'Channel' },
    publicUpdatesChannelId: { type: Schema.Types.ObjectId, ref: 'Channel' },
    afkChannelId: { type: Schema.Types.ObjectId, ref: 'Channel' },
    afkTimeoutSec: {
      type: Number,
      default: 300,
      min: 60,
      max: 3600,
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

    stats: {
      memberCount: { type: Number, default: 1 },
      premiumTier: { type: Number, default: 0 },
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
// index
GuildSchema.index({ name: 'text' });

// hook
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
//pre

export function applyCommonValidations(doc: any, next: (err?: any) => void) {
  if (!doc.slug && doc.name) {
    const base = slugify(doc.name);
    doc.slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  if (doc.isDeleted && !doc.deletedAt) {
    doc.deletedAt = new Date();
  }

  next();
}

GuildSchema.pre('validate', function(next) {
  return applyCommonValidations(this, next);
});

//post
GuildSchema.post('save', async function(guild, next) {
  try {
    // Ensuring founder is in ownerIds
    if (!guild.ownerIds || guild.ownerIds.length === 0) {
      guild.ownerIds = [guild.founderId];
      await guild.save();
    } else if (!guild.ownerIds.some(id => id.equals(guild.founderId))) {
      guild.ownerIds.push(guild.founderId);
      await guild.save();
    }

    // Ensuring @everyone role exists
    if (!guild.defaultRoleId) {
      const role = await RoleModel.create({
        guild: guild._id,
        name: '@everyone',
        permissions: '0',
      });

      guild.defaultRoleId = <Types.ObjectId>role._id;
      await guild.save();
    }

    next();
  } catch (err) {
    next(err as Error);
  }
});

// methods
GuildSchema.methods.isOwner = function(userId: Types.ObjectId | string) {
  const idStr = String(userId);
  if (String(this.founderId) === idStr) return true;
  return this.ownerIds?.some((oid) => String(oid) === idStr) ?? false;
};

GuildSchema.methods.canManageGuild = function(
  userId: Types.ObjectId | string
) {
  return this.isOwner(userId);
};

export const Guild = mongoose.model<IGuild, GuildModel>('Guild', GuildSchema);
