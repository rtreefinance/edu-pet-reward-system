import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole } from '../../shared/types';

// ---- Interface ----

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  avatarUrl: string;

  // Student-only
  coins?: number;
  level?: number;
  xp?: number;
  parentId?: mongoose.Types.ObjectId;

  // Teacher-only
  subject?: string;
  classIds?: string[];

  // Parent-only
  childrenIds?: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

// ---- Schema ----

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    avatarUrl: {
      type: String,
      default: '',
    },

    // Student fields
    coins: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    xp: { type: Number, default: 0, min: 0 },
    parentId: { type: Schema.Types.ObjectId, ref: 'User' },

    // Teacher fields
    subject: { type: String },
    classIds: [{ type: String }],

    // Parent fields
    childrenIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.passwordHash = undefined;
        ret._id = String(ret._id);
        return ret;
      },
    },
  },
);

// ---- Indexes ----

UserSchema.index({ role: 1 });
UserSchema.index({ 'parentId': 1 });
UserSchema.index({ 'childrenIds': 1 });

// ---- Pre-save: role-based default cleanup ----

UserSchema.pre('save', function (next) {
  if (this.role !== UserRole.Student) {
    this.coins = undefined;
    this.level = undefined;
    this.xp = undefined;
    this.parentId = undefined;
  }
  if (this.role !== UserRole.Teacher) {
    this.subject = undefined;
    this.classIds = undefined;
  }
  if (this.role !== UserRole.Parent) {
    this.childrenIds = undefined;
  }
  next();
});

// ---- Export ----

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
