// 爆款情报站 - 后端入口
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { prisma } from './lib/prisma.js';
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
import subscribeRoutes from './routes/subscribe.js';
import materialsRoutes from './routes/materials.js';
import collectRoutes from './routes/collect.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authLimiter } from './middleware/rateLimiter.js';

const app = express();
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
app.use('/api/subscribe', subscribeRoutes);       // 公众号订阅

// 公开 API（无需登录即可查看）
app.use('/api/cases', casesRoutes);  // 爆款案例列表
app.use('/api/products', productsRoutes);  // 产品数据
app.use('/api/intelligence', intelligenceRoutes);  // 情报中心
app.use('/api/templates', templatesRoutes);  // 模板库
app.use('/api/title-optimization', titleOptimizationRoutes);  // 标题优化
app.use('/api/generator', generatorRoutes);  // 标题生成

// 认证中间件
import { authenticate, requireRole } from './middleware/auth.js';

// 需要登录的 API（个性化/管理功能）
const protectedRoutes = [
  { path: '/api/users', router: userRoutes },
  { path: '/api/teams', router: teamRoutes },
  { path: '/api/stats', router: statsRoutes },
  { path: '/api/materials', router: materialsRoutes },
  { path: '/api/collect', router: collectRoutes },
];

protectedRoutes.forEach(({ path, router }) => {
  app.use(path, authenticate, router);
});

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

// prisma 已在 lib/prisma.ts 中导出
