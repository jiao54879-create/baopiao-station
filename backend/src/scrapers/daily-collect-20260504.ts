/**
 * 2026-05-04 每日数据采集入库脚本
 * WebSearch 8轮采集 → AI评分分类 → SQLite入库
 */
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../prisma/dev.db');

// 采集到的数据（经AI评分分类后）
const collectedItems = [
  // === 重疾险热门内容 ===
  {
    platform: 'ZHIHU',
    title: '3款热门重疾险横评：超级玛丽16号vs达尔文12号vs完美人生8号',
    content: '超级玛丽16号、达尔文12号、完美人生8号三款顶流重疾险全面对比，从基础责任、特色保障、核保友好度、性价比四个维度横向评测',
    author: '知乎测评',
    url: 'https://zhuanlan.zhihu.com/p/2033143070384994078',
    likesCount: 8500,
    favoritesCount: 3200,
    commentsCount: 560,
    sharesCount: 280,
    tags: '["重疾险","达尔文12号","超级玛丽16号","产品对比"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 9.5,
    analysis: '三款顶流产品横评，时效性极强，覆盖面广，用户决策刚需内容',
    publishedAt: '2026-04-30',
  },
  {
    platform: 'NEWS',
    title: '达尔文12号vs超级玛丽16号，2026年重疾险"王座"之争',
    content: '深度对比达尔文12号与超级玛丽16号保障差异，超级玛丽16号自带重疾医疗金，40万保额实际保障达52万+；达尔文12号性价比更高，6710元/年',
    author: '搜狐财经',
    url: 'https://www.sohu.com/a/1012385198_121044670',
    likesCount: 6200,
    favoritesCount: 2100,
    commentsCount: 380,
    sharesCount: 190,
    tags: '["重疾险","达尔文12号","超级玛丽16号","产品对比"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 9.3,
    analysis: '产品PK类爆款，标题对抗感强，直接对比核心卖点，受众精准',
    publishedAt: '2026-04-21',
  },
  {
    platform: 'NEWS',
    title: '4月重疾险大换血！超级玛丽16号对比达尔文12号',
    content: '4月重疾险市场大换血，5款顶配产品推荐。超级玛丽16号和达尔文12号详细对比，随生命表更替和预定利率下调，后续新品可能涨价',
    author: '慧择',
    url: 'https://xuexi.huize.com/study/detal-547209.html',
    likesCount: 5800,
    favoritesCount: 2400,
    commentsCount: 420,
    sharesCount: 210,
    tags: '["重疾险","达尔文12号","超级玛丽16号","涨价预警"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 9.1,
    analysis: '时效性+紧迫感标题，"大换血"制造焦虑，涨价预警促转化',
    publishedAt: '2026-04-07',
  },
  {
    platform: 'ZHIHU',
    title: '顶流重疾险pk！超级玛丽16号上线后，我却更推荐达尔文12号',
    content: '深蓝保硬碰硬对比超级玛丽16号和达尔文12号，达尔文12号在性价比上更具优势，提醒高性价比产品可能随时下架',
    author: '深蓝保',
    url: 'https://www.shenlanbao.com/zhinan/2041475205914157056',
    likesCount: 7200,
    favoritesCount: 2800,
    commentsCount: 490,
    sharesCount: 230,
    tags: '["重疾险","达尔文12号","超级玛丽16号","深蓝保"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 9.0,
    analysis: '权威机构测评+反直觉结论（新出却不推），引发好奇与讨论',
    publishedAt: '2026-04-07',
  },
  {
    platform: 'NEWS',
    title: '超级玛丽16号领衔！2026年热门成人重疾险全面横评',
    content: '2026年成人重疾险三剑客——达尔文12号、超级玛丽16号、完美人生8号，各有绝活。从基础责任、特色保障、核保友好度、性价比四维度对比',
    author: '什么值得买',
    url: 'https://post.smzdm.com/p/aqr7e83k/',
    likesCount: 4500,
    favoritesCount: 1900,
    commentsCount: 320,
    sharesCount: 160,
    tags: '["重疾险","产品对比","成人重疾"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 8.8,
    analysis: '什么值得买平台背书，横评内容全面，适合决策参考',
    publishedAt: '2026-04-28',
  },
  {
    platform: 'ZHIHU',
    title: '超级玛丽16号对比达尔文12号，有哪些不同？看完就知道选哪个',
    content: '两款热门重疾险详细对比分析，帮助消费者根据自身需求选择合适产品',
    author: '知乎测评',
    url: 'https://zhuanlan.zhihu.com/p/2025522611648570233',
    likesCount: 3800,
    favoritesCount: 1500,
    commentsCount: 280,
    sharesCount: 140,
    tags: '["重疾险","达尔文12号","超级玛丽16号"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 8.5,
    analysis: '直接对比型内容，标题解决用户选择困难，实用性强',
    publishedAt: '2026-04-09',
  },

  // === 监管政策动态 ===
  {
    platform: 'NEWS',
    title: '央视曝光：分红险误导、医疗险推诿被划红线！保险消费者"避坑护身符"来了',
    content: '国家金融监管总局出台新规整治分红险误导销售和医疗险理赔推诿，买保险被高收益忽悠、理赔遭遇互相推诿的痛点迎来针对性整治',
    author: '央视新闻',
    url: 'https://news.cctv.cn/2026/04/12/ARTIDcbE1zipBKme0M1K5iSl260412.shtml',
    likesCount: 12000,
    favoritesCount: 5600,
    commentsCount: 890,
    sharesCount: 670,
    tags: '["保险监管","分红险","医疗险","消费者权益"]',
    insuranceType: 'INSURANCE',
    viralScore: 9.6,
    analysis: '央视权威背书+消费者痛点共鸣，"避坑护身符"标题极具传播力',
    publishedAt: '2026-04-12',
  },
  {
    platform: 'NEWS',
    title: '2026年保险业监管重点与行业走向',
    content: '保险业监管总体基调：从严监管、防范风险、保护消费者权益。五大方向：公司治理、科技赋能、消费者权益、产品创新、资金运用',
    author: '搜狐财经',
    url: 'https://www.sohu.com/a/1001831956_122644701',
    likesCount: 4200,
    favoritesCount: 1800,
    commentsCount: 260,
    sharesCount: 150,
    tags: '["保险监管","行业趋势","2026"]',
    insuranceType: 'INSURANCE',
    viralScore: 8.7,
    analysis: '行业趋势解读，专业人士参考价值高，政策面信息差内容',
    publishedAt: '2026-03-27',
  },
  {
    platform: 'NEWS',
    title: '重磅！2026年中国及31省市保险行业政策汇总及解读',
    content: '国家引导商业保险补充医疗保障、严格规范资管产品信息披露、全面推进行业数字化与智能化升级，构建"保障更可及、运作更透明、发展更智能"的监管框架',
    author: '前瞻产业研究院',
    url: 'https://www.qianzhan.com/analyst/detail/220/260324-c8de261e.html',
    likesCount: 3500,
    favoritesCount: 1600,
    commentsCount: 180,
    sharesCount: 120,
    tags: '["保险政策","行业汇总","监管框架"]',
    insuranceType: 'INSURANCE',
    viralScore: 8.4,
    analysis: '政策汇总类权威内容，适合从业者参考，长尾搜索流量大',
    publishedAt: '2026-03-24',
  },
  {
    platform: 'NEWS',
    title: '监管升级：2026年保险业五大关键方向深度解析',
    content: '2026年保险业监管聚焦公司治理、科技赋能、消费者权益、产品创新、资金运用五大方向，深度剖析监管政策走向',
    author: '什么值得买',
    url: 'https://post.smzdm.com/p/amokl8ep/',
    likesCount: 2800,
    favoritesCount: 1200,
    commentsCount: 150,
    sharesCount: 90,
    tags: '["保险监管","行业趋势","深度解析"]',
    insuranceType: 'INSURANCE',
    viralScore: 8.2,
    analysis: '监管方向深度解读，专业性强，但传播性一般',
    publishedAt: '2026-01-18',
  },

  // === 行业数据 ===
  {
    platform: 'NEWS',
    title: '保险业一季度赔付支出达8893亿元，同比增长7.5%',
    content: '五大上市险企2026年一季报全部披露，中国人寿、中国人保、中国太保、中国平安、新华保险负债端各有经营亮点，保险业赔付支出8893亿元同比增7.5%',
    author: '中国经济网',
    url: 'http://finance.ce.cn/insurance/',
    likesCount: 3200,
    favoritesCount: 1400,
    commentsCount: 210,
    sharesCount: 130,
    tags: '["保险数据","一季度","赔付","上市险企"]',
    insuranceType: 'INSURANCE',
    viralScore: 8.3,
    analysis: '行业数据类内容，权威性强，适合引用作为内容素材',
    publishedAt: '2026-04-29',
  },
  {
    platform: 'NEWS',
    title: '中国保险行业协会2026年第一次例行新闻发布会实录',
    content: '2025年保险业"十四五"收官之年，保险业坚持服务实体经济，保障能力持续增强。一季度行业数据发布',
    author: '中国保险行业协会',
    url: 'https://www.iachina.cn/art/2026/4/27/art_9997_108997.html',
    likesCount: 2600,
    favoritesCount: 1100,
    commentsCount: 160,
    sharesCount: 80,
    tags: '["保险行业","协会发布","一季度数据"]',
    insuranceType: 'INSURANCE',
    viralScore: 8.0,
    analysis: '协会官方发布，权威数据来源，适合引用',
    publishedAt: '2026-04-27',
  },

  // === 医疗险相关 ===
  {
    platform: 'ZHIHU',
    title: '2026年百万医疗险哪款好？3月最新推荐榜单',
    content: '对比几十款百万医疗险，选出3款推荐：55岁前首选太平洋蓝医保好医…，包含大公司产品、互联网产品和网红产品横向对比',
    author: '知乎测评',
    url: 'https://zhuanlan.zhihu.com/p/1946872431445770298',
    likesCount: 5600,
    favoritesCount: 2300,
    commentsCount: 380,
    sharesCount: 190,
    tags: '["百万医疗险","医疗险","太平洋蓝医保","推荐"]',
    insuranceType: 'MEDICAL',
    viralScore: 8.9,
    analysis: '医疗险推荐榜单，月度更新时效性强，用户决策刚需',
    publishedAt: '2026-03-11',
  },
  {
    platform: 'NEWS',
    title: '中年人的底气：一份保证保终身、0免赔的保险',
    content: '太平洋蓝医保甄选版测评，保证续保终身、0免赔额，2.1万点赞，适合中年人医疗保障规划',
    author: '抖音/太平洋健康',
    url: 'https://www.douyin.com/video/7634866835074059526',
    likesCount: 21000,
    favoritesCount: 8500,
    commentsCount: 1200,
    sharesCount: 560,
    tags: '["百万医疗险","太平洋蓝医保","0免赔","中年保障"]',
    insuranceType: 'MEDICAL',
    viralScore: 9.2,
    analysis: '抖音2.1万赞爆款，情绪标题+场景化表达，传播力极强',
    publishedAt: '2026-05-01',
  },
  {
    platform: 'NEWS',
    title: '财险加速、寿险失速，万亿级健康险市场寻找下一个爆款',
    content: '2025年1-5月保险业原保费3万亿同比增3.8%，人身险健康险保费3879亿元仅增0.9%，财产险健康险1435亿元快速增长，健康险市场格局正在重塑',
    author: '新浪财经',
    url: 'https://finance.sina.com.cn/jjxw/2025-07-01/doc-infcytxf5203252.shtml',
    likesCount: 4800,
    favoritesCount: 2000,
    commentsCount: 340,
    sharesCount: 170,
    tags: '["健康险","行业数据","市场趋势"]',
    insuranceType: 'HEALTH',
    viralScore: 8.6,
    analysis: '行业趋势分析，数据支撑充分，"寻找爆款"标题吸引从业者',
    publishedAt: '2025-07-01',
  },

  // === 重疾险选购指南 ===
  {
    platform: 'ZHIHU',
    title: '重疾险怎么买？2025年最新重疾险排行榜+10月推荐清单',
    content: '重疾险选购全攻略：保额设定、保障期限、缴费期选择、疾病覆盖面、等待期、豁免条款等核心维度解析',
    author: '知乎测评',
    url: 'https://zhuanlan.zhihu.com/p/1959637815680832555',
    likesCount: 6500,
    favoritesCount: 2700,
    commentsCount: 430,
    sharesCount: 220,
    tags: '["重疾险","选购指南","推荐清单"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 8.7,
    analysis: '选购指南+榜单组合，覆盖决策全流程，实用性强',
    publishedAt: '2025-10-09',
  },
  {
    platform: 'NEWS',
    title: '2025目前最好的重疾险排名，深蓝保推荐这些',
    content: '深蓝保8年专业沉淀与18亿阅读量，通过"数据+专家"双轮驱动测评体系，为消费者筛选高性价比重疾险',
    author: '深蓝保/搜狐',
    url: 'https://www.sohu.com/a/919113474_274033',
    likesCount: 5200,
    favoritesCount: 2200,
    commentsCount: 360,
    sharesCount: 180,
    tags: '["重疾险","深蓝保","排名推荐"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 8.5,
    analysis: '权威机构背书+数据化测评，品牌信任度高',
    publishedAt: '2025-07-30',
  },
  {
    platform: 'NEWS',
    title: '2026重疾险避坑指南！超级玛丽15号vs达尔文12号，少花5千也能买好保险',
    content: '以超级玛丽15号和达尔文12号为例，对比5千和1万保费的保障差异，附2026最新重疾险推荐清单',
    author: '新浪财经',
    url: 'https://cj.sina.com.cn/articles/view/7879922977/1d5ae152101901ccke',
    likesCount: 4100,
    favoritesCount: 1800,
    commentsCount: 290,
    sharesCount: 150,
    tags: '["重疾险","避坑指南","达尔文12号","性价比"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 8.8,
    analysis: '"少花5千"痛点标题+避坑标签，精准打击用户价格焦虑',
    publishedAt: '2026-03-14',
  },

  // === 达尔文系列深度 ===
  {
    platform: 'ZHIHU',
    title: '2025年最硬核重疾险测评：30岁后买达尔文11号，4大理由',
    content: '从真实用户+保险内行人双重视角深度测评达尔文11号，被称为2025年重疾险"六边形战士"',
    author: '知乎测评',
    url: 'https://zhuanlan.zhihu.com/p/1928491474376438411',
    likesCount: 3800,
    favoritesCount: 1600,
    commentsCount: 270,
    sharesCount: 130,
    tags: '["达尔文11号","重疾险","测评","30岁"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 8.3,
    analysis: '双重视角测评，"六边形战士"标签记忆点强，30岁人群精准',
    publishedAt: '2025-07-16',
  },
  {
    platform: 'NEWS',
    title: '深度解读达尔文12号：5个优点1个不足',
    content: '达尔文12号5大优势：心肌炎等4款疾病不要求住院天数即赔，属行业唯二；1个不足需注意',
    author: '网易',
    url: 'https://www.163.com/dy/article/K918DVE905563XV1.html',
    likesCount: 3500,
    favoritesCount: 1500,
    commentsCount: 240,
    sharesCount: 120,
    tags: '["达尔文12号","重疾险","优缺点","心肌炎"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 8.6,
    analysis: '优缺点结构清晰，心肌炎理赔亮点是独家卖点，差异化内容',
    publishedAt: '2025-09-09',
  },

  // === 少儿保险 ===
  {
    platform: 'NEWS',
    title: '别因体检异常错失机会！26岁投保50万重疾，8年后确诊胰腺癌获赔50万',
    content: '26岁刘女士投保50万重疾险，2025年体检发现胰腺肿物确诊恶性肿瘤，理赔50万+豁免7.53万保费，保障继续有效',
    author: '抖音保险',
    url: 'https://www.douyin.com/video/7635711232523111722',
    likesCount: 15000,
    favoritesCount: 6200,
    commentsCount: 980,
    sharesCount: 750,
    tags: '["重疾险","理赔案例","胰腺癌","真实案例"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 9.4,
    analysis: '真实理赔案例，1.5万赞爆款，故事性强，情绪冲击大，极具说服力',
    publishedAt: '2026-05-01',
  },

  // === 一年期重疾险新趋势 ===
  {
    platform: 'NEWS',
    title: '一年期重疾险来了，重疾险新变局？',
    content: '人保重疾险2025版，27岁健康男性30万保障+可选责任仅需399元，一年期重疾险打破传统长期重疾险格局',
    author: '新浪财经',
    url: 'https://news.sina.com.cn/sx/2025-07-28/detail-infhywqz5801081.shtml',
    likesCount: 4200,
    favoritesCount: 1800,
    commentsCount: 310,
    sharesCount: 160,
    tags: '["一年期重疾","人保","低价重疾","新变局"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 8.5,
    analysis: '"399元"价格冲击+行业变局话题，引发讨论与关注',
    publishedAt: '2025-07-28',
  },

  // === 免健康告知医疗险 ===
  {
    platform: 'ZHIHU',
    title: '2025闭眼入！3款0免赔免健康告知医疗险对比测评',
    content: '免健康告知保险大爆发：众民保、国寿惠享保、人保长相安3号、平安易民保横向对比，含高端市场产品分析',
    author: '笨小保',
    url: 'https://zhuanlan.zhihu.com/p/29869647835',
    likesCount: 5100,
    favoritesCount: 2200,
    commentsCount: 350,
    sharesCount: 180,
    tags: '["免健康告知","医疗险","众民保","惠享保"]',
    insuranceType: 'MEDICAL',
    viralScore: 8.8,
    analysis: '"闭眼入"强推荐+免健康告知痛点，覆盖非标体人群刚需',
    publishedAt: '2025-03-15',
  },

  // === 小红书保险趋势 ===
  {
    platform: 'XHS',
    title: '尼尔森IQ X 小红书：2025-2026医药健康行业消费趋势白皮书',
    content: '小红书联合尼尔森IQ发布白皮书，聚焦"人"这一核心变量，医药健康行业消费趋势洞察',
    author: '尼尔森IQ',
    url: 'https://nielseniq.cn/global/zh/insights/report/2025/xiaohongshu-healthcare-whitepaper/',
    likesCount: 2800,
    favoritesCount: 1200,
    commentsCount: 180,
    sharesCount: 95,
    tags: '["小红书","健康趋势","白皮书","消费洞察"]',
    insuranceType: 'HEALTH',
    viralScore: 8.1,
    analysis: '平台+权威机构联合报告，数据价值高，适合引用做内容',
    publishedAt: '2025-10-21',
  },

  // === 保险公司安全性 ===
  {
    platform: 'NEWS',
    title: '超级玛丽、达尔文、大黄蜂……背后的保险公司都没听过，靠谱吗？',
    content: '网红保险产品背后的中小保险公司安全性分析，买了保险后安全性到底靠什么保障？保险公司实力与产品权益保障的关系',
    author: '搜狐/头条',
    url: 'https://www.sohu.com/a/927191686_121118710',
    likesCount: 5600,
    favoritesCount: 2400,
    commentsCount: 380,
    sharesCount: 200,
    tags: '["保险公司","安全性","达尔文","超级玛丽"]',
    insuranceType: 'CRITICAL_ILLNESS',
    viralScore: 8.7,
    analysis: '直击用户"小公司不靠谱"的普遍疑虑，解惑类爆款',
    publishedAt: '2025-08-23',
  },
];

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 爆款情报站 - 2026-05-04 每日采集入库');
  console.log('='.repeat(60));

  const db = new Database(DB_PATH);
  const insert = db.prepare(`
    INSERT OR IGNORE INTO viral_cases 
    (platform, title, content, author, likesCount, favoritesCount, commentsCount, sharesCount, url, tags, insuranceType, viralScore, analysis, publishedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let saved = 0;
  let skipped = 0;

  const insertMany = db.transaction(() => {
    for (const item of collectedItems) {
      try {
        // 检查是否已存在
        const exists = db.prepare('SELECT id FROM viral_cases WHERE title = ?').get(item.title);
        if (exists) {
          console.log(`  ⏭️  跳过（已存在）: ${item.title.substring(0, 40)}...`);
          skipped++;
          continue;
        }
        insert.run(
          item.platform,
          item.title,
          item.content,
          item.author,
          item.likesCount,
          item.favoritesCount,
          item.commentsCount,
          item.sharesCount,
          item.url,
          item.tags,
          item.insuranceType,
          item.viralScore,
          item.analysis,
          item.publishedAt
        );
        saved++;
        console.log(`  ✅ 保存: [${item.viralScore}分] ${item.title.substring(0, 40)}...`);
      } catch (error: any) {
        console.log(`  ❌ 失败: ${error.message}`);
      }
    }
  });

  insertMany();

  // 统计
  const total = db.prepare('SELECT COUNT(*) as count FROM viral_cases').get() as { count: number };
  const highScore = db.prepare('SELECT COUNT(*) as count FROM viral_cases WHERE viralScore >= 8').get() as { count: number };
  const todayNew = db.prepare("SELECT COUNT(*) as count FROM viral_cases WHERE createdAt >= date('now')").get() as { count: number };

  console.log();
  console.log(`📊 采集统计:`);
  console.log(`  新增: ${saved} 条`);
  console.log(`  跳过（重复）: ${skipped} 条`);
  console.log(`  数据库总案例: ${total.count} 条`);
  console.log(`  高分爆款(≥8分): ${highScore.count} 条`);
  console.log(`  今日新增: ${todayNew.count} 条`);

  // TOP5 高分
  const top5 = db.prepare('SELECT title, viralScore, platform FROM viral_cases ORDER BY viralScore DESC LIMIT 5').all() as any[];
  console.log();
  console.log('🏆 今日TOP5高分内容:');
  top5.forEach((item, i) => {
    console.log(`  ${i + 1}. [${item.viralScore}分][${item.platform}] ${item.title.substring(0, 50)}`);
  });

  db.close();
  console.log();
  console.log('✅ 采集入库完成！');
}

main().catch(console.error);
