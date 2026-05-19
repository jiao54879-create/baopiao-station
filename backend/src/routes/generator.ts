// 生成器路由 - 风格类型版本
import { Router } from 'express';
import { z } from 'zod';
import { 
  generateTitles, 
  generateTitlesByStyle, 
  generateCrossDomainTitles,
  STYLE_DEFINITIONS,
  CROSS_DOMAIN_HOOKS,
  FILL_IN_TEMPLATES,
  PSYCHOLOGICAL_TRIGGERS,
  StyleType
} from '../services/claude.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Schema 定义
const GenerateSchema = z.object({
  keywords: z.array(z.string()).min(1).max(5),
  context: z.string().optional(),
  count: z.number().min(5).max(20).default(12)
});

const GenerateByStyleSchema = z.object({
  keywords: z.array(z.string()).min(1).max(5),
  styleTypes: z.union([
    z.string(), // 单个风格如 "A" 或逗号分隔的 "A,B,C"
    z.array(z.string()) // 数组如 ["A", "B"]
  ]),
  enableCrossDomain: z.boolean().optional().default(false),
  crossDomainTypes: z.array(z.string()).optional(),
  count: z.number().min(5).max(15).default(8)
});

const GenerateCrossDomainSchema = z.object({
  keywords: z.array(z.string()).min(1).max(5),
  crossDomainType: z.enum(['职场', '情感', '育儿', '理财', '健康']),
  count: z.number().min(5).max(10).default(6)
});

// ==================== 原接口（保持兼容） ====================

// 生成标题（原有接口）
router.post('/', async (req, res, next) => {
  try {
    const { keywords, context, count } = GenerateSchema.parse(req.body);

    if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new AppError('AI 服务未配置，请在 Railway 环境变量中设置 DEEPSEEK_API_KEY', 500);
    }

    const result = await generateTitles(keywords, context);
    const limitedTitles = result.titles.slice(0, count);

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 1,
        action: 'GENERATE_TITLES',
        resource: 'saved_title',
        details: JSON.stringify({ keywords, count: limitedTitles.length })
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

// ==================== 新接口：按风格类型生成 ====================

// 按风格类型生成标题
router.post('/by-style', async (req, res, next) => {
  try {
    const { keywords, styleTypes, enableCrossDomain, crossDomainTypes, count } = GenerateByStyleSchema.parse(req.body);

    if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new AppError('AI 服务未配置', 500);
    }

    // 解析风格类型
    let styles: StyleType[];
    if (typeof styleTypes === 'string') {
      if (styleTypes.includes(',')) {
        styles = styleTypes.split(',').map(s => s.trim().toUpperCase()) as StyleType[];
      } else {
        styles = [styleTypes.toUpperCase()] as StyleType[];
      }
    } else {
      styles = styleTypes.map(s => s.toUpperCase()) as StyleType[];
    }

    // 验证风格类型
    const validStyles = styles.filter(s => STYLE_DEFINITIONS[s]);
    if (validStyles.length === 0) {
      throw new AppError('请选择有效的风格类型：A、B、C、D、E、F', 400);
    }

    const result = await generateTitlesByStyle(keywords, validStyles, {
      enableCrossDomain,
      crossDomainTypes,
      count
    });

    const limitedTitles = result.titles.slice(0, count);

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 1,
        action: 'GENERATE_TITLES_BY_STYLE',
        resource: 'saved_title',
        details: JSON.stringify({ keywords, styles: validStyles, count: limitedTitles.length })
      }
    });

    res.json({
      keywords,
      styleTypes: validStyles,
      enableCrossDomain,
      titles: limitedTitles,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// 生成跨赛道标题
router.post('/cross-domain', async (req, res, next) => {
  try {
    const { keywords, crossDomainType, count } = GenerateCrossDomainSchema.parse(req.body);

    if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new AppError('AI 服务未配置', 500);
    }

    const result = await generateCrossDomainTitles(keywords, crossDomainType);
    const limitedTitles = result.titles.slice(0, count);

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 1,
        action: 'GENERATE_CROSS_DOMAIN_TITLES',
        resource: 'saved_title',
        details: JSON.stringify({ keywords, crossDomainType, count: limitedTitles.length })
      }
    });

    res.json({
      keywords,
      crossDomainType,
      titles: limitedTitles,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 辅助接口 ====================

// 获取风格定义列表
router.get('/styles', (req, res) => {
  const styles = Object.values(STYLE_DEFINITIONS).map(s => ({
    id: s.id,
    name: s.name,
    emoji: s.emoji,
    color: s.color,
    description: s.description,
    coreLogic: s.coreLogic,
    exampleTitles: s.exampleTitles.slice(0, 2),
    templateCount: s.templates.length
  }));

  res.json({
    success: true,
    styles
  });
});

// 获取跨赛道钩子
router.get('/cross-domain-hooks', (req, res) => {
  res.json({
    success: true,
    hooks: CROSS_DOMAIN_HOOKS
  });
});

// 获取填空模板
router.get('/fill-templates', (req, res) => {
  res.json({
    success: true,
    templates: FILL_IN_TEMPLATES
  });
});

// 获取心理触发器
router.get('/psychological-triggers', (req, res) => {
  res.json({
    success: true,
    triggers: PSYCHOLOGICAL_TRIGGERS
  });
});

// ==================== 保存和标记接口（保持原有） ====================

// 保存生成的标题
router.post('/save', async (req, res, next) => {
  try {
    const { keywords, generatedTitles, finalTitle, notes } = req.body;

    const saved = await prisma.savedTitle.create({
      data: {
        userId: req.user?.id || 1,
        keywords,
        generatedTitles: generatedTitles || [],
        finalTitle,
        notes
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || 1,
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
