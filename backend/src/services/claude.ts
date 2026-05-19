// DeepSeek AI 服务封装（替代 Claude）- 风格类型版本
import OpenAI from 'openai';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

// ==================== 风格类型定义 ====================

export type StyleType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface StyleDefinition {
  id: StyleType;
  name: string;
  emoji: string;
  color: string;
  description: string;
  coreLogic: string;
  exampleTitles: string[];
  templates: string[];
}

export const STYLE_DEFINITIONS: Record<StyleType, StyleDefinition> = {
  A: {
    id: 'A',
    name: '反直觉反向',
    emoji: '🔴',
    color: 'red',
    description: '不推销、只劝退/揭秘，反向博取好感',
    coreLogic: '制造预期违背，反向操作反而吸引用户点击',
    exampleTitles: [
      '我已经不卖保险了，但还想说点行业大实话',
      '干了10年保险，我反而劝年轻人别急着买保险',
      '买保险前必看劝退指南，避开90%的坑',
      '这3类保险，我真心不建议普通人入手',
      '别再傻傻买全险了！普通人根本用不上'
    ],
    templates: [
      '干了[X]年保险，我反而劝你别急着买',
      '这[X]类保险，我真心不建议[人群]买',
      '买保险前，先看看这份劝退指南',
      '年薪[X]万以下，保险这么买是在烧钱',
      '我已经[退出/不卖]了，但还想说点大实话'
    ]
  },
  B: {
    id: 'B',
    name: '行业内幕揭秘',
    emoji: '🟠',
    color: 'orange',
    description: '输出圈内稀缺信息，打破信息差',
    coreLogic: '圈内人爆料，制造私密感和权威感',
    exampleTitles: [
      '干了10年保险，说点小红书上搜不到的行业真相',
      '保险合同第3条，90%投保人都直接跳过不看',
      '理赔员朋友偷偷告诉我：顺利理赔的核心秘诀',
      '保险公司拒赔的3个惯用理由，提前避开'
    ],
    templates: [
      '干了[X]年保险，说点[平台]上搜不到的',
      '保险合同第[X]条，[比例]的人都跳过不看',
      '[职业]朋友偷偷告诉我：[核心秘诀/真相]',
      '[职业/角色]不会主动告诉你的[内幕]',
      '保险公司最不想让你知道的[X]个真相'
    ]
  },
  C: {
    id: 'C',
    name: '精准人群痛点',
    emoji: '🟡',
    color: 'gold',
    description: '绑定年龄、职业、身份、预算标签',
    coreLogic: '精准标签锁定受众，用户自动对号入座',
    exampleTitles: [
      '30岁上班族，保险这么配不花一分冤枉钱',
      '宝妈买保险，最容易浪费的3笔冤枉钱',
      '45岁以上买保险，还有这些高性价比选择',
      '月光族！花最少的钱配齐全家保障'
    ],
    templates: [
      '[年龄/职业]买保险，最容易花的[X]笔冤枉钱',
      '[精准人群]，保险这么配不花冤枉钱',
      '如果你[具体情况]，买保险要注意这[X]点',
      '[精准人群]买保险，还有这些[高性价比/省钱]选择',
      '月薪[X]k，[精准人群]保险配置方案'
    ]
  },
  D: {
    id: 'D',
    name: '权威背书+亲身实操',
    emoji: '🟢',
    color: 'green',
    description: '第三方权威加持+真实实操经历',
    coreLogic: '第三方权威佐证+亲身实操经历，增强可信度和冲击力',
    exampleTitles: [
      '和儿科医生聊完，我把宝宝的保险全部换掉了',
      '律师朋友看完我的保单，只说了一句话（太扎心）',
      '陪客户理赔50万后，我总结出普通人买保险的真相',
      '和精算师深聊后，发现我以前买保险全错了'
    ],
    templates: [
      '和[权威人士]聊完，我把[个人/全家/宝宝]保险换了',
      '[权威人士]看完我的保单，只说了一句[扎心/干货]真话',
      '[经历描述]后，我总结出[人群]买保险的真相',
      '陪[人群]理赔[X]万后，发现[核心洞察]',
      '和[权威人士]深聊后，发现我以前[做错了什么]'
    ]
  },
  E: {
    id: 'E',
    name: '数字/清单/对比',
    emoji: '🔵',
    color: 'blue',
    description: '数字清晰、对比强烈、干货密集',
    coreLogic: '用具体数字制造冲击，不要抽象表达',
    exampleTitles: [
      '保险买对vs买错，几年下来差距居然这么大',
      '90%的人都踩过的5个保险误区，赶紧自查',
      '一年花3000买保险和10000买保险，差别在哪？',
      '复盘100份真实理赔案例，总结出普通人投保规律'
    ],
    templates: [
      '[XX]买对vs买错，[时间/情况]差距居然这么大',
      '[比例]的人都踩过的[X]个保险误区',
      '一年花[X]和[X]买保险，差别在哪？',
      '复盘[X]份[真实案例]，总结出[规律/结论]',
      '[XX]和[XX]，[数字/金额]差距好大'
    ]
  },
  F: {
    id: 'F',
    name: '情绪/故事/悬念',
    emoji: '🟣',
    color: 'purple',
    description: '用情绪、真实故事、悬念抓住用户共情',
    coreLogic: '情绪驱动，故事开场，悬念收尾',
    exampleTitles: [
      '我后悔了，保险真的不该买太早',
      '28岁一场小病，让我彻底读懂了保险的意义',
      '做保险5年，我见过最扎心的6个真实理赔故事',
      '但凡你想退保，一定要先看完这篇再决定'
    ],
    templates: [
      '我[后悔/庆幸]了，[核心事件]',
      '[年龄]岁[事件]，让我[重新认识/读懂][主题]',
      '做保险[X]年，我见过最[形容词]的[X]个[故事/案例]',
      '但凡你想[做某事]，一定要先看完这篇',
      '[情绪触发]，[真实故事简述]'
    ]
  }
};

// 跨赛道借鉴钩子
export const CROSS_DOMAIN_HOOKS = {
  职场: '我不是怕你没保险，我是怕你买错了还浑然不知',
  情感: '跟资深保险人聊完，我终于搞懂怎么买保险了',
  育儿: '后悔没有早点给孩子买对保险，少花几万冤枉钱',
  理财: '年薪10万，我用保险守住了全家的经济底线',
  健康: '核保老师说出这句话时，我才懂投保的关键'
};

// 万能填空模板
export const FILL_IN_TEMPLATES = [
  '干了[X]年保险，说点[小红书/网上]搜不到的真话',
  '我已经不卖保险了，但还想聊聊[投保/理赔/避坑]大实话',
  '和[医生/精算师/核保师/律师]聊完，我把[个人/全家/宝宝]保险换了',
  '突然发现[宝妈/打工人/30岁女性/中年人]买保险的思路要改了',
  '[精准人群]买保险，最容易花的[N]笔冤枉钱，别再踩坑',
  '保险公司/代理人最怕客户问的[N]个问题，建议收藏',
  '我主动[退保/加保/换方案]，真实原因太现实',
  '[权威人士]看完我的保单，只说了一句[扎心/干货]真话',
  '买保险前，一定要先看完这份[避坑/配置/理赔]指南',
  '这[N]类保险，我真心不建议[普通人/年轻人/宝妈]买'
];

// 4大心理触发器
export const PSYCHOLOGICAL_TRIGGERS = {
  反直觉: '打破用户固有认知，制造预期反差',
  内幕感: '圈内独家信息，稀缺不公开',
  精准人群: '精准标签锁定受众，用户自动对号入座',
  '权威背书+个人行动': '第三方权威佐证+亲身实操'
};

// ==================== Schema 定义 ====================

const TitleOutputSchema = z.object({
  titles: z.array(z.object({
    title: z.string(),
    type: z.string(),
    score: z.number().min(1).max(10),
    explanation: z.string(),
    hashtags: z.array(z.string()),
    selfCriticism: z.string(),
    targetAudience: z.string().optional(),
    styleType: z.string().optional()
  }))
});

const TitleArraySchema = z.array(z.object({
  title: z.string(),
  type: z.string(),
  score: z.number().min(1).max(10),
  explanation: z.string(),
  hashtags: z.array(z.string()),
  selfCriticism: z.string(),
  targetAudience: z.string().optional(),
  styleType: z.string().optional()
}));

const tripleBacktick = '\x60\x60\x60';

// ==================== 辅助函数 ====================

/**
 * 从数据库拉取小红书高分爆款标题
 */
async function fetchViralTitleExamples(keywords: string[]): Promise<string> {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    let cases = await prisma.viralCase.findMany({
      where: {
        platform: 'XHS',
        likesCount: { gte: 50 },
        publishedAt: { gte: fifteenDaysAgo },
        url: { not: { contains: 'example' } }
      },
      orderBy: { viralScore: 'desc' },
      take: 8,
      select: { title: true, likesCount: true, favoritesCount: true }
    });

    if (cases.length < 4) {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      cases = await prisma.viralCase.findMany({
        where: {
          platform: 'XHS',
          likesCount: { gte: 50 },
          publishedAt: { gte: sixtyDaysAgo },
          url: { not: { contains: 'example' } }
        },
        orderBy: { viralScore: 'desc' },
        take: 8,
        select: { title: true, likesCount: true, favoritesCount: true }
      });
    }

    if (cases.length === 0) return '';

    const exampleList = cases
      .map((c, i) => `${i + 1}. 「${c.title}」（点赞${c.likesCount}，收藏${c.favoritesCount || 0}）`)
      .join('\n');

    return `\n## 🔥 真实爆款参考（数据库中过去15天点赞50+的小红书笔记标题）\n以下是本账号数据库中已验证有流量的真实爆款标题，请仔细学习它们的措辞方式、情绪触点和结构规律：\n${exampleList}\n`;
  } catch (e) {
    console.log('拉取爆款标题参考失败（忽略）:', e);
    return '';
  }
}

/**
 * 构建风格类型的Prompt
 */
function buildStylePrompt(
  styleType: StyleType,
  keywords: string[],
  options?: {
    enableCrossDomain?: boolean;
    crossDomainTypes?: string[];
  }
): string {
  const style = STYLE_DEFINITIONS[styleType];
  const keywordStr = keywords.join(', ');

  let crossDomainSection = '';
  if (options?.enableCrossDomain) {
    const types = options.crossDomainTypes || Object.keys(CROSS_DOMAIN_HOOKS);
    crossDomainSection = `

## 🌐 跨赛道借鉴（可选择性融入）
${types.map(t => `- ${t}赛道 → "${CROSS_DOMAIN_HOOKS[t as keyof typeof CROSS_DOMAIN_HOOKS]}"`).join('\n')}
`;
  }

  return `你是一个深谙小红书流量密码的保险赛道标题黑客。

用户关键词：${keywordStr}

## 📌 当前风格类型：【${style.emoji} ${style.name}】
核心逻辑：${style.coreLogic}
风格描述：${style.description}

## 示例标题（学习这些标题的语气和结构）
${style.exampleTitles.map(t => `- "${t}"`).join('\n')}

## 可用模板（在模板基础上创新，不要照搬）
${style.templates.map(t => `- ${t}`).join('\n')}${crossDomainSection}

## 🔥 真实爆款参考（如果有的话）
（系统会自动注入数据库中的真实爆款标题）

## 铁律
1. 标题必须≤20个字（小红书硬性限制）
2. 必须像真人发的朋友圈，不像AI生成的广告
3. 禁止恐吓式标题（"千万别买""后悔死了"已过时）

## 4大心理触发器（必须命中至少1种）
1. 反直觉：打破用户固有认知，制造预期反差
2. 内幕感：圈内独家信息，稀缺不公开
3. 精准人群：精准标签锁定受众，用户自动对号入座
4. 权威背书+个人行动：第三方权威佐证+亲身实操

## 万能填空模板参考（可用但不要照搬）
1. 干了[X]年保险，说点[平台]搜不到的真话
2. 我已经不卖保险了，但还想聊聊[投保/理赔/避坑]大实话
3. 和[医生/精算师/核保师/律师]聊完，我把[个人/全家/宝宝]保险换了
4. [精准人群]买保险，最容易花的[N]笔冤枉钱，别再踩坑
5. 保险公司最怕客户问的[N]个问题，建议收藏

## 精准人群标签（至少2个标题要精准命中目标人群）
- 宝妈、打工人、25岁单身女性、40岁中年人
- 房贷族、独生子女、刚毕业、有娃家庭
- 理赔过的人、退保过的人、自由职业者

## 评分标准
- 9-10分：能和真实爆款掰手腕，有强烈点击欲
- 7-8分：有吸引力，像真人说的
- 5-6分：中规中矩，没有记忆点
- 3-4分：像AI生成的，或像广告
- 1-2分：说明书式，完全不想点

## 禁止清单
- 禁止"今天分享""一起来了解""给大家介绍"式开头
- 禁止纯"科普""攻略""指南"等说明书式用词
- 禁止过度恐吓（"千万别""后悔死了"已审美疲劳）
- 禁止超过20字
- 禁止使用绝对化用语（最、第一、唯一、顶级）
- 禁止使用收益承诺类词汇
- 禁止使用医疗功效类词汇

## 输出要求
生成8个标题，每个标题标注字数（10-20字），必须覆盖至少3种精准人群标签，风格要多样化不要全是同一句式。

【重要】请直接输出纯JSON，不要用markdown代码块包裹：
{
  "titles": [
    {"title": "标题1[12字]", "type": "${style.name}", "score": 8, "explanation": "为什么这个标题好", "hashtags": ["标签1"], "selfCriticism": "自我批评", "targetAudience": "打工人", "styleType": "${styleType}"}
  ]
}`;
}

/**
 * 解析AI返回的JSON
 */
function parseAIResponse(responseText: string): z.infer<typeof TitleOutputSchema> {
  let cleanText = responseText.trim();
  
  // 去掉markdown代码块包裹
  while (cleanText.startsWith(tripleBacktick)) {
    cleanText = cleanText.replace(new RegExp('^' + tripleBacktick + 'json\\n?', 'i'), '').replace(new RegExp('^' + tripleBacktick + '\\n?', 'i'), '').trim();
  }
  while (cleanText.endsWith(tripleBacktick)) {
    cleanText = cleanText.replace(new RegExp('\\n?' + tripleBacktick + '$'), '').trim();
  }

  let jsonStr = cleanText;
  
  // 方法1：直接解析
  try {
    const parsed = JSON.parse(jsonStr);
    return TitleOutputSchema.parse(parsed);
  } catch (e1: any) {
    console.error('方法1解析失败:', e1.message);
  }

  // 方法2：提取JSON对象
  const braceStart = jsonStr.indexOf('{');
  const braceEnd = jsonStr.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    jsonStr = jsonStr.substring(braceStart, braceEnd + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      return TitleOutputSchema.parse(parsed);
    } catch (e2: any) {
      console.error('方法2解析失败:', e2.message);
    }
  }

  // 方法3：解析数组
  try {
    const parsed = JSON.parse(cleanText);
    if (Array.isArray(parsed)) {
      return { titles: TitleArraySchema.parse(parsed) };
    }
  } catch (e3: any) {
    console.error('方法3解析失败:', e3.message);
  }

  // 方法4：正则提取
  try {
    const titleRegex = /"title"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"([^"]+)"\s*,\s*"score"\s*:\s*(\d+)\s*,\s*"explanation"\s*:\s*"(.+?)"\s*,\s*"hashtags"\s*:\s*\[([^\]]*)\]\s*,\s*"selfCriticism"\s*:\s*"(.+?)"\s*\}/g;
    const extractedTitles: Array<{title: string; type: string; score: number; explanation: string; hashtags: string[]; selfCriticism: string; targetAudience?: string; styleType?: string}> = [];
    let match;
    while ((match = titleRegex.exec(cleanText)) !== null) {
      const hashtagsStr = match[5];
      const hashtags = hashtagsStr.split(',').map((h: string) => h.trim().replace(/"/g, '')).filter(Boolean);
      extractedTitles.push({
        title: match[1],
        type: match[2],
        score: parseInt(match[3]),
        explanation: match[4],
        hashtags,
        selfCriticism: match[6]
      });
    }
    if (extractedTitles.length > 0) {
      console.log(`正则提取到 ${extractedTitles.length} 个标题`);
      return TitleOutputSchema.parse({ titles: extractedTitles });
    }
  } catch (e4: any) {
    console.error('方法4正则提取失败:', e4.message);
  }

  console.error('AI 返回内容:', responseText.substring(0, 500));
  throw new Error('AI 返回格式错误，返回内容: ' + responseText.substring(0, 500));
}

// ==================== 主要导出函数 ====================

/**
 * 按风格类型生成标题（新接口）
 */
export async function generateTitlesByStyle(
  keywords: string[],
  styleTypes: StyleType | StyleType[],
  options?: {
    enableCrossDomain?: boolean;
    crossDomainTypes?: string[];
    count?: number;
  }
): Promise<z.infer<typeof TitleOutputSchema>> {
  const styles = Array.isArray(styleTypes) ? styleTypes : [styleTypes];
  const count = options?.count || 8;
  
  const allTitles: z.infer<typeof TitleOutputSchema>['titles'] = [];
  
  // 动态注入真实爆款参考标题
  const viralExamples = await fetchViralTitleExamples(keywords);

  for (const styleType of styles) {
    const style = STYLE_DEFINITIONS[styleType];
    if (!style) continue;

    let prompt = buildStylePrompt(styleType, keywords, {
      enableCrossDomain: options?.enableCrossDomain,
      crossDomainTypes: options?.crossDomainTypes
    });

    // 注入真实爆款参考
    if (viralExamples) {
      prompt = prompt.replace('（系统会自动注入数据库中的真实爆款标题）', viralExamples);
    }

    try {
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4096,
      });

      const responseText = response.choices[0]?.message?.content || '';
      const result = parseAIResponse(responseText);
      
      // 添加风格类型标记
      result.titles = result.titles.map(t => ({
        ...t,
        styleType: styleType
      }));
      
      allTitles.push(...result.titles);
    } catch (error: any) {
      console.error(`生成${style.name}风格标题失败:`, error?.message || error);
      // 继续生成其他风格的标题
    }
  }

  // 如果没有生成任何标题，返回默认标题
  if (allTitles.length === 0) {
    throw new Error('AI 服务调用失败，未能生成任何标题');
  }

  // 限制返回数量
  return { titles: allTitles.slice(0, count) };
}

/**
 * 生成跨赛道借鉴标题
 */
export async function generateCrossDomainTitles(
  keywords: string[],
  crossDomainType: keyof typeof CROSS_DOMAIN_HOOKS
): Promise<z.infer<typeof TitleOutputSchema>> {
  const hook = CROSS_DOMAIN_HOOKS[crossDomainType];
  const keywordStr = keywords.join(', ');
  
  const viralExamples = await fetchViralTitleExamples(keywords);

  const prompt = `你是一个深谙小红书流量密码的保险赛道标题黑客。

用户关键词：${keywordStr}

## 🌐 跨赛道借鉴模式
目标：借鉴${crossDomainType}赛道的爆款钩子，融入保险内容
核心钩子：${hook}

将上述钩子的结构/情绪/句式迁移到保险标题，但内容必须原创且符合保险主题。

## 示例借鉴方式
- 职场→保险："我不是怕你没保险，我是怕你买错了还浑然不知"
- 情感→保险："跟资深保险人聊完，我终于搞懂怎么买保险了"
- 育儿→保险："后悔没有早点给孩子买对保险，少花几万冤枉钱"
- 理财→保险："年薪10万，我用保险守住了全家的经济底线"
- 健康→保险："核保老师说出这句话时，我才懂投保的关键"${viralExamples ? '\n\n## 🔥 真实爆款参考\n' + viralExamples : ''}

## 铁律
1. 标题必须≤20个字
2. 借鉴结构/情绪，不是照搬内容
3. 必须和保险/保障相关

## 输出要求
生成6个标题：
【重要】请直接输出纯JSON，不要用markdown代码块包裹：
{
  "titles": [
    {"title": "标题1", "type": "跨赛道-${crossDomainType}", "score": 8, "explanation": "借鉴了什么", "hashtags": ["标签"], "selfCriticism": "批评", "targetAudience": "精准人群", "styleType": "CROSS_DOMAIN"}
  ]
}`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2048,
    });

    const responseText = response.choices[0]?.message?.content || '';
    return parseAIResponse(responseText);
  } catch (error: any) {
    console.error('生成跨赛道标题失败:', error?.message || error);
    throw new Error('AI 服务调用失败: ' + (error?.message || '未知错误'));
  }
}

/**
 * 原有接口保持兼容
 */
export async function generateTitles(keywords: string[], context?: string): Promise<z.infer<typeof TitleOutputSchema>> {
  let background = '';
  if (context) {
    background = '\n当前背景：' + context + '\n';
  }

  const viralExamples = await fetchViralTitleExamples(keywords);

  const prompt = `你是一个深谙小红书流量密码的保险赛道标题黑客。

用户输入的关键词：${keywords.join(', ')}${background}${viralExamples}

## 铁律
1. 标题必须≤20个字
2. 必须像真人发的朋友圈，不像AI生成的广告
3. 禁止恐吓式标题

## 12种爆款风格
### 风格1：大佬思路通透风
- 大佬买XX的思路，真的太通透了
- 聪明人XX，从来不乱跟风

### 风格2：行业大实话风
- 不卖XX了，掏句良心大实话
- 从业多年，揭开XX不为人知内幕

### 风格3：反套路吐槽风
- 别再瞎买XX，全是隐形大坑
- XX水太深，小白千万别盲目入手

### 风格4：走心共情风
- 普通家庭XX，真的不用买太贵
- 给家人XX，记住这几点就够了

### 风格5：悬念好奇风
- 为什么聪明人，从不乱买XX
- XX最大信息差，90%人都不知道

### 风格6：灵魂拷问式
- 你买的XX，真的有用吗？
- 花几万买XX，出事能赔多少？

### 风格7：极端场景代入式
- 如果明天得XX，你的保险够吗？
- 如果住院花10万，XX能报多少？

### 风格8：一句话反常识式
- 先给孩子买XX，是最大的错误
- XX买得越多，反而越不安全

### 风格9：精准人群劝退式
- 如果你是XX，别买XX
- 如果你没钱，别碰返还型保险

### 风格10：数字暴击式
- 花1万买的XX，只赔了1000块
- 同样50万保额，差价能差3倍

### 风格11：亲身踩坑故事式
- 我闺蜜买XX，理赔时被拒了
- 我妈买的XX，10年亏了2万

### 风格12：紧急预警式
- 注意！这些XX下个月就要涨价
- 警惕！这种XX正在大量拒赔

## 精准人群（至少3个标题要命中）
宝妈、打工人、房贷族、独生子女、刚毕业、理赔过的人、退保过的人

## 评分标准
- 9-10分：能和真实爆款掰手腕
- 7-8分：有强烈点击欲
- 5-6分：中规中矩
- 3-4分：像AI或广告
- 1-2分：说明书式

## 禁止清单
- 禁止"今天分享""一起来了解"式开头
- 禁止纯"科普""攻略""指南"说明书式
- 禁止超过20字

【重要】请直接输出纯JSON，不要用markdown代码块包裹：
{
  "titles": [
    {"title": "标题1", "type": "风格名称", "score": 8, "explanation": "说明", "hashtags": ["标签"], "selfCriticism": "批评", "targetAudience": "人群"}
  ]
}`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4096,
    });

    const responseText = response.choices[0]?.message?.content || '';
    return parseAIResponse(responseText);
  } catch (error: any) {
    console.error('DeepSeek API 调用失败:', error?.message || error);
    throw new Error('AI 服务调用失败: ' + (error?.message || '未知错误'));
  }
}

/**
 * 案例分析（保持原有功能）
 */
export async function analyzeViralCase(
  title: string,
  content: string,
  metrics: { likes: number; favorites: number; comments: number }
): Promise<{
  viralScore: number;
  viralFactors: string[];
  contentStructure: { opening: string; body: string; ending: string };
  topicAngle: string;
  hooks: string[];
  styleFeatures: string;
  reusableFormula: string;
  suggestions: string[];
}> {
  const prompt = `你是一个深谙小红书流量密码的保险赛道内容分析师。

标题：${title}
内容：${content}
互动数据：👍${metrics.likes} ⭐${metrics.favorites} 💬${metrics.comments}

## 分析要求
1. 爆款指数（0-100分）
2. 爆款因子（3-5个）
3. 内容结构拆解
4. 选题角度
5. 爆款钩子
6. 语言风格
7. 可复用公式
8. 仿写建议

【重要】请直接输出纯JSON：
{
  "viralScore": 85,
  "viralFactors": ["因子1", "因子2"],
  "contentStructure": {"opening": "开头", "body": "正文", "ending": "结尾"},
  "topicAngle": "角度",
  "hooks": ["钩子1"],
  "styleFeatures": "风格",
  "reusableFormula": "公式",
  "suggestions": ["建议1"]
}`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2048,
  });

  const responseText = response.choices[0]?.message?.content || '';
  let cleanText = responseText.trim()
    .replace(new RegExp('^' + tripleBacktick + 'json\\n?', 'i'), '')
    .replace(new RegExp('^' + tripleBacktick + '\\n?', 'i'), '')
    .replace(new RegExp('\\n?' + tripleBacktick + '$'), '')
    .trim();

  try {
    return JSON.parse(cleanText);
  } catch (e: any) {
    console.error('案例分析解析失败:', e.message);
    throw new Error('AI 返回格式错误');
  }
}

// 导出类型和常量供前端使用
export { TitleOutputSchema, TitleArraySchema };

// ==================== 情报摘要功能（兼容旧接口） ====================

export async function summarizeIntelligence(title: string, content?: string): Promise<string> {
  const prompt = `请为以下保险情报生成简洁的中文摘要（100字以内）：

标题：${title}
${content ? '内容：' + content.substring(0, 1000) : ''}

摘要要求：
1. 提取核心信息
2. 突出关键数据或变化
3. 100字以内`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content?.trim() || title;
  } catch (error: any) {
    console.error('AI摘要生成失败:', error?.message || error);
    return title;
  }
}
