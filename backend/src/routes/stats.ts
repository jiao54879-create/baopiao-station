// 数据统计路由
import { Router } from 'express';
import reportService from '../services/report.js';
import notificationService from '../services/notification.js';

const router = Router();

// 获取仪表盘统计数据
router.get('/dashboard', async (req, res, next) => {
  try {
    const teamId = req.user?.teamId || undefined;
    const stats = await reportService.getDashboardStats(teamId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// 获取每日报告
router.get('/daily-report', async (req, res, next) => {
  try {
    const teamId = req.user?.teamId || undefined;
    const report = await reportService.generateDailyReport(teamId);
    res.json({ report });
  } catch (error) {
    next(error);
  }
});

// 发送每日摘要（手动触发）
router.post('/send-daily-summary', async (req, res, next) => {
  try {
    if (!req.user?.teamId) {
      return res.status(400).json({ error: '需要团队ID' });
    }

    await notificationService.sendDailySummary(req.user.teamId);
    res.json({ success: true, message: '每日摘要已发送' });
  } catch (error) {
    next(error);
  }
});

// 发送测试通知
router.post('/test-notification', async (req, res, next) => {
  try {
    const { type = 'info' } = req.body;

    await notificationService.broadcastToTeam(req.user!.teamId!, {
      title: '测试通知',
      content: '这是一条来自爆款情报站的测试消息。',
      type
    });

    res.json({ success: true, message: '测试通知已发送' });
  } catch (error) {
    next(error);
  }
});

// 配置飞书 Webhook
router.post('/config/feishu', async (req, res, next) => {
  try {
    const { webhook } = req.body;
    notificationService.setFeishuWebhook(webhook);
    res.json({ success: true, message: '飞书 Webhook 已配置' });
  } catch (error) {
    next(error);
  }
});

export default router;
