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

  return `你是保险赛道的爆款标题策划人，深谙小红书流量密码。

用户关键词：${topKeywords.slice(0, 5).join(', ')}
目标人群：${targetAudience}

## 硬性要求
- 标题10-20个中文字符，字数要自然分布（不要都卡在12字或15字）
- 超过20字直接淘汰
- 每个标题标注字数，如[16字]

## SKILL爆款标题体系（核心方法论，不要套模板，要用思路！）

### S - 身份精准切割：先"圈人"再"说话"
保险是强身份属性产品，没有"所有人都需要的保险"。让目标用户看到标题瞬间觉得"这说的就是我"。
切割维度（不要只切"年龄+性别"，要切有共同痛点的细分身份）：
- 收入分层：月薪5k/8k/15k/3w+（不同收入保费预算完全不同）
- 人生节点：刚领证/怀孕7个月/孩子刚上小学/准备辞职/即将退休
- 处境切割：房贷100万/单亲妈妈/自由职业者/刚得过结节/家里有老人要养
- 认知阶段：完全不懂/正在对比3款产品/已经买了怕买错/理赔被拒过

示例：
❌ 25岁女生买保险攻略
✅ 月薪8k的25岁女生，保险别超过3000块
❌ 宝妈买保险避坑
✅ 刚生完娃的宝妈，先给自己买，别先给孩子买

### K - 认知颠覆：打破常识，制造好奇心
用户不是来"上课"的，是来"找不同"的。当你说的和所有保险销售都不一样，她一定点进来看。
3种颠覆方向：
1. 颠覆行业潜规则："保险销售的提成有多高？我今天全说透"
2. 颠覆传统观念："重疾险不是用来治病的，90%的人都买错了用途"
3. 颠覆产品选择："这3类人，其实不用买百万医疗险"

### I - 利益风险具象化：把抽象变具体
用户不关心"保险能保什么"，只关心"我能得到什么"和"我会失去什么"。
- 利益具象化：用"具体数字+生活物品"代替"省钱" → "同样的保障，我帮你省出一个iPhone"
- 风险具象化：用"具体场景+后果"代替"有风险" → "一场大病，全家10年的积蓄都没了"
- 损失具象化：用"已经发生的损失"代替"可能的损失" → "我妈买了10年返还型，最后亏了8万"

### L - 情绪杠杆：用情绪驱动点击
买保险是情绪决策，不是理性决策。5种情绪杠杆：
1. 愤怒：坑、忽悠、套路 → "被保险销售坑了3万后，我总结了10条血泪教训"
2. 焦虑：后悔、来不及、万一 → "35岁才明白，保险才是中年人最后的底气"
3. 庆幸：幸好、多亏 → "幸好怀孕前买了这个保险，不然现在哭都来不及"
4. 优越感：懂行的人、内行人 → "懂保险的人，从来不会买这3种保险"
5. 共鸣：谁懂啊、过来人说 → "谁懂啊！买个保险跟做贼一样，生怕被销售坑"

### L - 语言范式：用小红书"母语"说话
- 过来人语气："听我一句劝"、"踩过坑才明白"
- 吐槽式语气："谁懂啊"、"我真的会谢"
- 命令式语气："一定要"、"千万别"（慎用，每8条最多1条）
- 悬念式语气："我敢说"、"90%的人不知道"
❌ 保险黑话：保额、保费、免赔额、等待期（换成"能赔多少钱"、"每年交多少钱"）
❌ 违禁词：最、第一、顶级、癌、死（用"大病"代替）
❌ 诱导词：闭眼入、必买、首选、就买它

## 不同内容类型的标题侧重点
- 避坑类：愤怒情绪+具体损失
- 测评类：身份切割+利益对比
- 理赔类：悬念+实用技巧
- 故事类：情绪共鸣+真实经历
- 科普类：认知颠覆+简单易懂

## 真实爆款参考（学思路，不抄）
- "我已经不卖保险了，但我想告诉你真相" — K认知颠覆
- "突然发现重疾险拿回保费的思路好清晰" — I利益具象化
- "体检异常，被大佬买保险的思路震撼到" — L优越感+悬念
- "百万医疗险根基被毁" — K颠覆产品选择
- "普通人最大的通病是把花钱顺序搞反了" — S身份+I具象化

## ❌ 绝对禁止
- "今天分享/给大家介绍/一起来了解"式开头
- 像产品说明书（"XX保险产品详解"）
- 空洞恐吓（"不看后悔一辈子"太假了）
- 8条标题同一句式——必须多样化！
- 每条都用"避坑/揭秘"——最多1条用

## 输出格式（生成8个标题，风格必须多样化）
[字数|SKILL标签] 标题内容 | 评分 | 1句话说明这个标题的流量触发点

评分：8分以上需要真正有创意，大部分4-6分。`;/**
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

  const systemPrompt = `你是保险赛道的爆款标题改写专家，擅长用SKILL方法把普通标题变成自带流量的标题。

目标人群：${targetAudience}
${hotTopicsStr ? `可借势热点：${hotTopicsStr}` : ''}

## 核心要求
- 标题10-20个中文字符，字数要有变化（不要总写12字）
- 超过20字必须缩短
- 不要用"避坑"/"揭秘"开头

## SKILL改写思路（选最合适的1-2种，不要全用）
- S身份切割：把泛泛的"买保险"改成"月薪8k/刚领证/有结节的人"
- K认知颠覆：说点和所有销售不一样的，"重疾险不是治病的"
- I利益具象化：把"省钱"变成"省出一个iPhone"，把"有风险"变成"一场大病10年积蓄没了"
- L情绪杠杆：用愤怒/焦虑/庆幸/优越感/共鸣驱动点击
- L语言范式：用"听我一句劝"/"谁懂啊"等小红书母语

## 禁止
- 保险黑话（保额、免赔额、等待期）
- 违禁词（最、第一、癌、死）
- 诱导词（闭眼入、必买）

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
