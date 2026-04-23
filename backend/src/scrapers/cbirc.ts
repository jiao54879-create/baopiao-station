// 银保监会官网数据采集
import { BaseScraper, ScrapeResult } from './base.js';

export class CBIRCScraper extends BaseScraper {
  constructor() {
    super({
      name: '中国银保监会',
      url: 'https://www.cbirc.gov.cn',
      category: 'INSURANCE'
    });
  }

  async scrape(): Promise<ScrapeResult> {
    try {
      const items: any[] = [];

      // 抓取政策法规列表
      const $ = await this.fetch(`${this.baseUrl}/cn/web/website/28_1024.html`);

      // 解析政策法规列表
      $('ul.newsList li, tr.listItem, .news-list-item').each((_, elem) => {
        const $elem = $(elem);
        const title = $elem.find('a').first().text().trim();
        const url = $elem.find('a').first().attr('href');
        const date = $elem.find('span, .date').text().trim();

        if (title && url) {
          items.push({
            title,
            source: this.name,
            sourceUrl: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            publishTime: this.parseDate(date),
            tags: this.extractTags(title)
          });
        }
      });

      // 抓取最新公告
      const $$ = await this.fetch(`${this.baseUrl}/cn/web/website/28_1025.html`);
      $$('ul.newsList li, tr.listItem, .news-list-item').each((_, elem) => {
        const $elem = $$(elem);
        const title = $elem.find('a').first().text().trim();
        const url = $elem.find('a').first().attr('href');
        const date = $elem.find('span, .date').text().trim();

        if (title && url) {
          items.push({
            title,
            source: this.name,
            sourceUrl: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            publishTime: this.parseDate(date),
            tags: this.extractTags(title)
          });
        }
      });

      const saved = await this.saveIntelligence(items);

      return {
        success: true,
        data: items,
        count: saved
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;
    // 格式：2026-04-22 或 2026/04/22
    const match = dateStr.match(/\d{4}[-/]\d{2}[-/]\d{2}/);
    if (match) {
      return new Date(match[0].replace('/', '-'));
    }
    return undefined;
  }

  private extractTags(title: string): string[] {
    const tags: string[] = [];
    const tagKeywords: Record<string, string> = {
      '保险': '保险政策',
      '健康险': '健康险',
      '车险': '车险',
      '养老': '养老保险',
      '重疾': '重疾险',
      '医疗': '医疗险',
      '监管': '监管动态',
      '偿付': '偿付能力',
      '中介': '保险中介',
      '互联网': '互联网保险'
    };

    for (const [keyword, tag] of Object.entries(tagKeywords)) {
      if (title.includes(keyword)) {
        tags.push(tag);
      }
    }

    return tags;
  }
}

export default new CBIRCScraper();
