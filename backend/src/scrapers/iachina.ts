// 中国保险行业协会官网数据采集
import { BaseScraper, ScrapeResult } from './base.js';

interface IACHINANews {
  title: string;
  summary?: string;
  source: string;
  sourceUrl: string;
  publishTime?: Date;
  tags: string[];
}

export class IACHINAScraper extends BaseScraper {
  name = 'iachina';
  category = 'INSURANCE';

  // 中保协官方数据源
  private sources = [
    {
      name: '中保协-协会动态',
      url: 'https://www.iachina.cn/col/col41/index.html',
      type: 'association',
      keywords: ['通知', '公告', '自律', '规范']
    },
    {
      name: '中保协-行业研究',
      url: 'https://www.iachina.cn/col/col42/index.html',
      type: 'association',
      keywords: ['报告', '研究', '分析', '数据']
    },
    {
      name: '中保协-消费者教育',
      url: 'https://www.iachina.cn/col/col45/index.html',
      type: 'association',
      keywords: ['知识', '科普', '提示', '风险']
    }
  ];

  async scrape(): Promise<ScrapeResult> {
    const allNews: IACHINANews[] = [];

    try {
      for (const source of this.sources) {
        try {
          const items = await this.scrapePage(source);
          allNews.push(...items);
        } catch (e) {
          console.log(`中保协 ${source.name} 抓取失败: ${e}`);
        }
      }

      // 如果抓取失败，使用备用RSS
      if (allNews.length === 0) {
        const rssItems = await this.fetchBackupRSS();
        allNews.push(...rssItems);
      }

      const saved = await this.saveIntelligence(allNews.map(n => ({
        title: n.title,
        summary: n.summary,
        content: '',
        source: n.source,
        sourceUrl: n.sourceUrl,
        tags: n.tags,
        publishTime: n.publishTime
      })));

      return {
        success: true,
        data: allNews,
        count: saved
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async scrapePage(source: any): Promise<IACHINANews[]> {
    const news: IACHINANews[] = [];

    try {
      const $ = await this.fetch(source.url);

      // 中保协网站通用列表结构
      $('ul.news-list li, .list-item, tr.data-item, .article-item').each((_, elem) => {
        const $elem = $(elem);
        const $link = $elem.find('a').first();
        const title = $link.text().trim();
        const url = $link.attr('href');
        const dateText = $elem.find('.date, span.time, td:last').text().trim();

        if (title && url && this.containsKeywords(title, source.keywords)) {
          news.push({
            title: title,
            summary: this.generateSummary(title),
            source: source.name,
            sourceUrl: url.startsWith('http') ? url : `https://www.iachina.cn${url}`,
            publishTime: this.parseDate(dateText),
            tags: this.extractTags(title)
          });
        }
      });
    } catch (e) {
      console.log(`页面抓取失败: ${source.url}`);
    }

    return news;
  }

  private async fetchBackupRSS(): Promise<IACHINANews[]> {
    // 备用：使用公开保险资讯RSS
    const rssUrls = [
      'https://www.iachina.cn/rss/news.xml'
    ];

    for (const rssUrl of rssUrls) {
      try {
        const $ = await this.fetch(rssUrl);
        const news: IACHINANews[] = [];

        $('item').each((_, elem) => {
          const $elem = $(elem);
          news.push({
            title: $elem.find('title').text().trim(),
            summary: $elem.find('description').text().trim().substring(0, 200),
            source: '中保协',
            sourceUrl: $elem.find('link').text().trim(),
            publishTime: new Date($elem.find('pubDate').text().trim()),
            tags: ['保险', '行业协会', '资讯']
          });
        });

        if (news.length > 0) return news;
      } catch (e) {
        console.log('RSS备用源失败');
      }
    }

    return [];
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    // 如果没有关键词要求，返回true
    if (!keywords || keywords.length === 0) return true;
    // 否则至少包含一个关键词
    return keywords.some(k => text.includes(k));
  }

  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;
    const match = dateStr.match(/\d{4}[-/]\d{2}[-/]\d{2}/);
    return match ? new Date(match[0].replace('/', '-')) : undefined;
  }

  private generateSummary(title: string): string {
    // 根据标题生成简短摘要
    const summaryMap: Record<string, string> = {
      '通知': '关于规范保险行业发展的最新通知',
      '公告': '保险行业重要公告',
      '自律': '保险行业自律公约相关',
      '规范': '保险行业规范文件',
      '报告': '保险行业发展研究报告',
      '研究': '保险行业深度研究成果',
      '知识': '保险消费知识科普',
      '风险': '保险消费风险提示'
    };

    for (const [key, value] of Object.entries(summaryMap)) {
      if (title.includes(key)) return value;
    }
    return '';
  }

  private extractTags(title: string): string[] {
    const tags: string[] = ['保险', '行业协会'];
    const keywords: Record<string, string> = {
      '重疾': '重疾险',
      '医疗': '医疗险',
      '寿险': '寿险',
      '健康': '健康险',
      '养老': '养老保险',
      '车险': '车险',
      '意外': '意外险',
      '投资': '投资险',
      '分红': '分红险',
      '万能': '万能险',
      '监管': '监管动态',
      '规范': '行业规范',
      '通知': '行业通知',
      '风险': '风险提示',
      '消费': '消费者保护'
    };

    for (const [key, tag] of Object.entries(keywords)) {
      if (title.includes(key) && !tags.includes(tag)) {
        tags.push(tag);
      }
    }

    return tags;
  }
}

export default new IACHINAScraper();
