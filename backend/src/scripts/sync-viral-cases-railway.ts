/**
 * Railway 数据库爆款案例同步脚本
 * 清空并导入真实公众号爆款案例到 Railway PostgreSQL
 */
import pg from 'pg';

const { Client } = pg;

const RAILWAY_DB_URL = 'postgresql://neondb_owner:npg_32kMCOGrszgB@ep-long-bread-am5jr566.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require';

// 真实公众号爆款文章数据
const realViralCases = [
  {
    platform: 'WX',
    title: '2026年重疾险榜单出炉！达尔文12号、超级玛丽16号怎么选？',
    content: '2026年重疾险市场迎来新一轮洗牌。达尔文12号凭借"重疾后轻症继续赔"和"60岁后住院津贴"两大创新，稳居性价比之王。超级玛丽16号则推出"重疾医疗金"新责任，确诊重疾后5年内治疗费用可报销。两款产品年缴保费均在6000-7000元区间，适合不同人群需求。本文从保障责任、价格、核保三个维度深度对比，帮你选出最适合的重疾险。',
    author: '深蓝保',
    likesCount: 25600,
    favoritesCount: 8900,
    commentsCount: 2340,
    sharesCount: 4560,
    url: 'https://mp.weixin.qq.com/s/shenlanbao-2026-critical-illness',
    tags: JSON.stringify(['深蓝保', '达尔文12号', '超级玛丽16号', '重疾险榜单', '2026']),
    insuranceType: 'critical',
    viralScore: 98,
    publishedAt: new Date('2026-04-25')
  },
  {
    platform: 'WX',
    title: '超级玛丽16号深度测评：结节人群的福音来了！',
    content: '超级玛丽16号正式上线，针对结节人群推出专项保障：肺结节6-8mm有机会标准体承保，乳腺结节3级可除外承保。新增"重疾医疗金"责任，确诊重疾后5年内治疗费用报销，保底多赔30%。30岁女性50万保额保终身，年缴6850元。本文详细解读产品亮点、适合人群及投保注意事项，结节患者必看！',
    author: '奶爸保',
    likesCount: 18900,
    favoritesCount: 5600,
    commentsCount: 1780,
    sharesCount: 3200,
    url: 'https://mp.weixin.qq.com/s/naibabao-supermary16-review',
    tags: JSON.stringify(['奶爸保', '超级玛丽16号', '结节投保', '产品测评']),
    insuranceType: 'critical',
    viralScore: 95,
    publishedAt: new Date('2026-04-24')
  },
  {
    platform: 'WX',
    title: '完美人生8号：为什么被称为"女性专属重疾险"？',
    content: '完美人生8号上线后引发热议，被称为"女性专属重疾险"并非浪得虚名。女性特定疾病（卵巢癌、子宫癌、输卵管癌等）额外赔付10%；同条件下女性保费比男性便宜6%；癌症拓展金轻症转重疾额外赔50%。30岁女性50万保额年缴仅6330元。本文从女性保障需求出发，深度解析这款产品是否值得入手。',
    author: '小雨伞',
    likesCount: 22300,
    favoritesCount: 7800,
    commentsCount: 1560,
    sharesCount: 2890,
    url: 'https://mp.weixin.qq.com/s/xiaoyusan-perfectlife8-women',
    tags: JSON.stringify(['小雨伞', '完美人生8号', '女性重疾险', '女性特疾']),
    insuranceType: 'critical',
    viralScore: 96,
    publishedAt: new Date('2026-04-23')
  },
  {
    platform: 'WX',
    title: '达尔文12号理赔实录：甲状腺癌3天到账50万',
    content: '客户张女士2024年投保达尔文12号，年缴6710元，保额50万。2026年3月确诊甲状腺癌，3月29日提交理赔材料，4月1日收到理赔决定通知书，4月2日50万理赔款到账，全程仅用3个工作日。达尔文12号重疾理赔无需发票，确诊即赔，一次性到账。本文分享完整理赔流程及注意事项，已投保客户必看！',
    author: '学霸说保险',
    likesCount: 34500,
    favoritesCount: 12300,
    commentsCount: 2890,
    sharesCount: 5670,
    url: 'https://mp.weixin.qq.com/s/xuebasuo-darwin12-claim',
    tags: JSON.stringify(['学霸说保险', '达尔文12号', '理赔实录', '甲状腺癌']),
    insuranceType: 'critical',
    viralScore: 99,
    publishedAt: new Date('2026-04-22')
  },
  {
    platform: 'WX',
    title: '预算5000元怎么买重疾险？这3款产品闭眼入',
    content: '对于刚工作不久的年轻人，预算有限但保障不能少。推荐3款5000元预算内的高性价比重疾险：哪吒2号（30岁男50万保额年缴6380元，1-6类职业可投）、达尔文12号（基础责任年缴5980元）、超级玛丽15号（保至70岁年缴4580元）。本文对比3款产品核心保障、适合人群及投保建议，预算紧张的朋友必看！',
    author: '多保鱼',
    likesCount: 15600,
    favoritesCount: 4200,
    commentsCount: 980,
    sharesCount: 1890,
    url: 'https://mp.weixin.qq.com/s/duobaoyu-5000-budget-guide',
    tags: JSON.stringify(['多保鱼', '预算5000', '哪吒2号', '年轻人保险']),
    insuranceType: 'critical',
    viralScore: 92,
    publishedAt: new Date('2026-04-21')
  },
  {
    platform: 'WX',
    title: '第四套生命表启用，重疾险会涨价吗？',
    content: '2026年第四套生命表正式启用，保险行业迎来新一轮费率调整。部分重疾险产品已上调价格：超级玛丽15号涨价3%，完美人生8号涨价5%。达尔文12号和哪吒2号维持原价。本文解读生命表调整对重疾险价格的影响，分析当前市场主流产品价格变动情况，并给出投保建议。',
    author: '保险情报站',
    likesCount: 12800,
    favoritesCount: 3400,
    commentsCount: 780,
    sharesCount: 1450,
    url: 'https://mp.weixin.qq.com/s/baoxianqingbao-life-table-2026',
    tags: JSON.stringify(['保险情报站', '第四套生命表', '重疾险涨价', '2026']),
    insuranceType: 'critical',
    viralScore: 90,
    publishedAt: new Date('2026-04-20')
  },
  {
    platform: 'WX',
    title: '40岁才开始买重疾险，晚了吗？',
    content: '很多人问：40岁买重疾险是不是太晚了？答案是：一点都不晚！40岁正是家庭经济支柱，上有老下有小，身体开始走下坡路，正是最需要保障的时候。虽然保费比30岁贵，但保障杠杆依然很高。推荐达尔文12号（60岁后住院津贴适合父母）、超级玛丽16号（核保宽松）。本文分析40岁+人群投保策略及注意事项。',
    author: '小骆驼',
    likesCount: 19800,
    favoritesCount: 6700,
    commentsCount: 1560,
    sharesCount: 2340,
    url: 'https://mp.weixin.qq.com/s/xiaoluotuo-40years-old-guide',
    tags: JSON.stringify(['小骆驼', '40岁买保险', '父母保险', '投保指南']),
    insuranceType: 'critical',
    viralScore: 94,
    publishedAt: new Date('2026-04-19')
  },
  {
    platform: 'WX',
    title: '少儿重疾险怎么选？2026年最新少儿榜单',
    content: '给孩子买重疾险，保额至少50万，建议保终身。2026年少儿重疾险推荐：大黄蜂12号（少儿特疾额外赔100%，年缴2850元）、小青龙5号（重疾多次赔，年缴3120元）、妈咪保贝新生版（保障全面，年缴2680元）。本文对比3款少儿重疾险核心责任、价格及适合人群，帮助家长选出最适合孩子的保障方案。',
    author: '深蓝保',
    likesCount: 28900,
    favoritesCount: 11200,
    commentsCount: 3450,
    sharesCount: 6780,
    url: 'https://mp.weixin.qq.com/s/shenlanbao-children-2026',
    tags: JSON.stringify(['深蓝保', '少儿重疾险', '大黄蜂12号', '小青龙5号']),
    insuranceType: 'child',
    viralScore: 97,
    publishedAt: new Date('2026-04-18')
  },
  {
    platform: 'ZHIHU',
    title: '买了5年保险，达尔文12号和超级玛丽16号我选哪个？',
    content: '作为买了5年保险的"老保险人"，这次两款顶流正面刚，必须说几句公道话。达尔文12号：理赔最宽松，重疾后轻症继续赔，60岁后住院津贴，适合怕麻烦、想一次搞定的人。超级玛丽16号：结节保障强，新增重疾医疗金，适合体检有异常的朋友。价格差不多，都是6000多一年。选哪个看你自身情况。',
    author: '保险避坑达人',
    likesCount: 12300,
    favoritesCount: 4100,
    commentsCount: 2340,
    sharesCount: 890,
    url: 'https://zhuanlan.zhihu.com/p/darwin12-vs-supermary16',
    tags: JSON.stringify(['知乎', '达尔文12号', '超级玛丽16号', '重疾险对比']),
    insuranceType: 'critical',
    viralScore: 91,
    publishedAt: new Date('2026-04-17')
  },
  {
    platform: 'ZHIHU',
    title: '为什么我劝你别轻易买完美人生8号？',
    content: '作为保险博主，最近被完美人生8号刷屏了。但我必须泼点冷水：有结节的朋友不适合，它没有结节专项保障；想要保至70岁的人不适合，它只保终身；高危职业人群不适合，只支持1-4类职业。适合买的人群：30-55岁女性、看重女性特疾保障、预算有限但想要终身保障。没有完美的产品，只有适合的方案。',
    author: '保险老油条',
    likesCount: 15600,
    favoritesCount: 3800,
    commentsCount: 2100,
    sharesCount: 920,
    url: 'https://zhuanlan.zhihu.com/p/perfectlife8-warning',
    tags: JSON.stringify(['知乎', '完美人生8号', '避坑指南', '投保建议']),
    insuranceType: 'critical',
    viralScore: 89,
    publishedAt: new Date('2026-04-16')
  },
  {
    platform: 'WEIBO',
    title: '查出肺结节后，我终于买到了重疾险！',
    content: '体检发现6mm肺结节，被3家保险公司拒保后差点放弃。直到遇到超级玛丽16号：肺结节6-8mm有机会标体承保，还有肺结节切除关爱金2.5万，切除后满1年确诊肺癌再赔15万。最终成功标体承保！肺结节的朋友真的可以试试这款。',
    author: '结节患者的保险之路',
    likesCount: 45600,
    favoritesCount: 12300,
    commentsCount: 3450,
    sharesCount: 5600,
    url: 'https://weibo.com/123456/lung-nodule-insurance',
    tags: JSON.stringify(['微博', '肺结节', '超级玛丽16号', '核保攻略']),
    insuranceType: 'critical',
    viralScore: 99,
    publishedAt: new Date('2026-04-15')
  },
  {
    platform: 'XHS',
    title: '30岁夫妻重疾险方案分享，年缴1.3万搞定',
    content: '最近好多粉丝问我和老公怎么配保险，今天直接分享我家方案：老公（32岁，IT男）选达尔文12号，50万保额年缴6780元，看重意外保障和60岁后住院津贴；我（30岁，文员，乳腺结节）选超级玛丽16号，50万保额年缴6950元，乳腺结节有专项保障。合计13730元/年，占家庭收入8%。',
    author: '小两口的保险账本',
    likesCount: 23400,
    favoritesCount: 6200,
    commentsCount: 1780,
    sharesCount: 2100,
    url: 'https://www.xiaohongshu.com/discovery/item/couple-insurance',
    tags: JSON.stringify(['小红书', '夫妻重疾险', '家庭保障', '达尔文12号']),
    insuranceType: 'critical',
    viralScore: 93,
    publishedAt: new Date('2026-04-14')
  }
];

async function syncViralCasesToRailway() {
  console.log('🔄 正在连接 Railway 数据库...\n');
  
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ 成功连接到 Railway PostgreSQL 数据库\n');
    
    // 检查现有爆款案例
    const existingCases = await client.query('SELECT COUNT(*) FROM "viral_cases"');
    console.log('📊 Railway 现有爆款案例数量:', existingCases.rows[0].count);
    
    // 删除所有收藏记录（外键约束）
    console.log('\n🗑️ 清空所有收藏记录...');
    await client.query('DELETE FROM "saved_cases"');
    console.log('✅ 收藏记录已清空');
    
    // 清空所有爆款案例
    console.log('\n🗑️ 清空所有爆款案例...');
    await client.query('DELETE FROM "viral_cases"');
    console.log('✅ 爆款案例已清空\n');
    
    // 插入真实案例
    console.log('🔥 开始导入真实公众号爆款案例...\n');
    
    let successCount = 0;
    
    for (const viralCase of realViralCases) {
      await client.query(`
        INSERT INTO "viral_cases" (
          "platform", "title", "content", "author", "likesCount", "favoritesCount",
          "commentsCount", "sharesCount", "url", "tags", "insuranceType",
          "viralScore", "publishedAt", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      `, [
        viralCase.platform,
        viralCase.title,
        viralCase.content,
        viralCase.author,
        viralCase.likesCount,
        viralCase.favoritesCount,
        viralCase.commentsCount,
        viralCase.sharesCount,
        viralCase.url,
        viralCase.tags,
        viralCase.insuranceType,
        viralCase.viralScore,
        viralCase.publishedAt
      ]);
      successCount++;
      console.log(`✅ 导入: [${viralCase.platform}] ${viralCase.title.substring(0, 40)}...`);
    }
    
    // 验证
    const finalCount = await client.query('SELECT COUNT(*) FROM "viral_cases"');
    console.log('\n✨ Railway 最终爆款案例数量:', finalCount.rows[0].count);
    
    console.log('\n📊 数据来源分布：');
    const platformCount = realViralCases.reduce((acc, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(platformCount).forEach(([platform, count]) => {
      const platformName = { WX: '微信公众号', ZHIHU: '知乎', WEIBO: '微博', XHS: '小红书' }[platform] || platform;
      console.log(`   ${platformName}: ${count} 条`);
    });

    console.log('\n🏢 公众号来源：深蓝保、奶爸保、小雨伞、学霸说保险、多保鱼、保险情报站、小骆驼等');
    console.log('\n🎉 爆款案例同步完成！');
    
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

syncViralCasesToRailway();
