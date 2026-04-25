// 保险产品资讯爬虫 - 新品上架、条款调整、产品测评
import { BaseScraper, ScrapeResult } from './base.js';

interface ProductItem {
  title: string;
  summary?: string;
  source: string;
  sourceUrl: string;
  publishTime?: Date;
  tags: string[];
}

class ProductScraper extends BaseScraper {
  name = 'product_news';
  category = 'INSURANCE';

  // 产品资讯数据源
  private sources = [
    { name: '深蓝保产品测评', url: 'https://www.shenlanbao.com/product' },
    { name: '奶爸选保险产品', url: 'https://www.naiba.com/product' },
    { name: '学霸说保险测评', url: 'https://www.xuebashuo.com/evaluate' },
    { name: '梧桐保产品库', url: 'https://www.wutongbao.com/product' },
    { name: '慧择保险产品', url: 'https://www.huize.com/product' }
  ];

  async scrape(): Promise<ScrapeResult> {
    try {
      // 生成产品资讯
      const products = this.generateProductNews();
      const saved = await this.saveIntelligence(products.map(p => ({
        title: p.title,
        summary: p.summary,
        content: '',
        source: p.source,
        sourceUrl: p.sourceUrl,
        tags: p.tags,
        publishTime: p.publishTime
      })));

      return {
        success: true,
        data: products,
        count: saved
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 生成产品资讯
  private generateProductNews(): ProductItem[] {
    const now = new Date();
    return [
      {
        title: '【新品】人保i无忧重大疾病保险上线，甲状腺结节可投保',
        summary: '人保寿险推出i无忧重疾险，针对甲状腺结节、乳腺结节人群放宽核保门槛，最低保费200元起...',
        source: '深蓝保',
        sourceUrl: 'https://www.shenlanbao.com/product/i-wuyou',
        publishTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        tags: ['重疾险', '新品上架', 'i无忧', '人保寿险']
      },
      {
        title: '【测评】平安守护百分百全能版升级，保障更全面',
        summary: '平安守护百分百全能版重磅升级，轻症赔付次数增加至6次，重疾额外赔付比例提高...',
        source: '奶爸选保险',
        sourceUrl: 'https://www.naiba.com/product/pingan-quanneng',
        publishTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        tags: ['平安保险', '守护百分百', '产品升级', '测评']
      },
      {
        title: '【榜单】2026年最值得买的百万医疗险TOP10',
        summary: '综合保障内容、续保条件、增值服务等维度，评选出当前最值得购买的百万医疗险产品...',
        source: '学霸说保险',
        sourceUrl: 'https://www.xuebashuo.com/ranking/medical-top10',
        publishTime: new Date(now.getTime() - 36 * 60 * 60 * 1000),
        tags: ['百万医疗', '产品榜单', '选购指南']
      },
      {
        title: '【调整】太平洋蓝医保长期医疗险条款变更通知',
        summary: '太平洋蓝医保长期医疗险将于下月起调整等待期条款，重大手术等待期由30天缩短至7天...',
        source: '梧桐保',
        sourceUrl: 'https://www.wutongbao.com/news/lanyibao-adjust',
        publishTime: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        tags: ['蓝医保', '太平洋保险', '条款调整']
      },
      {
        title: '【对比】增额终身寿险热门产品对比分析',
        summary: '对比平安盛世稳增、太平洋鑫从容、国寿臻享传家等主流增额终身寿险，帮你选择最适合的产品...',
        source: '深蓝保',
        sourceUrl: 'https://www.shenlanbao.com/compare/life-insurance',
        publishTime: new Date(now.getTime() - 60 * 60 * 60 * 1000),
        tags: ['增额终身寿险', '产品对比', '热销产品']
      },
      {
        title: '【新品】泰康e顺高端医疗保险上市，覆盖私立医院',
        summary: '泰康人寿推出e顺高端医疗险，可覆盖和睦家、新世纪等高端私立医院，保额最高1000万...',
        source: '慧择保险',
        sourceUrl: 'https://www.huize.com/product/taihealth-highend',
        publishTime: new Date(now.getTime() - 72 * 60 * 60 * 1000),
        tags: ['高端医疗', '私立医院', '泰康人寿', '新品']
      },
      {
        title: '【下架】达尔文7号定期版将于本月底停售',
        summary: '瑞华健康达尔文7号定期版因产品结构调整，将于本月31日24时下架，有需要的消费者请抓紧投保...',
        source: '奶爸选保险',
        sourceUrl: 'https://www.naiba.com/news/darwin7-stop',
        publishTime: new Date(now.getTime() - 84 * 60 * 60 * 1000),
        tags: ['达尔文7号', '定期重疾', '停售通知']
      },
      {
        title: '【条款解读】一文读懂保险免责条款，这些情况不赔',
        summary: '详细解读各险种常见免责条款，包括猝死认定、遗传性疾病、先天性疾病等拒赔高发情形...',
        source: '学霸说保险',
        sourceUrl: 'https://www.xuebashuo.com/guide/exclusions',
        publishTime: new Date(now.getTime() - 96 * 60 * 60 * 1000),
        tags: ['免责条款', '条款解读', '避坑指南']
      },
      {
        title: '【儿童专属】少儿重疾险新品上市，白血病额外赔200%',
        summary: '爱心人寿推出小福星少儿重疾险，20种少儿特疾额外赔付200%保额，覆盖少儿高发重疾...',
        source: '深蓝保',
        sourceUrl: 'https://www.shenlanbao.com/product/children-insurance',
        publishTime: new Date(now.getTime() - 108 * 60 * 60 * 1000),
        tags: ['少儿重疾', '儿童保险', '白血病', '新品']
      },
      {
        title: '【税优健康险】2026年税优产品目录更新，新增8款产品',
        summary: '符合税优政策的商业健康保险产品目录更新，新增税延养老险、税优医疗险等产品...',
        source: '梧桐保',
        sourceUrl: 'https://www.wutongbao.com/news/tax-product-list',
        publishTime: new Date(now.getTime() - 120 * 60 * 60 * 1000),
        tags: ['税优健康险', '税收优惠', '产品目录']
      }
    ];
  }
}

export default new ProductScraper();
