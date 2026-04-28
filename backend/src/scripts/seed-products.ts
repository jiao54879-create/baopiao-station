/**
 * 保险产品种子数据 - 2026年热门重疾险
 * 运行方式: npx tsx src/scripts/seed-products.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 2026年热门重疾险产品数据
const products = [
  {
    name: '达尔文12号',
    company: '复星联合健康保险',
    insuranceType: 'CRITICAL_ILLNESS',
    status: 'HOT',
    priceAdult30: 6710,
    priceChild0: null,
    launchDate: new Date('2025-09-01'),
    highlightsSevere: JSON.stringify([
      '110种重大疾病，赔付100%保额',
      '重疾赔付后轻症、中症继续有效，无间隔期',
      '意外导致的首次重疾额外赔付35%'
    ]),
    highlightsMild: JSON.stringify([
      '45种轻症，赔付30%保额',
      '轻症赔付4次，不分组'
    ]),
    highlightsWaiver: JSON.stringify([
      '自带被保人豁免',
      '重疾赔付后轻症/中症保障继续'
    ]),
    highlightsSpecial: JSON.stringify([
      '60岁后住院津贴，每天500元',
      '意外重疾额外赔35%（行业首创）',
      '重疾多次赔付无年龄限制'
    ]),
    highlightsValue: JSON.stringify([
      '重疾多次赔间隔期仅180天（市场最短）',
      '癌症与其他重疾间隔仅180天',
      '疾病关爱金轻症也能多赔'
    ]),
    advantagesPrice: JSON.stringify([
      '50万保额年缴6710元（30岁男性）',
      '终身多次赔价格最优'
    ]),
    advantagesCoverage: JSON.stringify([
      '110种重疾+30种中症+45种轻症',
      '重疾后轻症/中症继续有效',
      '意外重疾额外赔35%（自带）'
    ]),
    advantagesUW: JSON.stringify([
      '结节1-2级大概率标准体承保',
      '不问拒保记录'
    ]),
    advantagesService: JSON.stringify([
      '理赔门槛低，重疾后轻症继续赔',
      '等待期短'
    ]),
    competitors: JSON.stringify(['超级玛丽15号', '超级玛丽16号', '完美人生8号', '哪吒2号']),
    drawbacks: JSON.stringify([
      '中症赔付仅60%，低于超级玛丽16号的75%',
      '无结节专项保障，不适合结节人群',
      '60岁前无额外赔付'
    ]),
    source: '奶爸保险/搜狐',
    sourceUrl: 'https://www.sohu.com/a/1012385198_121044670',
    notes: '理赔最宽松、重疾后轻症继续赔、60岁后住院津贴、意外保障强'
  },
  {
    name: '超级玛丽16号',
    company: '君龙人寿',
    insuranceType: 'CRITICAL_ILLNESS',
    status: 'HOT',
    priceAdult30: 6850,
    priceChild0: null,
    launchDate: new Date('2026-04-01'),
    highlightsSevere: JSON.stringify([
      '110种重大疾病，赔付100%保额',
      '重疾医疗金：确诊重疾后5年内治疗费用报销',
      '保底多赔30%，最高多赔50%'
    ]),
    highlightsMild: JSON.stringify([
      '轻症赔付30%保额',
      '赔完重疾后轻症继续有效'
    ]),
    highlightsWaiver: JSON.stringify([
      '自带被保人豁免',
      '豁免后合同继续有效'
    ]),
    highlightsSpecial: JSON.stringify([
      '结节保障最强：肺/乳腺/甲状腺结节专项保障',
      '肺结节6-8mm有机会标准体承保',
      '重疾医疗金保底多赔30%'
    ]),
    highlightsValue: JSON.stringify([
      '癌症津贴对"持续"要求宽松，未治疗也能赔',
      '核保不问拒保记录',
      '45岁前保额翻倍（可选）'
    ]),
    advantagesPrice: JSON.stringify([
      '40万保额年缴6868元',
      '综合性价比高（考虑医疗金后）'
    ]),
    advantagesCoverage: JSON.stringify([
      '110种重疾',
      '重疾医疗金保底30%额外赔付',
      '结节专项关爱金'
    ]),
    advantagesUW: JSON.stringify([
      '肺结节6-8mm有机会标准体承保',
      '不问拒保记录（行业首创）',
      '乳腺/甲状腺结节有专项保障'
    ]),
    advantagesService: JSON.stringify([
      '癌症津贴持续要求宽松',
      '结节核保最宽松'
    ]),
    competitors: JSON.stringify(['达尔文12号', '超级玛丽15号', '完美人生8号', '哪吒2号']),
    drawbacks: JSON.stringify([
      '无60岁后住院津贴',
      '无意外重疾额外赔',
      '医疗金仅限确诊后5年内'
    ]),
    source: '奶爸保险/搜狐',
    sourceUrl: 'https://www.sohu.com/a/1012385198_121044670',
    notes: '结节人群首选、重疾医疗金、45岁前保额翻倍、癌症津贴宽松'
  },
  {
    name: '超级玛丽15号',
    company: '君龙人寿',
    insuranceType: 'CRITICAL_ILLNESS',
    status: 'NORMAL',
    priceAdult30: 6650,
    priceChild0: null,
    launchDate: new Date('2025-06-01'),
    highlightsSevere: JSON.stringify([
      '110种重大疾病，赔付100%保额',
      '重疾多次赔付（可选）',
      '45岁前疾病关爱金可选翻倍'
    ]),
    highlightsMild: JSON.stringify([
      '45种轻症，赔付30%保额',
      '轻症赔付后重疾保障继续'
    ]),
    highlightsWaiver: JSON.stringify([
      '自带被保人豁免',
      '豁免责任全面'
    ]),
    highlightsSpecial: JSON.stringify([
      '肺结节切除赔2.5万，满1年后确诊肺癌再赔15万',
      '乳腺/甲状腺结节关爱金',
      '癌症拓展金：轻到重额外赔25万'
    ]),
    highlightsValue: JSON.stringify([
      '癌症津贴对"持续"要求宽松',
      '结节保障业内领先',
      '可选保至70岁或终身'
    ]),
    advantagesPrice: JSON.stringify([
      '性价比高，30岁男性年缴6650元起',
      '可选保至70岁降低保费'
    ]),
    advantagesCoverage: JSON.stringify([
      '110种重疾+30种轻症',
      '肺结节专项保障',
      '癌症津贴覆盖广'
    ]),
    advantagesUW: JSON.stringify([
      '肺结节切除后可保',
      '乳腺/甲状腺结节核保宽松',
      '健康告知相对友好'
    ]),
    advantagesService: JSON.stringify([
      '结节人群专项服务',
      '核保速度快'
    ]),
    competitors: JSON.stringify(['达尔文12号', '超级玛丽16号', '完美人生8号', '哪吒2号']),
    drawbacks: JSON.stringify([
      '重疾多次赔价格较贵',
      '无60岁后住院津贴',
      '无意外重疾额外赔'
    ]),
    source: '新浪/慧择',
    sourceUrl: 'https://k.sina.cn/article_7879922977_1d5ae152101901e256.html',
    notes: '肺结节首选、45岁前翻倍杠杆高、癌症津贴宽松'
  },
  {
    name: '哪吒2号',
    company: '海保人寿',
    insuranceType: 'CRITICAL_ILLNESS',
    status: 'HOT',
    priceAdult30: 6380,
    priceChild0: null,
    launchDate: new Date('2025-10-01'),
    highlightsSevere: JSON.stringify([
      '110种重大疾病，赔付100%保额',
      '重疾多次赔付（保至70岁性价比最高）',
      '70岁前首次重疾触发多次赔'
    ]),
    highlightsMild: JSON.stringify([
      '45种轻症，赔付30%保额',
      '轻症赔付后其他保障继续'
    ]),
    highlightsWaiver: JSON.stringify([
      '自带被保人豁免',
      '豁免范围广'
    ]),
    highlightsSpecial: JSON.stringify([
      '1-6类职业可投保（高危职业福音）',
      '医院范围最广（含顶尖民营医院）',
      '肺/乳腺/甲状腺结节切除满1年，60岁前癌症多赔7.5万'
    ]),
    highlightsValue: JSON.stringify([
      '极致性价比，三款中最便宜',
      '癌症津贴首笔多5万（共25万）',
      '接近40岁人群首选'
    ]),
    advantagesPrice: JSON.stringify([
      '30岁男性年缴6380元（最低）',
      '保至70岁性价比最高',
      '高危职业无加费'
    ]),
    advantagesCoverage: JSON.stringify([
      '1-6类职业可保',
      '医院选择最广',
      '结节癌症津贴'
    ]),
    advantagesUW: JSON.stringify([
      '1-6类职业可投保（刑警、消防员等）',
      '民营医院认可度高',
      '结节切除后有机会获赔'
    ]),
    advantagesService: JSON.stringify([
      '医院网络广',
      '高危职业友好',
      '理赔速度快'
    ]),
    competitors: JSON.stringify(['达尔文12号', '超级玛丽15号', '超级玛丽16号', '完美人生8号']),
    drawbacks: JSON.stringify([
      '癌症津贴对"持续"要求较严',
      '重疾多次赔保终身价格不如达尔文12号',
      '无60岁后住院津贴'
    ]),
    source: '新浪/慧择',
    sourceUrl: 'https://k.sina.cn/article_7879922977_1d5ae152101901e256.html',
    notes: '极致性价比、高危职业首选、接近40岁人群首选'
  },
  {
    name: '完美人生8号',
    company: '复星联合健康保险',
    insuranceType: 'CRITICAL_ILLNESS',
    status: 'HOT',
    priceAdult30: 6770,
    priceChild0: null,
    launchDate: new Date('2025-12-01'),
    highlightsSevere: JSON.stringify([
      '135种重大疾病（病种最多）',
      '赔付100%保额，确诊即赔',
      '重疾赔付后轻症、中症继续有效'
    ]),
    highlightsMild: JSON.stringify([
      '50种轻症，赔付30%保额',
      '轻症+中症合并赔付6次'
    ]),
    highlightsWaiver: JSON.stringify([
      '自带被保人豁免',
      '豁免后合同继续有效'
    ]),
    highlightsSpecial: JSON.stringify([
      '女性特定疾病保障：卵巢癌、子宫癌等额外+10%',
      '恶性肿瘤-重度拓展金：轻→重额外+50%',
      '轻中合并赔付6次（灵活度高）'
    ]),
    highlightsValue: JSON.stringify([
      '女性保费比男性低约6%',
      '30岁女性年缴6330元',
      '女性专属费率优势'
    ]),
    advantagesPrice: JSON.stringify([
      '30岁女性年缴6330元（女性最低）',
      '30岁男性年缴6770元',
      '女性保费优惠显著'
    ]),
    advantagesCoverage: JSON.stringify([
      '135种重疾（市场最多）',
      '女性特疾额外赔10%',
      '癌症拓展金+50%'
    ]),
    advantagesUW: JSON.stringify([
      '肝囊肿、肝血管瘤可标准体承保',
      '卵巢囊肿、子宫肌瘤核保宽松',
      '妊娠糖尿病/高血压产后可承保'
    ]),
    advantagesService: JSON.stringify([
      '女性专属服务',
      '健康告知相对宽松',
      '核保速度快'
    ]),
    competitors: JSON.stringify(['达尔文12号', '超级玛丽15号', '超级玛丽16号', '哪吒2号']),
    drawbacks: JSON.stringify([
      '无结节专项保障',
      '仅保终身，不可选保至70岁',
      '等待期180天'
    ]),
    source: '谱蓝保',
    sourceUrl: 'https://www.pulanbx.com/bxzs/228154.html',
    notes: '女性首选、女性特疾+10%、保费女性更优惠'
  }
];

async function seedProducts() {
  console.log('🌱 开始导入2026年热门重疾险产品数据...\n');

  for (const product of products) {
    try {
      // 检查是否已存在
      const existing = await prisma.insuranceProduct.findFirst({
        where: { name: product.name }
      });

      if (existing) {
        // 更新现有产品
        const updated = await prisma.insuranceProduct.update({
          where: { id: existing.id },
          data: {
            ...product,
            lastUpdated: new Date()
          }
        });
        console.log(`✅ 更新: ${product.name} (ID: ${updated.id})`);
      } else {
        // 创建新产品
        const created = await prisma.insuranceProduct.create({
          data: product
        });
        console.log(`✅ 创建: ${product.name} (ID: ${created.id})`);
      }
    } catch (error) {
      console.error(`❌ 导入失败: ${product.name}`, error);
    }
  }

  console.log('\n✨ 产品数据导入完成！');
}

// 运行
seedProducts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
