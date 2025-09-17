import mongoose, { CallbackError, Types } from 'mongoose';
import { slugify } from './guild';
import { RoleModel } from './role';

export type Id = mongoose.Types.ObjectId;

export interface IHasSlug {
  name: string;
  slug: string;
}
export interface IMemberSummary {
  userId: Id;
  roles: Id[];
  nickname?: string;
  joinedAt: Date;
}

export interface IHasTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface ISoftDeletable {
  deletedAt: Date | null;
}
export interface IHasOwnership {
  ownership: {
    founderId: Id;
    ownerIds: Id[];
  };
}
export interface IHasRoles{
  roles: {
    defaultRoleId: Id;
    order: Id[];
  };
}
export function validateSlug(doc: IHasSlug, next: (err?: CallbackError) => void) {
  if (!doc.slug && doc.name) {
    const base = slugify(doc.name);
    doc.slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  next();
}

export async function ensureDefaultState(doc: unknown): Promise<void> {
  const typedDoc = doc as Document & IHasOwnership & IHasRoles & {
    _id: Types.ObjectId;
    save: () => Promise<unknown>;
  };

  const owners = typedDoc.ownership.ownerIds;
  if (!owners || owners.length === 0) {
    typedDoc.ownership.ownerIds = [typedDoc.ownership.founderId];
    await typedDoc.save();
  } else if (!owners.some(id => id.equals(typedDoc.ownership.founderId))) {
    owners.push(typedDoc.ownership.founderId);
    await typedDoc.save();
  }

  // Ensure @everyone role exists
  if (typedDoc.roles && !typedDoc.roles.defaultRoleId) {
    const role = await RoleModel.create({
      guild: typedDoc._id,
      name: '@everyone',
      permissions: '0',
    });

    typedDoc.roles.defaultRoleId = role._id;
    await typedDoc.save();
  }
}
export function isOwner(doc:unknown , userId: Types.ObjectId | string): boolean {
  const typedDoc = doc as Document & IHasOwnership & IHasRoles;
  if(String(typedDoc.ownership.founderId) === String(userId)) return true;
  return typedDoc.ownership.ownerIds?.some((oid) => String(oid) === String(userId)) ?? false;
}
