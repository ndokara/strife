import mongoose, { CallbackError } from 'mongoose';
import { slugify } from './guild';

export type Id = mongoose.Types.ObjectId;

export interface IHasSlug {
  name: string;
  slug: string;
}

export function validateSlug(doc: IHasSlug, next: (err?: CallbackError) => void) {
  if (!doc.slug && doc.name) {
    const base = slugify(doc.name);
    doc.slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  next();
}

export interface IHasTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface ISoftDeletable {
  deletedAt: Date | null;
}
