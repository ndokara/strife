import mongoose, { CallbackError, Types } from 'mongoose';
import { Guild, slugify } from './guild';

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

export interface IHasRoles {
  roles: {
    defaultRoleId: Id;
    order: Id[];
  };
}

export async function validateSlug(
  doc: IHasSlug,
  next: (err?: CallbackError) => void
): Promise<void> {
  try {
    if (doc.name) {
      const base = doc.slug ? doc.slug : slugify(doc.name);

      let slug = base;
      let counter = 1;

      while (await Guild.exists({ slug })) {
        slug = `${base}-${counter++}`;
      }

      doc.slug = slug;
    }

    next();
  } catch (err) {
    next(err as CallbackError);
  }
}

export function isOwner(doc: unknown, userId: Types.ObjectId | string): boolean {
  const typedDoc = doc as Document & IHasOwnership & IHasRoles;
  if (String(typedDoc.ownership.founderId) === String(userId)) return true;
  return typedDoc.ownership.ownerIds?.some((oid) => String(oid) === String(userId)) ?? false;
}
