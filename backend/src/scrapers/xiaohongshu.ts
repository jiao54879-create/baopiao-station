// 小红书爆款笔记采集 - 精准版
import { BaseScraper, ScrapeResult } from './base.js';
import axios from 'axios';
import { isWithinLastMonth } from './keywords.js';

export class XiaohongshuScraper extends BaseScraper {
  private cookies: string = '';

  constructor() {
    super({
      name: '小红书',
      url: 'https://www.xiaohongshu.com',
      category: 'SOCIAL'
    });
  }

  async scrape(): Promise<ScrapeResult> {
    const allItems: any[] = [];

    // 抓取保险相关爆款
    const searchTerms = ['保险', '医疗险', '重疾险', '养老金', '给孩子买保险', '家庭保险配置'];

    for (const term of searchTerms) {
      try {
        const items = await this.searchNotes(term);
        allItems.push(...items);
      } catch (e) {
        console.log(`小红书搜索 "${term}" 失败:`, e.message);
      }
    }

    // 保存到爆款案例库
    let saved = 0;
    for (const item of allItems) {
      const success = await this.saveViralCase(item);
      if (success) saved++;
    }

    return {
      success: true,
      data: allItems,
      count: saved
    };
  }

  // 搜索笔记
  private async searchNotes(keyword: string): Promise<any[]> {
    const items: any[] = [];

    try {
      // 小红书搜索 API（需要 cookies）
      const response = await axios.get(
        `https://edith.xiaohongshu.com/api/sns/web/v1/search/notes`,
        {
          params: {
            keyword,
            page: 1,
            page_size: 20,
            search_id: this.generateSearchId(),
            sort: 'general',
            note_type: 0
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': this.cookies,
            'Referer': 'https://www.xiaohongshu.com'
          },
          timeout: 15000
        }
      );

      const data = response.data;
      if (data?.data?.items) {
        for (const item of data.data.items) {
          const noteCard = item.note_card || item;
          const publishedAt = noteCard.time ? new Date(noteCard.time * 1000) : undefined;

          // 时间过滤：只采集最近一个月
          if (!isWithinLastMonth(publishedAt)) {
            continue;
          }

          items.push({
            platform: 'XHS',
            title: noteCard.title || noteCard.display_title,
            content: noteCard.desc || noteCard.content,
            author: noteCard.user?.nickname,
            url: `https://www.xiaohongshu.com/discovery/item/${noteCard.note_id}`,
            coverImage: noteCard.cover?.url || noteCard.image_list?.[0]?.url,
            likesCount: noteCard.interact_info?.liked_count || 0,
            favoritesCount: noteCard.interact_info?.collected_count || 0,
            commentsCount: noteCard.interact_info?.comment_count || 0,
            tags: this.extractTags(noteCard.desc || noteCard.title),
            insuranceType: this.guessInsuranceType(keyword),
            publishedAt
          });
        }
      }
    } catch (e) {
      // 如果 API 失败，尝试网页抓取
      return this.scrapeFromWeb(keyword);
    }

    return items;
  }

  // 从网页抓取（备选方案）
  private async scrapeFromWeb(keyword: string): Promise<any[]> {
    const items: any[] = [];

    try {
      const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&type=51`;
      const $ = await this.fetch(searchUrl);

      $('.note-item, .search-result .item').each((_, elem) => {
        const $elem = $(elem);
        const title = $elem.find('.title, .note-title').text().trim();
        const url = $elem.find('a').first().attr('href');
        const author = $elem.find('.author, .user-name').text().trim();
        const likes = parseInt($elem.find('.like-count, .liked-count').text().replace(/[^0-9]/g, '')) || 0;

        if (title && url) {
          items.push({
            platform: 'XHS',
            title,
            author,
            url: url.startsWith('http') ? url : `https://www.xiaohongshu.com${url}`,
            likesCount: likes,
            insuranceType: this.guessInsuranceType(keyword),
            tags: ['小红书', keyword]
          });
        }
      });
    } catch (e) {
      console.log('小红书网页抓取失败:', e.message);
    }

    return items;
  }

  // 设置登录 Cookies（用于访问更多数据）
  setCookies(cookies: string) {
    this.cookies = cookies;
  }

  // 生成搜索 ID
  private generateSearchId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // 从内容中提取标签
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const tagPattern = /#([^#\s]+)/g;
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      tags.push(match[1]);
    }

    return tags.slice(0, 10); // 最多10个标签
  }

  // 根据搜索词猜测险种
  private guessInsuranceType(keyword: string): string {
    const mapping: Record<string, string> = {
      '医疗险': 'medical',
      '重疾险': 'critical',
      '养老': 'pension',
      '孩子': 'child',
      '年金': 'annuity',
      '寿险': 'life',
      '意外': 'accident'
    };

    for (const [key, value] of Object.entries(mapping)) {
      if (keyword.includes(key)) return value;
    }
    return 'insurance';
  }
}

export default new XiaohongshuScraper();
