import mongoose, { Document, Schema } from 'mongoose';
import { Id } from './common';
import { Role } from './role';
import { PermissionValue } from './permissions';

export interface IMember extends Document<Id> {
  userId: Id;
  parent: {
    kind: 'Guild' | 'Channel';
    id: Id;
  };
  nickname?: string;
  roles: Id[];
  joinedAt: Date;

  moderation: {
    mute: {
      isMuted: boolean;
      expiresAt?: Date;
    };
    ban: {
      isBanned: boolean;
      reason?: string;
    };
  };

  presence: {
    status: 'online' | 'idle' | 'dnd' | 'offline';
    customStatus?: string;
    lastActiveAt: Date;
  };

  // TODO: I intend to keep more data here like personal member settings per guild/channel, etc.

  getPermissionMask(): Promise<bigint>;

  hasPermission(perm: PermissionValue): Promise<boolean>;
}

const MemberSchema = new Schema<IMember>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  parent: {
    kind: {
      type: String,
      enum: ['Guild', 'Channel'],
      required: true,
    },
    id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },

  nickname: { type: String },

  roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],

  joinedAt: { type: Date, default: Date.now },

  moderation: {
    mute: {
      isMuted: { type: Boolean, default: false },
      expiresAt: { type: Date },
    },
    ban: {
      isBanned: { type: Boolean, default: false },
      reason: { type: String },
    },
  },

  presence: {
    status: {
      type: String,
      enum: ['online', 'idle', 'dnd', 'offline'],
      default: 'offline',
    },
    customStatus: { type: String, maxlength: 100 },
    lastActiveAt: { type: Date, default: Date.now },
  },
});

// Methods
MemberSchema.methods.getPermissionMask = async function(): Promise<bigint> {
  const roles = await Role.find({ _id: { $in: this.roles } });
  let mask = 0n;
  for (const role of roles) {
    mask |= BigInt(role.permissions);
  }
  return mask;
};

MemberSchema.methods.hasPermission = async function(perm: PermissionValue): Promise<boolean> {
  const mask = await this.getPermissionMask();
  return (mask & perm) === perm;
};

export const Member = mongoose.model<IMember>('Member', MemberSchema);
