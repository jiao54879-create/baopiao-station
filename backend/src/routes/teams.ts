// 团队路由
import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const CreateTeamSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional()
});

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')
});

// 创建团队
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = CreateTeamSchema.parse(req.body);
    const userId = req.user!.id;

    // 生成团队码
    const code = randomBytes(4).toString('hex').toUpperCase();

    const team = await prisma.team.create({
      data: {
        name,
        description,
        code,
        members: {
          connect: { id: userId }
        }
      },
      include: { members: { select: { id: true, username: true, email: true, role: true } } }
    });

    // 将用户角色更新为 ADMIN
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN', teamId: team.id }
    });

    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
});

// 获取我的团队
router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: {
              select: { id: true, username: true, email: true, role: true, lastLoginAt: true }
            }
          }
        }
      }
    });

    if (!user?.team) {
      return res.json({ team: null });
    }

    res.json({ team: user.team });
  } catch (error) {
    next(error);
  }
});

// 邀请成员
router.post('/invite', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { email, role } = InviteSchema.parse(req.body);
    const teamId = req.user!.teamId!;

    // 检查是否已是成员
    const existing = await prisma.user.findFirst({
      where: { email, teamId }
    });
    if (existing) {
      throw new AppError('该用户已是团队成员', 409);
    }

    // 生成邀请令牌
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天过期

    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        email,
        role,
        token,
        expiresAt,
        createdBy: req.user!.id
      }
    });

    // TODO: 发送邮件通知
    const inviteLink = `${process.env.API_BASE_URL}/teams/invite/${token}`;

    res.status(201).json({
      ...invite,
      inviteLink
    });
  } catch (error) {
    next(error);
  }
});

// 处理邀请链接
router.get('/invite/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: { team: true }
    });

    if (!invite) {
      throw new AppError('邀请链接无效', 404);
    }

    if (invite.usedAt) {
      throw new AppError('邀请链接已使用', 400);
    }

    if (invite.expiresAt < new Date()) {
      throw new AppError('邀请链接已过期', 400);
    }

    // 如果已登录，直接加入团队
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { teamId: invite.teamId, role: invite.role }
      });

      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() }
      });

      return res.json({ success: true, team: invite.team });
    }

    res.json({
      invite: {
        teamName: invite.team.name,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// 接受邀请（需要登录）
router.post('/invite/:token/accept', async (req, res, next) => {
  try {
    const { token } = req.params;

    const invite = await prisma.teamInvite.findUnique({
      where: { token }
    });

    if (!invite) {
      throw new AppError('邀请链接无效', 404);
    }

    if (invite.usedAt) {
      throw new AppError('邀请链接已使用', 400);
    }

    if (invite.expiresAt < new Date()) {
      throw new AppError('邀请链接已过期', 400);
    }

    // 更新用户团队
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { teamId: invite.teamId, role: invite.role }
    });

    // 标记邀请已使用
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() }
    });

    const team = await prisma.team.findUnique({
      where: { id: invite.teamId }
    });

    res.json({ success: true, team });
  } catch (error) {
    next(error);
  }
});

// 获取团队成员列表
router.get('/members', requireRole('ADMIN', 'MEMBER'), async (req, res, next) => {
  try {
    const teamId = req.user!.teamId!;

    const members = await prisma.user.findMany({
      where: { teamId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    res.json({ data: members });
  } catch (error) {
    next(error);
  }
});

// 移除成员
router.delete('/members/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const memberId = Number(req.params.id);
    const teamId = req.user!.teamId!;

    if (memberId === req.user!.id) {
      throw new AppError('不能移除自己', 400);
    }

    const member = await prisma.user.findFirst({
      where: { id: memberId, teamId }
    });

    if (!member) {
      throw new AppError('成员不存在', 404);
    }

    await prisma.user.update({
      where: { id: memberId },
      data: { teamId: null, role: 'MEMBER' }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
