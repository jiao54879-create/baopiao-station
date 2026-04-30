// 爆款案例路由
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateTitles, analyzeViralCase } from '../services/claude.js';

const router = Router();

const GenerateTitleSchema = z.object({
  keywords: z.array(z.string()).min(1).max(5),
  context: z.string().optional()
});

const AnalyzeCaseSchema = z.object({
  title: z.string(),
  content: z.string(),
  metrics: z.object({
    likes: z.number(),
    favorites: z.number(),
    comments: z.number()
  })
});

// AI 生成标题
router.post('/generate', async (req, res, next) => {
  try {
    const { keywords, context } = GenerateTitleSchema.parse(req.body);

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new AppError('AI 服务未配置', 500);
    }

    const result = await generateTitles(keywords, context);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 分析爆款案例
router.post('/analyze', async (req, res, next) => {
  try {
    const { title, content, metrics } = AnalyzeCaseSchema.parse(req.body);

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: 'AI 服务未配置，请联系管理员配置 DeepSeek API Key' });
    }

    const result = await analyzeViralCase(title, content, metrics);
    res.json(result);
  } catch (error: any) {
    console.error('AI 分析失败:', error.message);
    return res.status(500).json({ error: 'AI 分析失败: ' + error.message });
  }
});

// 获取爆款案例列表
router.get('/', async (req, res, next) => {
  try {
    const { platform, insuranceType, keyword, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (platform) where.platform = platform;
    if (insuranceType) where.insuranceType = insuranceType;
    if (keyword) {
      where.OR = [
        { title: { contains: String(keyword), mode: 'insensitive' } },
        { content: { contains: String(keyword), mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.viralCase.findMany({
        where,
        orderBy: { viralScore: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        select: {
          id: true,
          platform: true,
          title: true,
          author: true,
          url: true,
          content: true,
          likesCount: true,
          favoritesCount: true,
          commentsCount: true,
          viralScore: true,
          tags: true,
          insuranceType: true,
          publishedAt: true
        }
      }),
      prisma.viralCase.count({ where })
    ]);

    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取单条案例详情
router.get('/:id', async (req, res, next) => {
  try {
    const viralCase = await prisma.viralCase.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        savedBy: {
          where: { userId: req.user!.id },
          select: { id: true }
        }
      }
    });

    if (!viralCase) {
      throw new AppError('案例不存在', 404);
    }

    res.json({
      ...viralCase,
      isSaved: viralCase.savedBy.length > 0
    });
  } catch (error) {
    next(error);
  }
});

// 收藏案例
router.post('/:id/save', async (req, res, next) => {
  try {
    const { notes } = req.body;
    const userId = req.user!.id;
    const caseId = Number(req.params.id);

    const existing = await prisma.savedCase.findUnique({
      where: { userId_caseId: { userId, caseId } }
    });

    if (existing) {
      throw new AppError('已经收藏过了', 409);
    }

    const saved = await prisma.savedCase.create({
      data: { userId, caseId, notes },
      include: { case: true }
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
    const caseId = Number(req.params.id);

    await prisma.savedCase.delete({
      where: { userId_caseId: { userId, caseId } }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// 保存生成的标题
router.post('/titles/save', async (req, res, next) => {
  try {
    const { keywords, generatedTitles, finalTitle, notes } = req.body;
    const userId = req.user!.id;

    const saved = await prisma.savedTitle.create({
      data: {
        userId,
        keywords,
        generatedTitles,
        finalTitle,
        notes
      }
    });

    res.json(saved);
  } catch (error) {
    next(error);
  }
});

// 获取我的标题收藏
router.get('/titles/mine', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.savedTitle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.savedTitle.count({ where })
    ]);

    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
