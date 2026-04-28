/**
 * 爆款案例种子数据 - 2026年4月最新爆款内容
 * 运行方式: npx tsx src/scripts/seed-viral-cases.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 2026年4月最新爆款案例数据
const viralCases = [
  {
    platform: 'WX',
    title: '超级玛丽16号上线！40万保额变60万，这个创新太炸了',
    content: '等了3个月，超级玛丽16号终于上线了！这次玩了个新花样——重疾医疗金。简单说就是确诊重疾后，5年内治疗费用还能报销，保底多赔30%。像我闺蜜买的40万保额，万一不幸确诊癌症，实际能拿到52万+！而且结节人群这次核保也很友好，肺结节6-8mm有机会标体承保。需要了解详情的评论区见~',
    author: '保险小能手',
    likesCount: 15800,
    favoritesCount: 3200,
    commentsCount: 856,
    sharesCount: 1240,
    url: 'https://mp.weixin.qq.com/s/example1',
    tags: JSON.stringify(['超级玛丽16号', '重疾医疗金', '新品测评', '结节人群']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 95,
    publishedAt: new Date('2026-04-27')
  },
  {
    platform: 'ZHIHU',
    title: '2026年达尔文12号vs超级玛丽16号，买了5年保险的人告诉你怎么选',
    content: '作为买了5年保险的"老保险人"，这次两款顶流正面刚，必须说几句公道话。\n\n达尔文12号：理赔最宽松没有之一！重疾后轻症继续赔，60岁后还有住院津贴。适合我这种怕麻烦、想一次搞定的人。\n\n超级玛丽16号：结节保障真的强，而且新增了重疾医疗金。适合体检有异常的朋友。\n\n价格差不多，都是6000多一年。选哪个看你自身情况，不懂就问我。',
    author: '保险避坑达人',
    likesCount: 12300,
    favoritesCount: 4100,
    commentsCount: 2340,
    sharesCount: 890,
    url: 'https://www.zhihu.com/p/example1',
    tags: JSON.stringify(['达尔文12号', '超级玛丽16号', '重疾险对比', '选购建议']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 92,
    publishedAt: new Date('2026-04-25')
  },
  {
    platform: 'XHS',
    title: '40岁才开始买重疾险，晚了吗？',
    content: '后台一直被问这个问题，统一回复：一点都不晚！\n\n我妈妈就是42岁才买的达尔文12号，当时还被业务员嫌弃年龄大。现在50岁了，年缴7000多，保额50万。\n\n很多人觉得40岁买保险贵，但其实：\n1️⃣ 40岁正是家庭经济支柱，上有老下有小\n2️⃣ 这个年龄段身体开始走下坡路\n3️⃣ 保费虽然贵，但保障杠杆还是很高\n\n关键是选对产品，达尔文12号60岁后住院津贴就很适合给父母买。',
    author: '90后保险日记',
    likesCount: 28900,
    favoritesCount: 7800,
    commentsCount: 1560,
    sharesCount: 2100,
    url: 'https://www.xiaohongshu.com/discovery/item/example1',
    tags: JSON.stringify(['40岁买保险', '达尔文12号', '父母保险', '重疾险']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 98,
    publishedAt: new Date('2026-04-24')
  },
  {
    platform: 'WX',
    title: '女性买重疾险必看！完美人生8号凭什么被称为"女性专属"？',
    content: '完美人生8号上线后后台炸了，全是问这款产品的。今天详细说说为什么它被称为女性专属重疾险：\n\n1️⃣ 女性特定疾病额外赔10%：卵巢癌、子宫癌、输卵管癌等统统额外赔\n2️⃣ 保费女性更优惠：同条件下比男性便宜6%，30岁女性年缴6330\n3️⃣ 癌症拓展金轻→重额外赔50%：原位癌→肺癌这种路径直接多赔25万\n4️⃣ 核保对女性常见病友好：子宫肌瘤、卵巢囊肿都能标准体\n\n如果你也是30-55岁女性，这款真的可以考虑。',
    author: '女性保障规划师',
    likesCount: 19800,
    favoritesCount: 5600,
    commentsCount: 1230,
    sharesCount: 1800,
    url: 'https://mp.weixin.qq.com/s/example2',
    tags: JSON.stringify(['完美人生8号', '女性重疾险', '女性特疾', '产品测评']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 96,
    publishedAt: new Date('2026-04-23')
  },
  {
    platform: 'WEIBO',
    title: '救命！查出肺结节后我终于买到了保险',
    content: '体检发现6mm肺结节，被3家保险公司拒保后，我差点放弃。直到遇到超级玛丽16号...[\n\n之前情况：\n- 体检发现6mm磨玻璃肺结节\n- 线上智能核保直接拒\n- 线下投保被延期1年\n\n后来了解到超级玛丽16号：\n- 肺结节6-8mm有机会标体承保\n- 还有肺结节切除关爱金2.5万\n- 切除后满1年确诊肺癌再赔15万\n\n最终成功标体承保！肺结节的朋友真的可以试试这款。\n\n#肺结节 #重疾险 #保险攻略',
    author: '结节患者的保险之路',
    likesCount: 45600,
    favoritesCount: 12300,
    commentsCount: 3450,
    sharesCount: 5600,
    url: 'https://weibo.com/u/example1',
    tags: JSON.stringify(['肺结节', '超级玛丽16号', '核保攻略', '结节投保']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 99,
    publishedAt: new Date('2026-04-22')
  },
  {
    platform: 'XHS',
    title: '预算5000怎么买重疾险？我选了哪吒2号',
    content: '刚毕业月薪6000，刨去房租生活费，能用来买保险的预算只有5000。\n\n研究了达尔文12号、超级玛丽15号、哪吒2号后，我选了哪吒2号：\n\n✅ 30岁男性50万保额保终身，年缴6380元\n✅ 1-6类职业都能买（我是摄影师，平时要爬高）\n✅ 医院范围广，私立也能报销\n✅ 癌症津贴25万，比别家多5万\n\n很多人觉得便宜没好货，但哪吒2号该有的保障一样不落，就是把营销费用省下来让利给用户了。\n\n刚投保成功，分享给和我一样预算紧张但想要保障的年轻人！',
    author: '北漂小李的攒钱日记',
    likesCount: 18200,
    favoritesCount: 4200,
    commentsCount: 980,
    sharesCount: 1350,
    url: 'https://www.xiaohongshu.com/discovery/item/example2',
    tags: JSON.stringify(['哪吒2号', '预算5000', '年轻人保险', '性价比']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 94,
    publishedAt: new Date('2026-04-21')
  },
  {
    platform: 'ZHIHU',
    title: '为什么我劝你别轻易买完美人生8号？',
    content: '作为保险博主，最近被完美人生8号刷屏了。但我必须泼点冷水，这款产品并不适合所有人。\n\n❌ 不适合买完美人生8号的人群：\n1. 有结节的朋友——它没有结节专项保障，建议选超级玛丽16号\n2. 想要保至70岁的人——它只保终身\n3. 高危职业人群——只支持1-4类职业\n\n✅ 适合买完美人生8号的人群：\n1. 30-55岁女性\n2. 看重女性特疾保障\n3. 预算有限但想要终身保障\n\n总之，没有完美的产品，只有适合的方案。买之前一定要看清楚条款！',
    author: '保险老油条',
    likesCount: 15600,
    favoritesCount: 3800,
    commentsCount: 2100,
    sharesCount: 920,
    url: 'https://www.zhihu.com/p/example2',
    tags: JSON.stringify(['完美人生8号', '避坑指南', '重疾险测评', '注意事项']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 90,
    publishedAt: new Date('2026-04-20')
  },
  {
    platform: 'WX',
    title: '2026年4月重疾险榜单！这款产品竟然涨价了',
    content: '第四套生命表启用后，重疾险市场迎来新一轮调整。部分产品已经涨价，但达尔文12号竟然还维持原价...\n\n4月最新重疾险价格变动分析：\n\n涨价产品：\n- 超级玛丽15号：上调3%\n- 完美人生8号：上调5%\n\n维持原价：\n- 达尔文12号：依然是6710元/年（30岁男50万）\n- 哪吒2号：依然是6380元/年\n\n新增产品：\n- 超级玛丽16号：6850元/年（新增重疾医疗金）\n\n结论：还没上车的朋友，达尔文12号和哪吒2号依然是价格最稳定的选项。',
    author: '保险情报站',
    likesCount: 8900,
    favoritesCount: 2100,
    commentsCount: 560,
    sharesCount: 780,
    url: 'https://mp.weixin.qq.com/s/example3',
    tags: JSON.stringify(['2026年4月榜单', '重疾险涨价', '达尔文12号', '价格分析']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 88,
    publishedAt: new Date('2026-04-19')
  },
  {
    platform: 'DOUYIN',
    title: '30岁夫妻怎么买重疾险？我家方案分享',
    content: '最近好多粉丝问我和老公怎么配保险，今天直接分享我家方案：\n\n👨 老公（32岁，IT男，熬夜多）：\n- 达尔文12号，50万保额保终身\n- 年缴6780元\n- 理由：看重意外保障和60岁后住院津贴\n\n👩 我（30岁，文员，体检有乳腺结节）：\n- 超级玛丽16号，50万保额保终身\n- 年缴6950元\n- 理由：乳腺结节有专项保障\n\n💰 合计：13730元/年，占家庭收入8%\n\n很多人觉得贵，但重疾险是兜底保障，宁可不用不能没有。两个都选保终身，避免保障断档。',
    author: '小两口的保险账本',
    likesCount: 23400,
    favoritesCount: 6200,
    commentsCount: 1780,
    sharesCount: 2100,
    url: 'https://www.douyin.com/video/example1',
    tags: JSON.stringify(['夫妻重疾险', '达尔文12号', '超级玛丽16号', '家庭保障']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 93,
    publishedAt: new Date('2026-04-18')
  },
  {
    platform: 'XHS',
    title: '理赔实录：达尔文12号重疾险3天到账50万',
    content: '上周刚理赔成功，今天必须来分享！\n\n理赔经过：\n- 3月28日：确诊甲状腺癌\n- 3月29日：提交理赔材料\n- 4月1日：收到理赔决定通知书\n- 4月2日：50万到账\n\n说实话没想到这么快，之前看网上说重疾险理赔难，这次体验完全不一样。达尔文12号轻症/重疾都能直接赔，而且50万一次性到账，不用发票报销。\n\n当时买的50万保额，年缴6710元，交了2年。这次理赔相当于用1.3万撬动50万，杠杆率38倍。\n\n希望大家都用不上，但万一用到，有保障真的很安心。',
    author: '甲状腺癌康复者',
    likesCount: 56700,
    favoritesCount: 15600,
    commentsCount: 4560,
    sharesCount: 8900,
    url: 'https://www.xiaohongshu.com/discovery/item/example3',
    tags: JSON.stringify(['达尔文12号', '理赔实录', '甲状腺癌', '重疾险理赔']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 99,
    publishedAt: new Date('2026-04-17')
  },
  {
    platform: 'ZHIHU',
    title: '超级玛丽16号vs达尔文12号：保险经纪人内部资料泄露',
    content: '作为保险经纪人，今天不推荐产品，只做客观对比，给大家参考：\n\n【基础保障对比】\n- 达尔文12号：110种重疾+30种轻症+45种轻症\n- 超级玛丽16号：110种重疾+30种轻症+轻症\n\n【核心差异】\n- 达尔文12号：中症赔60%，意外重疾额外35%，60岁后住院津贴\n- 超级玛丽16号：中症赔75%，重疾医疗金，结节保障\n\n【核保差异】\n- 达尔文12号：结节1-2级标准体，3级可能除外\n- 超级玛丽16号：肺结节6-8mm可标体，不问拒保记录\n\n【适合人群】\n- 达尔文12号：健康体、看重晚年保障\n- 超级玛丽16号：结节人群、高压人群\n\n客观来说，两款都是好产品，关键是找对适合自己的。',
    author: '保险精算师阿明',
    likesCount: 18900,
    favoritesCount: 5200,
    commentsCount: 2670,
    sharesCount: 1450,
    url: 'https://www.zhihu.com/p/example3',
    tags: JSON.stringify(['超级玛丽16号', '达尔文12号', '内部对比', '经纪人视角']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 94,
    publishedAt: new Date('2026-04-16')
  },
  {
    platform: 'WEIBO',
    title: '#2026年要不要买重疾险# 听这5个故事再做决定',
    content: '5个真实的理赔故事告诉你，为什么重疾险是刚需。\n\n看了后台留言，发现很多人还在犹豫要不要买重疾险。分享5个真实故事：\n\n1️⃣ @小林：买了达尔文12号，甲状腺癌理赔50万，治疗花了8万，剩下42万还房贷\n2️⃣ @阿花：没买重疾险，肺癌自费花了30万，只能卖房治病\n3️⃣ @老王：买了哪吒2号，急性心梗理赔50万，现在在家休养不用担心收入\n4️⃣ @小美：买了完美人生8号，乳腺癌理赔55万（含女性特疾10%），用了靶向药\n5️⃣ @张叔：买了达尔文12号，住院15天，每天领500元津贴，共7500元\n\n重疾险不是花冤枉钱，是给家人留一条退路。#保险# #重疾险#',
    author: '保险观察日记',
    likesCount: 34500,
    favoritesCount: 9800,
    commentsCount: 2340,
    sharesCount: 6700,
    url: 'https://weibo.com/u/example2',
    tags: JSON.stringify(['重疾险故事', '理赔案例', '为什么要买保险', '真实案例']),
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 96,
    publishedAt: new Date('2026-04-15')
  }
];

async function seedViralCases() {
  console.log('🔥 开始导入2026年4月最新爆款案例...\n');

  let successCount = 0;
  let updateCount = 0;

  for (const viralCase of viralCases) {
    try {
      // 检查是否已存在
      const existing = await prisma.viralCase.findFirst({
        where: { title: viralCase.title }
      });

      if (existing) {
        // 更新现有案例
        await prisma.viralCase.update({
          where: { id: existing.id },
          data: {
            content: viralCase.content,
            author: viralCase.author,
            likesCount: viralCase.likesCount,
            favoritesCount: viralCase.favoritesCount,
            commentsCount: viralCase.commentsCount,
            sharesCount: viralCase.sharesCount,
            viralScore: viralCase.viralScore,
            publishedAt: viralCase.publishedAt,
            tags: viralCase.tags,
            insuranceType: viralCase.insuranceType
          }
        });
        updateCount++;
        console.log(`🔄 更新: ${viralCase.title.substring(0, 40)}...`);
      } else {
        // 创建新案例
        const created = await prisma.viralCase.create({
          data: viralCase
        });
        successCount++;
        console.log(`✅ 新增: ${viralCase.title.substring(0, 40)}...`);
      }
    } catch (error) {
      console.error(`❌ 导入失败: ${viralCase.title}`, error);
    }
  }

  console.log(`\n✨ 爆款案例导入完成！新增 ${successCount} 条，更新 ${updateCount} 条`);
}

// 运行
seedViralCases()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
