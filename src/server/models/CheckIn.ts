import mongoose, { Schema, Document, Model } from 'mongoose';
import { COIN_REWARDS } from '../../shared/types';

// ---- Interface ----

export interface ICheckIn extends Document {
  studentId: mongoose.Types.ObjectId;
  date: string;          // YYYY-MM-DD format
  streak: number;        // consecutive check-in days (1-N)
  coinReward: number;    // auto: 10 + (streak % 7 === 0 ? 50 : 0)
  createdAt: Date;
}

// ---- Schema ----

const CheckInSchema = new Schema<ICheckIn>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    },
    streak: {
      type: Number,
      required: true,
      min: 1,
    },
    coinReward: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// ---- Indexes ----

// Unique: one check-in per student per day
CheckInSchema.index({ studentId: 1, date: 1 }, { unique: true });

// ---- Pre-save: auto-calculate coinReward ----

CheckInSchema.pre('save', function (next) {
  let reward = COIN_REWARDS.DAILY_CHECKIN;
  if (this.streak > 0 && this.streak % 7 === 0) {
    reward += COIN_REWARDS.STREAK_7DAY_BONUS;
  }
  this.coinReward = reward;
  next();
});

// ---- Static: determine streak for a student on a given date ----

CheckInSchema.statics.calculateStreak = async function (
  studentId: string,
  dateStr: string,
): Promise<number> {
  const date = new Date(dateStr + 'T00:00:00Z');
  const prevDate = new Date(date);
  prevDate.setUTCDate(prevDate.getUTCDate() - 1);
  const prevDateStr = prevDate.toISOString().slice(0, 10);

  const prevCheckIn = await this.findOne({
    studentId,
    date: prevDateStr,
  }).sort({ date: -1 });

  return prevCheckIn ? prevCheckIn.streak + 1 : 1;
};

// ---- Interface for static ----

export interface ICheckInModel extends Model<ICheckIn> {
  calculateStreak(studentId: string, dateStr: string): Promise<number>;
}

// ---- Export ----

const CheckIn: ICheckInModel = mongoose.model<ICheckIn, ICheckInModel>('CheckIn', CheckInSchema);

export default CheckIn;
