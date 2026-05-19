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
 *   基础分 30 分
 *   + 标题模式加分（每个模式 +5，最多 +20）
 *   + 关键词加分（高 +8，中 +4，低 +2）
 *   + 字数达标加分（15-20字 +5）
 *   - 扣分项（超过20字直接扣20分）
 * 
 * 评分等级：
 *   优秀：≥70（真正的爆款潜力）
 *   良好：≥50（有一定吸引力）
 *   一般：≥35（勉强及格）
 *   差：<35（需要大幅改进）
 */
export async function analyzeTitle(title: string): Promise<TitleAnalysis> {
  let score = 30;  // 降低基础分到30，更严格的起点
  const patterns: string[] = [];
  let keyword = '';
  let category = 'GENERAL';
  const suggestions: string[] = [];

  // ===== 字数检查（最重要！） =====
  const charCount = title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, 'x').length; // 粗略计算
  const chineseChars = title.match(/[\u4e00-\u9fa5]/g)?.length || 0; // 纯中文计数
  
  // 扣分：超过20字直接扣20分
  if (chineseChars > 20) {
    score -= 20;
    suggestions.push(`❌ 字数超标！小红书限20字，当前${chineseChars}字`);
  } else if (chineseChars >= 15 && chineseChars <= 20) {
    score += 5; // 字数达标加分
  } else if (chineseChars > 0) {
    score += 2; // 有字数但不够理想
  }

  // ===== 检查标题模式（每个模式 +5，最多 +20） =====
  let patternCount = 0;
  for (const [name, config] of Object.entries(TITLE_PATTERNS)) {
    if (config.pattern.test(title)) {
      score += 5;
      patterns.push(name);
      patternCount++;
    }
  }
  // 封顶：最多计算4个模式 = +20
  if (patternCount > 4) score -= (patternCount - 4) * 5;

  // ===== 检查关键词（不叠加，只取最高） =====
  for (const kw of VIRAL_KEYWORDS.HIGH) {
    if (title.includes(kw)) {
      score += 8;
      keyword = kw;
      category = 'HIGH_RELEVANCE';
      break;
    }
  }
  if (!keyword) {
    for (const kw of VIRAL_KEYWORDS.MEDIUM) {
      if (title.includes(kw)) {
        score += 4;
        keyword = kw;
        category = 'MEDIUM_RELEVANCE';
        break;
      }
    }
  }
  if (!keyword) {
    for (const kw of VIRAL_KEYWORDS.LOW) {
      if (title.includes(kw)) {
        score += 2;
        keyword = kw;
        category = 'LOW_RELEVANCE';
        break;
      }
    }
  }

  // ===== 扣分项 =====
  const boringOpenings = ['今天分享', '一起来了解', '给大家介绍', '给大家推荐', '今天来聊'];
  if (boringOpenings.some(op => title.includes(op))) score -= 10;
  
  const manualStyle = ['保险产品说明书', '保险条款解读', '详解', '一文读懂'];
  if (manualStyle.some(m => title.includes(m))) score -= 8;

  // 太平淡的句式
  if (/^[这那]个/.test(title)) score -= 5;

  // ===== 生成优化建议 =====
  if (chineseChars > 20) {
    suggestions.push('必须精简到20字以内');
  } else if (chineseChars < 10) {
    suggestions.push('标题偏短，10-20字均可，不必都卡15字');
  }
  if (!TITLE_PATTERNS.NUMBER.pattern.test(title)) suggestions.push('缺少具体数字（金额/年龄/百分比）');
  if (!TITLE_PATTERNS.QUESTION.pattern.test(title) && !TITLE_PATTERNS.SHOCK.pattern.test(title) && !TITLE_PATTERNS.EMOTION.pattern.test(title)) {
    suggestions.push('缺少情绪触发词（疑问/震惊/情绪共鸣）');
  }
  if (!keyword) suggestions.push('缺少保险核心关键词');
  if (patterns.length < 2) suggestions.push('建议组合多种标题套路');

  // ===== 最终评分 =====
  // 上限100，下限15（不能低于15分，太差的不给机会）
  score = Math.min(100, Math.max(15, score));

  // 计算爆款潜力（更严格的阈值）
  let viralPotential: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (score >= 70) viralPotential = 'HIGH';  // 70分以上才是高潜力
  else if (score >= 50) viralPotential = 'MEDIUM';  // 50-69是中等

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

  return `你是一个叛逆的保险内容策划人，擅长从意想不到的角度切入，写出让人忍不住点进来的标题。

用户输入的关键词：${topKeywords.slice(0, 5).join(', ')}
目标人群：${targetAudience}

## ⭐ 硬性要求
- 标题10-20个中文字符，字数要自然分布，不要都卡在12字
- 超过20字直接淘汰
- 每个标题标注字数，如[16字]

## 🧠 发散思维方法（核心！不要套模板！）
拿到关键词后，先用以下方法发散，再写标题：

1. **反向思考**：大家都说"要买"，你偏说"别买"/"买了也白买"——逆反心理天然吸引
2. **身份代入**：不是泛泛的"宝妈"，而是"刚拿到产检单的孕妈"/"被裁员通知吓到的35岁"
3. **场景切入**：不是"保险怎么买"，而是"凌晨3点急诊室我崩溃了"/"工资到账那一刻"
4. **悬念留白**：话说一半，"最后一条90%的人不知道"/"我后悔只做了一件事"
5. **反常识**：挑战大众认知，"保险越贵越坑"/"健康告知说实话反而亏"
6. **故事预告**：用真实经历做钩子，"同事赔了80万我一分没赔"/"婆婆骂我浪费钱3年后"
7. **情绪炸弹**：不是恐吓，而是共鸣，"穷人买保险才是最大的奢侈"/"买保险的勇气比钱重要"

## 🎯 真实爆款参考（学思路，别抄）
- "我已经不卖保险了，但我想告诉你真相" — 反向+真相诱惑
- "突然发现重疾险拿回保费的思路好清晰" — 意外发现感
- "体检异常，被大佬买保险的思路震撼到" — 第三方背书+震撼
- "百万医疗险根基被毁" — 权威颠覆
- "普通人最大的通病是把花钱顺序搞反了" — 扎心但不说教

## ❌ 绝对禁止
- 禁止"今天分享/给大家介绍/一起来了解"式开头
- 禁止像产品说明书（如"XX保险产品详解"）
- 禁止空洞恐吓（"不看后悔一辈子"太假了）
- 禁止每条都用"避坑"/"揭秘"开头——3条里最多1条用
- 禁止6条标题都是同一句式——要有变化！

## 输出要求
生成8个标题，风格必须多样化（不要8条都是恐吓体），每条标注套路类型和字数：

[字数|套路] 标题内容 | 评分 | 1句话说明这个标题凭什么吸引人

评分标准：8分以上需要真正有创意和冲击力，不要滥给高分。大部分4-6分。`;
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

  const systemPrompt = `你是一个叛逆的保险内容策划人，擅长把普通标题改写成让人忍不住点击的爆款。

目标人群：${targetAudience}
${hotTopicsStr ? `可借势热点：${hotTopicsStr}` : ''}

## 核心要求
- 标题10-20个中文字符，不要每次都写12字，字数要有变化
- 超过20字必须缩短
- 不要用"避坑"/"揭秘"开头，太平庸了

## 改写思路（选最合适的1-2种，不要全用）
- 反向：大家都说买，你偏说别买/买了也亏
- 悬念：话说一半留钩子
- 场景：用具体画面代替抽象概念
- 反常识：挑战大众认知
- 故事预告：用"我/同事/朋友"的真实经历做钩子
- 扎心共鸣：不是恐吓而是戳痛点

## 输出格式
只返回1个优化后的标题，不要解释、不要引号、不要标注字数。`;

  try {
    const response = await aiClient.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请优化这个标题，使其更具爆款潜力：\n"${title}"` }
      ],
      temperature: 0.9,
      max_tokens: 150
    });

    let optimizedTitle = response.choices[0]?.message?.content?.trim() || title;
    
    // 强制截断到20字
    const chineseChars = optimizedTitle.match(/[\u4e00-\u9fa5]/g)?.length || 0;
    if (chineseChars > 20) {
      // 简单截断到20字
      let count = 0;
      let truncated = '';
      for (const char of optimizedTitle) {
        if (/[\u4e00-\u9fa5]/.test(char)) count++;
        if (count > 20) break;
        truncated += char;
      }
      optimizedTitle = truncated;
    }

    const optimizedAnalysis = await analyzeTitle(optimizedTitle);

    return {
      originalTitle: title,
      optimizedTitle,
      improvement: optimizedAnalysis.score - originalAnalysis.score,
      techniques: optimizedAnalysis.patterns,
      reason: `从${originalAnalysis.score}分优化到${optimizedAnalysis.score}分`
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
