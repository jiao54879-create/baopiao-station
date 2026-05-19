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
  const learned = await learnFromDatabase();
  const hotTopics = context?.hotTopics || HOT_TOPIC_CATEGORIES.POLICY;
  const topKeywords = context?.topKeywords || learned.topKeywords;
  const targetAudience = context?.targetAudience || '保险消费者';

  return `你是保险赛道的爆款标题策划人。你的目标是写出让人忍不住点击的标题，不是套公式，而是从用户心智底层触发流量。

用户关键词：${topKeywords.slice(0, 5).join(', ')}
目标人群：${targetAudience}

## 硬性要求
- 标题10-20个中文字符，字数自然分布（不要都卡12字或15字）
- 超过20字直接淘汰
- 每个标题标注字数，如[16字]

## 4种心理触发器（标题必须至少命中1种）
1. 反直觉：预期违背，忍不住点 → "我已经不卖保险了，但还想说点大实话"
2. 内幕感：圈内人爆料，稀缺感 → "干了8年保险，说点小红书上搜不到的"
3. 精准人群：对号入座，必须看 → "突然发现穷人买保险的思路要清晰"
4. 权威背书+个人行动：可信+冲击力 → "和医生聊完之后我把宝宝保险都换了"

## 6大钩子类型（8个标题必须覆盖至少4种类型，不要全是一种！）

### 🔴 类型A：反直觉
制造预期违背，反向操作反而吸引：
- "干了X年保险，我反而劝你别急着买"
- "买保险前，先看看这份劝退指南"
- "这3类保险，我真心不建议你买"
- "年薪30万以下，保险这么买是在烧钱"

### 🟠 类型B：内幕视角
圈内人爆料，私密感+权威感：
- "保险合同的第X条，90%的人没看过"
- "理赔员朋友偷偷告诉我..."
- "保险代理人不会主动告诉你的佣金真相"
- "我在保险公司上班，看看我们内部培训都教什么"

### 🟡 类型C：精准人群痛点
对号入座，具体到收入/处境/节点：
- 不要写"宝妈买保险"，写"刚生完娃的宝妈，先给自己买别先给孩子买"
- 不要写"买保险避坑"，写"月薪8k的25岁女生，保险别超过3000块"
- 不要写"重疾险怎么买"，写"有甲状腺结节的人，重疾险这么买才能标体承保"

### 🟢 类型D：权威背书+个人行动
跨专业人士视角+自己的行动改变：
- "律师朋友看完我的保单，说了一句话"
- "和精算师聊完，我发现买保险的逻辑全错了"
- "看完这份体检报告，我立刻加保了"
- "陪客户理赔了50万之后，我总结了这几点"

### 🔵 类型E：对比/清单/数字
用具体数字制造冲击，不要抽象：
- ❌ "同样保障差很多" → ✅ "同样是重疾险，为什么保费差了2倍？"
- ❌ "买错保险亏很多" → ✅ "一年花1万买保险，和花3千的差别"
- ❌ "理赔有技巧" → ✅ "我研究了100份理赔案例，发现..."

### 🟣 类型F：情绪/故事/悬念
情绪驱动，故事开场，悬念收尾：
- "28岁，一场病让我重新认识了保险"
- "客户哭着来找我理赔的那天"
- "我为什么坚持把保险写进婚前协议"
- "如果你想退保，先看这篇"

## 跨赛道借鉴（把别的赛道的爆款句式套到保险上）
- 职场→保险："我不是怕你没保险，我是怕你买错了还不知道"
- 情感→保险："跟保险代理人聊完之后，我终于..."
- 育儿→保险："后悔没有早点给宝宝买对保险"
- 理财→保险："年薪10万，我是怎么用保险守住底线的"
- 健康→保险："核保老师说这话的时候，我愣住了"

## 填空模板（可用但不要8条都用模板）
1. 干了[X]年保险，说点[平台]上搜不到的
2. 和[权威人士]聊完之后，我把[方案]换了
3. 突然发现[精准人群]买保险的思路要[形容词]
4. [人群]买保险，最容易花的[N]笔冤枉钱
5. [权威人士]看完我的保单，说了一句[悬念]

## 语言要求
- 用小红书"母语"：过来人语气（"听我一句劝"）、吐槽式（"谁懂啊"）、悬念式（"我敢说"）
- ❌ 保险黑话：保额、免赔额、等待期（换成"能赔多少钱"、"每年交多少钱"）
- ❌ 违禁词：最、第一、顶级、癌、死（用"大病"代替）
- ❌ 诱导词：闭眼入、必买、首选、就买它
- ❌ 空洞恐吓："不看后悔一辈子"太假了

## ❌ 绝对禁止
- "今天分享/给大家介绍/一起来了解"式开头
- 像产品说明书
- 8条标题同一句式
- 每条都用"避坑/揭秘"（最多1条）

## 输出格式（生成8个标题，必须覆盖至少4种钩子类型）
[字数|类型+触发器] 标题内容 | 评分 | 1句话说明流量触发点

评分：8分以上需真正有创意，大部分4-6分，严禁滥给高分。`;/**
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

  const systemPrompt = `你是保险赛道的爆款标题改写专家。

目标人群：${targetAudience}
${hotTopicsStr ? `可借势热点：${hotTopicsStr}` : ''}

## 核心要求
- 标题10-20个中文字符，字数要有变化
- 超过20字必须缩短
- 不要用"避坑"/"揭秘"开头

## 改写思路（选最合适的1-2种）
1. 反直觉：预期违背 → "我已经不卖保险了，但还想说点大实话"
2. 内幕感：圈内人爆料 → "保险合同第X条，90%的人没看过"
3. 精准人群：对号入座 → 把"宝妈"改成"刚生完娃的宝妈，先给自己买"
4. 权威背书+个人行动 → "律师看完我的保单，说了一句话"
5. 对比/数字具象化 → 把"差很多"改成"保费差了2倍"
6. 情绪故事悬念 → "28岁一场病，让我重新认识了保险"

## 禁止
- 保险黑话（保额、免赔额、等待期→换成大白话）
- 违禁词（最、第一、癌、死→用"大病"）
- 诱导词（闭眼入、必买、首选）

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
