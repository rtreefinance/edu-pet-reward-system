import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { HomeworkStatus, TransactionType } from '../../shared/types';
import { Homework, Transaction, User } from '../models';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { UserRole } from '../../shared/types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/homework - teacher assigns homework
router.post('/', requireRole(UserRole.Teacher), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, subject, studentId, dueDate, maxScore } = req.body;

    if (!title || !subject || !studentId || !dueDate) {
      res.status(400).json({ error: '缺少必填字段: title, subject, studentId, dueDate' });
      return;
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== UserRole.Student) {
      res.status(400).json({ error: '无效的学生ID' });
      return;
    }

    const homework = await Homework.create({
      title,
      description: description || '',
      subject,
      teacherId: req.user!._id,
      studentId,
      dueDate: new Date(dueDate),
      maxScore: maxScore || 100,
      status: HomeworkStatus.Pending,
    });

    res.status(201).json({ homework: homework.toJSON() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '布置作业失败' });
  }
});

// GET /api/homework - student views their own homework
router.get('/', requireRole(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = { studentId: req.user!._id };
    if (status && Object.values(HomeworkStatus).includes(status as HomeworkStatus)) {
      filter.status = status;
    }

    const homework = await Homework.find(filter)
      .sort({ createdAt: -1 })
      .populate('teacherId', 'displayName subject');

    res.json({ homework });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取作业列表失败' });
  }
});

// GET /api/homework/child/:childId - parent views child's homework
router.get('/child/:childId', requireRole(UserRole.Parent), async (req: AuthRequest, res: Response) => {
  try {
    const parent = await User.findById(req.user!._id);
    if (!parent || !parent.childrenIds) {
      res.status(403).json({ error: '无权访问' });
      return;
    }

    const childIdStr = req.params.childId;
    const isChild = parent.childrenIds.some((id: mongoose.Types.ObjectId) => id.toString() === childIdStr);
    if (!isChild) {
      res.status(403).json({ error: '该学生不在您的关联列表中' });
      return;
    }

    const homework = await Homework.find({ studentId: childIdStr })
      .sort({ createdAt: -1 })
      .populate('teacherId', 'displayName subject');

    res.json({ homework });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取孩子作业失败' });
  }
});

// GET /api/homework/:id - single homework detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('teacherId', 'displayName subject')
      .populate('studentId', 'displayName');

    if (!homework) {
      res.status(404).json({ error: '作业不存在' });
      return;
    }

    // Check ownership: teacher who assigned, student who received, or parent of student
    const userId = req.user!._id;
    const isOwner =
      homework.teacherId._id?.toString() === userId ||
      homework.studentId._id?.toString() === userId;

    if (!isOwner && req.user!.role === UserRole.Parent) {
      const parent = await User.findById(userId);
      if (parent?.childrenIds) {
        const studentIdStr = homework.studentId._id?.toString();
        const isChild = parent.childrenIds.some((id: mongoose.Types.ObjectId) => id.toString() === studentIdStr);
        if (!isChild) {
          res.status(403).json({ error: '无权查看此作业' });
          return;
        }
      } else {
        res.status(403).json({ error: '无权查看此作业' });
        return;
      }
    } else if (!isOwner) {
      res.status(403).json({ error: '无权查看此作业' });
      return;
    }

    res.json({ homework: homework.toJSON() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取作业详情失败' });
  }
});

// PUT /api/homework/:id/grade - teacher grades homework
router.put('/:id/grade', requireRole(UserRole.Teacher), async (req: AuthRequest, res: Response) => {
  try {
    const { score } = req.body;

    if (score === undefined || score < 0 || score > 100) {
      res.status(400).json({ error: '分数必须在0-100之间' });
      return;
    }

    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      res.status(404).json({ error: '作业不存在' });
      return;
    }

    if (homework.teacherId.toString() !== req.user!._id) {
      res.status(403).json({ error: '只能批改自己布置的作业' });
      return;
    }

    if (homework.status === HomeworkStatus.Graded) {
      res.status(400).json({ error: '作业已批改，不能重复评分' });
      return;
    }

    homework.score = score;
    homework.status = HomeworkStatus.Graded;
    homework.gradedAt = new Date();
    // pre-save will calculate coinReward
    await homework.save();

    // Issue coins via Transaction.record if reward > 0
    if (homework.coinReward > 0) {
      await Transaction.record({
        studentId: homework.studentId.toString(),
        type: TransactionType.HomeworkReward,
        amount: homework.coinReward,
        reference: { model: 'Homework', id: homework._id.toString() },
        description: `作业"${homework.title}"获得满分奖励`,
      });
    }

    res.json({ homework: homework.toJSON() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '批改作业失败' });
  }
});

export default router;
