// 社会热点数据采集（微博热搜、知乎热榜等）
import { BaseScraper, ScrapeResult } from './base.js';
import axios from 'axios';

export class SocialHotScraper extends BaseScraper {
  constructor() {
    super({
      name: '社会热点',
      url: '',
      category: 'SOCIAL'
    });
  }

  async scrape(): Promise<ScrapeResult> {
    const allItems: any[] = [];

    // 并行抓取多个热点源
    const results = await Promise.allSettled([
      this.scrapeWeiboHot(),
      this.scrapeZhihuHot(),
      this.scrapeDouyinHot(),
      this.scrapeWeiboNews()
    ]);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allItems.push(...result.value);
      }
    });

    // 过滤与保险相关的内容
    const insuranceKeywords = [
      '保险', '医疗', '健康', '养老', '退休', '社保', '医保',
      '重疾', '癌症', '看病', '费用', '保障', '理赔'
    ];

    const filteredItems = allItems.filter(item => {
      const text = `${item.title} ${item.summary || ''}`;
      return insuranceKeywords.some(keyword => text.includes(keyword));
    });

    const saved = await this.saveIntelligence(filteredItems);

    return {
      success: true,
      data: filteredItems,
      count: saved
    };
  }

  // 微博热搜
  private async scrapeWeiboHot(): Promise<any[]> {
    const items: any[] = [];

    try {
      // 微博热搜 API（非官方）
      const response = await axios.get(
        'https://weibo.com/ajax/side/hotSearch',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://weibo.com'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      if (data?.data?.realtime) {
        data.data.realtime.forEach((item: any, index: number) => {
          items.push({
            title: item.word || item.note,
            summary: item.raw_hot || item.desc,
            source: '微博热搜',
            sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
            hotScore: 100 - index,
            tags: ['热搜', '微博', '社会热点']
          });
        });
      }
    } catch (e) {
      console.log('微博热搜抓取失败:', e.message);
    }

    return items;
  }

  // 知乎热榜
  private async scrapeZhihuHot(): Promise<any[]> {
    const items: any[] = [];

    try {
      const response = await axios.get(
        'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=20',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'X-API-VERSION': '3.0.40'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      if (data?.data) {
        data.data.forEach((item: any) => {
          items.push({
            title: item.target?.title || item.title,
            summary: item.target?.excerpt || item.excerpt,
            source: '知乎热榜',
            sourceUrl: item.target?.url || `https://www.zhihu.com/question/${item.id}`,
            hotScore: item.detail_text ? parseInt(item.detail_text) : 50,
            tags: ['热榜', '知乎', '知识社区']
          });
        });
      }
    } catch (e) {
      console.log('知乎热榜抓取失败:', e.message);
    }

    return items;
  }

  // 抖音热榜
  private async scrapeDouyinHot(): Promise<any[]> {
    const items: any[] = [];

    try {
      // 抖音热点榜 API
      const response = await axios.get(
        'https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://www.douyin.com'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      if (data?.data?.word_list) {
        data.data.word_list.forEach((item: any, index: number) => {
          items.push({
            title: item.word,
            summary: item.hot_value,
            source: '抖音热榜',
            sourceUrl: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
            hotScore: 100 - index,
            tags: ['热榜', '抖音', '短视频']
          });
        });
      }
    } catch (e) {
      console.log('抖音热榜抓取失败:', e.message);
    }

    return items;
  }

  // 微博新闻
  private async scrapeWeiboNews(): Promise<any[]> {
    const items: any[] = [];

    try {
      // 微博新闻中心
      const $ = await this.fetch('https://news.weibo.com/?from=home');

      $('.hotlist .list li, .feed-list li').each((_, elem) => {
        const $elem = $(elem);
        const title = $elem.find('.tt a, h2 a').text().trim();
        const url = $elem.find('.tt a, h2 a').attr('href');
        const source = $elem.find('.from a, .source').text().trim();

        if (title) {
          items.push({
            title,
            source: source || '微博新闻',
            sourceUrl: url?.startsWith('http') ? url : `https://news.weibo.com${url}`,
            tags: ['新闻', '微博']
          });
        }
      });
    } catch (e) {
      console.log('微博新闻抓取失败:', e.message);
    }

    return items;
  }
}

export default new SocialHotScraper();
