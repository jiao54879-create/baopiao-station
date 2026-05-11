// DeepSeek AI 服务封装（替代 Claude）
import OpenAI from 'openai';
import { z } from 'zod';

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

export async function generateTitles(keywords: string[], context?: string): Promise<z.infer<typeof TitleOutputSchema>> {
  let background = '';
  if (context) {
    background = '\n当前背景：' + context + '\n';
  }

  const prompt = '你是一个深谙小红书流量密码的保险赛道标题黑客。你的标题必须让人在信息流中停下拇指，不点进来就睡不着觉。\n\n用户输入的关键词：' + keywords.join(', ') + background + '\n请根据以下原则生成 12 个爆款标题：\n\n## 强制三要素（缺一不可）\n1. 具体数字：必须包含至少一个具体数字（金额、年龄、百分比、人数等）\n2. 痛点/恐惧/利益：必须触及用户的恐惧、焦虑或贪念\n3. 反常识/情绪钩子：必须有让人"咦？"的反转或强烈的情绪触发词\n\n## 6种强制覆盖套路（每种至少生成2个）\n1. 避坑恐吓类：用恐惧驱动点击\n2. 对比反差类：制造认知冲突\n3. 逆袭翻盘类：从失败到成功\n4. 权威背书类：借权威增强可信度\n5. 数字冲击类：用震撼数字冲击\n6. 情绪共鸣类：戳中焦虑/后悔/庆幸\n\n## 禁止清单\n- 禁止"今天分享"、"一起来了解"、"给大家介绍"式开头\n- 禁止纯"科普"、"攻略"、"指南"等说明书式用词\n- 禁止没有情绪张力的陈述句\n- 禁止标题像产品说明书\n- 禁止标题党但内容不符\n\n## 严格打分标准（1-10分）\n- 9-10分：信息流杀手\n- 7-8分：有强烈吸引力\n- 5-6分：有亮点但平庸\n- 3-4分：无聊、像说明书\n- 1-2分：完全不想点\n\n⚠️ 自我批判规则：生成后必须诚实自评。\n\n请只输出 JSON：\n' + tripleBacktick + 'json\n{\n  "titles": [\n    {"title": "标题1", "type": "避坑恐吓类", "score": 6, "explanation": "说明", "hashtags": ["标签1"], "selfCriticism": "自我批评"}\n  ]\n}\n' + tripleBacktick;

  let response;
  try {
    response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1500,
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
