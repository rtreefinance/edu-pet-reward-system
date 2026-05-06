import { Router, Response } from 'express';
import { TransactionType } from '../../shared/types';
import { CheckIn, Transaction, User } from '../models';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { UserRole } from '../../shared/types';
import Pet from '../models/Pet';

const router = Router();

router.use(authenticate);

// POST /api/checkin - student check-in
router.post('/', requireRole(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!._id;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Check if already checked in today
    const existing = await CheckIn.findOne({ studentId, date: today });
    if (existing) {
      res.status(400).json({ error: '今天已经签到过了' });
      return;
    }

    // Calculate streak
    const streak = await CheckIn.calculateStreak(studentId, today);

    // Create check-in (pre-save auto-calculates coinReward)
    const checkIn = await CheckIn.create({
      studentId,
      date: today,
      streak,
    });

    // Record coin reward via Transaction.record
    const txType = streak > 0 && streak % 7 === 0
      ? TransactionType.CheckinStreakBonus
      : TransactionType.CheckinReward;

    await Transaction.record({
      studentId,
      type: txType,
      amount: checkIn.coinReward,
      reference: { model: 'CheckIn', id: checkIn._id.toString() },
      description: streak % 7 === 0
        ? `连续签到第${streak}天，获得额外奖励`
        : `第${streak}天签到`,
    });

    // Boost pet mood by 5
    const pet = await Pet.findOne({ studentId });
    if (pet) {
      pet.mood = Math.min(pet.mood + 5, 100);
      await pet.save();
    }

    res.status(201).json({
      checkIn: checkIn.toJSON(),
      streak,
      coinReward: checkIn.coinReward,
      petMood: pet?.mood ?? null,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '签到失败' });
  }
});

// GET /api/checkin - current month's check-in calendar
router.get('/', requireRole(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!._id;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}`;

    const checkIns = await CheckIn.find({
      studentId,
      date: { $regex: `^${prefix}` },
    }).sort({ date: 1 });

    const dates = checkIns.map((c) => c.date);
    res.json({ month: prefix, checkInDates: dates, total: dates.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取签到记录失败' });
  }
});

// GET /api/checkin/streak - current streak
router.get('/streak', requireRole(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!._id;
    const latest = await CheckIn.findOne({ studentId }).sort({ date: -1 });
    const streak = latest ? latest.streak : 0;
    res.json({ streak });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取连续签到天数失败' });
  }
});

// GET /api/checkin/child/:childId - parent view child's monthly check-ins
router.get('/child/:childId', requireRole(UserRole.Parent), async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user!._id;
    const { childId } = req.params;

    // Verify parent-children relationship
    const parent = await User.findById(parentId);
    if (!parent || !parent.childrenIds?.some((id: any) => id.toString() === childId)) {
      res.status(403).json({ error: '无权查看此孩子的签到记录' });
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}`;

    const checkins = await CheckIn.find({
      studentId: childId,
      date: { $regex: `^${prefix}` },
    }).sort({ date: 1 });

    res.json({ checkins });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取签到记录失败' });
  }
});

export default router;
