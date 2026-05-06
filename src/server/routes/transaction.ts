import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Transaction, User } from '../models';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { UserRole } from '../../shared/types';

const router = Router();

router.use(authenticate);

// GET /api/transactions - student's own transactions (paginated)
router.get('/', requireRole(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!._id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ studentId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ studentId }),
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取交易记录失败' });
  }
});

// GET /api/transactions/child/:childId - parent views child's transactions
router.get('/child/:childId', requireRole(UserRole.Parent), async (req: AuthRequest, res: Response) => {
  try {
    const parent = await User.findById(req.user!._id);
    if (!parent || !parent.childrenIds) {
      res.status(403).json({ error: '无权访问' });
      return;
    }

    const childIdStr = req.params.childId;
    const isChild = parent.childrenIds.some(
      (id: mongoose.Types.ObjectId) => id.toString() === childIdStr,
    );
    if (!isChild) {
      res.status(403).json({ error: '该学生不在您的关联列表中' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ studentId: childIdStr })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ studentId: childIdStr }),
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取交易记录失败' });
  }
});

export default router;
