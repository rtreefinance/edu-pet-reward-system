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
// Wrapped in a MongoDB session to prevent TOCTOU race conditions.
// Accepts an optional session parameter for callers that want to compose
// this operation atomically with other writes (e.g. pet.save).

TransactionSchema.statics.record = async function (params: {
  studentId: string;
  type: TransactionType;
  amount: number;
  reference?: { model: string; id: string };
  description?: string;
  session?: mongoose.ClientSession;
}): Promise<ITransaction> {
  const User = mongoose.model('User');

  // Core logic that runs within a session (provided or auto-created)
  const executeInSession = async (session: mongoose.ClientSession): Promise<ITransaction> => {
    // Read student WITHIN the session so no other writer can change the balance
    // between the read and the write — eliminates TOCTOU race.
    const student = await User.findById(params.studentId).session(session);
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

    // Update student balance within the transaction
    await User.findByIdAndUpdate(params.studentId, { coins: newBalance }, { session });

    // Create transaction document within the same session
    const tx = new this({
      studentId: params.studentId,
      type: params.type,
      amount: params.amount,
      balanceAfter: newBalance,
      reference: params.reference,
      description: params.description,
    });
    await tx.save({ session });
    return tx;
  };

  // If caller provided a session, use it directly (caller manages tx lifecycle)
  if (params.session) {
    return executeInSession(params.session);
  }

  // No session provided — create a new one and wrap in withTransaction
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction((sess) => executeInSession(sess));
  } finally {
    await session.endSession();
  }
};

// ---- Interface for statics ----

export interface ITransactionModel extends Model<ITransaction> {
  record(params: {
    studentId: string;
    type: TransactionType;
    amount: number;
    reference?: { model: string; id: string };
    description?: string;
    session?: mongoose.ClientSession;
  }): Promise<ITransaction>;
}

// ---- Export ----

const Transaction = mongoose.model<ITransaction, ITransactionModel>(
  'Transaction',
  TransactionSchema,
) as ITransactionModel;

export default Transaction;
