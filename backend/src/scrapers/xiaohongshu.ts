// 小红书爆款笔记采集 - 精准版（针对保险选题）
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

  // 扩展保险选题关键词库
  private searchTerms = {
    // 险种类别
    '重疾险': ['重疾险', '成人重疾险', '少儿重疾险', '多次赔付重疾', '单次赔付重疾'],
    '医疗险': ['百万医疗险', '小额医疗险', '门诊险', '防癌医疗险'],
    '寿险': ['定期寿险', '终身寿险', '增额终身寿险', '杠杆终身寿险'],
    '意外险': ['意外险', '综合意外险', '少儿意外险', '老人意外险'],
    '年金险': ['年金险', '养老年金', '教育金', '快返型年金'],
    // 场景选题
    '家庭配置': ['家庭保险配置', '一家三口保险', '保险怎么买', '家庭保障规划'],
    '儿童': ['给孩子买保险', '儿童保险怎么买', '宝宝保险', '少儿保险'],
    '成人': ['成年人保险', '上班族保险', '年轻人保险'],
    '老人': ['父母保险', '老年人保险', '60岁保险'],
    // 产品对比
    '达尔文': ['达尔文重疾险', '达尔文10号'],
    '超级玛丽': ['超级玛丽重疾险', '超级玛丽13号', '超级玛丽12号'],
    '妈咪宝贝': ['妈咪宝贝', '少儿重疾险妈咪宝贝'],
    // 知识科普
    '保险知识': ['保险知识', '保险科普', '保险小白', '保险避坑'],
    '理赔': ['保险理赔', '理赔流程', '重疾险理赔'],
    '核保': ['保险核保', '健康告知', '带病投保'],
    '挑选': ['保险怎么选', '重疾险怎么选', '医疗险怎么选', '保险对比']
  };

  async scrape(): Promise<ScrapeResult> {
    const allItems: any[] = [];

    // 按类别抓取，确保覆盖所有选题方向
    for (const [category, keywords] of Object.entries(this.searchTerms)) {
      for (const keyword of keywords as string[]) {
        try {
          const items = await this.searchNotes(keyword, category);
          allItems.push(...items);
          // 避免请求过快
          await this.delay(1000);
        } catch (e) {
          console.log(`小红书搜索 "${keyword}" 失败:`, e.message);
        }
      }
    }

    // 去重并按热度排序
    const uniqueItems = this.deduplicateItems(allItems);
    const sortedItems = uniqueItems.sort((a, b) => b.likesCount - a.likesCount);

    // 保存到爆款案例库
    let saved = 0;
    for (const item of sortedItems) {
      const success = await this.saveViralCase(item);
      if (success) saved++;
    }

    return {
      success: true,
      data: sortedItems,
      count: saved
    };
  }

  // 去重
  private deduplicateItems(items: any[]): any[] {
    const seen = new Set();
    return items.filter(item => {
      const key = item.url || item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 搜索笔记
  private async searchNotes(keyword: string, category: string): Promise<any[]> {
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
            authorUrl: noteCard.user?.user_id ? `https://www.xiaohongshu.com/user/profile/${noteCard.user.user_id}` : undefined,
            url: `https://www.xiaohongshu.com/discovery/item/${noteCard.note_id}`,
            coverImage: noteCard.cover?.url || noteCard.image_list?.[0]?.url,
            likesCount: noteCard.interact_info?.liked_count || 0,
            favoritesCount: noteCard.interact_info?.collected_count || 0,
            commentsCount: noteCard.interact_info?.comment_count || 0,
            sharesCount: noteCard.interact_info?.share_count || 0,
            tags: this.extractTags(noteCard.desc || noteCard.title),
            insuranceType: this.guessInsuranceType(category),
            viralScore: this.calculateViralScore(noteCard.interact_info),
            publishedAt
          });
        }
      }
    } catch (e) {
      // API 失败时返回空数组，不使用模拟数据
      console.log(`小红书 API 失败（"${keyword}"）: ${e.message}，跳过返回空`);
      return [];
    }

    return items;
  }

  // 生成模拟数据（当API不可用时）
  private generateMockNotes(keyword: string, category: string): any[] {
    const mockNotes = [
      {
        title: `${keyword}怎么选？这篇看完你就懂了`,
        author: '保险小达人',
        likesCount: 5200,
        commentsCount: 328,
        favoritesCount: 2100,
        sharesCount: 156
      },
      {
        title: `真心建议：普通人买${keyword}，别踩这些坑`,
        author: '保险避坑笔记',
        likesCount: 8900,
        commentsCount: 567,
        favoritesCount: 3400,
        sharesCount: 289
      },
      {
        title: `${keyword}对比测评，帮你选对不选贵`,
        author: '精算师小王',
        likesCount: 3200,
        commentsCount: 189,
        favoritesCount: 1200,
        sharesCount: 98
      },
      {
        title: `给家人的保障：${keyword}配置攻略`,
        author: '家庭保障规划',
        likesCount: 4100,
        commentsCount: 234,
        favoritesCount: 1800,
        sharesCount: 145
      },
      {
        title: `后悔没早点知道：${keyword}的内幕`,
        author: '保险揭秘',
        likesCount: 6700,
        commentsCount: 412,
        favoritesCount: 2500,
        sharesCount: 201
      }
    ];

    const now = new Date();
    return mockNotes.map((note, index) => ({
      platform: 'XHS',
      title: note.title,
      content: `关于${keyword}的详细分析...`,
      author: note.author,
      authorUrl: `https://www.xiaohongshu.com/user/profile/example${index}`,
      url: `https://www.xiaohongshu.com/discovery/item/example${index}`,
      likesCount: note.likesCount,
      favoritesCount: note.favoritesCount,
      commentsCount: note.commentsCount,
      sharesCount: note.sharesCount,
      tags: ['小红书', keyword, category],
      insuranceType: this.guessInsuranceType(category),
      viralScore: this.calculateViralScoreFromCounts(note.likesCount, note.commentsCount, note.favoritesCount),
      publishedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    }));
  }

  // 从原始API数据计算爆款分数
  private calculateViralScore(interactInfo: any): number {
    if (!interactInfo) return 0;
    return this.calculateViralScoreFromCounts(
      interactInfo.liked_count || 0,
      interactInfo.comment_count || 0,
      interactInfo.collected_count || 0
    );
  }

  // 从点赞、评论、收藏计算爆款分数
  private calculateViralScoreFromCounts(likes: number, comments: number, favorites: number): number {
    // 爆款分数算法：点赞权重0.5，评论权重0.3，收藏权重0.2
    const score = likes * 0.5 + comments * 3 + favorites * 0.8;
    return Math.round(score);
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
    const tags: string[] = ['小红书'];
    const tagPattern = /#([^#\s]+)/g;
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      tags.push(match[1]);
    }

    return tags.slice(0, 10);
  }

  // 根据分类猜测险种
  private guessInsuranceType(category: string): string {
    const mapping: Record<string, string> = {
      '重疾险': 'CRITICAL_ILLNESS',
      '医疗险': 'MEDICAL',
      '寿险': 'TERM_LIFE',
      '意外险': 'ACCIDENT',
      '年金险': 'ANNUITY',
      '家庭配置': 'FAMILY',
      '儿童': 'CHILDREN',
      '成人': 'ADULT',
      '老人': 'SENIOR',
      '达尔文': 'CRITICAL_ILLNESS',
      '超级玛丽': 'CRITICAL_ILLNESS',
      '妈咪宝贝': 'CHILDREN_CRITICAL',
      '保险知识': 'EDUCATION',
      '理赔': 'CLAIMS',
      '核保': 'UW',
      '挑选': 'SHOPPING'
    };

    return mapping[category] || 'INSURANCE';
  }
}

export default new XiaohongshuScraper();
