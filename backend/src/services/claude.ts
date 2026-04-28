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
    hashtags: z.array(z.string())
  }))
});

// 宽松的数组格式（直接返回标题数组）
const TitleArraySchema = z.array(z.object({
  title: z.string(),
  type: z.string(),
  score: z.number().min(1).max(10),
  explanation: z.string(),
  hashtags: z.array(z.string())
}));

const tripleBacktick = '\x60\x60\x60';

export async function generateTitles(keywords: string[], context?: string): Promise<z.infer<typeof TitleOutputSchema>> {
  let background = '';
  if (context) {
    background = '\n当前背景：' + context + '\n';
  }

  const prompt = '你是一个专注于小红书保险内容创作的专业标题专家。\n\n用户输入的关键词：' + keywords.join(', ') + background + '\n请根据以下原则生成 12 个爆款标题：\n\n1. 情感共鸣：触及用户痛点（健康焦虑、养老焦虑、家庭责任）\n2. 数字钩子：使用具体数字增加可信度\n3. 对比反差：制造认知冲突\n4. 疑问引导：引发好奇心\n5. 情绪刺激：惊讶、恐惧、期待等情绪\n\n每个标题需要包含：\n- 标题内容（简洁有力，控制在20字以内）\n- 类型\n- 爆款概率评分（1-10分）\n- 适用场景说明\n- 推荐的小红书标签（3-5个）\n\n请只输出 JSON，不要任何解释文字。格式如下：\n' + tripleBacktick + 'json\n{\n  "titles": [\n    {"title": "标题1", "type": "震惊体", "score": 9, "explanation": "说明", "hashtags": ["标签1"]}\n  ]\n}\n' + tripleBacktick;

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
