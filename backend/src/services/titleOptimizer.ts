// AI标题优化服务 - 方案二
// 功能：自动分析爆款特征、动态更新Prompt、热点自动借势

import axios from 'axios';
import { prisma } from '../lib/prisma.js';

// ==================== 爆款标题特征库 ====================

// 标题类型特征
export const TITLE_PATTERNS = {
  // 震惊体
  SHOCK: {
    pattern: /震惊|突发|重磅|紧急|刚刚|终于|内幕|曝光|揭秘|真相|必看|紧急通知/,
    weight: 3,
    description: '引发好奇心和紧迫感'
  },
  // 数字体
  NUMBER: {
    pattern: /\d+%|\d+万|\d+元|\d+岁|\d+种|\d+个|\d+招|\d+步|\d+条|\d+大/,
    weight: 4,
    description: '具体数字增强可信度和可操作性'
  },
  // 疑问体
  QUESTION: {
    pattern: /[？\?]|[是否|能不能|要不要|为什么|如何|怎么|怎样]/,
    weight: 3,
    description: '引发思考，促使用户点击寻找答案'
  },
  // 对比体
  CONTRAST: {
    pattern: /vs|对比|区别|差异|不同|其实|但是|然而|没想到|万万没想到/,
    weight: 3,
    description: '制造冲突感和认知反差'
  },
  // 情绪体
  EMOTION: {
    pattern: /哭了|笑死|太难了|崩溃|后悔|庆幸|终于|终于等到|感动|扎心|破防/,
    weight: 4,
    description: '引发情感共鸣'
  },
  // 实用体
  PRACTICAL: {
    pattern: /指南|攻略|教程|方法|技巧|秘诀|干货|建议|收藏|必备|清单|清单/,
    weight: 4,
    description: '提供实际价值'
  },
  // 故事体
  STORY: {
    pattern: /经历|故事|案例|真实|亲身|朋友|同事|邻居|客户|读者/,
    weight: 3,
    description: '真实案例增强说服力'
  },
  // 身份标签体
  IDENTITY: {
    pattern: /宝妈|奶爸|90后|80后|00后|上班族|打工人|家庭|一家|三口|三口之家/,
    weight: 2,
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
 * 分析标题的爆款潜力
 */
export async function analyzeTitle(title: string): Promise<TitleAnalysis> {
  let score = 50;  // 基础分
  const patterns: string[] = [];
  let keyword = '';
  let category = 'GENERAL';

  // 检查标题模式
  for (const [name, config] of Object.entries(TITLE_PATTERNS)) {
    if (config.pattern.test(title)) {
      score += config.weight;
      patterns.push(name);
    }
  }

  // 检查关键词
  for (const kw of VIRAL_KEYWORDS.HIGH) {
    if (title.includes(kw)) {
      score += 10;
      keyword = kw;
      category = 'HIGH_RELEVANCE';
      break;
    }
  }

  if (!keyword) {
    for (const kw of VIRAL_KEYWORDS.MEDIUM) {
      if (title.includes(kw)) {
        score += 6;
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

  // 计算爆款潜力
  let viralPotential: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (score >= 70) viralPotential = 'HIGH';
  else if (score >= 55) viralPotential = 'MEDIUM';

  // 生成优化建议
  const suggestions: string[] = [];
  if (patterns.length === 0) suggestions.push('建议添加震惊/数字/疑问等元素增强吸引力');
  if (!keyword) suggestions.push('标题缺少核心关键词，建议添加"保险"、"重疾险"等词');
  if (!TITLE_PATTERNS.NUMBER.pattern.test(title)) suggestions.push('建议添加具体数字，如"3步"、"5个技巧"等');
  if (!TITLE_PATTERNS.QUESTION.pattern.test(title)) suggestions.push('可以考虑用疑问句引发好奇');
  if (!TITLE_PATTERNS.IDENTITY.pattern.test(title)) suggestions.push('建议添加目标人群标签，如"宝妈"、"90后"等');

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
}> {
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
      avgScore: viralCases.length > 0 ? Math.round(totalScore / viralCases.length) : 50
    };
  } catch (e) {
    console.log('学习爆款标题失败:', e);
    return {
      topKeywords: VIRAL_KEYWORDS.HIGH,
      topPatterns: ['NUMBER', 'PRACTICAL', 'QUESTION'],
      avgScore: 60
    };
  }
}

/**
 * 生成动态Prompt
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

  return `你是一个专业的保险内容标题创作专家。请根据以下要求生成标题：

## 要求
1. 标题长度：15-30字，避免过长或过短
2. 必须包含核心关键词：${topKeywords.slice(0, 5).join('、')}
3. 可以借势的热点：${hotTopics.slice(0, 3).join('、')}
4. 目标人群：${targetAudience}

## 爆款标题特征（学习自${learned.avgScore}分高评标题）
- 数字体：使用具体数字增加可信度（如"3步"、"5个技巧"）
- 疑问体：用问句引发好奇（如"要不要"、"怎么选"）
- 震惊体：使用"震惊"、"必看"、"揭秘"等词
- 情绪体：引发情感共鸣（如"后悔没早买"、"终于等到"）
- 实用体：提供具体价值（如"攻略"、"指南"、"清单"）
- 故事体：使用真实案例（如"客户真实经历"）

## 禁止
- 标题党：与内容严重不符
- 虚假夸大：使用"最好"、"第一"等绝对词
- 低俗用语

## 输出格式
请生成5个标题，每个标题格式：
[Nums|Que|Shock|Emot|Pract|Story] 标题内容
例如：[Nums] 重疾险怎么买？3步教你选对不选贵
[Nums|Que] 保费多少钱一年？算完这笔账，后悔买晚了！`;
}

/**
 * AI标题优化
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

  // 生成动态Prompt
  const prompt = await generateDynamicPrompt({
    hotTopics: context?.hotTopics || [],
    targetAudience: context?.targetAudience
  });

  // 调用AI生成优化版本（这里使用OpenAI作为示例）
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `请优化这个标题，使其更具爆款潜力：\n"${title}"` }
        ],
        temperature: 0.8,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const optimizedTitle = response.data.choices[0]?.message?.content?.trim() || '';

    // 分析优化后的标题
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
    // 如果AI调用失败，返回基础优化版本
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
 * 热点借势标题生成
 */
export async function generateHotTopicTitles(
  hotTopic: string,
  insuranceKeywords: string[] = ['保险', '保障', '重疾险', '医疗险']
): Promise<string[]> {
  const prompt = `你是一个保险内容营销专家。当发生社会热点事件时，需要快速生成与保险相关的借势标题。

## 热点事件
${hotTopic}

## 要求
1. 标题必须与保险、保障相关
2. 标题要有吸引力，符合爆款标题特征
3. 不要恶意蹭热点，保持正向价值观
4. 标题长度15-30字

## 输出格式
生成8个标题，每行一个，格式示例：
[借势] 标题内容`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `请生成与"${hotTopic}"相关的保险借势标题` }
        ],
        temperature: 0.8,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    // 解析标题
    const titles = content
      .split('\n')
      .map(line => line.replace(/^\[.*?\]\s*/, '').trim())
      .filter(line => line.length >= 10);

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
