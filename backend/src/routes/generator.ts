// 生成器路由（标题生成）
import { Router } from 'express';
import { z } from 'zod';
import { generateTitles } from '../services/claude.js';
import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const GenerateSchema = z.object({
  keywords: z.array(z.string()).min(1).max(5),
  context: z.string().optional(),
  count: z.number().min(5).max(20).default(12)
});

// 生成标题
router.post('/', async (req, res, next) => {
  try {
    const { keywords, context, count } = GenerateSchema.parse(req.body);

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new AppError('AI 服务未配置，请联系管理员', 500);
    }

    // 调用 Claude 生成标题
    const result = await generateTitles(keywords, context);

    // 限制返回数量
    const limitedTitles = result.titles.slice(0, count);

    // 记录到活动日志
    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'GENERATE_TITLES',
        resource: 'saved_title',
        details: { keywords, count: limitedTitles.length }
      }
    });

    res.json({
      keywords,
      titles: limitedTitles,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// 保存生成的标题
router.post('/save', async (req, res, next) => {
  try {
    const { keywords, generatedTitles, finalTitle, notes } = req.body;

    const saved = await prisma.savedTitle.create({
      data: {
        userId: req.user!.id,
        keywords,
        generatedTitles: generatedTitles || [],
        finalTitle,
        notes
      }
    });

    // 记录活动
    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'SAVE_TITLE',
        resource: 'saved_title',
        resourceId: saved.id
      }
    });

    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
});

// 标记标题为已使用
router.patch('/:id/use', async (req, res, next) => {
  try {
    const title = await prisma.savedTitle.findFirst({
      where: { id: Number(req.params.id), userId: req.user!.id }
    });

    if (!title) {
      throw new AppError('标题不存在', 404);
    }

    const updated = await prisma.savedTitle.update({
      where: { id: title.id },
      data: { status: 'USED', usedAt: new Date() }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
