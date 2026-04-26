// 采集触发 API - 用于外部定时器调用
import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// 从环境变量获取触发密钥，默认值用于本地开发
const TRIGGER_SECRET = process.env.TRIGGER_SECRET || 'baopiao2024secret';

// 简单的触发密钥验证
function verifyTrigger(req: any): boolean {
  const token = req.headers['x-trigger-token'];
  if (!token) return false;
  
  const hash = crypto.createHmac('sha256', TRIGGER_SECRET)
    .update(process.env.DATABASE_URL || '')
    .digest('hex');
  
  return token === hash;
}

// POST /api/trigger/collect - 触发数据采集（需要token）
router.post('/collect', async (req, res) => {
  try {
    // 验证触发令牌
    const triggerToken = req.headers['x-trigger-token'];
    if (triggerToken !== TRIGGER_SECRET) {
      return res.status(401).json({ error: '未授权的采集请求' });
    }

    console.log('📦 收到采集触发请求');

    // 动态导入调度器并执行
    const { default: scheduler } = await import('../scrapers/scheduler.js');

    // 执行所有采集任务
    const results: any[] = [];
    for (const job of scheduler.getStatus()) {
      if (job.enabled) {
        try {
          await scheduler.runOne(job.name);
          results.push({ name: job.name, status: 'success' });
        } catch (e: any) {
          results.push({ name: job.name, status: 'error', message: e.message });
        }
      }
    }

    res.json({
      success: true,
      message: '采集任务执行完成',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('采集触发失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/trigger/collect-test - 公开测试采集接口（无需认证）
router.post('/collect-test', async (req, res) => {
  try {
    console.log('📦 收到测试采集请求');

    console.log('📦 收到采集触发请求');
    
    // 动态导入调度器并执行
    const { default: scheduler } = await import('../scrapers/scheduler.js');
    
    // 执行所有采集任务
    const results: any[] = [];
    for (const job of scheduler.getStatus()) {
      if (job.enabled) {
        try {
          await scheduler.runOne(job.name);
          results.push({ name: job.name, status: 'success' });
        } catch (e: any) {
          results.push({ name: job.name, status: 'error', message: e.message });
        }
      }
    }

    res.json({
      success: true,
      message: '采集任务执行完成',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('采集触发失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/trigger/status - 查看采集任务状态（无需认证）
router.get('/status', async (req, res) => {
  try {
    const { default: scheduler } = await import('../scrapers/scheduler.js');
    const status = scheduler.getStatus();
    
    res.json({
      success: true,
      tasks: status.map(task => ({
        name: task?.name || '未知任务',
        enabled: task?.enabled ?? false,
        schedule: task?.schedule || '',
        lastRun: task?.lastRun,
        nextRun: task?.nextRun
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/trigger/stats - 查看数据库统计
router.get('/stats', async (req, res) => {
  try {
    const { prisma } = await import('../index.js');
    
    const [intelligenceCount, casesCount, productsCount] = await Promise.all([
      prisma.intelligence.count(),
      prisma.viralCase.count(),
      prisma.insuranceProduct.count()
    ]);

    res.json({
      success: true,
      stats: {
        intelligence: intelligenceCount,
        viralCases: casesCount,
        products: productsCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;

// POST /api/trigger/clear-and-collect - 清空旧数据并重新采集（用于测试）
router.post('/clear-and-collect', async (req, res) => {
  try {
    const { prisma } = await import('../index.js');
    
    // 清空情报、爆款案例
    await prisma.intelligence.deleteMany({});
    await prisma.viralCase.deleteMany({});
    
    console.log('🗑️ 已清空旧数据');
    res.json({ success: true, message: '已清空数据，开始重新采集...' });
    
    // 异步执行采集（不阻塞响应）
    setTimeout(async () => {
      try {
        const { default: scheduler } = await import('../scrapers/scheduler.js');
        const jobs = scheduler.getStatus().filter((j: any) => j.enabled);
        for (const job of jobs) {
          try {
            await scheduler.runOne(job.name);
          } catch (e: any) {
            console.log(`[${job.name}] 采集失败:`, e.message);
          }
        }
        console.log('✅ 重新采集完成');
      } catch (e: any) {
        console.error('采集失败:', e.message);
      }
    }, 100);
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
