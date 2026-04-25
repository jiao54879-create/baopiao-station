// 金融行业数据采集 - 精准版
// 只采集与保险、养老、医疗相关的金融内容
import { BaseScraper, ScrapeResult } from './base.js';
import axios from 'axios';
import { filterInsuranceContent, extractTags, isWithinLastMonth } from './keywords.js';

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

  // 同花顺财经 - 精准采集
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
            pageSize: 50  // 增加采集数量，过滤后会减少
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
        for (const item of data.data.list) {
          // 时间过滤：只采集最近一个月
          if (!isWithinLastMonth(item.time)) {
            continue;
          }

          // 关键词过滤：只采集保险相关内容
          const filterResult = filterInsuranceContent(
            item.title,
            item.summary || item.content,
            5  // 最低相关度分数
          );

          if (!filterResult.isValid) {
            console.log(`  [过滤] ${item.title.slice(0, 30)}... - ${filterResult.reason}`);
            continue;
          }

          items.push({
            title: item.title,
            summary: item.summary || item.content,
            source: '同花顺',
            sourceUrl: item.url || item.artUrl,
            publishTime: item.time ? new Date(item.time) : undefined,
            tags: filterResult.tags,
            relevanceScore: filterResult.relevanceScore,
            primaryCategory: filterResult.primaryCategory
          });
        }
      }
    } catch (e) {
      console.log('同花顺抓取失败:', e.message);
    }

    console.log(`  同花顺精准采集: ${items.length} 条保险相关内容`);
    return items;
  }

  // 东方财富 - 精准采集
  private async scrapeEastMoney(): Promise<any[]> {
    const items: any[] = [];

    try {
      // 东方财富财经新闻 - 增加采集量
      const response = await axios.get(
        'https://feed.eastmoney.com/more.html',
        {
          params: {
            pageIndex: 1,
            pageSize: 50,  // 增加采集数量
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
        for (const item of data.data.list) {
          // 时间过滤：只采集最近一个月
          if (!isWithinLastMonth(item.showtime)) {
            continue;
          }

          // 关键词过滤：只采集保险相关内容
          const filterResult = filterInsuranceContent(
            item.title,
            item.summary,
            5
          );

          if (!filterResult.isValid) {
            console.log(`  [过滤] ${item.title.slice(0, 30)}... - ${filterResult.reason}`);
            continue;
          }

          items.push({
            title: item.title,
            summary: item.summary,
            source: '东方财富',
            sourceUrl: item.url,
            publishTime: item.showtime ? new Date(item.showtime) : undefined,
            tags: filterResult.tags,
            relevanceScore: filterResult.relevanceScore,
            primaryCategory: filterResult.primaryCategory
          });
        }
      }
    } catch (e) {
      console.log('东方财富抓取失败:', e.message);
    }

    console.log(`  东方财富精准采集: ${items.length} 条保险相关内容`);
    return items;
  }
}

export default new FinanceScraper();
