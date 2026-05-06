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

export async function rewriteContent(
  originalTitle: string,
  originalContent: string,
  style: 'xhs' | 'wechat',
  sourceUrl?: string
): Promise<RewriteResult> {
  const styleGuide = style === 'xhs'
    ? `【小红书风格要求】
- 标题：带emoji，20字以内，制造悬念或引发共鸣，使用数字/对比/疑问
- 开头：直接切入痛点或金句，前3行留悬念（折叠前可见）
- 正文：分点排列，每点带emoji，口语化、亲切感强
- 结尾：互动引导（"你怎么看？""评论区聊聊"）+ 行动号召
- 标签：5-10个保险相关话题标签
- 字数：500-800字
- 语气：像朋友分享，有温度，不像广告`
    : `【微信公众号风格要求】
- 标题：20字以内，权威感+情感共鸣，可带副标题
- 开头：故事/数据/提问 三选一，引发读者代入感
- 正文：有深度分析，小标题分段，逻辑严密，有数据支撑
- 结尾：总结+升华主题+引导关注/转发
- 字数：1000-1500字
- 语气：专业但不生硬，有温度，适合转发朋友圈`;

  const prompt = `你是保险内容创作专家，请对以下原文进行仿写分析和创作。

【原文信息】
标题：${originalTitle}
${sourceUrl ? '来源：' + sourceUrl + '\n' : ''}内容：
${originalContent.substring(0, 3000)}

${styleGuide}

【任务】
1. 先深度解析原文的选题、思路、结构、风格、钩子
2. 基于分析，用上述风格要求重新创作一篇保险内容（同类选题但内容全新）
3. 仿写要"学其神不抄其形"——借鉴选题思路和爆款结构，内容完全原创

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
      temperature: 0.85,
      max_tokens: 3000,
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
  return { style, ...parsed } as RewriteResult;
}
