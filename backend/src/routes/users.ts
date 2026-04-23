// 用户路由
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  preferences: z.object({
    categories: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    notifications: z.object({
      email: z.boolean(),
      browser: z.boolean()
    }).optional()
  }).optional()
});

// 获取当前用户信息
router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        team: {
          select: { id: true, name: true, code: true }
        },
        preferences: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// 更新个人资料
router.patch('/me', async (req, res, next) => {
  try {
    const data = UpdateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...data,
        preferences: data.preferences ? JSON.stringify(data.preferences) : undefined
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        preferences: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// 修改密码
router.post('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('请提供当前密码和新密码', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('新密码长度至少6位', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError('当前密码错误', 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// 获取我的收藏
router.get('/saved', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { type = 'all', page = 1, limit = 20 } = req.query;

    let intelligenceData: any[] = [];
    let caseData: any[] = [];
    let titleData: any[] = [];

    if (type === 'all' || type === 'intelligence') {
      const savedIntelligences = await prisma.savedIntelligence.findMany({
        where: { userId },
        include: { intelligence: true },
        orderBy: { createdAt: 'desc' }
      });
      intelligenceData = savedIntelligences;
    }

    if (type === 'all' || type === 'cases') {
      const savedCases = await prisma.savedCase.findMany({
        where: { userId },
        include: { case: true },
        orderBy: { createdAt: 'desc' }
      });
      caseData = savedCases;
    }

    if (type === 'all' || type === 'titles') {
      const savedTitles = await prisma.savedTitle.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      titleData = savedTitles;
    }

    res.json({
      intelligence: intelligenceData,
      cases: caseData,
      titles: titleData
    });
  } catch (error) {
    next(error);
  }
});

// 获取使用统计
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const [savedIntelligences, savedCases, savedTitles, activityLogs] = await Promise.all([
      prisma.savedIntelligence.count({ where: { userId } }),
      prisma.savedCase.count({ where: { userId } }),
      prisma.savedTitle.count({ where: { userId } }),
      prisma.activityLog.count({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      savedIntelligences,
      savedCases,
      savedTitles,
      activityLogs
    });
  } catch (error) {
    next(error);
  }
});

// 获取活动日志
router.get('/activity', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const logs = await prisma.activityLog.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    res.json({ data: logs });
  } catch (error) {
    next(error);
  }
});

export default router;
