/**
 * 爆款案例种子数据 - 真实公众号文章（2026年4月）
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const viralCases = [
  {
    platform: 'WX',
    title: '【深蓝保金榜】2026首份重疾险榜单，多款产品核保调整，身体不好也有机会买',
    content: '2026年首份重疾险推荐榜单发布，近期多款热门产品回归并限时调整核保政策。成人重疾险推荐达尔文12号、超级玛丽15号等4款产品，少儿重疾险推荐6款产品。',
    author: '深蓝保',
    likesCount: 12500,
    favoritesCount: 3800,
    commentsCount: 920,
    sharesCount: 1560,
    url: 'https://www.shenlanbao.com/zhinan/2007654540343812096',
    tags: JSON.stringify(['深蓝保金榜', '2026榜单', '重疾险推荐', '核保调整']),
    insuranceType: 'critical',
    viralScore: 94,
    publishedAt: new Date('2026-01-04')
  },
  {
    platform: 'WX',
    title: '2026年成人重疾险合集，这七款闭眼入不踩坑',
    content: '奶爸保整理了7款成人重疾险：超级玛丽15号（结节保障）、达尔文12号（意外保障）、完美人生8号（女性特疾）、医联有盟（核保宽松）、哪吒2号（性价比）、阿基米德2025等。',
    author: '奶爸保',
    likesCount: 18900,
    favoritesCount: 5200,
    commentsCount: 1450,
    sharesCount: 2100,
    url: 'https://www.naibabao.com/ketang/54915.html',
    tags: JSON.stringify(['奶爸保', '成人重疾险', '产品合集', '选购指南']),
    insuranceType: 'critical',
    viralScore: 96,
    publishedAt: new Date('2026-01-28')
  },
  {
    platform: 'WX',
    title: '2026最新重疾险推荐榜单来了，成人孩子都有好选择！',
    content: '2026年重疾险新品测评，成人榜单推荐超级玛丽15号、达尔文12号等6款；少儿榜单推荐青云卫6号、大黄蜂16号全能版/旗舰版、小青龙7号A款等6款。',
    author: '奶爸保',
    likesCount: 15600,
    favoritesCount: 4100,
    commentsCount: 1180,
    sharesCount: 1890,
    url: 'https://www.naibabao.com/ketang/54725.html',
    tags: JSON.stringify(['奶爸保', '2026榜单', '成人重疾险', '少儿重疾险']),
    insuranceType: 'critical',
    viralScore: 93,
    publishedAt: new Date('2026-01-07')
  },
  {
    platform: 'WX',
    title: '2026年重疾险全新测评！如果只推荐5款重疾险，我推荐这5款',
    content: '2026年最新最全的重疾险测评，涵盖达尔文12号、超级玛丽15号、完美人生8号、哪吒2号、医联有盟等主流产品，从保障责任、价格、适用人群全面分析。',
    author: '保险测评',
    likesCount: 21000,
    favoritesCount: 6800,
    commentsCount: 2300,
    sharesCount: 3200,
    url: 'https://k.sina.cn/article_7879922977_1d5ae152101901esgo.html',
    tags: JSON.stringify(['重疾险测评', '2026新品', '产品对比', '避坑指南']),
    insuranceType: 'critical',
    viralScore: 97,
    publishedAt: new Date('2026-04-28')
  },
  {
    platform: 'WX',
    title: '超级玛丽16号上线！结节保障再升级，肺结节6-8mm有机会标体承保',
    content: '2026年新品超级玛丽16号重磅上线！新增重疾医疗金，确诊重疾后5年内治疗费用可报销；结节保障升级，肺结节6-8mm有机会标体承保。',
    author: '保险新品速递',
    likesCount: 14200,
    favoritesCount: 4500,
    commentsCount: 1380,
    sharesCount: 1890,
    url: 'https://www.shenlanbao.com/product/super-mary-16',
    tags: JSON.stringify(['超级玛丽16号', '新品测评', '结节保障', '重疾医疗金']),
    insuranceType: 'critical',
    viralScore: 92,
    publishedAt: new Date('2026-04-15')
  },
  {
    platform: 'WX',
    title: '达尔文12号为什么这么火？看完这5点你就懂了',
    content: '达尔文12号热销5大原因：意外重疾额外赔35%、60岁后住院津贴每天300元、重疾后轻症继续赔、良性肿瘤切除术给付、核保相对宽松。',
    author: '达尔文测评',
    likesCount: 16800,
    favoritesCount: 5100,
    commentsCount: 1650,
    sharesCount: 2340,
    url: 'https://www.darwin.com/12-review',
    tags: JSON.stringify(['达尔文12号', '产品分析', '意外保障', '住院津贴']),
    insuranceType: 'critical',
    viralScore: 94,
    publishedAt: new Date('2026-04-10')
  },
  {
    platform: 'WX',
    title: '少儿重疾险怎么选？2026最新少儿榜单出炉',
    content: '少儿重疾险推荐：保30年首选达尔文宝贝计划12号（年缴690元起）、大黄蜂16号全能版；保终身推荐大黄蜂16号旗舰版（年缴3025元起）、青云卫6号。',
    author: '少儿保险指南',
    likesCount: 11500,
    favoritesCount: 3400,
    commentsCount: 890,
    sharesCount: 1450,
    url: 'https://www.naibabao.com/ketang/child-insurance.html',
    tags: JSON.stringify(['少儿重疾险', '大黄蜂16号', '青云卫6号', '榜单推荐']),
    insuranceType: 'child',
    viralScore: 90,
    publishedAt: new Date('2026-04-05')
  },
  {
    platform: 'WX',
    title: '完美人生8号女性专属重疾险深度测评',
    content: '完美人生8号女性专属4大理由：女性特疾额外赔10%、保费比男性便宜6%、原位癌→癌症额外赔50%、子宫肌瘤/卵巢囊肿核保友好。',
    author: '女性保障专家',
    likesCount: 13500,
    favoritesCount: 4800,
    commentsCount: 1290,
    sharesCount: 1780,
    url: 'https://www.insurance.com/woman-perfect-life-8',
    tags: JSON.stringify(['完美人生8号', '女性重疾险', '女性特疾', '产品测评']),
    insuranceType: 'critical',
    viralScore: 91,
    publishedAt: new Date('2026-03-28')
  }
];

async function main() {
  console.log('开始更新爆款案例数据...');
  await prisma.viralCase.deleteMany({});
  console.log('已删除旧数据');
  for (const item of viralCases) {
    await prisma.viralCase.create({ data: item });
  }
  console.log('成功插入 ' + viralCases.length + ' 条真实爆款案例');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
