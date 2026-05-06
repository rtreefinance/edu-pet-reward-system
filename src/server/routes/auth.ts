import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../shared/types';
import User from '../models/User';
import { authenticate, requireRole, signToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, role, displayName, subject, parentCode } = req.body;

    if (!username || !password || !role || !displayName) {
      res.status(400).json({ error: '缺少必填字段: username, password, role, displayName' });
      return;
    }

    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ error: `无效角色: ${role}` });
      return;
    }

    if (role === UserRole.Teacher && !subject) {
      res.status(400).json({ error: '教师注册需要提供subject字段' });
      return;
    }

    const existing = await User.findOne({ username });
    if (existing) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userData: any = {
      username,
      passwordHash,
      role,
      displayName,
    };

    if (role === UserRole.Student) {
      userData.coins = 0;
      userData.level = 1;
      userData.xp = 0;
    }

    if (role === UserRole.Teacher) {
      userData.subject = subject;
    }

    if (role === UserRole.Parent && parentCode) {
      // parentCode not used in this simple version, but field accepted
    }

    const user = await User.create(userData);

    const token = signToken({ userId: user._id.toString(), role: user.role });

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '注册失败' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '缺少用户名或密码' });
      return;
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '登录失败' });
  }
});

// GET /api/auth/me - current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json({ user: user.toJSON() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取用户信息失败' });
  }
});

export default router;
