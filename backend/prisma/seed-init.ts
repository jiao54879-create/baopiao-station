// 产品种子数据初始化脚本（精简版）
// 运行: cd backend && npx tsx prisma/seed-init.ts
// 价格标准：成人30岁男性/30万保额/30年交/保终身；儿童0岁男宝/50万保额/30年交/保终身
// ⚠️ 注意：所有产品均为2026年4月当前在售版本

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProductSeed {
  name: string;
  company: string;
  insuranceType: string;
  status: string;
  priceAdult30: number;
  priceChild0: number;
  launchDate: string;
  estimatedOffline: string;
  highlightsSevere: any[];
  highlightsMild: any[];
  highlightsWaiver: any[];
  highlightsSpecial: any[];
  highlightsValue: any[];
  advantages: any[];
  competitors: any[];
  drawbacks: any[];
  suitableFor: string[];
  sourceUrl: string;
  notes: string;
}

const products: ProductSeed[] = [
  // ==================== 成人重疾险 ====================
  {
    name: '超级玛丽16号',
    company: '君龙人寿',
    insuranceType: 'CRITICAL_ILLNESS',
    status: 'HOT',
    priceAdult30: 5211,   // 什么值得买2026-04-04验证
    priceChild0: 0,
    launchDate: '2026-04-02',
    estimatedOffline: '2027-06-30',
    highlightsSevere: [
      { category: '重疾种类', title: '重疾保障', value: '110种，赔1次100%基本保额' },
      { category: '中症赔付', title: '中症赔付比例', value: '35种，75%/次（行业升级），赔完重疾后中症继续有效' },
      { category: '重疾医疗金', title: '行业首创重疾医疗保险金', value: '首次重疾后5年内，住院+特殊门诊100%报销，最高50%基本保额' }
    ],
    highlightsMild: [
      { category: '轻症种类', title: '轻症保障', value: '40种，每次赔30%保额' },
      { category: '轻症次数', title: '赔付次数', value: '重疾赔付后轻症继续，累计最多6次' }
    ],
    highlightsWaiver: [
      { category: '豁免范围', title: '轻/中/重症均可豁免', value: '确诊即豁免后续保费' }
    ],
    highlightsSpecial: [
      { category: '癌症拓展金', title: '先原位癌/轻度癌后确诊重度癌', value: '额外多赔65%保额，累计赔付达195%' },
      { category: '结节保障', title: '三大结节特定保险金', value: '肺/乳腺/甲状腺结节良性切除后赔5%；1年后确诊癌症额外赔40%(肺)/20%(乳甲)' },
      { category: '可选-疾病关爱金', title: '45岁前重疾额外翻倍', value: '45岁前额外100%，60岁前额外80%' }
    ],
    highlightsValue: [
      { category: '核保宽松', title: '核保亮点', value: '肺结节8mm以下可标保；删除哮喘/甲亢等多项问询' },
      { category: '增值服务', title: '重疾绿通', value: '覆盖300+三甲医院，MDT多学科会诊可申请' }
    ],
    advantages: [
      { dimension: '首创保障', content: '行业首创重疾医疗保险金，确诊重疾后5年内还能报销医疗费', weight: 'high' },
      { dimension: '中症赔付', content: '中症75%/次，行业最高水平之一', weight: 'high' },
      { dimension: '核保宽松', content: '肺结节8mm以下有机会标保，亚健康人群友好', weight: 'high' }
    ],
    competitors: [
      {
        productName: '达尔文12号',
        dimensions: [
          { name: '年缴保费(30岁/30万/30年)', thisProduct: '¥5,211', competitor: '¥4,026', winner: 'competitor' },
          { name: '中症赔付比例', thisProduct: '75%/次', competitor: '60%/次', winner: 'this' },
          { name: '重疾医疗金', thisProduct: '有（行业首创）', competitor: '无', winner: 'this' }
        ]
      }
    ],
    drawbacks: [
      { title: '等待期较长', description: '等待期180天，略长于部分竞品', severity: 'low' },
      { title: '价格略高', description: '比达尔文12号贵约30%', severity: 'medium' }
    ],
    suitableFor: ['30-45岁家庭经济支柱', '关注癌症/结节保障人群', '亚健康/肺结节人群'],
    sourceUrl: 'https://www.xiaoyusan.com/shk/wkpage/article/index.html?articleid=300011590',
    notes: '2026年4月2日上线，行业首创重疾医疗保险金，中症75%赔付行业领先，核保宽松'
  },

  {
    name: '达尔文12号',
    company: '复星联合健康保险',
    insuranceType: 'CRITICAL_ILLNESS',
    status: 'HOT',
    priceAdult30: 4026,
    priceChild0: 0,
    launchDate: '2025-09-05',
    estimatedOffline: '2027-03-31',
    highlightsSevere: [
      { category: '重疾保障', title: '重疾种类', value: '120种，赔付1次100%基本保额' },
      { category: '意外重疾额外赔', title: '意外导致重疾', value: '额外赔35%保额' },
      { category: '5种特定重疾门槛优化', title: '行业首创理赔门槛优化', value: '严重心肌炎等5种疾病，无需满足天数即可赔付' }
    ],
    highlightsMild: [
      { category: '中症保障', title: '中症', value: '30种，3次×60%保额' },
      { category: '轻症保障', title: '轻症', value: '45种，4次×30%保额' }
    ],
    highlightsWaiver: [
      { category: '豁免', title: '轻/中/重症均豁免', value: '确诊即豁免后续保费' }
    ],
    highlightsSpecial: [
      { category: '自带住院津贴', title: '60岁后住院津贴', value: '60岁前未发生重疾，60岁后住院每天0.1%保额，年限90天，最多累计赔100%保额' },
      { category: '可选-顶梁柱关爱金', title: '行业创新责任', value: '确诊癌症时，子女<18岁或父母≥60岁，额外赔30%保额' }
    ],
    highlightsValue: [
      { category: '现金价值', title: '高现金价值', value: '50万保额30年交，65-83岁现金价值持续17万+' },
      { category: '增值服务', title: '就医绿通', value: '覆盖200+医院' }
    ],
    advantages: [
      { dimension: '价格性价比', content: '30岁男/30万保额/30年终身年缴约4026元，同档保障中价格领先', weight: 'high' },
      { dimension: '创新保障', content: '5种重疾理赔门槛优化，行业独家，理赔更宽松', weight: 'high' },
      { dimension: '高现金价值', content: '长期持有现金价值高，老年退保可拿回大部分保费', weight: 'high' }
    ],
    competitors: [
      {
        productName: '超级玛丽16号',
        dimensions: [
          { name: '年缴保费(30岁/30万/30年)', thisProduct: '¥4,026', competitor: '¥5,211', winner: 'this' },
          { name: '中症赔付比例', thisProduct: '60%/次', competitor: '75%/次', winner: 'competitor' },
          { name: '5种重疾理赔优化', thisProduct: '有（独家）', competitor: '无', winner: 'this' }
        ]
      }
    ],
    drawbacks: [
      { title: '中症赔付低', description: '中症60%/次，低于超级玛丽16号的75%', severity: 'medium' },
      { title: '无重疾医疗金', description: '无重疾后医疗报销功能', severity: 'medium' }
    ],
    suitableFor: ['预算有限但追求高性价比人群', '关注现金价值人群', '家庭经济支柱'],
    sourceUrl: 'https://www.naibabao.com/ketang/53356.html',
    notes: '复星联合达尔文系列第12代，2025年9月5日上线，高现金价值是核心差异化优势'
  },

  // ==================== 少儿重疾险 ====================
  {
    name: '青云卫6号',
    company: '招商仁和人寿',
    insuranceType: 'CHILDREN_CRITICAL',
    status: 'HOT',
    priceAdult30: 0,
    priceChild0: 3510,
    launchDate: '2025-09-01',
    estimatedOffline: '2027-06-30',
    highlightsSevere: [
      { category: '重疾保障', title: '重疾种类', value: '137种，赔1次100%保额' },
      { category: '少儿特疾', title: '18岁前特疾额外赔', value: '重疾后额外赔 6%×保单年度数，最高100%保额' },
      { category: '白血病骨髓移植', title: '白血病骨髓移植医疗金', value: '18岁前骨髓移植后，每月持续赔2%保额/月，最多24个月' }
    ],
    highlightsMild: [
      { category: '轻症', title: '轻症保障', value: '51种，5次×30%保额' },
      { category: '重疾后间隔期取消', title: '取消重疾后间隔期', value: '重疾赔付后轻/中症直接继续，无需等待90天' }
    ],
    highlightsWaiver: [
      { category: '投被保人双豁免', title: '投被保人均可豁免', value: '轻/中/重症确诊后保费豁免' }
    ],
    highlightsSpecial: [
      { category: '性早熟关爱金', title: '行业首创严重中枢性性早熟', value: '男宝9岁前/女宝8岁前确诊严重中枢性性早熟赔10%保额' },
      { category: '可选-重疾多次赔', title: '三次赔付递增', value: '65%+75%+85%，总多赔225%' },
      { category: '央企背书', title: '招商仁和人寿', value: '央企背景，偿付能力充足' }
    ],
    highlightsValue: [
      { category: '少儿绿通', title: '专属少儿绿色通道', value: '儿科专家快速就诊' }
    ],
    advantages: [
      { dimension: '保额增长型', content: '18岁前重疾赔付随时间增长，最高翻倍，越早投保越合算', weight: 'high' },
      { dimension: '白血病专属', content: '骨髓移植医疗金行业稀缺，最高额外赔48%保额', weight: 'high' },
      { dimension: '央企品牌', content: '招商仁和大公司品牌背书，家长购买更安心', weight: 'high' }
    ],
    competitors: [
      {
        productName: '大黄蜂16号旗舰版',
        dimensions: [
          { name: '0岁男宝50万30年保终身年缴', thisProduct: '¥3,510', competitor: '¥3,025', winner: 'competitor' },
          { name: '白血病骨髓移植医疗金', thisProduct: '有（最高48%）', competitor: '有', winner: 'this' },
          { name: '公司背景', thisProduct: '央企招商仁和', competitor: '复星保德信', winner: 'this' }
        ]
      }
    ],
    drawbacks: [
      { title: '价格较高', description: '比大黄蜂系列贵约15%', severity: 'medium' },
      { title: '等待期', description: '等待期180天', severity: 'low' }
    ],
    suitableFor: ['0-5岁低龄宝宝（增长金越早越合算）', '关注白血病等少儿高发疾病家庭', '看重央企品牌的家长'],
    sourceUrl: 'https://www.naibabao.com/ketang/53386.html',
    notes: '招商仁和人寿2025年9月上线，行业首创首次重疾增长金和性早熟关爱金，央企背景，取消重疾后间隔期是重要升级'
  },

  {
    name: '大黄蜂16号旗舰版',
    company: '复星保德信人寿',
    insuranceType: 'CHILDREN_CRITICAL',
    status: 'HOT',
    priceAdult30: 0,
    priceChild0: 3025,
    launchDate: '2025-09-01',
    estimatedOffline: '2026-08-31',
    highlightsSevere: [
      { category: '重疾保障', title: '重疾种类', value: '125种，赔100%保额' },
      { category: '少儿特疾递增赔', title: '特定少儿疾病赔付递增', value: '20种少儿特疾：保单第1年额外赔60%；第2年起额外赔130%' },
      { category: '罕见病额外赔', title: '20种罕见病递增赔付', value: '第1年额外赔100%；第2年起额外赔210%' }
    ],
    highlightsMild: [
      { category: '中症', title: '中症保障', value: '30种，赔60%保额' },
      { category: '轻症', title: '轻症保障', value: '43种，赔30%保额' }
    ],
    highlightsWaiver: [
      { category: '投被保人豁免', title: '轻/中/重症豁免', value: '包含' }
    ],
    highlightsSpecial: [
      { category: '传染病住院津贴', title: '少儿传染病住院津贴', value: '幼儿园/学校高发传染病住院给付津贴' },
      { category: '可选-重症保费补偿', title: '重症/中症确诊退保费', value: '缴费期内确诊，已交保费全退，约+10元/年' }
    ],
    highlightsValue: [
      { category: '缴费灵活', title: '最长35年交', value: '有效降低年缴压力' }
    ],
    advantages: [
      { dimension: '价格性价比', content: '0岁男宝50万终身年缴3025元，少儿重疾险中价格最低梯队', weight: 'high' },
      { dimension: '递增型赔付', content: '特疾/罕见病赔付随时间递增，长期持有后期赔付高达130%-210%', weight: 'high' },
      { dimension: '先天性疾病', content: '覆盖先天性疾病，低龄宝宝专属优势', weight: 'high' }
    ],
    competitors: [
      {
        productName: '大黄蜂17号全能版',
        dimensions: [
          { name: '0岁男宝50万30年保终身年缴', thisProduct: '¥3,025', competitor: '¥3,145', winner: 'this' },
          { name: '重疾持续增长金', thisProduct: '无', competitor: '有（最高108%）', winner: 'competitor' },
          { name: '心理健康/自闭症', thisProduct: '无', competitor: '有', winner: 'competitor' }
        ]
      }
    ],
    drawbacks: [
      { title: '心理健康保障缺失', description: '无重度自闭症、抑郁症保障，不如全能版', severity: 'medium' },
      { title: '无重疾持续增长金', description: '17号新增了此项，旗舰版无', severity: 'low' }
    ],
    suitableFor: ['预算有限家庭（性价比首选）', '0-3岁低龄宝宝（先天性疾病保障）', '多胎家庭（每年3000元）'],
    sourceUrl: 'https://www.xiaoyusan.com/shk/wkpage/article/index.html?articleid=300009986',
    notes: '大黄蜂系列第16代旗舰版，复星保德信承保，2025年9月上线，少儿重疾险价格最低梯队之一'
  },

  {
    name: '大黄蜂17号全能版',
    company: '北京人寿',
    insuranceType: 'CHILDREN_CRITICAL',
    status: 'NEW',
    priceAdult30: 0,
    priceChild0: 3145,
    launchDate: '2026-04-22',
    estimatedOffline: '2027-06-30',
    highlightsSevere: [
      { category: '重疾保障', title: '重疾种类', value: '125种+，赔100%保额' },
      { category: '新增重疾持续增长金', title: '行业最新升级亮点', value: '18岁前确诊首次重疾，额外赔6%×保单年度数，最高108%基本保额' },
      { category: '罕见病', title: '罕见病保障', value: '20种罕见病，额外赔200%保额' }
    ],
    highlightsMild: [
      { category: '中症', title: '中症保障', value: '含中症多次赔付' },
      { category: '轻症', title: '轻症保障', value: '含轻症多次赔付，重疾后继续有效' }
    ],
    highlightsWaiver: [
      { category: '豁免', title: '投被保人豁免', value: '包含' }
    ],
    highlightsSpecial: [
      { category: '心理健康保障', title: '重度自闭症+重度抑郁症', value: '全能版独有，行业市场稀缺保障' },
      { category: '质子重离子', title: '质子重离子治疗津贴', value: '高端治疗支持' },
      { category: '新增特定住院治疗津贴', title: '17号新增亮点', value: '18岁以下非重/中/轻症疾病住院，年度医疗自费超5万，一次性赔付5万津贴' },
      { category: '可选-意外重疾额外赔', title: '意外导致重疾', value: '额外赔20%保额' }
    ],
    highlightsValue: [
      { category: '最新上线', title: '2026年4月22日上线', value: '大黄蜂系列最新版本' }
    ],
    advantages: [
      { dimension: '全面保障', content: '心理健康（自闭症/抑郁症）+质子重离子+特定住院津贴，保障维度全面超越旗舰版', weight: 'high' },
      { dimension: '重疾增长金', content: '17号新增重疾持续增长金，18岁前最高额外赔108%保额', weight: 'high' },
      { dimension: '新品优势', content: '2026年4月22日最新上线，保障条款最新', weight: 'medium' }
    ],
    competitors: [
      {
        productName: '大黄蜂16号旗舰版',
        dimensions: [
          { name: '0岁男宝50万30年保终身年缴', thisProduct: '¥3,145', competitor: '¥3,025', winner: 'competitor' },
          { name: '重疾持续增长金', thisProduct: '有（最高108%）', competitor: '无', winner: 'this' },
          { name: '心理健康/自闭症', thisProduct: '有', competitor: '无', winner: 'this' }
        ]
      }
    ],
    drawbacks: [
      { title: '价格比旗舰版高', description: '比16号旗舰版每年多80元', severity: 'low' },
      { title: '新品风险', description: '2026年4月22日刚上线，正式条款需确认', severity: 'low' }
    ],
    suitableFor: ['关注心理健康/自闭症/抑郁症保障的家庭', '追求最全面保障的家庭', '0岁新生儿（增长金越早越合算）'],
    sourceUrl: 'https://www.naibabao.com/ketang/55461.html',
    notes: '大黄蜂系列第17代全能版，北京人寿承保，2026年4月22日上线，与旗舰版每年仅差80元'
  },

  // ==================== 医疗险 ====================
  {
    name: '蓝医保长期医疗险',
    company: '太平洋健康险',
    insuranceType: 'MEDICAL',
    status: 'HOT',
    priceAdult30: 234,   // 沃保网2026年数据
    priceChild0: 368,
    launchDate: '2024-05-01',
    estimatedOffline: '2030-12-31',
    highlightsSevere: [
      { category: '保证续保', title: '20年保证续保', value: '行业领先稳定性' },
      { category: '一般医疗', title: '一般医疗', value: '200万/年' },
      { category: '重疾医疗', title: '重疾医疗', value: '400万/年' }
    ],
    highlightsMild: [],
    highlightsWaiver: [],
    highlightsSpecial: [
      { category: '特药保障', title: '院外特药', value: '162种特药，100%报销' },
      { category: '质子重离子', title: '质子重离子', value: '100%报销' }
    ],
    highlightsValue: [
      { category: '绿通', title: '重疾绿通', value: '覆盖广' },
      { category: '垫付', title: '医疗费用垫付', value: '支持' }
    ],
    advantages: [
      { dimension: '稳定性', content: '20年保证续保，行业领先', weight: 'high' },
      { dimension: '价格', content: '价格实惠，性价比高', weight: 'high' }
    ],
    competitors: [
      {
        productName: '好医保长期医疗20年版',
        dimensions: [
          { name: '保证续保', thisProduct: '20年', competitor: '20年', winner: 'tie' },
          { name: '年缴保费(30岁)', thisProduct: '¥234', competitor: '¥262', winner: 'this' },
          { name: '特药数量', thisProduct: '162种', competitor: '93种', winner: 'this' }
        ]
      }
    ],
    drawbacks: [
      { title: '核保严格', description: '健康告知较严格', severity: 'medium' }
    ],
    suitableFor: ['追求长期稳定保障人群', '40岁以下健康人群'],
    sourceUrl: 'https://www.cpic.com/lanbaoyi',
    notes: '百万医疗险标杆，20年保证续保是核心竞争力'
  },

  {
    name: '好医保长期医疗20年版',
    company: '人保健康',
    insuranceType: 'MEDICAL',
    status: 'NORMAL',
    priceAdult30: 262,
    priceChild0: 385,
    launchDate: '2024-03-01',
    estimatedOffline: '2030-06-30',
    highlightsSevere: [
      { category: '保证续保', title: '20年保证续保', value: '行业领先稳定性' },
      { category: '一般医疗', title: '一般医疗', value: '200万/年' },
      { category: '重疾医疗', title: '重疾医疗', value: '400万/年' }
    ],
    highlightsMild: [],
    highlightsWaiver: [],
    highlightsSpecial: [
      { category: '特药保障', title: '院外特药', value: '93种特药' },
      { category: '质子重离子', title: '质子重离子', value: '100%报销' }
    ],
    highlightsValue: [
      { category: '品牌', title: '品牌保障', value: '人保背书' },
      { category: '核保', title: '智能核保', value: '相对宽松' }
    ],
    advantages: [
      { dimension: '品牌', content: '人保健康，品牌顶级', weight: 'high' },
      { dimension: '核保', content: '健康告知相对宽松', weight: 'high' }
    ],
    competitors: [
      {
        productName: '蓝医保长期医疗险',
        dimensions: [
          { name: '特药数量', thisProduct: '93种', competitor: '162种', winner: 'competitor' },
          { name: '保费(30岁)', thisProduct: '¥262', competitor: '¥234', winner: 'competitor' }
        ]
      }
    ],
    drawbacks: [
      { title: '特药数量', description: '特药种类比蓝医保少', severity: 'medium' }
    ],
    suitableFor: ['追求大品牌人群', '体况复杂人群'],
    sourceUrl: 'https://www.picc.com/haoyibao',
    notes: '依托支付宝平台，核保相对宽松，适合体况复杂用户'
  },

  // ==================== 定期寿险 ====================
  {
    name: '大麦定寿4.0',
    company: '华贵保险',
    insuranceType: 'TERM_LIFE',
    status: 'NORMAL',
    priceAdult30: 227,   // 30万保额（基于100万757元估算）
    priceChild0: 0,
    launchDate: '2024-08-01',
    estimatedOffline: '2026-12-31',
    highlightsSevere: [],
    highlightsMild: [],
    highlightsWaiver: [],
    highlightsSpecial: [
      { category: '保障期间', title: '保障期限', value: '可选至60/65/70岁' },
      { category: '最高保额', title: '最高保额', value: '350万' },
      { category: '健康告知', title: '健康告知', value: '仅3条，最宽松' }
    ],
    highlightsValue: [
      { category: '转换权', title: '终身寿险转换权', value: '可免健告转换' }
    ],
    advantages: [
      { dimension: '价格', content: '定期寿险地板价', weight: 'high' },
      { dimension: '核保', content: '健康告知最宽松', weight: 'high' }
    ],
    competitors: [
      {
        productName: '擎天柱8号',
        dimensions: [
          { name: '保费(30岁/30万)', thisProduct: '¥227', competitor: '¥340', winner: 'this' }
        ]
      }
    ],
    drawbacks: [
      { title: '公司知名度', description: '华贵保险知名度一般', severity: 'low' }
    ],
    suitableFor: ['家庭经济支柱', '健康异常人群'],
    sourceUrl: 'https://www.huagu.com/damai-4',
    notes: '定期寿险性价比最高，核保最宽松'
  },

  // ==================== 意外险 ====================
  {
    name: '小蜜蜂6号',
    company: '太平洋财险',
    insuranceType: 'ACCIDENT',
    status: 'HOT',
    priceAdult30: 156,   // 典藏版50万保额（沃保网2026年最新数据）
    priceChild0: 116,    // 经典版30万保额
    launchDate: '2026-01-01',
    estimatedOffline: '2027-06-30',
    highlightsSevere: [],
    highlightsMild: [],
    highlightsWaiver: [],
    highlightsSpecial: [
      { category: '版本', title: '可选版本', value: '经典版30万/典藏版50万/尊享版100万/至尊版150万' },
      { category: '意外身故/伤残', title: '意外身故伤残', value: '30万(经典)/50万(典藏)/100万(尊享)/150万(至尊)' },
      { category: '意外医疗', title: '意外医疗', value: '3万(经典)/5万(典藏)/10万(尊享)/15万(至尊)，0免赔，不限社保' },
      { category: '猝死保障', title: '猝死保障', value: '15万(经典)/30万(典藏/尊享/至尊)' },
      { category: '航空意外', title: '航空意外额外赔', value: '300万(经典)/500万(典藏/尊享/至尊)' }
    ],
    highlightsValue: [
      { category: '意外住院', title: '意外住院津贴', value: '50元/天(经典/典藏)/100元/天(尊享/至尊)' },
      { category: '救护车', title: '救护车费用', value: '1000元(经典/典藏)/2000元(尊享/至尊)' },
      { category: '疫苗接种', title: '疫苗接种意外', value: '含一般疫苗和新冠疫苗接种意外' }
    ],
    advantages: [
      { dimension: '版本灵活', content: '4个版本自由选择，30万-150万保额，丰俭由人', weight: 'high' },
      { dimension: '医疗0免赔', content: '意外医疗0免赔，不限社保目录，100%报销', weight: 'high' },
      { dimension: '猝死保障高', content: '典藏版猝死保障30万，比同类产品更高', weight: 'medium' }
    ],
    competitors: [
      {
        productName: '大护甲6号旗舰版',
        dimensions: [
          { name: '典藏版保费(30岁)', thisProduct: '¥156', competitor: '¥150', winner: 'tie' },
          { name: '猝死保障(典藏版)', thisProduct: '30万', competitor: '20万', winner: 'this' },
          { name: '意外医疗', thisProduct: '5万', competitor: '5万', winner: 'tie' }
        ]
      }
    ],
    drawbacks: [
      { title: '年龄限制', description: '18-55岁可投保典藏版，经典版18-50岁', severity: 'low' },
      { title: '职业限制', description: '1-4类职业，高危职业不可投保', severity: 'low' },
      { title: '续保', description: '一年期产品，需年年续保', severity: 'low' }
    ],
    suitableFor: ['18-55岁成年人', '家庭经济支柱', '经常出差/旅行人群', '注重猝死保障人群'],
    sourceUrl: 'https://news.vobao.com/article/1169912562779170238.shtml',
    notes: '太平洋小蜜蜂6号综合意外险，2026年1月升级上线，替代小蜜蜂5号，4个版本灵活可选（经典/典藏/尊享/至尊），典藏版50万保额156元/年是性价比最高选择'
  },

  // ==================== 已下架产品（历史参考）====================
  {
    name: '超级玛丽15号',
    company: '君龙人寿',
    insuranceType: 'CRITICAL_ILLNESS',
    status: 'OFFLINE',
    priceAdult30: 4680,
    priceChild0: 0,
    launchDate: '2025-09-01',
    estimatedOffline: '2026-04-01',
    highlightsSevere: [{ category: '已下架', title: '产品状态', value: '已停售，被超级玛丽16号替代' }],
    highlightsMild: [],
    highlightsWaiver: [],
    highlightsSpecial: [],
    highlightsValue: [],
    advantages: [],
    competitors: [],
    drawbacks: [{ title: '已下架', description: '被超级玛丽16号（2026-04-02）替代', severity: 'high' }],
    suitableFor: ['已投保用户'],
    sourceUrl: '',
    notes: '已下架，被超级玛丽16号替代'
  },

  {
    name: '达尔文11号',
    company: '复星联合健康保险',
    insuranceType: 'CRITICAL_ILLNESS',
    status: 'OFFLINE',
    priceAdult30: 3720,
    priceChild0: 0,
    launchDate: '2024-12-01',
    estimatedOffline: '2025-09-04',
    highlightsSevere: [{ category: '已下架', title: '产品状态', value: '已停售，被达尔文12号替代' }],
    highlightsMild: [],
    highlightsWaiver: [],
    highlightsSpecial: [],
    highlightsValue: [],
    advantages: [],
    competitors: [],
    drawbacks: [{ title: '已下架', description: '被达尔文12号（2025-09-05）替代', severity: 'high' }],
    suitableFor: ['已投保用户'],
    sourceUrl: '',
    notes: '已下架，被达尔文12号替代'
  },

  {
    name: '青云卫5号',
    company: '招商仁和人寿',
    insuranceType: 'CHILDREN_CRITICAL',
    status: 'OFFLINE',
    priceAdult30: 0,
    priceChild0: 3150,
    launchDate: '2025-01-01',
    estimatedOffline: '2025-09-01',
    highlightsSevere: [{ category: '已下架', title: '产品状态', value: '已停售，被青云卫6号替代' }],
    highlightsMild: [],
    highlightsWaiver: [],
    highlightsSpecial: [],
    highlightsValue: [],
    advantages: [],
    competitors: [],
    drawbacks: [{ title: '已下架', description: '被青云卫6号（2025-09-01）替代', severity: 'high' }],
    suitableFor: ['已投保用户'],
    sourceUrl: '',
    notes: '已下架，被青云卫6号替代'
  }
];

async function seedProducts() {
  console.log('开始初始化产品种子数据（2026年4月在售版本）...');
  console.log('Database URL:', process.env.DATABASE_URL ? '已设置' : '未设置');

  try {
    await prisma.$connect();
    console.log('数据库连接成功');

    let successCount = 0;
    let updateCount = 0;

    for (const product of products) {
      try {
        const existing = await prisma.insuranceProduct.findFirst({
          where: { name: product.name }
        });

        const productData = {
          name: product.name,
          company: product.company,
          insuranceType: product.insuranceType,
          status: product.status,
          priceAdult30: product.priceAdult30 > 0 ? product.priceAdult30 : null,
          priceChild0: product.priceChild0 > 0 ? product.priceChild0 : null,
          launchDate: product.launchDate ? new Date(product.launchDate) : null,
          estimatedOffline: product.estimatedOffline ? new Date(product.estimatedOffline) : null,
          highlightsSevere: JSON.stringify(product.highlightsSevere),
          highlightsMild: JSON.stringify(product.highlightsMild),
          highlightsWaiver: JSON.stringify(product.highlightsWaiver),
          highlightsSpecial: JSON.stringify(product.highlightsSpecial),
          highlightsValue: JSON.stringify(product.highlightsValue),
          advantagesPrice: JSON.stringify(product.advantages),
          competitors: JSON.stringify(product.competitors),
          drawbacks: JSON.stringify(product.drawbacks),
          sourceUrl: product.sourceUrl,
          notes: `适合人群：${product.suitableFor.join('、')}。${product.notes}`
        };

        if (existing) {
          await prisma.insuranceProduct.update({
            where: { id: existing.id },
            data: productData
          });
          updateCount++;
          console.log(`[更新] ${product.name}`);
        } else {
          await prisma.insuranceProduct.create({
            data: productData
          });
          successCount++;
          console.log(`[新增] ${product.name}`);
        }
      } catch (error) {
        console.error(`[错误] ${product.name}:`, error);
      }
    }

    console.log(`\n完成！新增: ${successCount}, 更新: ${updateCount}`);
  } catch (error) {
    console.error('数据库错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();
