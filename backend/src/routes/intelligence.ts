// 情报路由
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { summarizeIntelligence } from '../services/claude.js';

const router = Router();

const CreateIntelligenceSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  content: z.string().optional(),
  source: z.string(),
  sourceUrl: z.string().url().optional(),
  category: z.enum(['INSURANCE', 'FINANCE', 'EDUCATION', 'TECH', 'SOCIAL', 'HEALTH']),
  tags: z.array(z.string()).optional(),
  publishTime: z.string().datetime().optional()
});

const QuerySchema = z.object({
  category: z.enum(['INSURANCE', 'FINANCE', 'EDUCATION', 'TECH', 'SOCIAL', 'HEALTH']).optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['hotScore', 'publishTime', 'createdAt']).default('createdAt')
});

// 获取情报列表
router.get('/', async (req, res, next) => {
  try {
    const { category, keyword, page, limit, sortBy } = QuerySchema.parse(req.query);

    const where: any = {};
    if (category) where.category = category;
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { summary: { contains: keyword, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.intelligence.findMany({
        where,
        orderBy: { [sortBy]: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          summary: true,
          source: true,
          sourceUrl: true,
          category: true,
          tags: true,
          hotScore: true,
          publishTime: true,
          createdAt: true
        }
      }),
      prisma.intelligence.count({ where })
    ]);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取热门情报
router.get('/hot', async (req, res, next) => {
  try {
    const { category, limit = 10 } = req.query;

    const where: any = {};
    if (category) where.category = category;

    const data = await prisma.intelligence.findMany({
      where,
      orderBy: { hotScore: 'desc' },
      take: Number(limit),
      select: {
        id: true,
        title: true,
        summary: true,
        source: true,
        category: true,
        hotScore: true,
        publishTime: true
      }
    });

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// 获取单条情报详情
router.get('/:id', async (req, res, next) => {
  try {
    const intelligence = await prisma.intelligence.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        savedBy: {
          where: { userId: req.user!.id },
          select: { id: true, notes: true }
        }
      }
    });

    if (!intelligence) {
      throw new AppError('情报不存在', 404);
    }

    res.json({
      ...intelligence,
      isSaved: intelligence.savedBy.length > 0,
      savedId: intelligence.savedBy[0]?.id
    });
  } catch (error) {
    next(error);
  }
});

// 创建情报（手动录入）
router.post('/', async (req, res, next) => {
  try {
    const data = CreateIntelligenceSchema.parse(req.body);

    // 如果有 AI Key，尝试自动摘要
    let summary = data.summary;
    if (!summary && data.content && process.env.DEEPSEEK_API_KEY) {
      try {
        summary = await summarizeIntelligence(data.title, data.content);
      } catch (e) {
        console.error('AI 摘要失败:', e);
      }
    }

    const intelligence = await prisma.intelligence.create({
      data: {
        ...data,
        summary,
        publishTime: data.publishTime ? new Date(data.publishTime) : undefined
      }
    });

    res.status(201).json(intelligence);
  } catch (error) {
    next(error);
  }
});

// 收藏情报
router.post('/:id/save', async (req, res, next) => {
  try {
    const { notes } = req.body;
    const userId = req.user!.id;
    const intelligenceId = Number(req.params.id);

    // 检查是否已收藏
    const existing = await prisma.savedIntelligence.findUnique({
      where: { userId_intelligenceId: { userId, intelligenceId } }
    });

    if (existing) {
      throw new AppError('已经收藏过了', 409);
    }

    const saved = await prisma.savedIntelligence.create({
      data: { userId, intelligenceId, notes },
      include: { intelligence: true }
    });

    res.json(saved);
  } catch (error) {
    next(error);
  }
});

// 取消收藏
router.delete('/:id/save', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const intelligenceId = Number(req.params.id);

    await prisma.savedIntelligence.delete({
      where: {
        userId_intelligenceId: { userId, intelligenceId }
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// 删除情报（管理员或创建者可删除）
router.delete('/:id', async (req, res, next) => {
  try {
    const intelligenceId = Number(req.params.id);

    // 检查情报是否存在
    const intelligence = await prisma.intelligence.findUnique({
      where: { id: intelligenceId }
    });

    if (!intelligence) {
      throw new AppError('情报不存在', 404);
    }

    // 删除关联的收藏记录
    await prisma.savedIntelligence.deleteMany({
      where: { intelligenceId }
    });

    // 删除情报本身
    await prisma.intelligence.delete({
      where: { id: intelligenceId }
    });

    res.json({ success: true, message: '情报已删除' });
  } catch (error) {
    next(error);
  }
});

// 批量删除情报
router.post('/batch-delete', async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请提供要删除的情报ID数组', 400);
    }

    const idNumbers = ids.map((id: any) => Number(id));

    // 删除关联的收藏记录
    await prisma.savedIntelligence.deleteMany({
      where: { intelligenceId: { in: idNumbers } }
    });

    // 批量删除情报
    const result = await prisma.intelligence.deleteMany({
      where: { id: { in: idNumbers } }
    });

    res.json({
      success: true,
      message: `已删除 ${result.count} 条情报`,
      deletedCount: result.count
    });
  } catch (error) {
    next(error);
  }
});

// 按分类删除情报
router.delete('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;

    // 删除关联的收藏记录
    await prisma.savedIntelligence.deleteMany({
      where: { intelligence: { category } }
    });

    // 删除该分类的所有情报
    const result = await prisma.intelligence.deleteMany({
      where: { category }
    });

    res.json({
      success: true,
      message: `已删除分类 ${category} 下的 ${result.count} 条情报`,
      deletedCount: result.count
    });
  } catch (error) {
    next(error);
  }
});

export default router;
