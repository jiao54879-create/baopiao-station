// 今日保网站数据采集
import { BaseScraper, ScrapeResult } from './base.js';

export class JinRaoScraper extends BaseScraper {
  constructor() {
    super({
      name: '今日保',
      url: 'https://www.jinribao.com',
      category: 'INSURANCE'
    });
  }

  async scrape(): Promise<ScrapeResult> {
    try {
      const items: any[] = [];

      // 今日保官网（如果没有，可以用备用方案）
      try {
        const $ = await this.fetch(this.baseUrl);

        // 根据实际页面结构调整选择器
        $('article, .article-item, .news-item, .post-item').each((_, elem) => {
          const $elem = $(elem);
          const title = $elem.find('h2, h3, .title, a').first().text().trim();
          const url = $elem.find('a').first().attr('href');
          const summary = $elem.find('.summary, .desc, p').first().text().trim();
          const date = $elem.find('.date, .time').text().trim();

          if (title && url) {
            items.push({
              title,
              summary: summary || undefined,
              source: this.name,
              sourceUrl: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
              publishTime: this.parseDate(date),
              tags: ['保险资讯']
            });
          }
        });
      } catch (e) {
        // 如果官网抓取失败，使用 RSS 或 API
        console.log('官网抓取失败，尝试其他方式');
      }

      // 尝试抓取微信公众号文章（通过搜狗）
      await this.scrapeWechat();

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

  private async scrapeWechat(): Promise<any[]> {
    const items: any[] = [];

    try {
      // 搜狗微信搜索 - 保险相关
      const searchUrl = 'https://weixin.sogou.com/weixin?type=2&s_from=input&query=%E4%BF%9D%E9%99%A9&ie=utf8&_sug_=n&_sug_type_=';

      const $ = await this.fetch(searchUrl);

      $('.news-box .news-list li, .article-list .item').each((_, elem) => {
        const $elem = $(elem);
        const title = $elem.find('.txt h3, .title').text().trim();
        const url = $elem.find('.txt h3 a, .title a').attr('href');
        const source = $elem.find('.s-p, .account').text().trim();
        const date = $elem.find('.s2, .date').text().trim();

        if (title) {
          items.push({
            title,
            source: source || this.name,
            sourceUrl: url,
            publishTime: this.parseWechatDate(date),
            tags: ['保险资讯', '微信公众号']
          });
        }
      });
    } catch (e) {
      console.log('微信公众号抓取失败:', e.message);
    }

    return items;
  }

  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;
    const match = dateStr.match(/\d{4}[-/]\d{2}[-/]\d{2}/);
    if (match) return new Date(match[0].replace('/', '-'));
    return undefined;
  }

  private parseWechatDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;
    // 格式：03-15 或 今天 14:30
    const today = new Date();
    const match = dateStr.match(/(\d{2})-(\d{2})/);
    if (match) {
      return new Date(today.getFullYear(), parseInt(match[1]) - 1, parseInt(match[2]));
    }
    return undefined;
  }
}

export default new JinRaoScraper();
