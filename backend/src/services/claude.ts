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
    type: z.string(), // 放宽类型验证
    score: z.number().min(1).max(10),
    explanation: z.string(),
    hashtags: z.array(z.string()),
    selfCriticism: z.string()
  }))
});

// 宽松的数组格式（直接返回标题数组）
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

  const prompt = '你是一个深谙小红书流量密码的保险赛道标题黑客。你的标题必须让人在信息流中停下拇指，不点进来就睡不着觉。\n\n用户输入的关键词：' + keywords.join(', ') + background + '\n请根据以下原则生成 12 个爆款标题：\n\n## 强制三要素（缺一不可）\n1. 具体数字：必须包含至少一个具体数字（金额、年龄、百分比、人数等）\n2. 痛点/恐惧/利益：必须触及用户的恐惧、焦虑或贪念\n3. 反常识/情绪钩子：必须有让人"咦？"的反转或强烈的情绪触发词\n\n## 6种强制覆盖套路（每种至少生成2个）\n1. 避坑恐吓类：用恐惧驱动点击，如"XX前不看必亏X万"、"买错XX=白扔X万"\n2. 对比反差类：制造认知冲突，如"月薪3K和3W买保险，差距不是钱是命"\n3. 逆袭翻盘类：从失败到成功，如"被拒赔3次后靠这招拿50万"\n4. 权威背书类：借权威增强可信度，如"保险精算师自己的3个秘密"\n5. 数字冲击类：用震撼数字冲击，如"年缴XXX撬动XX万，这笔账必须算"\n6. 情绪共鸣类：戳中焦虑/后悔/庆幸，如"后悔没早买！30岁查出XX还好有它"\n\n## 禁止清单\n- 禁止"今天分享"、"一起来了解"、"给大家介绍"式开头\n- 禁止纯"科普"、"攻略"、"指南"等说明书式用词（除非搭配情绪钩子）\n- 禁止没有情绪张力的陈述句\n- 禁止标题像产品说明书\n- 禁止标题党但内容不符\n\n## 严格打分标准（1-10分）\n- 9-10分：信息流杀手，看到就忍不住点，情绪极强\n- 7-8分：有强烈吸引力，但情绪冲击还不够极致\n- 5-6分：有亮点但平庸，放到信息流里大概率被划过\n- 3-4分：无聊、像说明书、没有点击欲望\n- 1-2分：完全不想点\n\n⚠️ 自我批判规则：生成后必须诚实自评。如果一个标题放到小红书信息流中你会划过，那它最多5分。大部分标题应在5-7分，8分以上极难获得。不要为了讨好用户而给高分。\n\n每个标题需要包含：\n- 标题内容（15-25字，简洁有力）\n- 类型（避坑恐吓类/对比反差类/逆袭翻盘类/权威背书类/数字冲击类/情绪共鸣类）\n- 爆款概率评分（1-10分，严格自评）\n- 适用场景说明\n- 推荐的小红书标签（3-5个）\n- 自我批评（这个标题可能不够好的地方）\n\n请只输出 JSON，不要任何解释文字。格式如下：\n' + tripleBacktick + 'json\n{\n  "titles": [\n    {"title": "标题1", "type": "避坑恐吓类", "score": 6, "explanation": "说明", "hashtags": ["标签1"], "selfCriticism": "自我批评"}\n  ]\n}\n' + tripleBacktick;

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

  // 清理 JSON（移除 markdown 代码块）
  let cleanText = responseText.trim();
  if (cleanText.startsWith(tripleBacktick)) {
    cleanText = cleanText.replace(tripleBacktick + 'json', '').replace(tripleBacktick, '').trim();
  }

  // 尝试多种方式提取 JSON
  let jsonStr = cleanText;

  // 方法1：直接解析
  try {
    const parsed = JSON.parse(jsonStr);
    return TitleOutputSchema.parse(parsed);
  } catch (e1: any) {
    console.error('方法1解析失败:', e1.message);
  }

  // 方法2：提取 {...} 部分
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

  // 方法3：尝试解析为纯数组格式 [...]
  try {
    const parsed = JSON.parse(cleanText);
    if (Array.isArray(parsed)) {
      return { titles: TitleArraySchema.parse(parsed) };
    }
  } catch (e3: any) {
    console.error('方法3解析失败:', e3.message);
  }

  console.error('AI 返回内容:', responseText);
  console.error('清理后:', jsonStr);
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
  const prompt = '请分析以下小红书爆款笔记的爆款原因：\n\n标题：' + title + '\n内容：' + content + '\n数据表现：点赞 ' + metrics.likes + ' | 收藏 ' + metrics.favorites + ' | 评论 ' + metrics.comments + '\n\n请以 JSON 格式输出，必须包含以下字段：\n{\n  "viralFactors": ["因素1", "因素2", "因素3"],\n  "contentStructure": {"opening": "开头分析", "middle": "中间分析", "ending": "结尾分析"},\n  "topicAngle": "选题角度解读",\n  "reusableFormula": "可复用的写作公式",\n  "suggestions": ["建议1", "建议2", "建议3"]\n}';

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2048,  // 增加 token 数量
  });

  const responseText = response.choices[0]?.message?.content || '';
  console.log('DeepSeek 返回:', responseText);

  // 提取 JSON
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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
  const prompt = '请帮我将以下内容提炼成一段简洁的摘要（100字以内），保留核心信息：\n\n标题：' + title + '\n内容：' + content + '\n\n摘要要求：\n- 提取关键信息\n- 语言简洁易懂\n- 突出对保险内容创作者的价值';

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
  targetTopic?: string;  // 跨领域仿写时的目标保险选题
  // 仿写分析
  originalAnalysis: {
    topic: string;          // 选题方向
    coreIdea: string;       // 核心思路
    structure: string;      // 内容结构
    styleFeatures: string;  // 风格特点
    hooks: string[];        // 吸睛钩子
  };
  // 仿写成品
  rewrittenContent: {
    title: string;
    content: string;
    hashtags: string[];
    callToAction: string;
  };
  // 创作说明
  writingNotes: string;
}

// ========== 爆款样本精华模式（从真实爆款笔记提炼）==========

// 【标题公式库】
const TITLE_FORMULAS = `
## 爆款标题公式（从真实爆款提炼）
1. 【反常识冲击型】"穷人买保险=买条命"
2. 【身份反转型】"不卖保险了，就想说点没人敢说的"
3. 【权威揭秘型】"卖了几年保险，我想说点小红书上搜不到的"
4. 【悬念揭秘型】"第一批买XX的人已经发现不对劲了"
5. 【大胆宣言型】"我有一个大胆的想法：教会所有普通人买保险"
6. 【对比反差型】"几百块能搞定的保障，有人花几千却赔不到钱"
7. 【数字冲击型】"2000个家庭、8年保险经验总结"

标题必须包含以下至少2个要素：
- 具体数字（金额/年龄/人数/比例）
- 反常识/情绪冲击词（穷人不配/打水漂/没人敢说的）
- 身份标签（穷人/打工人/宝妈/保险内部人）
- 悬念词（不对劲/大胆/发现）
`;

// 【钩子公式库】
const HOOK_FORMULAS = `
## 爆款钩子公式（随机使用）
1. 【情绪冲击钩】"买保险=买条命"、"买对了能救命，买错了打水漂"
2. 【身份代入钩】"和我一样的普通打工人"、"穷人视角"、"宝妈必看"
3. 【避坑恐吓钩】"合同没写就是耍流氓"、"承诺续保≠保证续保"
4. 【悬念揭秘钩】"不对劲了"、"有人发现问题了"、"今天说点不一样的"
5. 【权威背书钩】"保险精算师才知道的"、"干过理赔的人告诉你"
6. 【人群精准钩】"第一批买宝宝保险的人"、"30岁打工人"、
`;

// 【结构模板库】
const STRUCTURE_TEMPLATES = `
## 内容结构模板（随机选择一种）

### 模板1：先破后立式（💢痛点→👉避坑）
- 开头：痛点共鸣/身份代入
- 主体：💢坑点1+案例+👉避坑技巧 → 💢坑点2+案例+👉避坑技巧
- 结尾：总结+互动引导
- 符号：💢=痛点标注，👉=解决方案标注

### 模板2：递进推荐式（便宜→贵）
- 先买最便宜的：职工医保/惠民保
- 再买百万医疗：两三百撬动几百万
- 再加意外险：一百多保大小意外
- 再加定期寿险：给家人的责任
- 最后重疾险：量力而行
- 结尾：量力而为，别超越经济负担能力

### 模板3：人群细分式（精准匹配）
- 普通打工人买什么？（3件套）
- 给父母买什么？（按身体状况分）
- 给孩子买什么？（3件套+早买杠杆高）
- 体检异常买什么？（带病投保攻略）
- 每类人群给明确方案，简洁好抄

### 模板4：干货条目式（信息密度高）
- 开头：身份背书+立场声明
- 主体：1-14条干货，每条带具体数字/案例
- 结尾：互动引导+人设强化
- 特点：信息密度极高，像内部攻略

### 模板5：案例故事式（真实代入）
- 开头：客户真实案例（张姐乳腺癌获赔50万）
- 中间：从案例引出建议
- 结尾：升华主题+行动号召
- 特点：故事感强，情感共鸣深
`;

// 【语气风格库】
const TONE_STYLES = `
## 语气风格（随机选择一种，每次仿写换一种避免审美疲劳）

### 风格1：犀利吐槽型 😤
- 像朋友骂你"别买这破玩意"
- 用词："智商税"、"坑死人"、"白扔钱"、"骗人的"
- 情绪强烈，敢说敢骂，建立"说真话"人设
- 适合：揭露坑点、劝退误导产品

### 风格2：温柔科普型 😊
- 像姐姐教你"咱这样选就行"
- 用词："咱家"、"咱们"、"不着急"、"慢慢来"
- 温和耐心，像朋友分享经验
- 适合：基础科普、方案推荐

### 风格3：权威拆解型 🤓
- 像内部人揭秘"我知道他们怎么设计的"
- 用词："精算师设计"、"合同条款"、"保司利润"
- 专业可信，用专业术语增强权威
- 适合：产品分析、条款解读

### 风格4：穷人共情型 🤝
- 像同路人分享"我也是普通人，这样买的"
- 用词："几千块月薪"、"农民父母"、"普通打工人"
- 代入感强，精准击中目标人群
- 适合：收入不高的人群、预算有限攻略
`;

// 【风格指南】
const STYLE_GUIDES = {
  xhs: `【小红书风格要求】
- 标题：带emoji，20字以内，制造悬念或情绪冲击，使用数字/对比/疑问
- 开头：前3行必须留悬念或情绪钩子（折叠前可见，决定要不要点进来）
- 正文：分点排列，每点带emoji，口语化、亲切感强
- 结尾：互动引导（"你怎么看？""评论区聊聊"）+ 行动号召
- 标签：5-10个保险相关话题标签
- 字数：500-800字
- 语气：像朋友分享，有温度，不像广告
- 视觉节奏：用💢👉✅等符号引导阅读`,
  wechat: `【微信公众号风格要求】
- 标题：20字以内，权威感+情感共鸣，可带副标题
- 开头：故事/数据/提问 三选一，引发读者代入感
- 正文：有深度分析，小标题分段，逻辑严密，有数据支撑
- 结尾：总结+升华主题+引导关注/转发
- 字数：1000-1500字
- 语气：专业但不生硬，有温度，适合转发朋友圈`
};

// 【few-shot样本】（精选片段，不超过500字）
const FEWSHOT_SAMPLES = `
## 爆款样本参考（从真实爆款提炼）

【样本1 - 干货条目式开头】
"有些宝宝保险，真的不配让你花钱！我给2000多个家庭做过规划，见过了太多。8年保险经验也让我明白：良心比赚钱重要，真话比业绩重要。"

【样本2 - 递进式结构】
"第一，先去参加职工医保或城乡居民医保...第二，购买当地政府与保险公司合作的惠民保...第三，百万医疗险..."

【样本3 - 先破后立结构】
"💢坑点1：承诺续保不靠谱，生病后赔不了
被销售忽悠'能续保到成年'，结果娃生病了，不能续保
👉避坑技巧：合同没写【保证续保20年】的全是耍流氓！"

【样本4 - 结尾互动引导】
"💁保险鱼龙混杂，大家一定要擦亮眼睛，做好功课，再来买。如果你还是不太清楚的话，就抄作业！不管是宝宝保险、自己的保险，还是爸妈的保险，都可以问我，主打一个有问必答"

【样本5 - 金句技巧】
"只选对的，不选贵的"、"合同没写就是耍流氓"、"买对了能救命，买错了就是花钱打水漂"
`;

export async function rewriteContent(
  originalTitle: string,
  originalContent: string,
  style: 'xhs' | 'wechat',
  sourceUrl?: string,
  targetTopic?: string  // 跨领域仿写：目标保险选题
): Promise<RewriteResult> {
  const styleGuide = STYLE_GUIDES[style];
  
  // 跨领域仿写说明
  let crossDomainInstruction = '';
  if (targetTopic && targetTopic.trim()) {
    crossDomainInstruction = `
## 【跨领域仿写任务】
原文不是保险内容，但你可以借鉴其爆款结构/钩子/节奏，创作保险内容。
目标选题方向：${targetTopic}

核心要求：
1. 提取原文的"爆款骨架"：选题逻辑、情绪节奏、钩子位置、叙事结构
2. 将骨架"翻译"到保险领域：换赛道不换套路
3. 保持原文带来的阅读冲击感/好奇心/情绪共鸣
4. 保险内容要专业准确，不能误导读者

举例：原文如果是美食教程的结构（"5个踩坑+正确做法"），保险版可以是"买保险5个坑+正确选择"；
原文如果是情感文的钩子（"我发现了一个可怕的事实"），保险版可以是"我发现了买保险的致命误区"。
`;
  }

  const prompt = `你是保险内容创作专家，请对以下原文进行仿写分析和创作。

【原文信息】
标题：${originalTitle}
${sourceUrl ? '来源：' + sourceUrl + '\n' : ''}内容：
${originalContent.substring(0, 3000)}
${crossDomainInstruction}

${TITLE_FORMULAS}
${HOOK_FORMULAS}
${STRUCTURE_TEMPLATES}
${TONE_STYLES}
${FEWSHOT_SAMPLES}

${styleGuide}

【任务】
1. 先深度解析原文的选题、思路、结构、风格、钩子
2. 基于分析，用上述风格要求重新创作一篇保险内容（同类选题但内容全新）
3. 随机选择一种结构模板和语气风格（不要每次都用同一种）
4. 仿写要"学其神不抄其形"——借鉴选题思路和爆款结构，内容完全原创
5. 跨领域仿写时：提取原文的爆款套路，移植到保险领域

请严格按照以下 JSON 格式输出：
${tripleBacktick}json
{
  "originalAnalysis": {
    "topic": "原文选题方向（20字以内）",
    "coreIdea": "核心思路（50字以内）",
    "structure": "内容结构分析（80字以内）",
    "styleFeatures": "风格特点（50字以内）",
    "hooks": ["钩子1", "钩子2", "钩子3"]
  },
  "rewrittenContent": {
    "title": "仿写标题",
    "content": "仿写正文（换行用\\n）",
    "hashtags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
    "callToAction": "结尾互动引导语"
  },
  "writingNotes": "创作说明：本文如何借鉴原文精华并创新（100字以内）"
}
${tripleBacktick}`;

  let response;
  try {
    response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,  // 从0.85提高到0.9，增加多样性
      max_tokens: 3500,  // 增加输出token
    });
  } catch (error: any) {
    throw new Error('AI 服务调用失败: ' + (error?.message || '未知错误'));
  }

  const responseText = response.choices[0]?.message?.content || '';

  // 提取 JSON
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
