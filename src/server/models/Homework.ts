import mongoose, { Schema, Document, Model } from 'mongoose';
import { HomeworkStatus, COIN_REWARDS } from '../../shared/types';

// ---- Interface ----

export interface IHomework extends Document {
  title: string;
  description: string;
  subject: string;
  teacherId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  score: number;
  maxScore: number;
  status: HomeworkStatus;
  coinReward: number;
  dueDate: Date;
  submittedAt?: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Schema ----

const HomeworkSchema = new Schema<IHomework>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    subject: {
      type: String,
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    maxScore: {
      type: Number,
      default: 100,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(HomeworkStatus),
      default: HomeworkStatus.Pending,
    },
    coinReward: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    submittedAt: { type: Date },
    gradedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// ---- Indexes ----

// Compound: find all homework for a student assigned by a teacher
HomeworkSchema.index({ teacherId: 1, studentId: 1 });

// Compound: find pending homework by due date (teacher dashboard)
HomeworkSchema.index({ status: 1, dueDate: 1 });

// ---- Pre-save: auto-calculate coinReward on grade ----

HomeworkSchema.pre('save', function (next) {
  // Only compute reward when status changes to graded and score is set
  if (this.status === HomeworkStatus.Graded && this.score != null) {
    this.coinReward = this.score === 100 ? COIN_REWARDS.PERFECT_HOMEWORK : 0;
    if (!this.gradedAt) {
      this.gradedAt = new Date();
    }
  }
  if (this.status === HomeworkStatus.Submitted && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  next();
});

// ---- Export ----

const Homework: Model<IHomework> = mongoose.model<IHomework>('Homework', HomeworkSchema);

export default Homework;
