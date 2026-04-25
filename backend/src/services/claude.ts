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
    type: z.enum(['震惊体', '数字体', '故事体', '对比体', '情绪体', '反差别', '实用体', '疑问体']),
    score: z.number().min(1).max(10),
    explanation: z.string(),
    hashtags: z.array(z.string())
  }))
});

export async function generateTitles(keywords: string[], context?: string): Promise<z.infer<typeof TitleOutputSchema>> {
  const prompt = `你是一个专注于小红书保险内容创作的专业标题专家。

用户输入的关键词：${keywords.join(', ')}

${context ? `当前背景：${context}` : ''}

请根据以下原则生成 12 个爆款标题：

1. **情感共鸣**：触及用户痛点（健康焦虑、养老焦虑、家庭责任）
2. **数字钩子**：使用具体数字增加可信度
3. **对比反差**：制造认知冲突
4. **疑问引导**：引发好奇心
5. **情绪刺激**：惊讶、恐惧、期待等情绪

每个标题需要包含：
- 标题内容（简洁有力，控制在20字以内）
- 类型
- 爆款概率评分（1-10分）
- 适用场景说明
- 推荐的小红书标签（3-5个）

请**只输出 JSON**，不要任何解释文字。格式如下：
\`\`\`json
{
  "titles": [
    {"title": "标题1", "type": "震惊体", "score": 9, "explanation": "说明", "hashtags": ["标签1"]}
  ]
}
\`\`\`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 1500,
  });

  const responseText = response.choices[0]?.message?.content || '';

  // 清理 JSON（移除 markdown 代码块）
  let cleanText = responseText.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
  }

  // 尝试多种方式提取 JSON
  let jsonStr = cleanText;
  
  // 方法1：直接解析
  try {
    return TitleOutputSchema.parse(JSON.parse(jsonStr));
  } catch (e) {}
  
  // 方法2：提取 {...} 部分
  const braceStart = jsonStr.indexOf('{');
  const braceEnd = jsonStr.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    jsonStr = jsonStr.substring(braceStart, braceEnd + 1);
    try {
      return TitleOutputSchema.parse(JSON.parse(jsonStr));
    } catch (e) {}
  }

  console.error('AI 返回内容:', responseText);
  throw new Error('AI 返回格式错误');
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
  const prompt = `请分析以下小红书爆款笔记的爆款原因：

标题：${title}
内容：${content}
数据表现：点赞 ${metrics.likes} | 收藏 ${metrics.favorites} | 评论 ${metrics.comments}

分析维度：
1. 标题吸引力（钩子、情绪、数字等）
2. 内容结构（开头/中间/结尾）
3. 选题角度（为什么能引发讨论）
4. 可复用的元素

请输出：
- 爆款因素总结（3-5条）
- 内容结构分析
- 选题角度解读
- 可模仿的写作公式
- 生成类似标题的建议（3条）

请以 JSON 格式输出结果。`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1024,
  });

  const responseText = response.choices[0]?.message?.content || '';

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 返回格式错误');
  }

  return CaseAnalysisSchema.parse(JSON.parse(jsonMatch[0]));
}

export async function summarizeIntelligence(
  title: string,
  content: string
): Promise<string> {
  const prompt = `请帮我将以下内容提炼成一段简洁的摘要（100字以内），保留核心信息：

标题：${title}
内容：${content}

摘要要求：
- 提取关键信息
- 语言简洁易懂
- 突出对保险内容创作者的价值`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 256,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}
