// AI标题优化服务 - 精简版（无反引号版本）
import OpenAI from 'openai';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

const TB = String.fromCharCode(96, 96, 96);

export const HOT_TOPIC_CATEGORIES: Record<string, string[]> = {
  POLICY: ['保险新规', '重疾定义修改', '互联网保险新规', '偿二代'],
  PRODUCT: ['新产品上市', '停售', '升级', '理赔放宽'],
  SOCIETY: ['疫情', '养老', '三孩', '延迟退休'],
};

const TitleAnalysisSchema = z.object({
  score: z.number().min(0).max(10),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

type TitleAnalysis = z.infer<typeof TitleAnalysisSchema>;

const OptimizationResultSchema = z.object({
  original: z.string(),
  optimized: z.string(),
  score: z.number(),
  reason: z.string(),
});

export type OptimizationResult = z.infer<typeof OptimizationResultSchema>;

export async function analyzeTitle(title: string): Promise<TitleAnalysis> {
  const prompt = '分析以下保险标题的质量（0-10分），指出问题并给出建议：\n\n' + title + '\n\n请直接输出JSON：{"score": 7, "issues": ["问题1"], "suggestions": ["建议1"]}';
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });
    const text = response.choices[0]?.message?.content || '';
    const cleanText = text.replace(new RegExp(TB + 'json\\n?', 'g'), '').replace(new RegExp(TB, 'g'), '').trim();
    return TitleAnalysisSchema.parse(JSON.parse(cleanText));
  } catch (error: any) {
    console.error('标题分析失败:', error?.message || error);
    return { score: 5, issues: ['分析失败'], suggestions: ['请重试'] };
  }
}

export async function learnFromDatabase(): Promise<{ topKeywords: string[]; avgScore: number }> {
  try {
    const cases = await prisma.viralCase.findMany({
      where: { platform: 'XHS', likesCount: { gte: 50 } },
      orderBy: { viralScore: 'desc' },
      take: 20,
      select: { title: true, viralScore: true },
    });
    const topKeywords = cases.flatMap(c => c.title.split(/[\s,，、]/)).filter(w => w.length >= 2).slice(0, 10);
    const avgScore = cases.length > 0 ? cases.reduce((sum, c) => sum + (c.viralScore || 0), 0) / cases.length : 50;
    return { topKeywords, avgScore };
  } catch {
    return { topKeywords: ['保险', '重疾险', '医疗险'], avgScore: 50 };
  }
}

export async function generateDynamicPrompt(context?: {
  hotTopics?: string[];
  topKeywords?: string[];
  targetAudience?: string;
}): Promise<string> {
  const learned = await learnFromDatabase();
  const hotTopics = context?.hotTopics || HOT_TOPIC_CATEGORIES.POLICY;
  const topKeywords = context?.topKeywords || learned.topKeywords;
  const targetAudience = context?.targetAudience || '保险消费者';
  return '你是保险赛道的爆款标题策划人。关键词：' + topKeywords.slice(0, 5).join(', ') + '，目标人群：' + targetAudience + '。生成8个10-20字的爆款标题，直接输出JSON：{"titles": [{"title": "标题", "score": 8}]}';
}

export async function optimizeTitle(
  title: string,
  context?: { hotTopics?: string[]; targetAudience?: string; }
): Promise<OptimizationResult> {
  const originalAnalysis = await analyzeTitle(title);
  const prompt = '请优化以下保险标题，使其更具爆款潜力：' + title + '\n\n直接输出优化后的标题文本，不要解释、不要引号。';
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是保险赛道标题优化专家。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 100,
    });
    const optimized = response.choices[0]?.message?.content?.trim() || title;
    const optimizedAnalysis = await analyzeTitle(optimized);
    return { original: title, optimized, score: optimizedAnalysis.score, reason: '从' + originalAnalysis.score + '分优化到' + optimizedAnalysis.score + '分' };
  } catch (error: any) {
    console.error('标题优化失败:', error?.message || error);
    return { original: title, optimized: title, score: originalAnalysis.score, reason: '优化失败，保持原标题' };
  }
}

export async function batchOptimizeTitles(
  titles: string[],
  context?: { hotTopics?: string[]; targetAudience?: string; }
): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = [];
  for (const title of titles) {
    try {
      const result = await optimizeTitle(title, context);
      results.push(result);
    } catch {
      results.push({ original: title, optimized: title, score: 0, reason: '优化失败' });
    }
  }
  return results;
}

export async function generateHotTopicTitles(hotTopic: string, count: number = 5): Promise<string[]> {
  const prompt = '基于热点' + hotTopic + '，生成' + count + '个保险相关爆款标题。每行一个，不要编号。';
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500,
    });
    const text = response.choices[0]?.message?.content || '';
    return text.split('\n').filter(l => l.trim()).slice(0, count);
  } catch {
    return [hotTopic + '后，保险该怎么买？', hotTopic + '启示：这件事必须提前准备'];
  }
}

export function isHotTopic(text: string): boolean {
  const allTopics = Object.values(HOT_TOPIC_CATEGORIES).flat();
  return allTopics.some(topic => text.includes(topic));
}
