// 爬虫基类和工具函数
import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '../index.js';

export interface ScrapeResult {
  success: boolean;
  data?: any[];
  error?: string;
  count?: number;
}

export interface SourceConfig {
  name: string;
  url: string;
  category: string;
  selector?: string;
  headers?: Record<string, string>;
}

// 基础爬虫类
export abstract class BaseScraper {
  public name: string;
  public baseUrl: string;
  public category: string;
  protected headers: Record<string, string>;

  constructor(config: SourceConfig) {
    this.name = config.name;
    this.baseUrl = config.url;
    this.category = config.category;
    this.headers = config.headers || {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
  }

  protected async fetch(url: string): Promise<cheerio.CheerioAPI> {
    const response = await axios.get(url, { headers: this.headers, timeout: 30000 });
    return cheerio.load(response.data);
  }

  protected async post(url: string, data: any): Promise<any> {
    const response = await axios.post(url, data, { headers: this.headers, timeout: 30000 });
    return response.data;
  }

  // 保存情报到数据库
  protected async saveIntelligence(items: Array<{
    title: string;
    summary?: string;
    content?: string;
    source: string;
    sourceUrl?: string;
    tags?: string[];
    publishTime?: Date;
  }>): Promise<number> {
    let saved = 0;

    for (const item of items) {
      try {
        // 检查是否已存在（根据标题去重）
        const exists = await prisma.intelligence.findFirst({
          where: { title: item.title, source: item.source }
        });

        if (!exists) {
          await prisma.intelligence.create({
            data: {
              title: item.title,
              summary: item.summary,
              content: item.content,
              source: item.source,
              sourceUrl: item.sourceUrl,
              category: this.category as any,
              tags: JSON.stringify(item.tags || []),
              publishTime: item.publishTime
            }
          });
          saved++;
        }
      } catch (error) {
        console.error(`保存情报失败: ${item.title}`, error);
      }
    }

    return saved;
  }

  // 保存爆款案例到数据库
  protected async saveViralCase(item: {
    platform: string;
    title: string;
    content?: string;
    author?: string;
    url: string;
    coverImage?: string;
    likesCount?: number;
    favoritesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
    tags?: string[];
    insuranceType?: string;
    publishedAt?: Date;
  }): Promise<boolean> {
    try {
      // 计算爆款分数（简单算法：点赞+收藏*2+评论*3）
      const viralScore = (item.likesCount || 0) * 1 + (item.favoritesCount || 0) * 2 + (item.commentsCount || 0) * 3;

      const exists = await prisma.viralCase.findFirst({
        where: { url: item.url }
      });

      if (!exists) {
        await prisma.viralCase.create({
          data: {
            ...item,
            viralScore,
            platform: item.platform as any,
            tags: JSON.stringify(item.tags || [])
          }
        });
        return true;
      }
    } catch (error) {
      console.error(`保存案例失败: ${item.title}`, error);
    }
    return false;
  }

  // 抽象方法：子类必须实现
  abstract scrape(): Promise<ScrapeResult>;
}

// 工具函数：从文本中提取关键词
export function extractKeywords(text: string, count: number = 5): string[] {
  // 简单实现：移除停用词，返回高频词
  const stopWords = ['的', '了', '是', '在', '和', '与', '或', '等', '以及', '对', '于', '为', '以', '及', '这', '那', '个', '也', '都', '就', '而', '且', '之'];

  const words = text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.includes(w));

  const freq: Record<string, number> = {};
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

// 工具函数：从内容中生成摘要
export function generateSummary(content: string, maxLength: number = 200): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}
