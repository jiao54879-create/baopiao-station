// DeepSeek AI 服务封装（替代 Claude）
import OpenAI from 'openai';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

const TitleOutputSchema = z.object({
  titles: z.array(z.object({
    title: z.string(),
    type: z.string(),
    score: z.number().min(1).max(10),
    explanation: z.string(),
    hashtags: z.array(z.string()),
    selfCriticism: z.string()
  }))
});

const TitleArraySchema = z.array(z.object({
  title: z.string(),
  type: z.string(),
  score: z.number().min(1).max(10),
  explanation: z.string(),
  hashtags: z.array(z.string()),
  selfCriticism: z.string()
}));

const tripleBacktick = '\x60\x60\x60';

/**
 * 从数据库拉取小红书高分爆款标题，作为 Prompt 参考样本
 * 优先取 XHS 平台，点赞 50+ 最近 15 天，最多 8 条
 */
async function fetchViralTitleExamples(keywords: string[]): Promise<string> {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // 先尝试取最近 15 天 XHS 点赞 50+ 数据
    let cases = await prisma.viralCase.findMany({
      where: {
        platform: 'XHS',
        likesCount: { gte: 50 },
        publishedAt: { gte: fifteenDaysAgo },
        // 排除示例数据
        url: { not: { contains: 'example' } }
      },
      orderBy: { viralScore: 'desc' },
      take: 8,
      select: { title: true, likesCount: true, favoritesCount: true }
    });

    // 如果近 15 天数据不足，放宽到 60 天
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

    return `\n## 🔥 真实爆款参考（数据库中过去15天点赞50+的小红书笔记标题）\n以下是本账号数据库中已验证有流量的真实爆款标题，请仔细学习它们的措辞方式、情绪触点和结构规律，仿照这些风格生成新标题，但内容必须完全原创：\n${exampleList}\n\n【分析维度】：学习上述标题的①关键词选择 ②数字使用 ③情绪触发词 ④结构模式，将这些元素融入新标题。\n`;
  } catch (e) {
    console.log('拉取爆款标题参考失败（忽略）:', e);
    return '';
  }
}

export async function generateTitles(keywords: string[], context?: string): Promise<z.infer<typeof TitleOutputSchema>> {
  let background = '';
  if (context) {
    background = '\n当前背景：' + context + '\n';
  }

  // 动态注入真实爆款参考标题
  const viralExamples = await fetchViralTitleExamples(keywords);

  const prompt = '你是一个深谙小红书流量密码的保险赛道标题黑客。你深知小红书用户的心理：她们不吃恐吓那套，反而对"大佬思路""行业大实话""反套路"这种走心唠嗑风毫无抵抗力。\n\n用户输入的关键词：' + keywords.join(', ') + background + viralExamples + '\n\n## 铁律\n1. 标题必须≤20个字（小红书硬性限制）\n2. 必须像真人发的朋友圈，不像AI生成的广告\n3. 禁止恐吓式标题（"千万别买""后悔死了"已过时）\n\n## 5种爆款风格（每种至少生成1-2个）\n\n### 1. 大佬思路通透风（最高点击率）\n用"大佬""聪明人""内行"制造降维打击感，让用户觉得"我要学他们"\n模板句式：\n- 大佬买XX的思路，真的太通透了\n- 聪明人XX，从来不乱跟风\n- 真正懂XX的人，都在悄悄这样买\n- 看懂大佬XX逻辑，少花几万冤枉钱\n\n### 2. 行业大实话风（最高信任感）\n用"不卖了""退出行业""从业多年"制造内部人爆料感\n模板句式：\n- 不卖XX了，掏句良心大实话\n- 做XX多年，有些真话不敢公开说\n- 退出XX行业，说点没人敢讲的真话\n- 从业多年，揭开XX不为人知内幕\n\n### 3. 反套路吐槽风（最高互动率）\n直接点破行业套路，让用户觉得"终于有人说真话了"\n模板句式：\n- 别再瞎买XX，全是隐形大坑\n- XX里的信息差，被我扒得明明白白\n- 买XX别听业务员画大饼了\n- XX水太深，小白千万别盲目入手\n\n### 4. 走心共情风（最高收藏率）\n站在普通人立场说话，消除焦虑\n模板句式：\n- 普通家庭XX，真的不用买太贵\n- 给家人XX，记住这几点就够了\n- XX避坑，普通人看完少走弯路\n- 越精简越靠谱\n\n### 5. 悬念好奇风（最高点击率）\n制造信息差缺口，不点不舒服\n模板句式：\n- 为什么聪明人，从不乱买XX\n- XX最大信息差，90%人都不知道\n- XX的谎言，终于被拆穿了\n- 我悟了，XX根本不用纠结\n\n## 评分标准（与真实爆款对标）\n- 9-10分：能和"我发现大佬买保险思路好清晰"级别的真实爆款掰手腕\n- 7-8分：有强烈点击欲，像真人说的\n- 5-6分：中规中矩，没有记忆点\n- 3-4分：像AI生成的，或像广告\n- 1-2分：说明书式，完全不想点\n\n评分重点：新颖度>情绪张力>信息量。一个没数字但走心的标题（如"大佬买保险的思路好通透"）远比一个堆数字但像广告的标题（如"3种保险坑让你亏8万"）更有爆款潜力。\n\n## 禁止清单\n- 禁止"今天分享""一起来了解""给大家介绍"式开头\n- 禁止纯"科普""攻略""指南"等说明书式用词\n- 禁止过度恐吓（"千万别""后悔死了"已审美疲劳）\n- 禁止像产品广告\n- 禁止超过20字\n\n⚠️ 自我批判：生成后诚实自评，参照真实爆款衡量。\n\n【重要】请直接输出纯JSON，不要用markdown代码块包裹，不要加```json或```：\n{\n  "titles": [\n    {"title": "标题1", "type": "大佬思路风", "score": 9, "explanation": "说明", "hashtags": ["标签1"], "selfCriticism": "自我批评"}\n  ]\n}';

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
  // 去掉markdown代码块包裹
  let cleanText = responseText.trim();
  // 处理 ```json 或 ``` 开头
  while (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').trim();
  }
  // 处理结尾的 ```
  while (cleanText.endsWith('```')) {
    cleanText = cleanText.replace(/\n?```$/, '').trim();
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

  // 方法4：用正则从混乱文本中逐个提取标题对象（即使JSON被截断/重叠也能工作）
  try {
    const titleRegex = /"title"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"([^"]+)"\s*,\s*"score"\s*:\s*(\d+)\s*,\s*"explanation"\s*:\s*"(.+?)"\s*,\s*"hashtags"\s*:\s*\[([^\]]*)\]\s*,\s*"selfCriticism"\s*:\s*"(.+?)"\s*\}/g;
    const extractedTitles: Array<{title: string; type: string; score: number; explanation: string; hashtags: string[]; selfCriticism: string}> = [];
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

  console.error('AI 返回内容:', responseText);
  throw new Error('AI 返回格式错误，返回内容: ' + responseText.substring(0, 500));
}

const CaseAnalysisSchema = z.object({
  viralFactors: z.array(z.string()),
  contentStructure: z.object({
    opening: z.string(),
    middle: z.string(),
    ending: z.string()
  }),
  topicAngle: z.string(),
  reusableFormula: z.string(),
  suggestions: z.array(z.string())
});

export async function analyzeViralCase(
  title: string,
  content: string,
  metrics: { likes: number; favorites: number; comments: number }
): Promise<z.infer<typeof CaseAnalysisSchema>> {
  const prompt = `你是一个深谙小红书流量密码的保险赛道内容分析师。请分析以下爆款笔记的爆款原因。

标题：${title}
内容：${content}
数据表现：点赞 ${metrics.likes} | 收藏 ${metrics.favorites} | 评论 ${metrics.comments}

请严格按照以下JSON格式输出分析结果（不要输出其他内容）：
{
  "viralFactors": ["爆款因素1", "爆款因素2", "爆款因素3"],
  "contentStructure": {
    "opening": "开头部分分析：如何抓住注意力",
    "middle": "中间部分分析：如何维持阅读兴趣",
    "ending": "结尾部分分析：如何引导互动"
  },
  "topicAngle": "选题角度分析：为什么这个选题能火",
  "reusableFormula": "可复制的爆款公式：提炼出可以套用的内容模板",
  "suggestions": ["改进建议1", "改进建议2", "改进建议3"]
}`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2048,
  });

  const responseText = response.choices[0]?.message?.content || '';
  let cleanText = responseText.trim();
  // 去掉markdown代码块包裹
  while (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').trim();
  }
  while (cleanText.endsWith('```')) {
    cleanText = cleanText.replace(/\n?```$/, '').trim();
  }
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 返回格式错误，无法解析 JSON');
  }
  const parsed = JSON.parse(jsonMatch[0]);
  return CaseAnalysisSchema.parse(parsed);
}

export async function summarizeIntelligence(
  title: string,
  content: string
): Promise<string> {
  const prompt = '请帮我将以下内容提炼成一段简洁的摘要（100字以内），保留核心信息：\n\n标题：' + title + '\n内容：' + content;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 256,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

// ========== 一键仿写 ==========

export interface RewriteResult {
  style: 'xhs' | 'wechat';
  targetTopic?: string;
  originalAnalysis: {
    topic: string;
    coreIdea: string;
    structure: string;
    styleFeatures: string;
    hooks: string[];
    detectedStructureType: string;   // 识别出的结构类型
    detectedToneType: string;        // 识别出的语气类型
  };
  rewrittenContent: {
    title: string;
    content: string;
    hashtags: string[];
    callToAction: string;
  };
  writingNotes: string;
}

export async function rewriteContent(
  originalTitle: string,
  originalContent: string,
  style: 'xhs' | 'wechat',
  sourceUrl?: string,
  targetTopic?: string
): Promise<RewriteResult> {
  const styleGuide = style === 'xhs'
    ? `【小红书风格要求】
- 标题：带emoji，20字以内，制造悬念或情绪冲击
- 开头：前3行必须留悬念或情绪钩子（折叠前可见）
- 正文：分点排列，每点带emoji，口语化、亲切感强
- 结尾：互动引导 + 行动号召
- 标签：5-10个保险相关话题标签
- 字数：500-800字
- 视觉节奏：用💢👉✅等符号引导阅读`
    : `【微信公众号风格要求】
- 标题：20字以内，权威感+情感共鸣
- 开头：故事/数据/提问 三选一
- 正文：有深度分析，小标题分段，逻辑严密
- 结尾：总结+升华主题+引导关注
- 字数：1000-1500字`;

  // 跨领域仿写说明
  let crossDomainInstruction = '';
  if (targetTopic && targetTopic.trim()) {
    crossDomainInstruction = `

## 【跨领域仿写模式】
原文不是保险内容，你需要提取其"爆款骨架"（选题逻辑、情绪节奏、钩子位置、叙事结构），移植到保险领域。
目标选题方向：${targetTopic}
举例：原文如果是美食教程"5个踩坑+正确做法"，保险版就是"买保险5个坑+正确选择"。
`;
  }

  const prompt = `你是保险赛道爆款内容创作专家。你的核心能力是"灵魂仿写"——学其神不抄其形。

【原文信息】
标题：${originalTitle}
${sourceUrl ? '来源：' + sourceUrl + '\n' : ''}内容：
${originalContent.substring(0, 3000)}
${crossDomainInstruction}

${styleGuide}

## ⚠️ 最关键的原则：沿用原文的结构和风格类型

你必须先识别原文属于哪种结构和语气，然后**沿用同类型**来仿写。如果原文是"递进推荐式"，你就用递进推荐式；如果原文是"先破后立式"，你就用先破后立式。绝不能原文给思路推荐，你却写出避坑拆解。

### 结构类型对照表（先识别，再沿用）
1. **先破后立式**：💢坑点→👉避坑技巧→✅正确选择。原文如果是在"揭露坑/误区/套路"，属于此类。
2. **递进推荐式**：从便宜到贵、从基础到进阶、按优先级排列。原文如果是"第一买XX、第二买XX"，属于此类。
3. **人群细分式**：按不同人群（打工人/父母/孩子/带病体）分别给方案。原文如果是"XX人群买什么"，属于此类。
4. **干货条目式**：1-N条干货清单，信息密度极高。原文如果是"说几条最重要的/几个真相"，属于此类。
5. **案例故事式**：用客户真实案例开头，从案例引出建议。原文如果有具体人名+金额+结局，属于此类。

### 语气类型对照表（先识别，再沿用）
1. **犀利吐槽型** 😤：敢说敢骂，"智商税""坑死人"。原文如果有强烈情绪批判，属于此类。
2. **温柔科普型** 😊：像姐姐教你，"咱家""咱们""慢慢来"。原文如果温和耐心、像朋友分享，属于此类。
3. **权威拆解型** 🤓：内部人视角，"精算师设计""合同条款"。原文如果用专业术语+内部视角，属于此类。
4. **穷人共情型** 🤝：同路人视角，"几千块月薪""农民父母"。原文如果有强烈身份代入，属于此类。

## 爆款标题公式（从中选择最贴合原文风格的）
1. 反常识冲击型："穷人买保险=买条命"
2. 身份反转型："不卖保险了，就想说点没人敢说的"
3. 权威揭秘型："卖了几年保险，我想说点小红书上搜不到的"
4. 悬念揭秘型："第一批买XX的人已经发现不对劲了"
5. 大胆宣言型："我有一个大胆的想法：教会所有普通人买保险"
6. 对比反差型："几百块能搞定的保障，有人花几千却赔不到钱"

标题必须包含以下至少2个要素：具体数字、反常识/情绪冲击词、身份标签、悬念词。

## 爆款钩子公式（根据原文风格选择对应的）
1. 情绪冲击钩："买保险=买条命"、"买对了能救命，买错了打水漂"
2. 身份代入钩："和我一样的普通打工人"、"穷人视角"、"宝妈必看"
3. 避坑恐吓钩："合同没写就是耍流氓"、"承诺续保≠保证续保"
4. 悬念揭秘钩："不对劲了"、"今天说点不一样的"
5. 权威背书钩："干过理赔的人告诉你"、"2000个家庭经验总结"

## 爆款样本参考（学习语气和节奏）
【样本1-干货条目式】"有些宝宝保险，真的不配让你花钱！我给2000多个家庭做过规划。8年经验让我明白：良心比赚钱重要，真话比业绩重要。"
【样本2-递进推荐式】"第一，先参加职工医保...第二，买惠民保...第三，百万医疗险..."
【样本3-先破后立式】"💢坑点1：承诺续保不靠谱 → 👉避坑技巧：合同没写【保证续保20年】的全是耍流氓！"
【样本4-金句】"只选对的，不选贵的"、"买对了能救命，买错了就是花钱打水漂"
【样本5-结尾互动】"如果你还是不太清楚，就抄作业！有问必答~"

## 任务（严格按顺序执行）

### 第一步：识别原文的结构类型和语气类型
仔细分析原文，判断它属于上述5种结构中的哪一种、4种语气中的哪一种。

### 第二步：沿用同类型创作
- 使用与原文**相同**的结构类型来组织仿写内容
- 使用与原文**相同**的语气类型来撰写
- 选题方向可以相同但内容必须完全原创
- 钩子和标题公式选择最贴合原文风格的

### 第三步：输出结果

请严格按照以下 JSON 格式输出：
${tripleBacktick}json
{
  "originalAnalysis": {
    "topic": "原文选题方向（20字以内）",
    "coreIdea": "核心思路（50字以内）",
    "structure": "内容结构分析（80字以内）",
    "styleFeatures": "风格特点（50字以内）",
    "hooks": ["钩子1", "钩子2", "钩子3"],
    "detectedStructureType": "识别出的结构类型（先破后立式/递进推荐式/人群细分式/干货条目式/案例故事式）",
    "detectedToneType": "识别出的语气类型（犀利吐槽型/温柔科普型/权威拆解型/穷人共情型）"
  },
  "rewrittenContent": {
    "title": "仿写标题",
    "content": "仿写正文（换行用\\n）",
    "hashtags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
    "callToAction": "结尾互动引导语"
  },
  "writingNotes": "创作说明：沿用原文的XX结构+XX语气，如何借鉴精华并创新（100字以内）"
}
${tripleBacktick}`;

  let response;
  try {
    response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 3500,
    });
  } catch (error: any) {
    throw new Error('AI 服务调用失败: ' + (error?.message || '未知错误'));
  }

  const responseText = response.choices[0]?.message?.content || '';

  let cleanText = responseText.trim();
  if (cleanText.startsWith(tripleBacktick)) {
    cleanText = cleanText.replace(tripleBacktick + 'json', '').replace(new RegExp(tripleBacktick, 'g'), '').trim();
  }

  const braceStart = cleanText.indexOf('{');
  const braceEnd = cleanText.lastIndexOf('}');
  if (braceStart === -1 || braceEnd === -1) {
    throw new Error('AI 返回格式错误');
  }
  const jsonStr = cleanText.substring(braceStart, braceEnd + 1);

  const parsed = JSON.parse(jsonStr);
  return {
    style,
    targetTopic: targetTopic || undefined,
    ...parsed
  } as RewriteResult;
}
