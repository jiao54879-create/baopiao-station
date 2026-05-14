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
// GET /styles - 获取所有风格和大佬配置
router.get('/styles', (req, res) => {
  const styles = Object.entries(styleConfig).map(([key, config]) => ({
    key,
    name: config.name,
    icon: config.icon,
    masters: config.masters.map(m => ({
      key: m.key,
      name: m.name,
      avatar: m.avatar,
      description: m.description
    }))
  }));
  res.json(styles);
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
// 语言DNA类型定义
interface LanguageDNA {
  opener: string;
  sentencePattern: string;
  emotion: string;
  structure: string;
  ending: string;
  forbiddenWords: string[];
}
// 大佬锚点类型定义
interface Master {
  key: string;
  name: string;
  avatar: string;
  description: string;
  languageDNA: LanguageDNA;
}
// 风格配置类型
interface StyleConfig {
  name: string;
  icon: string;
  masters: Master[];
}
const RewriteRequestSchema = z.object({
  style: z.enum(['hearth', 'practical', 'twist', 'anxiety', 'data']),
  master: z.string()
});
// 风格配置 - 包含25+大佬锚点
const styleConfig: Record<string, StyleConfig> = {
  hearth: {
    name: '走心唠嗑风',
    icon: '💬',
    masters: [
      {
        key: 'mimeng',
        name: '咪蒙模式',
        avatar: '🧡',
        description: '自黑式开头，情绪饱满，一句话独立成段',
        languageDNA: {
          opener: '自黑/自嘲式开头，"我承认我……"',
          sentencePattern: '5-15字一句，短句密集轰炸，一句话独立成段',
          emotion: '情绪饱满贯穿全文，适当用"靠""妈蛋"增加真实感',
          structure: '自黑开场→故事代入→金句收尾',
          ending: '一句扎心金句收尾，让人忍不住截图',
          forbiddenWords: ['四平八稳的客套话', '"然而""不过"等转折词太多']
        }
      },
      {
        key: 'houcuicui',
        name: '侯翠翠模式',
        avatar: '💚',
        description: '闺蜜八卦式碎碎念，抱怨中带温暖',
        languageDNA: {
          opener: '"我跟你讲""你知道吗"闺蜜八卦式',
          sentencePattern: '碎碎念式，想到哪说到哪，但逻辑暗线清晰',
          emotion: '抱怨中带真实感，反焦虑治愈系，吐槽但不丧',
          structure: '日常琐事切入→吐槽→突然给个温暖的结论',
          ending: '温暖的鼓励或自我和解',
          forbiddenWords: ['说教感', '鸡汤味', '端着说话']
        }
      },
      {
        key: 'leijun',
        name: '雷军模式',
        avatar: '💙',
        description: '真诚大白话，偶尔自嘲，给朴素建议',
        languageDNA: {
          opener: '直接亮数据或事实，"说实话""跟你们讲"',
          sentencePattern: '大白话，像隔壁大哥聊天，偶尔冒出一句金句',
          emotion: '真诚不装，偶尔自嘲"Are you OK"式',
          structure: '抛问题→讲真实经历→给朴素建议',
          ending: '朴实但有力，"这事儿就这么简单"',
          forbiddenWords: ['装腔作势', '故弄玄虚']
        }
      },
      {
        key: 'yizhongtian',
        name: '易中天',
        avatar: '🏛️',
        description: '评书式"妙说"，用"俗不可耐"的语言讲深刻道理，口语化+反差幽默+声情并茂',
        languageDNA: {
          opener: '评书式开场，先讲个故事或场景，让听众坐下来',
          sentencePattern: '口语化讲述，大俗即大雅，用最接地气的话讲最深刻的道理',
          emotion: '反差幽默，严肃中带调侃，调侃中有深情',
          structure: '故事引入→反差转折→妙语点题→余味收尾',
          ending: '留一个让人回味的妙语',
          forbiddenWords: ['学术腔', '端着说话', '不接地的华丽词藻']
        }
      },
      {
        key: 'luoxiang',
        name: '罗翔',
        avatar: '⚖️',
        description: '法学教授讲故事，用极端案例讲道理，自嘲"法外狂徒张三"',
        languageDNA: {
          opener: '先讲一个极端案例或荒诞故事，"张三又来了"',
          sentencePattern: '故事驱动，从极端案例讲普遍道理，自嘲式幽默',
          emotion: '严肃话题中带自嘲，用荒诞消解沉重，但核心是认真',
          structure: '荒诞案例→追问本质→法理分析→人生哲思',
          ending: '一句话点破荒诞中的人性',
          forbiddenWords: ['空洞说教', '不讲故事直接讲道理']
        }
      },
      {
        key: 'papijiang',
        name: 'papi酱',
        avatar: '🎬',
        description: '短视频式吐槽，一人分饰多角，节奏快笑点密',
        languageDNA: {
          opener: '模仿某类人的经典台词开头，一秒带入场景',
          sentencePattern: '一人分饰多角对话式，节奏快笑点密，短句连珠炮',
          emotion: '吐槽+吐槽+吐槽，但吐槽背后是共情',
          structure: '场景还原→夸张模仿→犀利吐槽→说回现实',
          ending: '一个让人又笑又心酸的反转',
          forbiddenWords: ['正经腔', '慢节奏', '长篇大论']
        }
      }
    ]
  },
  practical: {
    name: '干货避坑风',
    icon: '📋',
    masters: [
      {
        key: 'banfo',
        name: '半佛仙人模式',
        avatar: '🧣',
        description: '颠覆性结论开头，一句话一段，快节奏',
        languageDNA: {
          opener: '颠覆性结论开头，"你以为的XXX全是错的"',
          sentencePattern: '一句话一段，类现代诗格式，快节奏',
          emotion: '冷静理性中带讽刺，"前方有坑绕行"的举牌人',
          structure: '颠覆结论→极端案例→拆解底层逻辑→给可操作建议',
          ending: '三步自救法，可操作',
          forbiddenWords: ['模糊表述', '"可能""也许"', '不给结论']
        }
      },
      {
        key: 'zhangxuefeng',
        name: '张雪峰模式',
        avatar: '🧢',
        description: '极端判断抓注意，干货+段子，东北味',
        languageDNA: {
          opener: '极端判断抓注意，"千万别""一定不要"',
          sentencePattern: '干货+段子，单口相声节奏，东北味幽默',
          emotion: '激昂亢奋，为普通人着急，"急"是核心情绪',
          structure: '制造焦虑→给具体方案→用数据打脸',
          ending: '扎心金句+行动指令',
          forbiddenWords: ['模糊建议', '两头堵的话', '不痛不痒']
        }
      },
      {
        key: 'kazike',
        name: '卡兹克模式',
        avatar: '🧤',
        description: '真实体验切入，Slogan式干货，拒绝套话',
        languageDNA: {
          opener: '从真实体验切入，不用宏大叙事',
          sentencePattern: '平实直接，拒绝套话，Slogan式干货',
          emotion: '冷静客观但有态度，自嘲幽默',
          structure: '体验/观察→数据支撑→一句话结论→扩展解释',
          ending: '一句话核心总结',
          forbiddenWords: ['"赋能""抓手""闭环"', '"在当今XXX的时代"', '"说白了/本质上/换句话说"']
        }
      },
      {
        key: 'xiaocai',
        name: '小蔡碎碎念',
        avatar: '📝',
        description: '保险公众号大V，普通消费者立场，7000字深度长文逻辑拆解，先提问题再拆解决策逻辑，像朋友帮你分析',
        languageDNA: {
          opener: '先抛一个保险购买的真实困境，"你是不是也遇到这种情况"',
          sentencePattern: '先提问题→拆解决策逻辑→给出明确结论，像朋友在帮你分析',
          emotion: '站在消费者这边，替普通人说话，不装专家但比专家还细致',
          structure: '真实问题→逐层拆解→逻辑推导→明确结论→避坑清单',
          ending: '给一个明确的选择建议，不含糊',
          forbiddenWords: ['含糊其辞', '两头堵', '不给出结论']
        }
      },
      {
        key: 'liyongle',
        name: '李永乐老师',
        avatar: '📐',
        description: '数学老师讲热点，用数学/逻辑推演，白板式讲解，把复杂问题变简单',
        languageDNA: {
          opener: '用一个数字或问题开场，"你有没有想过一个问题"',
          sentencePattern: '白板式讲解，一步一步推导，复杂问题拆成简单步骤',
          emotion: '理性平和，像老师讲课但有趣，把复杂变简单',
          structure: '提出问题→数学/逻辑推演→得出结论→实际应用',
          ending: '一句话总结核心逻辑',
          forbiddenWords: ['模糊结论', '不推导直接给答案', '故弄玄虚']
        }
      }
    ]
  },
  twist: {
    name: '反转打脸风',
    icon: '🎭',
    masters: [
      {
        key: 'baguamangguo',
        name: '八卦芒果模式',
        avatar: '🥭',
        description: '八卦式切入，先站队再反转，打脸共同敌人',
        languageDNA: {
          opener: '"嘿我跟你说个事"，八卦式切入',
          sentencePattern: '先站队→讲故事→突然反转，和观众站同一条战线',
          emotion: '共同吐槽→认知颠覆→恍然大悟',
          structure: '制造共同敌人→统一战线→用事实打脸→给出新认知',
          ending: '反常识的新结论，让人"啊？是这样？"',
          forbiddenWords: ['直接说教', '不给故事就讲道理']
        }
      },
      {
        key: 'mimeng-slap',
        name: '咪蒙打脸模式',
        avatar: '💜',
        description: '一句话打脸→展开论证→金句锤死',
        languageDNA: {
          opener: '先承认普遍想法，"很多人觉得……"',
          sentencePattern: '一句话打脸→展开论证→金句锤死',
          emotion: '从温和到激烈，"如果善良是纵容，我愿意一辈子歹毒"',
          structure: '承认普遍观点→一句话颠覆→案例论证→给行动方案',
          ending: '态度鲜明的立场宣言',
          forbiddenWords: ['和稀泥', '"各有各的道理"']
        }
      },
      {
        key: 'banfo-twist',
        name: '半佛反转模式',
        avatar: '🎪',
        description: '颠覆结论→极端案例轰炸→拆解底层逻辑',
        languageDNA: {
          opener: '直接抛颠覆性结论',
          sentencePattern: '前15秒结论→1-3分钟极端案例→3-5分钟拆解逻辑',
          emotion: '冷静拆解中的暴击，"你以为你在XXX，其实你在YYY"',
          structure: '颠覆结论→极端案例轰炸→拆解底层逻辑→可操作建议',
          ending: '行动指南，三步自救',
          forbiddenWords: ['不给具体案例就下结论']
        }
      },
      {
        key: 'luxun',
        name: '鲁迅',
        avatar: '🖋️',
        description: '匕首投枪式，冷峻讽刺，一句话见血，揭露真相',
        languageDNA: {
          opener: '冷峻观察一个普遍现象，看似平静实则暗藏锋芒',
          sentencePattern: '短句如刀，一句见血，不怒自威，偶用反讽',
          emotion: '冷峻中带着痛心，讽刺但不虚无，绝望中仍有希望',
          structure: '现象观察→反讽揭露→本质拆解→一声叹息',
          ending: '一声叹息或一句反问，让人脊背发凉',
          forbiddenWords: ['温情脉脉', '和稀泥', '不痛不痒']
        }
      },
      {
        key: 'chaijing',
        name: '柴静',
        avatar: '🎥',
        description: '纪录片式叙事，用真实故事击穿认知，冷静但有力',
        languageDNA: {
          opener: '从一个具体的人物/故事切入，细节开场',
          sentencePattern: '纪录片式叙事，冷静叙述中见力量，细节为王',
          emotion: '克制但有力，用事实说话不用情绪煽动',
          structure: '人物故事→细节铺陈→认知颠覆→真相揭示',
          ending: '一个让人沉默的细节',
          forbiddenWords: ['情绪煽动', '空洞口号', '没有故事就下结论']
        }
      }
    ]
  },
  anxiety: {
    name: '焦虑共鸣风',
    icon: '🔥',
    masters: [
      {
        key: 'zhangxuefeng-anxiety',
        name: '张雪峰焦虑模式',
        avatar: '🔴',
        description: '用具体数字制造紧迫感，"急"字当头给出路',
        languageDNA: {
          opener: '用具体数字/场景制造紧迫感',
          sentencePattern: '先扎心→给路，短句密集',
          emotion: '为普通人着急，"急"是核心情绪，但底层是关心',
          structure: '制造焦虑场景→用数据佐证→给具体出路',
          ending: '具体行动指令，"现在就做XXX"',
          forbiddenWords: ['只焦虑不给方案', '空洞鼓励']
        }
      },
      {
        key: 'baolocaomei',
        name: '暴躁草莓模式',
        avatar: '🍓',
        description: '抱怨吐槽真实困境，把痛苦写成段子',
        languageDNA: {
          opener: '抱怨/吐槽真实困境，"烦死了""好崩溃"',
          sentencePattern: '吐槽押韵，魔性文案，把痛苦写成段子',
          emotion: '先暴露脆弱→在抱怨中坚持→最终没有放弃',
          structure: '暴露困境→吐槽发泄→找到方法→继续前行',
          ending: '不鸡汤但温暖的和解',
          forbiddenWords: ['完美励志', '假装坚强']
        }
      },
      {
        key: 'mimeng-resonate',
        name: '咪蒙共鸣模式',
        avatar: '💗',
        description: '戳中隐秘痛点，排比+反问，先共情再给力量',
        languageDNA: {
          opener: '戳中一个隐秘痛点，"你是不是也……"',
          sentencePattern: '排比+反问增强情绪，短句为主',
          emotion: '先共情→再愤怒→然后给力量',
          structure: '戳痛点→引发共鸣→站在你这边→给行动力量',
          ending: '有力的立场宣言',
          forbiddenWords: ['居高临下的指导', '不痛不痒的安慰']
        }
      },
      {
        key: 'yuhua',
        name: '余华',
        avatar: '📖',
        description: '写最苦的人生说最通透的话，把苦难写成段子',
        languageDNA: {
          opener: '讲一个苦到发笑的真实故事',
          sentencePattern: '苦中带笑，把苦难当段子讲，短句冷幽默',
          emotion: '表面自嘲，内核通透，苦但不丧',
          structure: '苦难故事→荒诞解读→通透领悟→继续生活',
          ending: '一句通透但心酸的话',
          forbiddenWords: ['鸡汤', '假装积极', '端着抒情']
        }
      },
      {
        key: 'liurun',
        name: '刘润',
        avatar: '💡',
        description: '商业顾问式焦虑，用商业逻辑解释生活困境，给框架给出路',
        languageDNA: {
          opener: '用一个商业框架解释生活现象',
          sentencePattern: '框架式表达，每段一个小模型，结论前置',
          emotion: '理性但紧迫，"这不是你的错，但你需要知道"',
          structure: '现象→底层逻辑→框架分析→行动建议',
          ending: '一个可执行的行动框架',
          forbiddenWords: ['只焦虑不给方法', '空洞鼓励', '不给底层逻辑']
        }
      }
    ]
  },
  data: {
    name: '数据震撼风',
    icon: '📊',
    masters: [
      {
        key: 'kazike-data',
        name: '卡兹克数据模式',
        avatar: '📈',
        description: '震惊数据开头，Slogan式结论，数据支撑',
        languageDNA: {
          opener: '一个让人震惊的数据/事实',
          sentencePattern: 'Slogan式一句话结论→数据支撑→扩展',
          emotion: '冷静中有冲击，自嘲但不减说服力',
          structure: '数据结论→对比数据→推导结论→一句话总结',
          ending: '压缩成一句话的核心信息',
          forbiddenWords: ['没有数据支撑的断言', '模糊表述']
        }
      },
      {
        key: 'banfo-data',
        name: '半佛数据模式',
        avatar: '📉',
        description: '一串数字砸脸，每个观点三个信源',

        languageDNA: {
          opener: '一串数字直接砸脸',
          sentencePattern: '每个观点三个信源，高信息密度',
          emotion: '冷静理性，用数据说话不带情绪',
          structure: '数据呈现→异常点分析→风险拆解→建议',
          ending: '事实风控+可验证的建议',
          forbiddenWords: ['无信源数据', '"据说""有人说"']
        }
      },
      {
        key: 'zhangxuefeng-data',
        name: '张雪峰数据模式',
        avatar: '💹',
        description: '极端数据制造冲击，数据+金句配合',
        languageDNA: {
          opener: '极端数据制造冲击',
          sentencePattern: '数据+金句配合，"80%都没干本行！"',
          emotion: '亢奋激昂，用数据撕破幻想',
          structure: '震撼数据→解释背后逻辑→给现实建议',
          ending: '扎心数据+行动指令',
          forbiddenWords: ['温和表述', '不痛不痒的数据']
        }
      },
      {
        key: 'liurun-data',
        name: '刘润数据',
        avatar: '📊',
        description: '用商业数据模型震撼认知，数据+逻辑双管齐下',
        languageDNA: {
          opener: '一个商业数据让你重新认识世界',
          sentencePattern: '数据→模型→结论，三步走，简洁有力',
          emotion: '冷静震撼，用数据撕开认知缺口',
          structure: '震撼数据→模型解释→逻辑推导→行动建议',
          ending: '一句话模型总结',
          forbiddenWords: ['无数据断言', '模糊模型', '不给推导']
        }
      },
      {
        key: 'wushicaijing',
        name: '巫师财经',
        avatar: '📈',
        description: '金融硬核分析，数据密集，"以我为准"的自信',
        languageDNA: {
          opener: '一个震撼的数据或金融事实，"以我为准"',
          sentencePattern: '数据密集轰炸，硬核分析，专业术语+大白话混搭',
          emotion: '自信霸气，"以我为准"式权威感，用数据碾压',
          structure: '数据呈现→硬核拆解→金融逻辑→投资建议',
          ending: '一个自信的结论判断',
          forbiddenWords: ['模棱两可', '不给数据就下结论', '软绵绵的表达']
        }
      }
    ]
  }
};
// 生成仿写内容
async function rewriteCaseContent(
  originalTitle: string,
  originalContent: string | null,
  author: string | null,
  insuranceType: string | null,
  likesCount: number,
  style: string,
  master: string
): Promise<{ title: string; content: string; tags: string[] }> {
  const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: 'https://api.deepseek.com',
  });
  const styleInfo = styleConfig[style];
  const masterInfo = styleInfo?.masters?.find((m: Master) => m.key === master);
  if (!masterInfo) {
    throw new AppError('未找到指定的大佬模式', 400);
  }
  const { languageDNA } = masterInfo;

  // 处理空内容的情况
  let contentHint = '';
  if (!originalContent || originalContent.trim() === '') {
    contentHint = '\n\n【重要提示】\n注意：原文无详细内容，请基于标题主题，结合保险行业知识进行深度创作，确保内容专业有价值。不要仅凭标题脑补，要补充实质性的保险知识、案例和数据。';
  }

  const prompt = `你是一个深谙小红书流量密码的保险赛道内容创作者。
## 写作风格：大佬锚点 - ${masterInfo.name}
严格按照以下语言DNA写作：
【开场方式】
${languageDNA.opener}
【句式特征】
${languageDNA.sentencePattern}
【情绪基调】
${languageDNA.emotion}
【文章结构】
${languageDNA.structure}
【收尾方式】
${languageDNA.ending}
【禁用词/禁用表达】
${languageDNA.forbiddenWords.join('；')}
## 原爆款笔记信息
- 标题：${originalTitle}
- 作者：${author || '未知'}
- 险种：${insuranceType || '保险'}
- 点赞数：${likesCount}
- 原文内容：${originalContent || '无详细内容，仅有标题'}${contentHint}
## 写作任务
请基于上述原爆款笔记的主题，用"${masterInfo.name}"风格重新创作一篇小红书保险笔记。
## 严格要求
1. 标题：≤20字，要有爆款感，像真人发的
2. 正文：500-800字，符合小红书排版风格
3. 标签：生成3-5个小红书热门标签（格式：#标签名）
4. 全文要用emoji增加可读性
5. 正文要分段，每段不要太长
6. 保险相关内容要专业但易懂
7. 不要直接抄袭原文，要原创改编
8. 严格遵循上述语言DNA的每个维度
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
    const { style, master } = RewriteRequestSchema.parse(req.body);
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new AppError('AI 服务未配置，请联系管理员配置 DeepSeek API Key', 500);
    }
    // 验证 master 是否属于指定的 style
    const styleInfo = styleConfig[style];
    if (!styleInfo || !styleInfo.masters.find((m: Master) => m.key === master)) {
      throw new AppError('无效的大佬模式', 400);
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
      style,
      master
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});
export default router;