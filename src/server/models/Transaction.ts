import mongoose, { Schema, Document, Model } from 'mongoose';
import { TransactionType } from '../../shared/types';

// ---- Interface ----

export interface ITransaction extends Document {
  studentId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;          // positive = earned, negative = spent
  balanceAfter: number;    // student's coin balance after this transaction
  reference?: {
    model: string;
    id: mongoose.Types.ObjectId;
  };
  description: string;
  createdAt: Date;
}

// ---- Schema ----

const TransactionSchema = new Schema<ITransaction>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    reference: {
      model: { type: String },
      id: { type: Schema.Types.ObjectId },
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// ---- Indexes ----

// Fast lookup: all transactions for a student, newest first
TransactionSchema.index({ studentId: 1, createdAt: -1 });

// Lookup by type (e.g. teacher views all homework rewards)
TransactionSchema.index({ type: 1, createdAt: -1 });

// ---- Pre-save: auto-generate description if missing ----

TransactionSchema.pre('save', function (next) {
  if (!this.description) {
    const labels: Record<TransactionType, string> = {
      [TransactionType.HomeworkReward]: '满分作业奖励',
      [TransactionType.CheckinReward]: '每日签到奖励',
      [TransactionType.CheckinStreakBonus]: '连续签到7天额外奖励',
      [TransactionType.FeedPet]: '喂食宠物',
      [TransactionType.BuyAccessory]: '购买装饰品',
      [TransactionType.BuySkin]: '购买皮肤',
      [TransactionType.AdminAdjust]: '管理员调整',
    };
    this.description = labels[this.type] || this.type;
  }
  next();
});

// ---- Static: create a transaction and update student balance ----

TransactionSchema.statics.record = async function (params: {
  studentId: string;
  type: TransactionType;
  amount: number;
  reference?: { model: string; id: string };
  description?: string;
}): Promise<ITransaction> {
  const User = mongoose.model('User');

  const student = await User.findById(params.studentId);
  if (!student) {
    throw new Error(`Student ${params.studentId} not found`);
  }
  if (student.role !== 'student') {
    throw new Error('Target user is not a student');
  }

  const currentBalance = student.coins ?? 0;
  const newBalance = currentBalance + params.amount;
  if (newBalance < 0) {
    throw new Error(`Insufficient coins: balance ${currentBalance}, required ${Math.abs(params.amount)}`);
  }

  // Update student balance atomically
  await User.findByIdAndUpdate(params.studentId, { coins: newBalance });

  const tx = await this.create({
    studentId: params.studentId,
    type: params.type,
    amount: params.amount,
    balanceAfter: newBalance,
    reference: params.reference,
    description: params.description,
  });

  return tx;
};

// ---- Interface for statics ----

export interface ITransactionModel extends Model<ITransaction> {
  record(params: {
    studentId: string;
    type: TransactionType;
    amount: number;
    reference?: { model: string; id: string };
    description?: string;
  }): Promise<ITransaction>;
}

// ---- Export ----

const Transaction = mongoose.model<ITransaction, ITransactionModel>(
  'Transaction',
  TransactionSchema,
) as ITransactionModel;

export default Transaction;
