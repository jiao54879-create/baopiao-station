// 教育行业数据采集
import { BaseScraper, ScrapeResult } from './base.js';
import axios from 'axios';

export class EducationScraper extends BaseScraper {
  constructor() {
    super({
      name: '教育行业',
      url: '',
      category: 'EDUCATION'
    });
  }

  async scrape(): Promise<ScrapeResult> {
    const allItems: any[] = [];

    const results = await Promise.allSettled([
      this.scrapeMoe(),
      this.scrapeEdu163(),
      this.scrapeSinaEdu()
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

  private async scrapeMoe(): Promise<any[]> {
    const items: any[] = [];
    try {
      const response = await axios.get(
        'http://www.moe.gov.cn/srcsite/A06/',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
        }
      );
      return items;
    } catch (e: any) {
      console.log('教育部抓取失败:', e.message);
    }
    return items;
  }

  private async scrapeEdu163(): Promise<any[]> {
    const items: any[] = [];
    try {
      const response = await axios.get(
        'https://edu.163.com/article/',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
        }
      );
      return items;
    } catch (e: any) {
      console.log('网易教育抓取失败:', e.message);
    }
    return items;
  }

  private async scrapeSinaEdu(): Promise<any[]> {
    const items: any[] = [];
    try {
      const response = await axios.get(
        'https://edu.sina.com.cn/',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
        }
      );
      return items;
    } catch (e: any) {
      console.log('新浪教育抓取失败:', e.message);
    }
    return items;
  }
}

export default new EducationScraper();
