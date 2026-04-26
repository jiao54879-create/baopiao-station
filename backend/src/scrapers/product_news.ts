// 保险产品信息采集爬虫
// 专门采集产品上架、下架、新品发布等信息
import { BaseScraper, ScrapeResult } from './base.js';
import { checkProductVersionAccuracy } from '../services/productAccuracy.js';

interface ProductNews {
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceUrl: string;
  publishTime?: Date;
  tags: string[];
  // 产品相关信息
  productName?: string;
  insuranceType?: string;
  company?: string;
  newsType: 'NEW_PRODUCT' | 'PRODUCT_UPDATE' | 'PRODUCT_OFFLINE' | 'RATE_ADJUSTMENT' | 'CLAIM_UPDATE';
}

export class ProductNewsScraper extends BaseScraper {
  constructor() {
    super({
      name: 'product_news',
      url: '',
      category: 'INSURANCE'
    });
  }

  // 产品信息来源
  private sources = [
    // 保险公司产品公告页
    {
      name: '君龙人寿-产品中心',
      url: 'https://www.jlrlife.com/product',
      type: 'company',
      keywords: ['产品', '上市', '停售', '升级']
    },
    {
      name: '复星联合-产品中心',
      url: 'https://www.fosun.com/products',
      type: 'company',
      keywords: ['产品', '新品', '停售']
    },
    // 保险信息平台
    {
      name: '深蓝保-新品速递',
      url: 'https://www.shenlanbao.com/product/new',
      type: 'platform',
      keywords: ['新品', '上线', '测评']
    },
    {
      name: '奶爸保-新品',
      url: 'https://www.naiba.com/product',
      type: 'platform',
      keywords: ['新品', '测评', '对比']
    },
    {
      name: '梧桐保-新品',
      url: 'https://www.wutongbao.com/product',
      type: 'platform',
      keywords: ['新品', '测评']
    },
    // 监管信息
    {
      name: '银保监会-产品备案',
      url: 'https://www.cbirc.gov.cn/cn/view/pages/Column.html?channelId=8a818aee72f0c8ea0172f17fb0e80293',
      type: 'regulator',
      keywords: ['备案', '产品', '保险']
    }
  ];

  // 产品关键词映射
  private productKeywords: Record<string, { type: string; company?: string }> = {
    '超级玛丽': { type: '重疾险', company: '君龙人寿' },
    '达尔文': { type: '重疾险', company: '复星联合/信泰保险' },
    '妈咪宝贝': { type: '少儿重疾险', company: '复星联合' },
    '阿波罗': { type: '重疾险', company: '昆仑健康' },
    '健康保': { type: '重疾险', company: '昆仑健康' },
    '大麦': { type: '定期寿险', company: '华贵保险' },
    '定海柱': { type: '定期寿险', company: '鼎城人寿' },
    '华贵大麦': { type: '定期寿险', company: '华贵保险' },
    '大黄蜂': { type: '少儿重疾险', company: '北京人寿' },
    '青云卫': { type: '少儿重疾险', company: '招商仁和' },
    '小青龙': { type: '少儿重疾险', company: '君龙人寿' },
    '达尔文': { type: '重疾险', company: '复星联合' },
    '完美人生': { type: '重疾险', company: '信泰保险' },
    '守卫者': { type: '重疾险', company: '昆仑健康' },
    '福特加': { type: '重疾险', company: '复星联合' },
    '康乐一生': { type: '重疾险', company: '复星联合' },
    '达尔文': { type: '重疾险', company: '信泰保险' },
    '朱雀': { type: '重疾险', company: '信泰保险' },
    '超级玛丽': { type: '重疾险', company: '和泰人寿' },
    '光武1号': { type: '重疾险', company: '和泰人寿' },
    '嘉和保': { type: '重疾险', company: '国富人寿' },
    '无忧人生': { type: '重疾险', company: '人保寿险' },
    'i保': { type: '重疾险', company: '阳光保险' },
    '太平': { type: '重疾险', company: '太平人寿' },
    '国寿福': { type: '重疾险', company: '中国人寿' },
    '平安福': { type: '重疾险', company: '中国平安' },
    '金福人生': { type: '重疾险', company: '太平洋人寿' }
  };

  async scrape(): Promise<ScrapeResult> {
    const allNews: ProductNews[] = [];
    const accuracyWarnings: string[] = [];

    try {
      // 抓取各数据源
      for (const source of this.sources) {
        try {
          const items = await this.scrapeSource(source);
          allNews.push(...items);
        } catch (e) {
          console.log(`数据源 ${source.name} 抓取失败`);
        }
      }

      // 如果没有数据，不使用mock，直接返回
      if (allNews.length === 0) {
        console.log('[产品新闻] 所有来源均无数据返回');
      }

      // 信息准确率自检：检查产品版本
      for (const news of allNews) {
        const check = checkProductVersionAccuracy(news.title, news.content);
        if (check && !check.isValid) {
          accuracyWarnings.push(check.suggestion);
          console.log(`[准确率自检] ${check.suggestion}`);
        }
      }

      // 保存到数据库
      const saved = await this.saveIntelligence(allNews.map(n => ({
        title: n.title,
        summary: n.summary,
        content: n.content,
        source: n.source,
        sourceUrl: n.sourceUrl,
        tags: n.tags,
        publishTime: n.publishTime
      })));

      return {
        success: true,
        data: { news: allNews, accuracyWarnings },
        count: saved
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async scrapeSource(source: any): Promise<ProductNews[]> {
    const news: ProductNews[] = [];

    try {
      const $ = await this.fetch(source.url);

      // 通用列表解析
      $('ul li, .item, .article, .news-item').each((_, elem) => {
        const $elem = $(elem);
        const $link = $elem.find('a').first();
        const title = $link.text().trim();
        const url = $link.attr('href');

        if (title && url && this.containsKeywords(title, source.keywords)) {
          const parsed = this.parseProductNews(title, source.name, url);
          if (parsed) {
            news.push(parsed);
          }
        }
      });
    } catch (e) {
      console.log(`页面抓取失败: ${source.url}`);
    }

    return news;
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(k => text.includes(k));
  }

  private parseProductNews(title: string, source: string, url: string): ProductNews | null {
    let newsType: ProductNews['newsType'] = 'PRODUCT_UPDATE';
    let productName = '';
    let insuranceType = '';
    let company = '';

    // 识别产品名称
    for (const [name, info] of Object.entries(this.productKeywords)) {
      if (title.includes(name)) {
        productName = name;
        insuranceType = info.type;
        company = info.company || '';
        break;
      }
    }

    // 识别新闻类型
    if (/新(品|上|发|推|发)/.test(title)) {
      newsType = 'NEW_PRODUCT';
    } else if (/下架|停售|停发/.test(title)) {
      newsType = 'PRODUCT_OFFLINE';
    } else if (/升级|优化|调整|新增/.test(title)) {
      newsType = 'PRODUCT_UPDATE';
    } else if (/费率|价格|保费/.test(title)) {
      newsType = 'RATE_ADJUSTMENT';
    } else if (/理赔|给付|赔付/.test(title)) {
      newsType = 'CLAIM_UPDATE';
    }

    // 生成摘要
    const summary = this.generateProductSummary(title, newsType, productName, insuranceType);

    return {
      title,
      summary,
      content: '',
      source,
      sourceUrl: url.startsWith('http') ? url : `https://${url}`,
      publishTime: new Date(),
      tags: this.generateProductTags(title, insuranceType, company, newsType),
      productName,
      insuranceType,
      company,
      newsType
    };
  }

  private generateProductSummary(title: string, newsType: string, productName: string, insuranceType: string): string {
    const summaries: Record<string, string> = {
      'NEW_PRODUCT': `${productName || '某产品'}新品上线，${insuranceType}领域新选择`,
      'PRODUCT_OFFLINE': `${productName || '某产品'}即将停售，有投保需求请抓紧`,
      'PRODUCT_UPDATE': `${productName || '某产品'}产品升级，保障更全面`,
      'RATE_ADJUSTMENT': `${insuranceType}费率调整，最新价格信息请关注`,
      'CLAIM_UPDATE': `${productName || '某产品'}理赔规则更新`
    };
    return summaries[newsType] || '保险产品相关信息';
  }

  private generateProductTags(title: string, insuranceType: string, company: string, newsType: string): string[] {
    const tags = ['保险产品', '资讯'];

    if (insuranceType) tags.push(insuranceType);
    if (company) tags.push(company);
    if (newsType) tags.push(this.getNewsTypeTag(newsType));

    // 从标题提取关键词
    const titleKeywords = ['重疾', '寿险', '医疗', '意外', '少儿', '成人', '定期', '终身', '多次赔付', '单次赔付'];
    for (const kw of titleKeywords) {
      if (title.includes(kw) && !tags.includes(kw)) {
        tags.push(kw);
      }
    }

    return tags;
  }

  private getNewsTypeTag(newsType: string): string {
    const map: Record<string, string> = {
      'NEW_PRODUCT': '新品上线',
      'PRODUCT_OFFLINE': '停售下架',
      'PRODUCT_UPDATE': '产品升级',
      'RATE_ADJUSTMENT': '费率调整',
      'CLAIM_UPDATE': '理赔更新'
    };
    return map[newsType] || '产品资讯';
  }

  private generateMockProductNews(): ProductNews[] {
    const now = new Date();
    return [
      {
        title: '超级玛丽13号正式上线，重症赔付再加码',
        summary: '君龙人寿超级玛丽13号重疾险正式上线，在超级玛丽12号基础上升级重症赔付次数',
        content: '',
        source: '君龙人寿官网',
        sourceUrl: 'https://www.jlrlife.com/product/13',
        publishTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        tags: ['新品上线', '重疾险', '超级玛丽', '君龙人寿'],
        productName: '超级玛丽13号',
        insuranceType: '重疾险',
        company: '君龙人寿',
        newsType: 'NEW_PRODUCT'
      },
      {
        title: '达尔文10号超越版来袭，价格更优保障不变',
        summary: '复星联合健康险到达尔文10号超越版，对比原版费率下调约5%',
        content: '',
        source: '复星联合官网',
        sourceUrl: 'https://www.fosun.com/product/10',
        publishTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        tags: ['新品上线', '重疾险', '达尔文', '复星联合'],
        productName: '达尔文10号超越版',
        insuranceType: '重疾险',
        company: '复星联合健康险',
        newsType: 'NEW_PRODUCT'
      },
      {
        title: '妈咪宝贝MAX版少儿重疾险全面升级',
        summary: '复星联合升级旗下王牌少儿重疾险，新增重度癌症二次赔付',
        content: '',
        source: '深蓝保',
        sourceUrl: 'https://www.shenlanbao.com/article/mmbb-max',
        publishTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        tags: ['产品升级', '少儿重疾', '妈咪宝贝', '复星联合'],
        productName: '妈咪宝贝MAX版',
        insuranceType: '少儿重疾险',
        company: '复星联合健康险',
        newsType: 'PRODUCT_UPDATE'
      },
      {
        title: '华贵大麦2024定期寿险将于本月底停售',
        summary: '华贵保险通知，大麦2024定期寿险因产品迭代将于4月30日停售',
        content: '',
        source: '华贵保险官网',
        sourceUrl: 'https://www.huaguilife.cn/product/2024',
        publishTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        tags: ['停售下架', '定期寿险', '大麦', '华贵保险'],
        productName: '大麦2024定期寿险',
        insuranceType: '定期寿险',
        company: '华贵保险',
        newsType: 'PRODUCT_OFFLINE'
      },
      {
        title: '多款网红重疾险费率调整通知',
        summary: '根据银保监会要求，多款热门重疾险产品费率进行调整',
        content: '',
        source: '13个精算师',
        sourceUrl: 'https://mp.weixin.qq.com/s/rate-adjust',
        publishTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        tags: ['费率调整', '重疾险', '行业动态'],
        productName: '',
        insuranceType: '重疾险',
        company: '',
        newsType: 'RATE_ADJUSTMENT'
      }
    ];
  }
}

export default new ProductNewsScraper();
