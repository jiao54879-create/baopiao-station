// 标题优化路由 - 方案二：AI标题优化
import { Router } from 'express';
import { z } from 'zod';
import {
  analyzeTitle,
  optimizeTitle,
  batchOptimizeTitles,
  generateHotTopicTitles,
  learnFromDatabase,
  generateDynamicPrompt,
  isHotTopic,
  HOT_TOPIC_CATEGORIES
} from '../services/titleOptimizer.js';
import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// ==================== 分析相关 ====================

// 分析单个标题
router.post('/analyze', async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      throw new AppError('请提供有效的标题', 400);
    }

    const analysis = await analyzeTitle(title);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    next(error);
  }
});

// 批量分析标题
router.post('/analyze/batch', async (req, res, next) => {
  try {
    const { titles } = req.body;

    if (!Array.isArray(titles) || titles.length === 0) {
      throw new AppError('请提供标题数组', 400);
    }

    const analyses = await Promise.all(
      titles.slice(0, 20).map(title => analyzeTitle(title))
    );

    // 按分数排序
    analyses.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      analyses,
      summary: {
        total: analyses.length,
        highPotential: analyses.filter(a => a.viralPotential === 'HIGH').length,
        mediumPotential: analyses.filter(a => a.viralPotential === 'MEDIUM').length,
        lowPotential: analyses.filter(a => a.viralPotential === 'LOW').length,
        avgScore: Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 学习爆款特征
router.get('/learn', async (req, res, next) => {
  try {
    const learned = await learnFromDatabase();

    res.json({
      success: true,
      learned,
      patterns: {
        shock: { weight: 3, description: '震惊/突发元素' },
        number: { weight: 4, description: '具体数字' },
        question: { weight: 3, description: '疑问句' },
        emotion: { weight: 4, description: '情绪共鸣' },
        practical: { weight: 4, description: '实用价值' },
        story: { weight: 3, description: '真实案例' },
        identity: { weight: 2, description: '人群标签' }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取当前Prompt模板
router.get('/prompt', async (req, res, next) => {
  try {
    const { hotTopics, targetAudience } = req.query;

    const prompt = await generateDynamicPrompt({
      hotTopics: hotTopics ? hotTopics.toString().split(',') : undefined,
      targetAudience: targetAudience?.toString()
    });

    res.json({
      success: true,
      prompt
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 优化相关 ====================

// 优化单个标题
router.post('/optimize', async (req, res, next) => {
  try {
    const { title, hotTopics, targetAudience } = req.body;

    if (!title || typeof title !== 'string') {
      throw new AppError('请提供有效的标题', 400);
    }

    if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      throw new AppError('AI 服务未配置，请联系管理员', 500);
    }

    const result = await optimizeTitle(title, {
      hotTopics: hotTopics ? hotTopics.split(',') : undefined,
      targetAudience
    });

    // 记录活动
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'OPTIMIZE_TITLE',
          resource: 'title_optimization',
          details: JSON.stringify({
            originalTitle: title,
            optimizedTitle: result.optimizedTitle,
            improvement: result.improvement
          })
        }
      });
    }

    res.json({
      success: true,
      result
    });
  } catch (error) {
    next(error);
  }
});

// 批量优化标题
router.post('/optimize/batch', async (req, res, next) => {
  try {
    const { titles, hotTopics, targetAudience } = req.body;

    if (!Array.isArray(titles) || titles.length === 0) {
      throw new AppError('请提供标题数组', 400);
    }

    if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      throw new AppError('AI 服务未配置，请联系管理员', 500);
    }

    // 限制批量数量
    const limitedTitles = titles.slice(0, 10);

    const results = await batchOptimizeTitles(limitedTitles, {
      hotTopics: hotTopics ? hotTopics.split(',') : undefined,
      targetAudience
    });

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        avgImprovement: Math.round(
          results.reduce((sum, r) => sum + r.improvement, 0) / results.length
        ),
        maxImprovement: Math.max(...results.map(r => r.improvement))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 热点借势 ====================

// 热点借势标题生成
router.post('/hot-topic', async (req, res, next) => {
  try {
    const { hotTopic, keywords } = req.body;

    if (!hotTopic || typeof hotTopic !== 'string') {
      throw new AppError('请提供热点话题', 400);
    }

    if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      throw new AppError('AI 服务未配置，请联系管理员', 500);
    }

    const titles = await generateHotTopicTitles(hotTopic, keywords);

    // 记录活动
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'GENERATE_HOT_TOPIC_TITLES',
          resource: 'hot_topic',
          details: JSON.stringify({ hotTopic, titlesCount: titles.length })
        }
      });
    }

    res.json({
      success: true,
      hotTopic,
      titles
    });
  } catch (error) {
    next(error);
  }
});

// 获取热点分类
router.get('/hot-categories', (req, res) => {
  res.json({
    success: true,
    categories: HOT_TOPIC_CATEGORIES
  });
});

// 检测文本是否为热点
router.post('/detect-hot', (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.json({
      success: false,
      isHot: false
    });
  }

  const isHot = isHotTopic(text);

  res.json({
    success: true,
    isHot,
    message: isHot
      ? '检测到热点元素，可能会获得更高的关注度'
      : '未检测到明显的热点元素'
  });
});

// ==================== 从情报中心一键优化 ====================

// 从情报中心获取内容并优化标题
router.post('/optimize-from-intelligence', async (req, res, next) => {
  try {
    const { intelligenceIds, targetAudience } = req.body;

    if (!Array.isArray(intelligenceIds) || intelligenceIds.length === 0) {
      throw new AppError('请提供情报ID数组', 400);
    }

    // 获取情报内容
    const intelligences = await prisma.intelligence.findMany({
      where: {
        id: { in: intelligenceIds }
      },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true
      }
    });

    if (intelligences.length === 0) {
      throw new AppError('未找到相关情报', 404);
    }

    // 批量优化标题
    const optimizationResults = await batchOptimizeTitles(
      intelligences.map(i => i.title),
      { targetAudience }
    );

    // 合并结果
    const results = intelligences.map((item, index) => ({
      intelligenceId: item.id,
      originalTitle: item.title,
      optimizedTitle: optimizationResults[index]?.optimizedTitle || item.title,
      summary: item.summary,
      improvement: optimizationResults[index]?.improvement || 0
    }));

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        avgImprovement: Math.round(
          results.reduce((sum, r) => sum + r.improvement, 0) / results.length
        )
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
