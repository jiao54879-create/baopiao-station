// AI标题优化服务 - 方案二
// 功能：自动分析爆款特征、动态更新Prompt、热点自动借势

import OpenAI from 'openai';
import { prisma } from '../lib/prisma.js';

// 使用 DeepSeek（优先）或 OpenAI
const aiClient = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    })
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

const AI_MODEL = process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-3.5-turbo';

// ==================== 爆款标题特征库 ====================

// 标题类型特征
export const TITLE_PATTERNS = {
  // 震惊体
  SHOCK: {
    pattern: /震惊|突发|重磅|紧急|刚刚|终于|内幕|曝光|揭秘|真相|必看|紧急通知/,
    weight: 2,
    description: '引发好奇心和紧迫感'
  },
  // 数字体
  NUMBER: {
    pattern: /\d+%|\d+万|\d+元|\d+岁|\d+种|\d+个|\d+招|\d+步|\d+条|\d+大/,
    weight: 2,
    description: '具体数字增强可信度和可操作性'
  },
  // 疑问体
  QUESTION: {
    pattern: /[？\?]|[是否|能不能|要不要|为什么|如何|怎么|怎样]/,
    weight: 1,
    description: '引发思考，促使用户点击寻找答案'
  },
  // 对比体
  CONTRAST: {
    pattern: /vs|对比|区别|差异|不同|其实|但是|然而|没想到|万万没想到/,
    weight: 2,
    description: '制造冲突感和认知反差'
  },
  // 情绪体
  EMOTION: {
    pattern: /哭了|笑死|太难了|崩溃|后悔|庆幸|终于|终于等到|感动|扎心|破防/,
    weight: 2,
    description: '引发情感共鸣'
  },
  // 实用体
  PRACTICAL: {
    pattern: /指南|攻略|教程|方法|技巧|秘诀|干货|建议|收藏|必备|清单|清单/,
    weight: 2,
    description: '提供实际价值'
  },
  // 故事体
  STORY: {
    pattern: /经历|故事|案例|真实|亲身|朋友|同事|邻居|客户|读者/,
    weight: 2,
    description: '真实案例增强说服力'
  },
  // 身份标签体
  IDENTITY: {
    pattern: /宝妈|奶爸|90后|80后|00后|上班族|打工人|家庭|一家|三口|三口之家/,
    weight: 1,
    description: '精准定位目标人群'
  }
};

// 爆款标题关键词
export const VIRAL_KEYWORDS = {
  HIGH: ['保险怎么买', '保险避坑', '保险理赔', '重疾险', '医疗险', '养老金',
         '保险骗局', '保险套路', '买保险', '保险科普', '家庭保险', '宝宝保险'],
  MEDIUM: ['保额', '保费', '保险条款', '核保', '健康告知', '保险配置',
           '定期寿险', '终身寿险', '意外险', '年金险', '增额终身寿'],
  LOW: ['储蓄', '理财', '资产配置', '财富', '投资', '收益', '分红']
};

// 借势热点分类
export const HOT_TOPIC_CATEGORIES = {
  POLICY: ['延迟退休', '个人养老金', '三孩政策', '医改', '社保调整'],
  HEALTH: ['体检', '癌症', '疾病', '医保', '药品降价', '集采'],
  LIFE: ['养老', '育儿', '教育', '房贷', '消费', '存钱'],
  CELEBRITY: ['明星生病', '富豪保险', '保险理赔故事']
};

// ==================== 标题分析服务 ====================

export interface TitleAnalysis {
  title: string;
  score: number;
  patterns: string[];           // 匹配到的标题模式
  keyword: string;              // 匹配的关键词
  category: string;             // 标题分类
  suggestions: string[];        // 优化建议
  viralPotential: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface OptimizationResult {
  originalTitle: string;
  optimizedTitle: string;
  improvement: number;           // 提升分数
  techniques: string[];          // 使用的技巧
  reason: string;                // 优化理由
}

/**
 * 分析标题的爆款潜力（基于规则打分，满分100分）
 * 评分标准：
 *   基础分 50 分
 *   + 标题模式加分（最多 +30）
 *   + 关键词加分（最多 +15）
 *   - 扣分项（最多 -20）
 * 高潜力：≥75   中潜力：≥55   低潜力：<55
 */
export async function analyzeTitle(title: string): Promise<TitleAnalysis> {
  let score = 50;  // 基础分 50，合理起点
  const patterns: string[] = [];
  let keyword = '';
  let category = 'GENERAL';

  // 检查标题模式（每个模式 +5，最多叠加 6 个 = +30）
  for (const [name, config] of Object.entries(TITLE_PATTERNS)) {
    if (config.pattern.test(title)) {
      score += 5;
      patterns.push(name);
    }
  }

  // 检查关键词（高热词 +15，中 +8，低 +3）
  for (const kw of VIRAL_KEYWORDS.HIGH) {
    if (title.includes(kw)) {
      score += 15;
      keyword = kw;
      category = 'HIGH_RELEVANCE';
      break;
    }
  }
  if (!keyword) {
    for (const kw of VIRAL_KEYWORDS.MEDIUM) {
      if (title.includes(kw)) {
        score += 8;
        keyword = kw;
        category = 'MEDIUM_RELEVANCE';
        break;
      }
    }
  }
  if (!keyword) {
    for (const kw of VIRAL_KEYWORDS.LOW) {
      if (title.includes(kw)) {
        score += 3;
        keyword = kw;
        category = 'LOW_RELEVANCE';
        break;
      }
    }
  }

  // 扣分项
  const boringOpenings = ['今天分享', '一起来了解', '给大家介绍', '给大家推荐', '今天来聊'];
  if (boringOpenings.some(op => title.includes(op))) score -= 15;
  const manualStyle = ['保险产品说明书', '保险条款解读'];
  if (manualStyle.some(m => title.includes(m))) score -= 10;

  // 上限 100 下限 10
  score = Math.min(100, Math.max(10, score));

  // 计算爆款潜力
  let viralPotential: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (score >= 75) viralPotential = 'HIGH';
  else if (score >= 55) viralPotential = 'MEDIUM';

  // 生成优化建议
  const suggestions: string[] = [];
  if (!TITLE_PATTERNS.NUMBER.pattern.test(title)) suggestions.push('加入具体数字（金额/年龄/百分比），增强可信度');
  if (!TITLE_PATTERNS.QUESTION.pattern.test(title)) suggestions.push('改为疑问句，引发读者主动思考');
  if (!TITLE_PATTERNS.EMOTION.pattern.test(title) && !TITLE_PATTERNS.SHOCK.pattern.test(title)) suggestions.push('加入情绪触发词，制造心理落差');
  if (!keyword) suggestions.push('添加保险核心关键词（重疾险/医疗险/保险避坑等）');
  if (patterns.length < 2) suggestions.push('结合多种标题套路，如数字体+情绪体组合效果更好');

  return {
    title,
    score,
    patterns,
    keyword,
    category,
    suggestions,
    viralPotential
  };
}

/**
 * 从数据库学习爆款标题特征
 */
export async function learnFromDatabase(): Promise<{
  topKeywords: string[];
  topPatterns: string[];
  avgScore: number;
}
> {
  try {
    // 获取高评分爆款案例
    const viralCases = await prisma.viralCase.findMany({
      where: {
        viralScore: { gte: 1000 }  // 高分案例
      },
      select: {
        title: true,
        tags: true,
        platform: true
      },
      take: 100,
      orderBy: { viralScore: 'desc' }
    });

    // 统计高频关键词
    const keywordCount: Record<string, number> = {};
    const patternCount: Record<string, number> = {};
    let totalScore = 0;

    for (const item of viralCases) {
      // 分析标题
      const analysis = await analyzeTitle(item.title);

      totalScore += analysis.score;

      // 统计关键词
      if (analysis.keyword) {
        keywordCount[analysis.keyword] = (keywordCount[analysis.keyword] || 0) + 1;
      }

      // 统计模式
      for (const pattern of analysis.patterns) {
        patternCount[pattern] = (patternCount[pattern] || 0) + 1;
      }
    }

    // 排序获取top
    const topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k]) => k);

    const topPatterns = Object.entries(patternCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);

    return {
      topKeywords,
      topPatterns,
      avgScore: viralCases.length > 0 ? Math.round(totalScore / viralCases.length) : 30
    };
  } catch (e) {
    console.log('学习爆款标题失败:', e);
    return {
      topKeywords: VIRAL_KEYWORDS.HIGH,
      topPatterns: ['NUMBER', 'PRACTICAL', 'QUESTION'],
      avgScore: 30
    };
  }
}

/**
 * 生成动态Prompt - 更严格的版本
 */
export async function generateDynamicPrompt(context?: {
  hotTopics?: string[];
  topKeywords?: string[];
  targetAudience?: string;
}): Promise<string> {
  // 学习数据库中的爆款特征
  const learned = await learnFromDatabase();

  const hotTopics = context?.hotTopics || HOT_TOPIC_CATEGORIES.POLICY;
  const topKeywords = context?.topKeywords || learned.topKeywords;
  const targetAudience = context?.targetAudience || '保险消费者';

  return `你是一个深谙小红书流量密码的保险赛道标题黑客。你的标题必须让人在信息流中停下拇指，不点进来就睡不着觉。

用户输入的关键词：${topKeywords.slice(0, 5).join(', ')}
目标人群：${targetAudience}
可借势热点：${hotTopics.slice(0, 3).join(', ')}

## 强制三要素（缺一不可）
1. 具体数字：必须包含至少一个具体数字（金额、年龄、百分比、人数等）
2. 痛点/恐惧/利益：必须触及用户的恐惧、焦虑或贪念
3. 反常识/情绪钩子：必须有让人"咦？"的反转或强烈的情绪触发词

## 6种强制覆盖套路（每种至少生成1个）
1. 避坑恐吓类：用恐惧驱动点击，如"XX前不看必亏X万"、"买错XX=白扔X万"
2. 对比反差类：制造认知冲突，如"月薪3K和3W买保险，差距不是钱是命"
3. 逆袭翻盘类：从失败到成功，如"被拒赔3次后靠这招拿50万"
4. 权威背书类：借权威增强可信度，如"保险精算师自己的3个秘密"
5. 数字冲击类：用震撼数字冲击，如"年缴XXX撬动XX万，这笔账必须算"
6. 情绪共鸣类：戳中焦虑/后悔/庆幸，如"后悔没早买！30岁查出XX还好有它"

## 禁止清单
- 禁止"今天分享"、"一起来了解"、"给大家介绍"式开头
- 禁止纯"科普"、"攻略"、"指南"等说明书式用词（除非搭配情绪钩子）
- 禁止没有情绪张力的陈述句
- 禁止标题像产品说明书
- 禁止标题党但内容不符

## 严格评分标准（1-10分）
- 9-10分：信息流杀手，看到就忍不住点，情绪极强
- 7-8分：有强烈吸引力，但情绪冲击还不够极致
- 5-6分：有亮点但平庸，放到信息流里大概率被划过
- 3-4分：无聊、像说明书、没有点击欲望
- 1-2分：完全不想点

⚠️ 自我批判规则：生成后必须诚实自评。如果一个标题放到小红书信息流中你会划过，那它最多5分。大部分标题应在5-7分，8分以上极难获得。

## 输出格式
请生成5个标题，每个标题格式：
[Nums|Que|Shock|Emot|Pract|Story] 标题内容 | 评分 | 自我批评
例如：[Nums|Que] 重疾险怎么买？3步教你选对不选贵 | 6 | 太平淡，缺少情绪冲击`;
}

/**
 * AI标题优化（使用 DeepSeek / OpenAI）
 */
export async function optimizeTitle(
  title: string,
  context?: {
    hotTopics?: string[];
    targetAudience?: string;
  }
): Promise<OptimizationResult> {
  // 分析原始标题
  const originalAnalysis = await analyzeTitle(title);

  const targetAudience = context?.targetAudience || '保险消费者';
  const hotTopicsStr = context?.hotTopics?.join('、') || '';

  const systemPrompt = `你是一个深谙小红书流量密码的保险赛道标题优化专家。
目标人群：${targetAudience}
${hotTopicsStr ? `可借势热点：${hotTopicsStr}` : ''}

优化原则：
1. 保留原标题的核心语义
2. 加入具体数字（金额/年龄/百分比）增强可信度
3. 加入痛点/恐惧/利益触发词
4. 制造情绪落差或认知反转
5. 长度控制在20字以内

请只返回优化后的标题文字，不要解释，不要加引号。`;

  try {
    const response = await aiClient.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请优化这个标题，使其更具爆款潜力：\n"${title}"` }
      ],
      temperature: 0.8,
      max_tokens: 100
    });

    const optimizedTitle = response.choices[0]?.message?.content?.trim() || title;
    const optimizedAnalysis = await analyzeTitle(optimizedTitle);

    return {
      originalTitle: title,
      optimizedTitle,
      improvement: optimizedAnalysis.score - originalAnalysis.score,
      techniques: optimizedAnalysis.patterns,
      reason: `从${originalAnalysis.score}分提升到${optimizedAnalysis.score}分`
    };
  } catch (e) {
    console.log('AI优化失败:', e);
    return {
      originalTitle: title,
      optimizedTitle: await generateBasicOptimization(title),
      improvement: 0,
      techniques: ['BASIC'],
      reason: 'AI服务不可用，使用基础优化'
    };
  }
}

/**
 * 批量优化标题
 */
export async function batchOptimizeTitles(
  titles: string[],
  context?: {
    hotTopics?: string[];
    targetAudience?: string;
  }
): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = [];

  for (const title of titles) {
    const result = await optimizeTitle(title, context);
    results.push(result);

    // 添加延迟避免API限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * 热点借势标题生成（使用 DeepSeek / OpenAI）
 */
export async function generateHotTopicTitles(
  hotTopic: string,
  insuranceKeywords: string[] = ['保险', '保障', '重疾险', '医疗险']
): Promise<string[]> {
  const prompt = `你是一个保险内容营销专家。当发生社会热点事件时，需要快速生成与保险相关的借势标题。

## 热点事件
${hotTopic}

## 要求
1. 标题必须与保险、保障相关（关键词：${insuranceKeywords.join('/')}）
2. 标题要有吸引力，符合爆款标题特征（含数字/情绪/痛点）
3. 不要恶意蹭热点，保持正向价值观
4. 标题长度15-30字

## 输出格式
生成8个标题，每行一个，不要编号，不要括号，直接输出标题内容：`;

  try {
    const response = await aiClient.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content || '';
    // 解析标题
    const titles = content
      .split('\n')
      .map(line => line.replace(/^\[.*?\]\s*/, '').replace(/^\d+[.、]\s*/, '').trim())
      .filter(line => line.length >= 8 && line.length <= 35);

    return titles.slice(0, 8);
  } catch (e) {
    console.log('热点借势生成失败:', e);
    return generateBasicHotTopicTitles(hotTopic, insuranceKeywords);
  }
}

/**
 * 基础优化（当AI不可用时）
 */
async function generateBasicOptimization(title: string): Promise<string> {
  const analysis = await analyzeTitle(title);
  let optimized = title;

  // 如果缺少数字，尝试添加
  if (!TITLE_PATTERNS.NUMBER.pattern.test(title)) {
    const numbers = ['3步', '5个', '1招', '2分钟', '100%'];
    const randomNum = numbers[Math.floor(Math.random() * numbers.length)];
    optimized = `${randomNum}教你 ${title}`;
  }

  // 如果缺少问号，尝试改成疑问句
  if (!TITLE_PATTERNS.QUESTION.pattern.test(optimized) && Math.random() > 0.5) {
    if (optimized.endsWith('吗')) {
      // 已经是疑问句
    } else {
      optimized = optimized.replace('。', '吗？').replace('!', '？');
    }
  }

  return optimized;
}

/**
 * 基础热点标题（当AI不可用时）
 */
function generateBasicHotTopicTitles(
  hotTopic: string,
  keywords: string[]
): string[] {
  const templates = [
    `${hotTopic}后，保险该怎么买？`,
    `${hotTopic}启示：这件事必须提前准备`,
    `突发！${hotTopic}，影响到每个人`,
    `${hotTopic}上热搜！保险专家这样说`,
    `${hotTopic}刷屏！这3类人要注意`
  ];

  return templates;
}

/**
 * 检测是否为热点话题
 */
export function isHotTopic(text: string): boolean {
  const hotIndicators = [
    '热搜', '爆了', '刷屏', '全网', '突发', '重磅',
    '震惊', '紧急', '刚刚', '重大'
  ];

  return hotIndicators.some(indicator => text.includes(indicator));
}

export default {
  analyzeTitle,
  learnFromDatabase,
  generateDynamicPrompt,
  optimizeTitle,
  batchOptimizeTitles,
  generateHotTopicTitles,
  isHotTopic,
  TITLE_PATTERNS,
  VIRAL_KEYWORDS,
  HOT_TOPIC_CATEGORIES
};
