// DeepSeek AI 服务封装（替代 Claude）- 风格类型版本（8种风格 A-H）
import OpenAI from 'openai';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

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

// ==================== 风格类型定义 ====================

export type StyleType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

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
    id: 'A', name: '反直觉反向', emoji: '🔴', color: 'red',
    description: '不推销、只劝退/揭秘，反向博取好感',
    coreLogic: '制造预期违背，反向操作反而吸引用户点击',
    exampleTitles: ['我已经不卖保险了，但还想说点行业大实话','干了10年保险，我反而劝年轻人别急着买保险','买保险前必看劝退指南，避开90%的坑','这3类保险，我真心不建议普通人入手','别再傻傻买全险了！普通人根本用不上'],
    templates: ['干了[X]年保险，我反而劝你别急着买','这[X]类保险，我真心不建议[人群]买','买保险前，先看看这份劝退指南','年薪[X]万以下，保险这么买是在烧钱','我已经不卖保险了，但还想说点大实话']
  },
  B: {
    id: 'B', name: '行业内幕揭秘', emoji: '🟠', color: 'orange',
    description: '圈内人爆料，打破信息差',
    coreLogic: '输出圈内稀缺信息，塑造资深从业者人设',
    exampleTitles: ['干了10年保险，说点小红书上搜不到的行业真相','保险合同第3条，90%投保人都直接跳过不看','理赔员朋友偷偷告诉我：顺利理赔的核心秘诀','保险公司拒赔的3个惯用理由，提前避开'],
    templates: ['干了[X]年保险，说点小红书上搜不到的真话','保险合同第[X]条，90%的人没看过','保险公司最不想让你知道的[X]个真相','理赔员朋友偷偷告诉我...']
  },
  C: {
    id: 'C', name: '精准人群痛点', emoji: '🟡', color: 'gold',
    description: '绑定年龄/职业/身份/预算标签',
    coreLogic: '精准标签锁定受众，用户自动对号入座',
    exampleTitles: ['30岁上班族，保险这么配不花一分冤枉钱','宝妈买保险，最容易浪费的3笔冤枉钱','45岁以上买保险，还有这些高性价比选择','月光族！花最少的钱配齐全家保障'],
    templates: ['[精准人群]买保险，最容易花的[N]笔冤枉钱','[年龄/身份]买保险，[好处]','月薪[X]的[人群]，保险这么配才对','给孩子买保险，别被爱绑架了']
  },
  D: {
    id: 'D', name: '权威背书+亲身实操', emoji: '🟢', color: 'green',
    description: '第三方权威加持+真实实操经历',
    coreLogic: '第三方权威佐证+亲身实操，摆脱广告感',
    exampleTitles: ['和儿科医生聊完，我把宝宝的保险全部换掉了','律师朋友看完我的保单，只说了一句话（太扎心）','陪客户理赔50万后，我总结出普通人买保险的真相','和精算师深聊后，发现我以前买保险全错了'],
    templates: ['和[权威人士]聊完，我把[保险方案]换了','[权威人士]看完我的保单，说了一句[悬念]','陪客户理赔[X]万后，我总结出...','看完体检报告，我立刻给自己加保了']
  },
  E: {
    id: 'E', name: '数字/清单/对比', emoji: '🔵', color: 'blue',
    description: '数字清晰、对比强烈、干货密集',
    coreLogic: '数字清晰、对比强烈、干货密集，用户收藏自用',
    exampleTitles: ['保险买对vs买错，几年下来差距居然这么大','90%的人都踩过的5个保险误区，赶紧自查','一年花3000买保险和10000买保险，差别在哪？','复盘100份真实理赔案例，总结出普通人投保规律'],
    templates: ['[A] vs [B]，差距居然这么大','90%的人都踩过的[N]个保险误区','同样[X]，为什么差了[N]倍？','复盘[X]份理赔案例，总结出...']
  },
  F: {
    id: 'F', name: '情绪/故事/悬念', emoji: '🟣', color: 'purple',
    description: '情绪驱动，抓住用户共情',
    coreLogic: '用情绪、真实故事、悬念抓住用户共情，打破陌生距离感',
    exampleTitles: ['我后悔了，保险真的不该买太早','28岁一场小病，让我彻底读懂了保险的意义','做保险5年，我见过最扎心的6个真实理赔故事','但凡你想退保，一定要先看完这篇再决定'],
    templates: ['我后悔了，[事件]','[年龄]，[事件]让我重新认识了[主题]','做[X]年[职业]，我见过最扎心的[N]个故事','但凡你想[做某事]，一定要先看完这篇']
  },
  G: {
    id: 'G', name: '阴阳怪气/网感热梗', emoji: '😏', color: 'pink',
    description: '反讽句式+安全热词，阴阳怪气靠结构不靠敏感词',
    coreLogic: '用反讽句式+安全网感热词制造情绪冲击，靠结构出味道不靠敏感词硬顶',
    exampleTitles: ['理赔被拒了，真·赢麻了','交了5年保费，只保了个寂寞','看了别人的理赔单，直接破防了','买了返还型重疾险，小丑竟是我自己🤡','之前觉得线上买保险不靠谱，现在真香'],
    templates: ['[动作]了，真·[反义词]','[动作]了半天，只[惨淡结果]','看了[信息]，直接破防了','买了[产品]，小丑竟是我自己🤡','之前觉得[观点]，现在[反观点]，真香']
  },
  H: {
    id: 'H', name: '短剧悬念', emoji: '🎬', color: 'indigo',
    description: '标题是一集剧情浓缩，有起因→转折→悬念',
    coreLogic: '用短剧式钩子制造剧情推进感，读者忍不住追后续',
    exampleTitles: ['理赔被拒后，我靠这一条翻盘了','那个说包赔的代理人，其实是个话术机器','退保后第3天，保险公司打来电话让我愣住了','被劝退的那款重疾险，反而是最值得买的','已经下架的这款保险，竟然还能买到'],
    templates: ['[惨事]后，我靠[翻盘点]翻盘了','那个[人设]，其实是个[真相]','退保后第[X]天，[意外转折]','被[动作]的那款[产品]，反而是[反转]','已经下架的[产品]，竟然[意外结果]']
  }
};

export const CROSS_DOMAIN_HOOKS: Record<string, string> = {
  '职场': '我不是怕你没保险，我是怕你买错了还浑然不知',
  '情感': '跟资深保险人聊完，我终于搞懂怎么买保险了',
  '育儿': '后悔没有早点给孩子买对保险，少花几万冤枉钱',
  '理财': '年薪10万，我用保险守住了全家的经济底线',
  '健康': '核保老师说出这句话时，我才懂投保的关键'
};

export const FILL_IN_TEMPLATES: string[] = [
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

export const PSYCHOLOGICAL_TRIGGERS: Record<string, string> = {
  '反直觉': '打破用户固有认知，制造预期反差',
  '内幕感': '圈内独家信息，稀缺不公开',
  '精准人群': '精准标签锁定受众，用户自动对号入座',
  '权威背书+个人行动': '第三方权威佐证+亲身实操'
};

// ==================== 数据库爆款参考 ====================

async function fetchViralTitleExamples(keywords: string[]): Promise<string> {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    let cases = await prisma.viralCase.findMany({
      where: { platform: 'XHS', likesCount: { gte: 50 }, publishedAt: { gte: fifteenDaysAgo }, url: { not: { contains: 'example' } } },
      orderBy: { viralScore: 'desc' }, take: 8,
      select: { title: true, likesCount: true, favoritesCount: true }
    });
    if (cases.length < 4) {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      cases = await prisma.viralCase.findMany({
        where: { platform: 'XHS', likesCount: { gte: 50 }, publishedAt: { gte: sixtyDaysAgo }, url: { not: { contains: 'example' } } },
        orderBy: { viralScore: 'desc' }, take: 8,
        select: { title: true, likesCount: true, favoritesCount: true }
      });
    }
    if (cases.length === 0) return '';
    const exampleList = cases.map((c, i) => `${i + 1}. 「${c.title}」（点赞${c.likesCount}，收藏${c.favoritesCount || 0}）`).join('\n');
    return `\n## 🔥 真实爆款参考\n${exampleList}\n`;
  } catch (e) {
    console.log('拉取爆款标题参考失败（忽略）:', e);
    return '';
  }
}

// ==================== JSON解析工具 ====================

function parseAIResponse(responseText: string): z.infer<typeof TitleOutputSchema> {
  let cleanText = responseText.trim();
  while (cleanText.startsWith(tripleBacktick)) {
    cleanText = cleanText.replace(new RegExp('^' + tripleBacktick + 'json\\n?', 'i'), '').replace(new RegExp('^' + tripleBacktick + '\\n?', 'i'), '').trim();
  }
  while (cleanText.endsWith(tripleBacktick)) {
    cleanText = cleanText.replace(new RegExp('\\n?' + tripleBacktick + '$'), '').trim();
  }

  let jsonStr = cleanText;
  try {
    const parsed = JSON.parse(jsonStr);
    return TitleOutputSchema.parse(parsed);
  } catch (e1: any) {
    console.error('方法1解析失败:', e1.message);
  }

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

  try {
    const parsed = JSON.parse(cleanText);
    if (Array.isArray(parsed)) {
      return { titles: TitleArraySchema.parse(parsed) };
    }
  } catch (e3: any) {
    console.error('方法3解析失败:', e3.message);
  }

  try {
    const titleRegex = /"title"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"([^"]+)"\s*,\s*"score"\s*:\s*(\d+)\s*,\s*"explanation"\s*:\s*"(.+?)"\s*,\s*"hashtags"\s*:\s*\[[^\]]*\]\s*,\s*"selfCriticism"\s*:\s*"(.+?)"/g;
    const extractedTitles: Array<{title: string; type: string; score: number; explanation: string; hashtags: string[]; selfCriticism: string; targetAudience?: string; styleType?: string}> = [];
    let match;
    while ((match = titleRegex.exec(cleanText)) !== null) {
      extractedTitles.push({
        title: match[1], type: match[2], score: parseInt(match[3]),
        explanation: match[4], hashtags: [], selfCriticism: match[5]
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

// ==================== 核心生成函数 ====================

export async function generateTitlesByStyle(
  keywords: string[],
  styleTypes: StyleType | StyleType[],
  options?: { enableCrossDomain?: boolean; crossDomainTypes?: string[]; count?: number }
): Promise<z.infer<typeof TitleOutputSchema>> {
  const styles = Array.isArray(styleTypes) ? styleTypes : [styleTypes];
  const count = options?.count || 8;
  const allTitles: z.infer<typeof TitleOutputSchema>['titles'] = [];
  const viralExamples = await fetchViralTitleExamples(keywords);

  for (const styleType of styles) {
    const style = STYLE_DEFINITIONS[styleType];
    if (!style) continue;

    let crossDomainHint = '';
    if (options?.enableCrossDomain && options.crossDomainTypes && options.crossDomainTypes.length > 0) {
      crossDomainHint = '\n\n## 跨赛道借鉴\n借鉴以下其他赛道的爆款钩子结构，迁移到保险标题：\n' +
        options.crossDomainTypes.map(t => `- ${t}赛道 → "${CROSS_DOMAIN_HOOKS[t] || ''}"`).join('\n');
    }

    const prompt = `你是一个深谙小红书流量密码的保险赛道标题黑客。

用户关键词：${keywords.join(', ')}

## 当前风格：${style.emoji} ${style.name}
核心逻辑：${style.coreLogic}

## 示例标题（学习风格和结构，内容必须原创）
${style.exampleTitles.map((t, i) => `${i+1}. ${t}`).join('\n')}

## 可用模板（替换关键词即可）
${style.templates.map((t, i) => `${i+1}. ${t}`).join('\n')}
${crossDomainHint}
${viralExamples ? '\n' + viralExamples : ''}

## 铁律
1. 标题必须10-20字（自然分布，不要全是12字）
2. 必须像真人发的朋友圈，不像AI生成的广告
3. 禁止绝对化用语（最、第一、唯一）
4. 禁止收益承诺类词汇
5. 禁止医疗功效类词汇
6. 风格要多样化，不要全是同一句式
7. 必须覆盖至少3种精准人群标签
${styleType === 'G' ? `\n## 类型G专属规则
- 阴阳怪气靠句式结构出味道，不靠敏感词硬顶
- 安全热词：破防、蚌埠住了、真香、芭比Q、emo、栓Q、赢麻了（自嘲）、绝绝子、小丑竟是我自己、无语子
- 🔴禁用：智商税、割韭菜（高频限流词）
- 🟡慎用：大冤种、离谱、摆烂/躺平、背刺` : ''}
${styleType === 'H' ? `\n## 类型H专属规则
- 标题必须有"起因→转折→悬念"的剧情走向
- 不是纯吐槽/抱怨，而是有剧情推进感
- 读者看到标题就像看到短剧的钩子，忍不住点进去追后续
- 禁止2023老套句式："那一刻我才明白""一纸拒赔书我崩溃了"` : ''}

生成8个标题，每个标题标注字数。

【重要】请直接输出纯JSON，不要用markdown代码块包裹：
{"titles":[{"title":"标题1[12字]","type":"${style.name}","score":8,"explanation":"为什么好","hashtags":["标签"],"selfCriticism":"批评","targetAudience":"精准人群","styleType":"${styleType}"}]}`;

    try {
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4096,
      });
      const responseText = response.choices[0]?.message?.content || '';
      const result = parseAIResponse(responseText);
      result.titles = result.titles.map(t => ({ ...t, styleType }));
      allTitles.push(...result.titles);
    } catch (error: any) {
      console.error(`生成${style.name}风格标题失败:`, error?.message || error);
    }
  }

  if (allTitles.length === 0) {
    throw new Error('AI 服务调用失败，未能生成任何标题');
  }
  return { titles: allTitles.slice(0, count) };
}

export async function generateCrossDomainTitles(
  keywords: string[],
  crossDomainType: string
): Promise<z.infer<typeof TitleOutputSchema>> {
  const hook = CROSS_DOMAIN_HOOKS[crossDomainType] || '';
  const keywordStr = keywords.join(', ');
  const viralExamples = await fetchViralTitleExamples(keywords);

  const prompt = `你是一个深谙小红书流量密码的保险赛道标题黑客。
用户关键词：${keywordStr}
跨赛道借鉴模式：借鉴${crossDomainType}赛道的爆款钩子 "${hook}"，融入保险内容。
${viralExamples ? '\n' + viralExamples : ''}
铁律：标题10-20字，借鉴结构/情绪不是照搬，必须和保险相关。
生成6个标题。
【重要】请直接输出纯JSON：{"titles":[{"title":"","type":"跨赛道-${crossDomainType}","score":8,"explanation":"","hashtags":[],"selfCriticism":"","targetAudience":"","styleType":"CROSS_DOMAIN"}]}`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }],
    temperature: 0.8, max_tokens: 2048,
  });
  const responseText = response.choices[0]?.message?.content || '';
  return parseAIResponse(responseText);
}

export async function generateTitles(keywords: string[], context?: string): Promise<z.infer<typeof TitleOutputSchema>> {
  let background = '';
  if (context) {
    background = '\n当前背景：' + context + '\n';
  }
  const viralExamples = await fetchViralTitleExamples(keywords);

  const prompt = `你是一个深谙小红书流量密码的保险赛道标题黑客。你深知小红书用户的心理：她们不吃恐吓那套，反而对"大佬思路""行业大实话""反套路"这种走心唠嗑风毫无抵抗力。

用户输入的关键词：` + keywords.join(', ') + background + viralExamples + `

## 铁律
1. 标题必须≤20个字（小红书硬性限制）
2. 必须像真人发的朋友圈，不像AI生成的广告
3. 禁止恐吓式标题（"千万别买""后悔死了"已过时）

## 12种爆款风格（每种至少生成1个，共12-15个标题）

### 风格1：大佬思路通透风（最高点击率）
用"大佬""聪明人""内行"制造降维打击感

### 风格2：行业大实话风（最高信任感）
用"不卖了""退出行业""从业多年"制造内部人爆料感

### 风格3：反套路吐槽风（最高互动率）
直接点破行业套路，让用户觉得"终于有人说真话了"

### 风格4：走心共情风（最高收藏率）
站在普通人立场说话，消除焦虑

### 风格5：悬念好奇风（最高点击率）
制造信息差缺口，不点不舒服

### 风格6：灵魂拷问式（戳中隐性焦虑）
用直击灵魂的问题戳中用户最担心的点

### 风格7：极端场景代入式（制造紧迫感）
把用户带入一个极端但真实可能发生的场景

### 风格8：一句话反常识式（颠覆认知）
直接说一句和大众认知完全相反的话

### 风格9：精准人群劝退式（命中目标用户）
直接点名某一类人群，告诉他们什么不能买

### 风格10：数字暴击式（具体数字冲击）
用具体、有冲击力的数字对比，突出信息差

### 风格11：亲身踩坑故事式（共情力拉满）
用一个简短的、有结果的亲身故事开头

### 风格12：紧急预警式（紧迫感）
用"注意""警惕""马上"等词，营造紧急氛围

## 12种精准身份选题方向（至少3个标题要精准命中目标人群）
宝妈、打工人、房贷族、独生子女、刚毕业、理赔过的人、退保过的人、医生/护士、律师、自由职业者、单亲妈妈/爸爸、丁克/单身贵族

## 评分标准
- 9-10分：能和真实爆款掰手腕
- 7-8分：有强烈点击欲，像真人说的
- 5-6分：中规中矩，没有记忆点
- 3-4分：像AI生成的，或像广告
- 1-2分：说明书式，完全不想点

## 禁止清单
- 禁止"今天分享""一起来了解""给大家介绍"式开头
- 禁止纯"科普""攻略""指南"等说明书式用词
- 禁止过度恐吓（"千万别""后悔死了"已审美疲劳）
- 禁止像产品广告
- 禁止超过20字

【重要】请直接输出纯JSON，不要用markdown代码块包裹：
{"titles":[{"title":"标题1","type":"大佬思路风","score":9,"explanation":"说明","hashtags":["标签1"],"selfCriticism":"自我批评","targetAudience":"打工人"}]}`;

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
    throw new Error('AI 服务调用失败: ' + (error?.message || '未知错误'));
  }

  const responseText = response.choices[0]?.message?.content || '';
  return parseAIResponse(responseText);
}

// ==================== 案例分析 ====================

const CaseAnalysisSchema = z.object({
  viralScore: z.number().min(0).max(100),
  viralFactors: z.array(z.string()),
  contentStructure: z.object({
    opening: z.string(),
    body: z.string(),
    ending: z.string()
  }),
  topicAngle: z.string(),
  hooks: z.array(z.string()),
  styleFeatures: z.string(),
  reusableFormula: z.string(),
  suggestions: z.array(z.string())
});

export async function analyzeViralCase(
  title: string,
  content: string,
  metrics: { likes: number; favorites: number; comments: number }
): Promise<z.infer<typeof CaseAnalysisSchema>> {
  const prompt = `你是一个深谙小红书流量密码的保险赛道内容分析师。请对以下爆款笔记进行深度结构化分析。

标题：${title}
内容：${content}
互动数据：👍${metrics.likes} ⭐${metrics.favorites} 💬${metrics.comments}

【重要】请直接输出纯JSON，不要用markdown代码块包裹：
{"viralScore":85,"viralFactors":["因子1"],"contentStructure":{"opening":"开头","body":"正文","ending":"结尾"},"topicAngle":"角度","hooks":["钩子1"],"styleFeatures":"风格","reusableFormula":"公式","suggestions":["建议1"]}`;

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
    return CaseAnalysisSchema.parse(JSON.parse(cleanText));
  } catch (e: any) {
    console.error('案例分析解析失败:', e.message);
    throw new Error('AI 返回格式错误');
  }
}

// ==================== 情报摘要 ====================

export async function summarizeIntelligence(title: string, content?: string): Promise<string> {
  const prompt = `请为以下保险情报生成简洁的中文摘要（100字以内）：

标题：${title}
${content ? '内容：' + content.substring(0, 1000) : ''}

摘要要求：提取核心信息，突出关键数据或变化，100字以内`;

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

export { TitleOutputSchema, TitleArraySchema };
