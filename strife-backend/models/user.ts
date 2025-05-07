import bcrypt from 'bcrypt';
import { model, Schema, Model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  displayName: string;
  username: string;
  password?: string;
  dateOfBirth: Date;
  avatarUrl: string;
  twoFASecret?: string;
  isTwoFAEnabled: boolean;
  googleId?: string;
  googleAccessToken?: string;
}

const UserSchema: Schema<IUser> = new Schema({
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String},
  dateOfBirth: { type: Date, required: true },
  avatarUrl: { type: String, required: true },
  twoFASecret: { type: String },
  isTwoFAEnabled: { type: Boolean, default: false },
  googleId: { type: String, unique: true},
  googleAccessToken: { type: String },
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  if (this.password) {
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }
});

const User: Model<IUser> = model('User', UserSchema);

export default User;
