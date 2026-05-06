import { Router, Response } from 'express';
import { UserRole } from '../../shared/types';
import User from '../models/User';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/user/:id - get user info (sanitized: displayName, avatarUrl, role only)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.user!._id;
    const requesterRole = req.user!.role;
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    // Students can only view themselves (though /me is preferred)
    if (requesterRole === UserRole.Student && id !== requesterId) {
      res.status(403).json({ error: '无权查看其他用户信息' });
      return;
    }

    // Parents can view themselves and their children
    if (requesterRole === UserRole.Parent && id !== requesterId) {
      const parent = await User.findById(requesterId);
      const isChild = parent?.childrenIds?.some(
        (childId: any) => childId.toString() === id,
      );
      if (!isChild) {
        res.status(403).json({ error: '无权查看此用户信息' });
        return;
      }
    }

    // Return sanitized user info
    res.json({
      user: {
        _id: targetUser._id,
        displayName: targetUser.displayName,
        avatarUrl: targetUser.avatarUrl,
        role: targetUser.role,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || '获取用户信息失败' });
  }
});

export default router;
