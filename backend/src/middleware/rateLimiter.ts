// 速率限制中间件（开发环境版本，无需 Redis）
import rateLimit from 'express-rate-limit';

// 认证相关接口限流
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 20, // 最多 20 次
  message: { error: '请求过于频繁，请稍后再试' }
});

// API 通用限流
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 100, // 最多 100 次
  message: { error: '请求过于频繁' }
});

// AI 生成限流（防止滥用）
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10, // 最多 10 次
  message: { error: 'AI 生成请求过于频繁，请稍后再试' }
});
