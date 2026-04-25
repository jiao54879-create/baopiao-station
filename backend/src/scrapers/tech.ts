// 科技/AI 热点数据采集 - 精准版
import { BaseScraper, ScrapeResult } from './base.js';
import axios from 'axios';
import { filterInsuranceContent, isWithinLastMonth } from './keywords.js';

export class TechHotScraper extends BaseScraper {
  constructor() {
    super({
      name: '科技热点',
      url: '',
      category: 'TECH'
    });
  }

  async scrape(): Promise<ScrapeResult> {
    const allItems: any[] = [];
    let totalFiltered = 0;

    // 并行抓取多个科技源
    const results = await Promise.allSettled([
      this.scrape36Kr(),
      this.scrapeHuxiu(),
      this.scrapeithome(),
      this.scrapeAISummary()
    ]);

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        // 应用关键词过滤和时间过滤
        const filtered = result.value.filter((item: any) => {
          // 时间过滤：只采集最近一个月
          if (!isWithinLastMonth(item.publishTime)) {
            return false;
          }

          // 关键词过滤：只采集保险相关内容
          const filterResult = filterInsuranceContent(
            item.title,
            item.summary,
            5
          );

          if (!filterResult.isValid) {
            totalFiltered++;
            return false;
          }

          // 添加过滤后的标签
          item.tags = filterResult.tags;
          item.relevanceScore = filterResult.relevanceScore;

          return true;
        });

        allItems.push(...filtered);
      }
    });

    if (totalFiltered > 0) {
      console.log(`  [科技热点] 已过滤 ${totalFiltered} 条不相关内容`);
    }

    const saved = await this.saveIntelligence(allItems);

    return {
      success: true,
      data: allItems,
      count: saved
    };
  }

  // 36氪
  private async scrape36Kr(): Promise<any[]> {
    const items: any[] = [];

    try {
      const response = await axios.get(
        'https://36kr.com/api/newsflash/index?per_page=20&page=1',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://36kr.com'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      if (data?.data?.items) {
        data.data.items.forEach((item: any) => {
          items.push({
            title: item.title,
            summary: item.description || item.digest,
            source: '36氪',
            sourceUrl: item.news_url || `https://36kr.com/p/${item.item_id}.html`,
            publishTime: item.published_at ? new Date(item.published_at * 1000) : undefined,
            tags: ['科技', '创业', '36氪']
          });
        });
      }
    } catch (e) {
      console.log('36氪抓取失败:', e.message);
    }

    return items;
  }

  // 虎嗅
  private async scrapeHuxiu(): Promise<any[]> {
    const items: any[] = [];

    try {
      const response = await axios.get(
        'https://www.huxiu.com/v2/action/Article/list.html?page=1&pageSize=20',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://www.huxiu.com'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      if (data?.data?.list) {
        data.data.list.forEach((item: any) => {
          items.push({
            title: item.title,
            summary: item.digest,
            source: '虎嗅',
            sourceUrl: `https://www.huxiu.com/article/${item.aid}.html`,
            publishTime: item.create_time ? new Date(item.create_time * 1000) : undefined,
            tags: ['科技', '商业', '虎嗅']
          });
        });
      }
    } catch (e) {
      console.log('虎嗅抓取失败:', e.message);
    }

    return items;
  }

  // IT之家
  private async scrapeithome(): Promise<any[]> {
    const items: any[] = [];

    try {
      const response = await axios.get(
        'https://www.ithome.com/column/api/getlist?category=0&page=1&page_size=20',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      if (data?.data) {
        data.data.forEach((item: any) => {
          items.push({
            title: item.title,
            summary: item.description,
            source: 'IT之家',
            sourceUrl: item.url,
            publishTime: item.time ? new Date(item.time * 1000) : undefined,
            tags: ['科技', '数码', 'IT之家']
          });
        });
      }
    } catch (e) {
      console.log('IT之家抓取失败:', e.message);
    }

    return items;
  }

  // AI 产品日报（汇总）
  private async scrapeAISummary(): Promise<any[]> {
    const items: any[] = [];

    try {
      // AI 产品导航站
      const response = await axios.get(
        'https://www.theresanaiforthat.com/api/v1/daily/',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      if (data?.items) {
        data.items.slice(0, 10).forEach((item: any) => {
          items.push({
            title: item.name,
            summary: item.description,
            source: 'AI 产品',
            sourceUrl: item.url,
            tags: ['AI', '人工智能', '产品']
          });
        });
      }
    } catch (e) {
      // 尝试备用源
      try {
        const $$ = await this.fetch('https://www.theresanaiforthat.com/');
        $$('.aitem, .tool-item').each((_, elem) => {
          const $elem = $$(elem);
          const title = $elem.find('h3, .name').text().trim();
          const url = $elem.find('a').attr('href');
          const desc = $elem.find('.description, p').text().trim();

          if (title) {
            items.push({
              title,
              summary: desc,
              source: 'AI 产品',
              sourceUrl: url,
              tags: ['AI', '人工智能']
            });
          }
        });
      } catch (e2) {
        console.log('AI 产品抓取失败:', e2.message);
      }
    }

    return items;
  }
}

export default new TechHotScraper();
