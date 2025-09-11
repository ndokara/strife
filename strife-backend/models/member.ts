import mongoose, { Document, Schema } from 'mongoose';
import { Id } from './common';
import { RoleModel } from './role';
import { hasPermission, PermissionValue } from './permissions';

// TODO:I am not sure: should a member reference both guilds and channels (similar to roles)?
// That would achieve that a user can be a member of a guild but not of every channel of said guild, which makes sense.

export interface IMember extends Document<Id> {
  userId: Id;
  guildId: Id;
  nickname?: string;
  roleIds: Id[];
  joinedAt: Date;
  isMuted: boolean;
  muteExpiresAt?: Date;
  isBanned: boolean;
  banReason?: string;
  presence?: {
    status: 'online' | 'idle' | 'dnd' | 'offline';
    customStatus?: string;
  };
  lastActiveAt: Date;
  getPermissionMask(): Promise<bigint>;
  hasPermission(perm: PermissionValue): Promise<boolean>;
}

const MemberSchema = new Schema<IMember>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  guildId: { type: Schema.Types.ObjectId, ref: 'Guild', required: true },
  nickname: { type: String },
  roleIds: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
  /*
  TODO: maybe: additional mask for other permissions:
  so one could give a member certain custom permissions without
  creating and using a role to achieve that
  ; if that is not dumb
   */
  joinedAt: { type: Date, default: Date.now },
  isMuted: { type: Boolean, default: false },
  muteExpiresAt: { type: Date },

  isBanned: { type: Boolean, default: false },
  banReason: { type: String },

  // presence/activity tracking
  presence: {
    status: {
      type: String,
      enum: ['online', 'idle', 'dnd', 'offline'],
      default: 'offline',
    },
    customStatus: { type: String, maxlength: 100 },
  },

  lastActiveAt: { type: Date, default: Date.now },
});

// Methods
MemberSchema.methods.getPermissionMask = async function(): Promise<bigint> {
  const roles = await RoleModel.find({ _id: { $in: this.roleIds } });
  let mask = 0n;
  for (const role of roles) {
    mask |= BigInt(role.permissions);
  }
  return mask;
};

MemberSchema.methods.hasPermission = async function(perm: PermissionValue): Promise<boolean> {
  const mask = await this.getPermissionMask();
  return hasPermission(mask, perm);
};

export const MemberModel = mongoose.model<IMember>('Member', MemberSchema);
