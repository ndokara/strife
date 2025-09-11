import { Document, model, Schema } from 'mongoose';
import { Id, IHasTimestamps } from './common';

//TODO: Without creating separate guild channel role schemas:
// a role should be able to reference guilds and channels. At least one of those is required.

export interface IRole extends Document<Id>, IHasTimestamps {
  guild: Id;                      // reference to Guild
  name: string;                   // display name
  color?: string;                 // hex color (e.g. "#5865F2")
  hoist: boolean;                 // show separately in member list
  position: number;               // sorting position (higher = more priority)
  permissions: string;            // bitfield integer
  mentionable: boolean;           // can @mention this role
}

/*
TODO: Slightly optimize memory usage?:
If I have a high percentage users that create a default common used role ie Admin with exactly the same permissions
(which I would suggest) I could reference a single default role of that name and permissions?
Those default roles would be created and kept constant?
 */
const RoleSchema = new Schema<IRole>(
  {
    guild: {
      type: Schema.Types.ObjectId,
      ref: 'Guild',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      match: /^#(?:[0-9a-fA-F]{3}){1,2}$/, // validate hex
      default: '#000000',
    },
    hoist: {
      type: Boolean,
      default: false,
    },
    position: {
      type: Number,
      default: 0,
    },
    permissions: {
      type: String,
      required: true,
      default: '0',
    },
    mentionable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const RoleModel = model<IRole>('Role', RoleSchema);
