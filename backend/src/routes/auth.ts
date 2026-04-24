// 认证路由
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const RegisterSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// 注册
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { username, email, password } = RegisterSchema.parse(req.body);

    // 检查用户是否存在
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existing) {
      throw new AppError('用户名或邮箱已存在', 409);
    }

    // 创建用户
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, passwordHash }
    });

    // 生成 Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string }
    );

    res.status(201).json({
      user: { id: user.id, username, email, role: user.role },
      token
    });
  } catch (error) {
    next(error);
  }
});

// 登录
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('邮箱或密码错误', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('邮箱或密码错误', 401);
    }

    // 更新最后登录
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // 生成 Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, teamId: user.teamId },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        teamId: user.teamId
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// 刷新 Token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('缺少刷新令牌', 400);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { id: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, email: true, role: true }
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string }
    );

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

export default router;
