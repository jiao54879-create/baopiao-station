// 爆款案例路由
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateTitles, analyzeViralCase } from '../services/claude.js';
import OpenAI from 'openai';

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

const CreateCaseSchema = z.object({
  platform: z.enum(['XHS', 'WX', 'DOUYIN', 'VIDEO', 'WEIBO', 'ZHIHU']),
  title: z.string(),
  content: z.string().optional(),
  author: z.string().optional(),
  authorUrl: z.string().optional(),
  url: z.string(),
  coverImage: z.string().optional(),
  likesCount: z.number().optional(),
  favoritesCount: z.number().optional(),
  commentsCount: z.number().optional(),
  sharesCount: z.number().optional(),
  tags: z.array(z.string()).optional(),
  insuranceType: z.string().optional(),
  viralScore: z.number().optional(),
  analysis: z.string().optional(),
  publishedAt: z.string().datetime().optional()
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

// 创建爆款案例
router.post('/', async (req, res, next) => {
  try {
    const data = CreateCaseSchema.parse(req.body);

    const viralCase = await prisma.viralCase.create({
      data: {
        platform: data.platform,
        title: data.title,
        content: data.content,
        author: data.author,
        authorUrl: data.authorUrl,
        url: data.url,
        coverImage: data.coverImage,
        likesCount: data.likesCount || 0,
        favoritesCount: data.favoritesCount || 0,
        commentsCount: data.commentsCount || 0,
        sharesCount: data.sharesCount || 0,
        tags: data.tags ? JSON.stringify(data.tags) : '[]',
        insuranceType: data.insuranceType,
        viralScore: data.viralScore,
        analysis: data.analysis,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined
      }
    });

    res.status(201).json(viralCase);
  } catch (error) {
    next(error);
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

// ==================== 一键仿写功能 ====================

const RewriteRequestSchema = z.object({
  style: z.enum(['hearth', 'practical', 'twist', 'anxiety', 'data'])
});

// 风格对应的Prompt配置
const styleConfig: Record<string, { name: string; prompt: string }> = {
  hearth: {
    name: '走心唠嗑风',
    prompt: `你是一个深谙小红书流量密码的保险赛道内容创作者，擅长写"走心唠嗑风"内容。

风格特点：
- 像闺蜜聊天一样亲切自然
- 用真实故事打动人，引发情感共鸣
- 语言口语化，有温度
- 不要说教，要分享
- 让读者觉得"这不就是我吗"

写作要点：
1. 开篇用真实场景/故事引入，让读者有代入感
2. 中间穿插个人经历或客户案例
3. 结尾给出实用建议，不要硬广
4. 全文用"我""你"等人称，少用"我们""大家"
5. 可以用一些口语化表达，如"真的"、"其实"、"说实话"
6. 适当使用emoji增加亲切感`
  },
  practical: {
    name: '干货避坑风',
    prompt: `你是一个深谙小红书流量密码的保险赛道内容创作者，擅长写"干货避坑风"内容。

风格特点：
- 专业+实用，让人觉得"学到了"
- 结构清晰，用数字/列表让信息一目了然
- 帮人避坑，提供有价值的信息
- 像行业内部人士分享内幕

写作要点：
1. 开头直接点明主题，不要绕弯子
2. 用"3个技巧"、"5个坑"、"4个要点"等结构化呈现
3. 每个要点用简短的小标题+说明
4. 适当用表格或对比让信息更清晰
5. 结尾给出行动建议
6. 可以用"划重点"、"敲黑板"、"注意"等引导词
7. 适当使用emoji增加可读性`
  },
  twist: {
    name: '反转打脸风',
    prompt: `你是一个深谙小红书流量密码的保险赛道内容创作者，擅长写"反转打脸风"内容。

风格特点：
- 先抛出一个"常识"或"普遍认知"
- 然后反转，打破读者预期
- 最后给出一个出人意料但合理的结论/方案
- 让读者有"原来如此"的感觉

写作要点：
1. 开篇提出一个反直觉的观点或问题
2. 如"买保险越大公司越好？错！"
3. 用数据或案例支撑你的反转观点
4. 制造认知冲突，让读者重新思考
5. 结尾给出反转后的正确做法
6. 可以用"但是"、"然而"、"真相是"等转折词
7. 适当使用emoji增加戏剧效果`
  },
  anxiety: {
    name: '焦虑共鸣风',
    prompt: `你是一个深谙小红书流量密码的保险赛道内容创作者，擅长写"焦虑共鸣风"内容。

风格特点：
- 先戳痛点，引发焦虑
- 然后引发共鸣，让读者觉得"被看穿了"
- 最后提供出路，化解焦虑
- 让人欲罢不能，想看下去

写作要点：
1. 开篇描述一个让人焦虑的场景
2. 如"你有没有这种感觉..."
3. 描述痛点时用具体的数字或案例增强焦虑感
4. 中间引发共鸣，"你是不是也..."
5. 结尾给出解决方案，化解焦虑
6. 可以用"扎心了"、"破防了"、"太真实了"等情绪词
7. 适当使用emoji增加情绪感染力`
  },
  data: {
    name: '数据震撼风',
    prompt: `你是一个深谙小红书流量密码的保险赛道内容创作者，擅长写"数据震撼风"内容。

风格特点：
- 用数据说话，有理有据
- 数据要具体、震撼、有冲击力
- 让数据帮你讲故事
- 制造认知冲击，改变读者认知

写作要点：
1. 开篇用一个大数据或反常规数据吸引注意
2. 如"90%的人都不知道..."
3. 用对比数据让差异更明显
4. 数据要精确，不要模糊的数字
5. 每个数据点都要有解读，不要只列数字
6. 结尾用数据总结，给出建议
7. 可以用图表或emoji配合数据呈现
8. 数据来源要可信（可以标注"行业报告""调研数据"）`
  }
};

// 生成仿写内容
async function rewriteCaseContent(
  originalTitle: string,
  originalContent: string | null,
  author: string | null,
  insuranceType: string | null,
  likesCount: number,
  style: string
): Promise<{ title: string; content: string; tags: string[] }> {
  const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: 'https://api.deepseek.com',
  });

  const styleInfo = styleConfig[style];
  
  const prompt = `${styleInfo.prompt}

## 原爆款笔记信息
- 标题：${originalTitle}
- 作者：${author || '未知'}
- 险种：${insuranceType || '保险'}
- 点赞数：${likesCount}
- 原文内容：${originalContent || '无详细内容，仅有标题'}

## 写作任务
请基于上述原爆款笔记的主题和风格，用"${styleInfo.name}"重新创作一篇小红书保险笔记。

## 严格要求
1. 标题：≤20字，要有爆款感，像真人发的
2. 正文：500-800字，符合小红书排版风格
3. 标签：生成3-5个小红书热门标签（格式：#标签名）
4. 全文要用emoji增加可读性
5. 正文要分段，每段不要太长
6. 保险相关内容要专业但易懂
7. 不要直接抄袭原文，要原创改编

## 输出格式
请直接输出纯JSON，不要用markdown代码块包裹，不要加\`\`\`json或\`\`\`：
{
  "title": "新标题（≤20字）",
  "content": "正文内容（500-800字，含emoji和分段）",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}`;

  let response;
  try {
    response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4096,
    });
  } catch (error: any) {
    console.error('DeepSeek API 调用失败:', error?.message || error);
    throw new AppError('AI 服务调用失败: ' + (error?.message || '未知错误'), 500);
  }

  const responseText = response.choices[0]?.message?.content || '';
  
  // 解析JSON响应
  let jsonStr = responseText.trim();
  // 去掉markdown代码块包裹
  while (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').trim();
  }
  while (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.replace(/\n?```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      title: parsed.title || '',
      content: parsed.content || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : []
    };
  } catch (e) {
    // 尝试从文本中提取JSON
    const braceStart = jsonStr.indexOf('{');
    const braceEnd = jsonStr.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
      const extracted = jsonStr.substring(braceStart, braceEnd + 1);
      try {
        const parsed = JSON.parse(extracted);
        return {
          title: parsed.title || '',
          content: parsed.content || '',
          tags: Array.isArray(parsed.tags) ? parsed.tags : []
        };
      } catch (e2) {
        console.error('JSON解析失败:', e2);
      }
    }
    console.error('AI返回内容:', responseText);
    throw new AppError('AI 返回格式错误', 500);
  }
}

// POST /:id/rewrite - 一键仿写
router.post('/:id/rewrite', async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const { style } = RewriteRequestSchema.parse(req.body);

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new AppError('AI 服务未配置，请联系管理员配置 DeepSeek API Key', 500);
    }

    // 从数据库获取案例信息
    const viralCase = await prisma.viralCase.findUnique({
      where: { id: caseId }
    });

    if (!viralCase) {
      throw new AppError('案例不存在', 404);
    }

    // 生成仿写内容
    const result = await rewriteCaseContent(
      viralCase.title,
      viralCase.content,
      viralCase.author,
      viralCase.insuranceType,
      viralCase.likesCount,
      style
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
