// 爆款情报站 - 后端入口
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import intelligenceRoutes from './routes/intelligence.js';
import casesRoutes from './routes/cases.js';
import generatorRoutes from './routes/generator.js';
import teamRoutes from './routes/teams.js';
import statsRoutes from './routes/stats.js';
import templatesRoutes from './routes/templates.js';
import titleOptimizationRoutes from './routes/titleOptimization.js';
import productsRoutes from './routes/products.js';
import triggerRoutes from './routes/trigger.js';
import materialsRoutes from './routes/materials.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authLimiter } from './middleware/rateLimiter.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
// CORS 配置
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 允许本地开发、Railway 前端、或无 origin（Postman 等）
    const allowedOrigins = [
      'http://localhost:3000',
      'https://proud-perception-production-700e.up.railway.app',
      undefined // 无 origin 的请求（如 Postman）
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的 CORS 来源'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// 静态文件服务（上传的素材）
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 公共路由（无需登录）
app.use('/api/auth', authRoutes);
app.use('/api/teams/invite/:token', teamRoutes); // 邀请链接无需认证
app.use('/api/trigger', triggerRoutes);          // 采集触发（用 TRIGGER_SECRET 验证，无需 JWT）

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
app.use('/api/title-optimization', titleOptimizationRoutes);  // AI标题优化（方案二）
  app.use('/api/products', productsRoutes);  // 保险产品管理
  app.use('/api/materials', materialsRoutes);  // 素材上传管理

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// Railway 环境变量
const HOST = process.env.HOST || '0.0.0.0';

// 启动服务
async function startServer() {
  try {
    // 尝试连接数据库
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }

  app.listen(+PORT, HOST, () => {
    console.log(`🚀 爆款情报站 API 服务运行在 http://${HOST}:${PORT}`);

    // 启动数据采集调度器
    try {
      import('./scrapers/scheduler.js').then(({ default: scheduler }) => {
        scheduler.start();
      }).catch(e => {
        console.log('调度器启动失败（继续运行）:', e.message);
      });
    } catch (e) {
      console.log('调度器导入失败（继续运行）');
    }
  });
}

startServer();

// 优雅关闭
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
