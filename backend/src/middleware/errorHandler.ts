// 错误处理中间件
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  // Zod 验证错误
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: '数据验证失败',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Prisma 错误
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({ error: '记录已存在' });
      case 'P2025':
        return res.status(404).json({ error: '记录不存在' });
      default:
        return res.status(500).json({ error: '数据库错误' });
    }
  }

  // 自定义应用错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // 默认错误
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
  });
}
