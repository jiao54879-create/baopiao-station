// 爆款情报站 - 后端入口
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import intelligenceRoutes from './routes/intelligence.js';
import casesRoutes from './routes/cases.js';
import generatorRoutes from './routes/generator.js';
import teamRoutes from './routes/teams.js';
import statsRoutes from './routes/stats.js';
import templatesRoutes from './routes/templates.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authLimiter } from './middleware/rateLimiter.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 公共路由
app.use('/api/auth', authRoutes);
app.use('/api/teams/invite/:token', teamRoutes); // 邀请链接无需认证

// 认证中间件
import { authenticate } from './middleware/auth.js';
app.use('/api', authenticate);

// 受保护的 API 路由
app.use('/api/users', userRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/generator', generatorRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/templates', templatesRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// Railway 环境变量
const HOST = process.env.HOST || '0.0.0.0';

// 启动服务
app.listen(+PORT, HOST, () => {
  console.log(`🚀 爆款情报站 API 服务运行在 http://${HOST}:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
