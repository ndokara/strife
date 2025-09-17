import { Document, model, Schema } from 'mongoose';
import { Id, IHasTimestamps } from './common';
import { normalize, Permission, PermissionValue } from './permissions';

export interface IRole extends Document<Id>, IHasTimestamps {
  parent: {
    kind: 'Guild' | 'Channel';
    id: Id;
  };
  name: string;
  appearance: {
    color?: string;
    hoist: boolean;
  };
  position: number;
  permissions: string; // stored as string
  mentionable: boolean;

  // Instance methods
  addPermission(perm: PermissionValue): void;
  removePermission(perm: PermissionValue): void;
  hasPermission(perm: PermissionValue): boolean;
  togglePermission(perm: PermissionValue): void;
  listPermissions(): string[];
}


const RoleSchema = new Schema<IRole>({
  parent: {
    kind: { type: String, enum: ['Guild', 'Channel'], required: true },
    id: { type: Schema.Types.ObjectId, required: true }
  },
  name: { type: String, required: true },
  appearance: {
    color: { type: String },
    hoist: { type: Boolean, default: false }
  },
  position: { type: Number, required: true },
  permissions: { type: String, required: true, default: '0' },
  mentionable: { type: Boolean, default: false }
});

// Instance methods
RoleSchema.methods.addPermission = function(perm: bigint) {
  this.permissions = (normalize(this.permissions) | perm).toString();
};

RoleSchema.methods.removePermission = function(perm: bigint) {
  this.permissions = (normalize(this.permissions) & ~perm).toString();
};

RoleSchema.methods.hasPermission = function(perm: bigint): boolean {
  return (normalize(this.permissions) & perm) === perm;
};

RoleSchema.methods.togglePermission = function(perm: bigint) {
  this.permissions = (normalize(this.permissions) ^ perm).toString();
};

RoleSchema.methods.listPermissions = function(): string[] {
  const perms = normalize(this.permissions);
  return Object.entries(Permission)
    .filter(([, value]) => typeof value === 'bigint' && (perms & (value as bigint)) !== 0n)
    .map(([key]) => key);
};

export const RoleModel = model<IRole>('Role', RoleSchema);
