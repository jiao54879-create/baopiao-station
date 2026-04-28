/**
 * 保险情报种子数据 - 2026年4月最新资讯
 * 运行方式: npx tsx src/scripts/seed-intelligence.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 2026年4月最新保险情报数据
const intelligences = [
  {
    title: '超级玛丽16号正式上线！创新"重疾医疗金"40万变60万',
    summary: '上个月超级玛丽15号火速下架后，超级玛丽16号强势接棒，新增重疾医疗金创新责任，确诊重疾后5年内治疗费用可报销，保底多赔30%。',
    content: '超级玛丽16号由君龙人寿承保，核心创新在于"重疾医疗金"：确诊重疾后5年内治疗费用可报销，保底多赔30%，最高多赔50%。此外结节保障依然强劲，肺结节6-8mm有机会标准体承保。30岁男性50万保额年缴约6850元。',
    source: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn/wm/2026-04-27/doc-inhvwwmq9290827.shtml',
    category: 'INSURANCE',
    tags: JSON.stringify(['超级玛丽16号', '君龙人寿', '重疾医疗金', '新品上线']),
    hotScore: 98,
    publishTime: new Date('2026-04-27'),
    isProductNews: true,
    productNewsType: 'NEW_PRODUCT'
  },
  {
    title: '2026年保险新规4月执行！人身险、车险、医疗险全面调整',
    summary: '国家金融监管总局发布2026年4月新规，涉及人身险、车险、医疗险等多个领域，强化"奖优罚劣"市场导向，扩大保障范围。',
    content: '新规要点：1）人身险：提高风险保障比例，优化核保流程；2）车险：继续深化费改，强化安全驾驶激励；3）医疗险：扩大既往症可赔范围，提升带病体保障。整体来看，投保将更规范，保障将更全面。',
    source: '搜狐',
    sourceUrl: 'https://www.sohu.com/a/1005493664_121614155',
    category: 'INSURANCE',
    tags: JSON.stringify(['保险新规', '2026年4月', '人身险', '医疗险']),
    hotScore: 92,
    publishTime: new Date('2026-04-25'),
    isProductNews: false,
    productNewsType: null
  },
  {
    title: '太平洋健康险发布蓝医保2026新品，中高端医疗险迭代',
    summary: '太平洋健康险召开蓝医保·中高端医疗险2026新品发布会，新产品以健康告知宽松、既往症可赔、全年龄段覆盖为亮点。',
    content: '4月23日，太平洋健康险发布蓝医保2026新品，主要升级：1）健康告知更宽松，包容更多带病体；2）既往症可赔，打破传统医疗险壁垒；3）覆盖全年龄段，从婴幼儿到老年均可投保。这标志着商业健康险向"带病可保"方向加速转型。',
    source: '雪球',
    sourceUrl: 'https://xueqiu.com/8954933447/385474827',
    category: 'INSURANCE',
    tags: JSON.stringify(['太平洋健康险', '蓝医保', '中高端医疗险', '既往症']),
    hotScore: 85,
    publishTime: new Date('2026-04-23'),
    isProductNews: true,
    productNewsType: 'NEW_PRODUCT'
  },
  {
    title: '2026年重疾险"王座之争"：达尔文12号 vs 超级玛丽16号',
    summary: '超级玛丽16号上线后，与达尔文12号形成正面竞争。达尔文12号主打理赔宽松和晚年保障，超级玛丽16号主打结节保障和重疾医疗金。',
    content: '两款顶流产品对比：达尔文12号优势在于60岁后住院津贴500元/天、意外重疾额外赔35%、重疾后轻症继续赔无间隔期；超级玛丽16号优势在于结节保障最强（肺/乳腺/甲状腺结节专项）、重疾医疗金保底多赔30%、45岁前保额可翻倍。价格方面两者接近，30岁男性50万保额约6700-6850元/年。',
    source: '搜狐/奶爸保险',
    sourceUrl: 'https://www.sohu.com/a/1012385198_121044670',
    category: 'INSURANCE',
    tags: JSON.stringify(['达尔文12号', '超级玛丽16号', '重疾险对比', '顶流产品']),
    hotScore: 95,
    publishTime: new Date('2026-04-21'),
    isProductNews: false,
    productNewsType: null
  },
  {
    title: '2026年保险行业4大核心调整，影响每个人钱包',
    summary: '2026年保险行业迎来密集政策落地，包括第四套生命表实施、适当性管理办法生效、产品定价改革等，投保门槛提高但保障更规范。',
    content: '2026年4大调整：1）第四套生命表1月1日启用，人均寿命延长至78.4岁，影响年金险涨价、重疾险略微涨价；2）适当性管理办法2月生效，投保前需完成风险测评；3）产品定价改革预定利率下调；4）偿付能力新规实施倒计时，险企引战增资加速。',
    source: '新浪',
    sourceUrl: 'https://k.sina.cn/article_7880068201_1d5b04c6901901vxds.html',
    category: 'INSURANCE',
    tags: JSON.stringify(['保险新规', '第四套生命表', '2026年调整', '保费影响']),
    hotScore: 88,
    publishTime: new Date('2026-04-20'),
    isProductNews: false,
    productNewsType: null
  },
  {
    title: '6款成人重疾险硬核横评！超级玛丽16、达尔文12、阿基米德等',
    summary: '2026年4月最新成人重疾险横评，涵盖超级玛丽16号、达尔文12号、完美人生8号、哪吒2号等6款热门产品，从保障、价格、核保多维度对比。',
    content: '横评结论：1）结节人群首选超级玛丽16号；2）标准健康体首选达尔文12号（理赔最宽松）；3）女性首选完美人生8号；4）高危职业/预算紧张首选哪吒2号；5）看重性价比可选阿基米德。价格区间：30岁男性50万保额6380-6850元/年。',
    source: '知乎',
    sourceUrl: 'https://zhuanlan.zhihu.com/p/2027861940026844283',
    category: 'INSURANCE',
    tags: JSON.stringify(['重疾险横评', '达尔文12号', '超级玛丽16号', '完美人生8号', '哪吒2号']),
    hotScore: 90,
    publishTime: new Date('2026-04-15'),
    isProductNews: false,
    productNewsType: null
  },
  {
    title: '第四套生命表启用！重疾险真的涨价了吗？',
    summary: '2026年1月1日起第四套生命表正式启用，分析显示年金险涨价明显，重疾险涨价幅度有限，建议把握窗口期。',
    content: '第四套生命表核心变化：人均寿命从74.4岁延长至78.4岁，死亡率下降。对保险影响：1）年金险：涨价10-20%，因为长寿意味着领钱更久；2）重疾险：涨价幅度有限（2%-8%），因为重疾发生率变化不大；3）寿险：可能降价。建议有需求的消费者在涨价全面落地前尽早配置。',
    source: '太平洋保险',
    sourceUrl: 'https://www.cpic.com.cn/c/2026-04-02/1881464.shtml',
    category: 'INSURANCE',
    tags: JSON.stringify(['第四套生命表', '重疾险涨价', '保费调整', '窗口期']),
    hotScore: 82,
    publishTime: new Date('2026-04-12'),
    isProductNews: false,
    productNewsType: 'RATE_ADJUSTMENT'
  },
  {
    title: '2026终身重疾险深度测评：3款热门产品怎么选不踩坑',
    summary: '2026年最新终身重疾险深度测评，涵盖达尔文12号、超级玛丽15号、完美人生8号，从保障、价格、核保、适合人群全面分析。',
    content: '测评结论：1）达尔文12号：理赔最宽松，重疾后轻症继续赔、60岁后住院津贴、意外额外赔，适合看重晚年保障和理赔确定性的用户；2）超级玛丽15号：结节保障最强、45岁前保额翻倍，适合有结节和高压人群；3）完美人生8号：女性专属费率优惠、女性特疾额外赔，适合职场女性。',
    source: '谱蓝保',
    sourceUrl: 'https://www.pulanbx.com/other/227479.html',
    category: 'INSURANCE',
    tags: JSON.stringify(['终身重疾险', '达尔文12号', '超级玛丽15号', '完美人生8号', '测评']),
    hotScore: 87,
    publishTime: new Date('2026-04-09'),
    isProductNews: false,
    productNewsType: null
  },
  {
    title: '重疾险三强对决！超级玛丽/达尔文/完美人生核心选购指南',
    summary: '2026年重疾险市场竞争激烈，超级玛丽15号、达尔文12号、完美人生8号三款顶流产品各具特色，精准匹配不同人群需求。',
    content: '选购指南：1）超级玛丽15号：结节+癌症保障首选，肺结节切除可赔，45岁前翻倍；2）达尔文12号：理赔门槛最低，终身多次赔无年龄限制，60岁后住院津贴；3）完美人生8号：女性首选，女性特疾额外赔+10%，保费女性更优惠。三款产品价格接近，30岁男性约6650-6770元/年。',
    source: '沃保网',
    sourceUrl: 'https://news.vobao.com/article/1165396159122594590.shtml',
    category: 'INSURANCE',
    tags: JSON.stringify(['超级玛丽15号', '达尔文12号', '完美人生8号', '选购指南']),
    hotScore: 89,
    publishTime: new Date('2026-04-04'),
    isProductNews: false,
    productNewsType: null
  },
  {
    title: '达尔文12号vs超级玛丽16号：2026年重疾险市场最新对比',
    summary: '超级玛丽16号作为超级玛丽15号的升级版，与达尔文12号进行全面对比，从基础保障、核保政策、保费等方面分析各自优势。',
    content: '核心差异：1）达尔文12号：轻症/中症在重疾后继续赔（无间隔期）、60岁后住院津贴500元/天、意外重疾额外赔35%、轻症也能参与关爱金；2）超级玛丽16号：中症赔75%（比达尔文高15%）、重疾医疗金保底多赔30%、结节保障全面领先。适合人群：达尔文适合标准健康体，超级玛丽适合有结节人群。',
    source: '什么值得买',
    sourceUrl: 'https://post.smzdm.com/p/az8w96qo/',
    category: 'INSURANCE',
    tags: JSON.stringify(['达尔文12号', '超级玛丽16号', '重疾险对比', '产品分析']),
    hotScore: 91,
    publishTime: new Date('2026-04-04'),
    isProductNews: false,
    productNewsType: null
  },
  {
    title: '长城人寿今年推8款新型重疾险，引战发债补充资本',
    summary: '财联社报道，长城人寿今年已推出8款新型重疾险，并发布引战计划，目标5年内将总资产做大至千亿规模。',
    content: '长城人寿2026年产品策略：1）新品布局：密集推出8款新型重疾险，覆盖不同人群需求；2）资本补充：发布引战计划，引入战略投资者；3）战略目标：未来5年总资产达到千亿规模。偿付能力新规实施在即，多家险企加速引战增资以满足新要求。',
    source: '财联社',
    sourceUrl: 'https://m.cls.cn/detail/774498',
    category: 'INSURANCE',
    tags: JSON.stringify(['长城人寿', '重疾险新品', '引战增资', '险企动态']),
    hotScore: 75,
    publishTime: new Date('2026-03-28'),
    isProductNews: true,
    productNewsType: 'NEW_PRODUCT'
  },
  {
    title: '2026重疾险三强对决！超级玛丽/达尔文/完美人生核心选购指南',
    summary: '2026年重疾险三强产品全面对比，超级玛丽15号结节保障强、达尔文12号理赔宽松、完美人生8号女性友好。',
    content: '三强选购指南：1）超级玛丽15号：结节+癌症保障首选（君龙人寿），肺结节切除赔2.5万+肺癌15万，45岁前翻倍；2）达尔文12号：理赔最宽松首选（复星联合），重疾后轻症继续赔，60岁后住院津贴500元/天；3）完美人生8号：女性首选（复星联合），女性特疾额外赔10%，保费女性更优惠。',
    source: '新浪',
    sourceUrl: 'https://k.sina.cn/article_7857141524_1d452771401901q0og.html',
    category: 'INSURANCE',
    tags: JSON.stringify(['超级玛丽15号', '达尔文12号', '完美人生8号', '重疾险选购']),
    hotScore: 86,
    publishTime: new Date('2026-03-31'),
    isProductNews: false,
    productNewsType: null
  },
  {
    title: '2026顶流重疾险测评！超级玛丽15号、达尔文12号、哪吒2号',
    summary: '2026年最新顶流重疾险测评，超级玛丽15号结节保障强、达尔文12号理赔宽松、哪吒2号性价比最高。',
    content: '测评结论：哪吒2号（海保人寿）：极致性价比首选，30岁男性6380元/年，1-6类职业可投保；超级玛丽15号（君龙人寿）：结节+45岁前翻倍首选；达尔文12号（复星联合）：理赔最宽松、终身多次赔无年龄限制首选。附加险建议：癌症津贴三款均可；重疾多次赔保终身选达尔文12号，保至70岁选哪吒2号。',
    source: '新浪',
    sourceUrl: 'https://k.sina.cn/article_7879922977_1d5ae152101901e256.html',
    category: 'INSURANCE',
    tags: JSON.stringify(['超级玛丽15号', '达尔文12号', '哪吒2号', '顶流测评']),
    hotScore: 93,
    publishTime: new Date('2026-04-11'),
    isProductNews: false,
    productNewsType: null
  },
  {
    title: '2026年重疾险怎么选？内行人对比两款顶流',
    summary: '2026年热门重疾险对比，达尔文12号和超级玛丽15号各具特色，分别适合不同人群。',
    content: '内行选购建议：1）达尔文12号：理赔门槛最低，重疾后轻症继续赔，60岁后有住院津贴，意外有额外保障，适合追求全面保障的用户；2）超级玛丽15号：结节保障最强，45岁前保额可翻倍，癌症津贴要求宽松，适合有结节和高压人群。两款价格接近，约6650-6710元/年。',
    source: '慧择保险网',
    sourceUrl: 'https://xuexi.huize.com/study/detal-520100.html',
    category: 'INSURANCE',
    tags: JSON.stringify(['达尔文12号', '超级玛丽15号', '产品对比', '选购建议']),
    hotScore: 84,
    publishTime: new Date('2026-04-01'),
    isProductNews: false,
    productNewsType: null
  },
  {
    title: '完美人生8号测评：2026年女性重疾险首选',
    summary: '完美人生8号是2026年女性重疾险首选，基础保障全面，女性专属癌症保障加码，核保宽松覆盖多款常见病。',
    content: '完美人生8号核心优势：1）女性特疾保障：卵巢癌、子宫癌等额外赔10%；2）癌症拓展金：轻→重额外赔50%；3）女性保费更优惠：30岁女性6330元/年，比男性低440元；4）核保宽松：卵巢囊肿、子宫肌瘤等可标准体承保。适合30-55岁职场女性和宝妈。',
    source: '沃保网',
    sourceUrl: 'https://news.vobao.cn/article/1160314292378365601.shtml',
    category: 'INSURANCE',
    tags: JSON.stringify(['完美人生8号', '女性重疾险', '复星联合', '女性特疾']),
    hotScore: 83,
    publishTime: new Date('2026-04-03'),
    isProductNews: false,
    productNewsType: null
  }
];

async function seedIntelligence() {
  console.log('📰 开始导入2026年4月最新保险情报...\n');

  let successCount = 0;
  let updateCount = 0;

  for (const intel of intelligences) {
    try {
      // 检查是否已存在相同标题的情报
      const existing = await prisma.intelligence.findFirst({
        where: { title: intel.title }
      });

      if (existing) {
        // 更新现有情报
        await prisma.intelligence.update({
          where: { id: existing.id },
          data: {
            summary: intel.summary,
            content: intel.content,
            source: intel.source,
            sourceUrl: intel.sourceUrl,
            tags: intel.tags,
            hotScore: intel.hotScore,
            publishTime: intel.publishTime,
            isProductNews: intel.isProductNews,
            productNewsType: intel.productNewsType
          }
        });
        updateCount++;
        console.log(`🔄 更新: ${intel.title.substring(0, 40)}...`);
      } else {
        // 创建新情报
        await prisma.intelligence.create({
          data: intel
        });
        successCount++;
        console.log(`✅ 新增: ${intel.title.substring(0, 40)}...`);
      }
    } catch (error) {
      console.error(`❌ 导入失败: ${intel.title}`, error);
    }
  }

  console.log(`\n✨ 情报数据导入完成！新增 ${successCount} 条，更新 ${updateCount} 条`);
}

// 运行
seedIntelligence()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
