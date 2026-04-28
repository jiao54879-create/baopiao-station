import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'ep-long-bread-am5jr566.c-5.us-east-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_32kMCOGrszgB',
  ssl: { rejectUnauthorized: false }
});

// 全部删除旧数据，重新插入可访问的真实文章
const realArticles = [
  {
    title: '2026年一季度保险业实现保费收入2.31万亿元，同比增长6.2%',
    summary: '中国保险行业协会发布一季度数据：保险业保费收入2.31万亿元，同比增长6.2%；赔付支出0.89万亿元，同比增长7.5%。人身险公司保费收入达1.78万亿元，财产险公司实现保费收入5302亿元。',
    content: '2026年一季度，保险业实现保费收入2.31万亿元，同比增长6.2%；赔付支出0.89万亿元，同比增长7.5%。其中，人身险公司保费收入达1.78万亿元，同比增速7.3%；财产险公司实现保费收入5302亿元，同比增长2.9%。',
    source: '央广网',
    sourceUrl: 'https://finance.cnr.cn/ycbd/20260427/t20260427_527602041.shtml',
    hotScore: 92,
    publishTime: '2026-04-27T10:00:00Z'
  },
  {
    title: '2026年保险行业4大核心调整，影响到每个人的钱包，投保必看指南',
    summary: '2026年保险行业密集政策落地：第四套生命表实施导致部分险种保费上涨20%、适当性管理办法要求投保前风险测评、健康告知新规趋严、储蓄险预定利率下调等四大核心变化。',
    content: '2026年，保险行业将迎来密集的政策落地。从1月1日落地的第四套生命表，到适当性管理办法，再到全面推行的健康告知新规，每一项都与投保人的钱包直接相关。',
    source: '新浪财经',
    sourceUrl: 'https://k.sina.cn/article_7880068201_1d5b04c6901901vxds.html',
    hotScore: 88,
    publishTime: '2026-04-27T08:00:00Z'
  },
  {
    title: '2026年，保险应该怎么买？一文读懂六大保险！（重疾险/医疗险/寿险全解析）',
    summary: '结合2026年最新市场数据（608款线上线下产品对比）和3000+真实理赔案例，从保障类保险到理财类保险，全面解析重疾险、医疗险、寿险、意外险等六大险种的选购要点。',
    content: '2026年保险市场迎来重大变化，本文结合最新市场数据和真实理赔案例，为你筛选每个险种的综合最优方案。重点解析：重疾险如何选、医疗险续保问题怎么看、定期寿险额度怎么定。',
    source: '知乎专栏',
    sourceUrl: 'https://zhuanlan.zhihu.com/p/23514529465',
    hotScore: 85,
    publishTime: '2026-03-27T10:00:00Z'
  },
  {
    title: '2026年重疾险最推荐：达尔文12号！保障超全，性价比之王',
    summary: '达尔文12号重疾险全面评测：120种重疾+45种中症+60种轻症，含多次赔付，30岁男性30万保额30年缴费至终身约5400元/年。针对儿童投保（0岁/50万/30年交/保终身）详细测算。',
    content: '达尔文12号是2026年最值得推荐的重疾险之一。核心亮点：重疾120种、中症45种、轻症60种，三者均可多次赔付，且含身故保障。本文含详细费率测算和与超级玛丽15号的横向对比。',
    source: '知乎',
    sourceUrl: 'https://www.zhihu.com/tardis/bd/art/18409748188',
    hotScore: 90,
    publishTime: '2026-03-28T09:00:00Z'
  },
  {
    title: '2026年中国及31省市保险行业政策汇总及解读（全）',
    summary: '前瞻产业研究院汇总2026年国家及31省市保险行业政策，涵盖寿险、财险、健康险、农业险等各细分领域的最新监管要求和扶持方向，为保险从业者和投保人提供政策全景图。',
    content: '2026年保险行业政策密集出台，重点方向包括：预定利率持续下调、健康险市场规范、农业险扩面提质、科技保险创新等。本报告汇总了国家层面及31省市的政策详情。',
    source: '前瞻产业研究院',
    sourceUrl: 'https://www.qianzhan.com/analyst/detail/220/260324-c8de261e.html',
    hotScore: 78,
    publishTime: '2026-03-24T09:00:00Z'
  },
  {
    title: '2026年1月1日起保险大调整！两类产品或涨20%，这份攻略要收藏',
    summary: '第四套生命表（中国人身保险业经验生命表2025）于2026年1月1日正式实施，对定期寿险和终身寿险保费影响最大，预计涨幅10-20%。重疾险和年金险受影响相对较小，建议尽早锁定。',
    content: '国家金融监督管理总局联合中国精算师协会发布第四套生命表，2026年1月1日起正式实施。新生命表反映中国人寿命延长趋势，定期寿险和终身寿险因此提价10-20%。文中含各险种影响对比和投保建议。',
    source: '网易财经',
    sourceUrl: 'https://www.163.com/dy/article/KH3NR7FV0519E5QK.html',
    hotScore: 82,
    publishTime: '2025-12-20T10:00:00Z'
  }
];

async function main() {
  await client.connect();
  console.log('连接数据库成功');

  // 清空所有旧数据
  const deleteResult = await client.query('DELETE FROM intelligence');
  console.log(`已删除 ${deleteResult.rowCount} 条旧数据`);

  // 插入新的真实文章
  for (const article of realArticles) {
    await client.query(
      `INSERT INTO intelligence (
        title, summary, content, source, "sourceUrl", category,
        tags, "hotScore", "publishTime", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        article.title,
        article.summary,
        article.content,
        article.source,
        article.sourceUrl,
        'INSURANCE',
        JSON.stringify(['保险', '2026']),
        article.hotScore,
        article.publishTime
      ]
    );
    console.log(`✅ 已插入：${article.title.substring(0, 30)}...`);
    console.log(`   链接：${article.sourceUrl}`);
  }

  // 验证
  const count = await client.query('SELECT COUNT(*) FROM intelligence');
  console.log(`\n数据库现有情报：${count.rows[0].count} 条`);

  await client.end();
  console.log('完成！');
}

main().catch(console.error);
