// 金融行业数据采集
import { BaseScraper, ScrapeResult } from './base.js';
import axios from 'axios';

export class FinanceScraper extends BaseScraper {
  constructor() {
    super({
      name: '金融行业',
      url: '',
      category: 'FINANCE'
    });
  }

  async scrape(): Promise<ScrapeResult> {
    const allItems: any[] = [];

    // 并行抓取多个金融源
    const results = await Promise.allSettled([
      this.scrapeCSRC(),      // 证监会
      this.scrapePBOC(),      // 央行
      this.scrapeTHS(),       // 同花顺
      this.scrapeEastMoney()  // 东方财富
    ]);

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        allItems.push(...result.value);
      }
    });

    const saved = await this.saveIntelligence(allItems);

    return {
      success: true,
      data: allItems,
      count: saved
    };
  }

  // 证监会
  private async scrapeCSRC(): Promise<any[]> {
    const items: any[] = [];

    try {
      const response = await axios.get(
        'http://www.csrc.gov.cn/csrc/c101864/index.html',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          timeout: 15000
        }
      );

      // 证监会网站结构可能变化，需要根据实际情况调整
      // 这里给出通用框架

      return items;
    } catch (e) {
      console.log('证监会抓取失败:', e.message);
    }

    return items;
  }

  // 央行
  private async scrapePBOC(): Promise<any[]> {
    const items: any[] = [];

    try {
      const response = await axios.get(
        'http://www.pbc.gov.cn/rmyh/index.html',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          timeout: 15000
        }
      );

      return items;
    } catch (e) {
      console.log('央行抓取失败:', e.message);
    }

    return items;
  }

  // 同花顺财经
  private async scrapeTHS(): Promise<any[]> {
    const items: any[] = [];

    try {
      // 同花顺热点新闻 API
      const response = await axios.get(
        'https://news.10jqka.com.cn/tapp/news/push/stock/',
        {
          params: {
            page: 1,
            tag: '',
            track: 'website',
            pageSize: 20
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://www.10jqka.com.cn/'
          },
          timeout: 15000
        }
      );

      const data = response.data;
      if (data?.data?.list) {
        data.data.list.forEach((item: any) => {
          items.push({
            title: item.title,
            summary: item.summary || item.content,
            source: '同花顺',
            sourceUrl: item.url || item.artUrl,
            publishTime: item.time ? new Date(item.time) : undefined,
            tags: ['金融', '股市', '同花顺']
          });
        });
      }
    } catch (e) {
      console.log('同花顺抓取失败:', e.message);
    }

    return items;
  }

  // 东方财富
  private async scrapeEastMoney(): Promise<any[]> {
    const items: any[] = [];

    try {
      // 东方财富财经新闻
      const response = await axios.get(
        'https://feed.eastmoney.com/more.html',
        {
          params: {
            pageIndex: 1,
            pageSize: 20,
            type: '1,2,3,4,5,6,7,8,9,10,11,12'
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://www.eastmoney.com/'
          },
          timeout: 15000
        }
      );

      const data = response.data;
      if (data?.data?.list) {
        data.data.list.forEach((item: any) => {
          items.push({
            title: item.title,
            summary: item.summary,
            source: '东方财富',
            sourceUrl: item.url,
            publishTime: item.showtime ? new Date(item.showtime) : undefined,
            tags: ['金融', '财经', '东方财富']
          });
        });
      }
    } catch (e) {
      console.log('东方财富抓取失败:', e.message);
    }

    return items;
  }
}

export default new FinanceScraper();
