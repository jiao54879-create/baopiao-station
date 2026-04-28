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

// 全部产品的完整数据更新
const products = [
  // === 青云卫6号 (id=7) ===
  {
    id: 7,
    highlightsSevere: JSON.stringify([
      '137种重疾，覆盖全面',
      '首次重疾增长金：18岁前确诊，6%×保单年度额外赔，无封顶',
      '白血病最高148%赔付：18岁前骨髓移植100%+后续治疗每月2%（累计48个月）'
    ]),
    highlightsMild: JSON.stringify([
      '轻症最多赔5次，每次30%',
      '重疾后轻症无间隔期继续赔',
      '等待期仅有90天'
    ]),
    highlightsWaiver: JSON.stringify([
      '投保人轻症/重疾/身故豁免',
      '缴费期内确诊轻症/重疾，返还已交保费（市场首创）'
    ]),
    highlightsSpecial: JSON.stringify([
      '严重中枢性性早熟保障（市场独有）',
      '缴费期内确诊返还保费（市场首创）',
      '少儿特疾120%赔付，无时间限制',
      '罕见病200%赔付，无时间限制'
    ]),
    highlightsValue: JSON.stringify([
      '绿色通道：专家预约/手术安排',
      '住院垫付服务',
      '重疾心理咨询'
    ]),
    advantagesPrice: JSON.stringify([
      '含重疾多次后保费在同类中属中等水平',
      '35年缴费期，年均压力小'
    ]),
    advantagesCoverage: JSON.stringify([
      '重疾病种137种，四款竞品中最全',
      '白血病148%累计赔付，行业最优',
      '重疾后轻症无间隔期，优于需90天间隔的竞品',
      '少儿特疾/罕见病均无时间限制'
    ]),
    advantagesUW: JSON.stringify([
      '限时核保放宽：早产/湿疹/手足口病等符合条件可投保',
      '支持智能核保+人工核保'
    ]),
    advantagesService: JSON.stringify([
      '央企背景，招商仁和人寿背书，品牌稳健',
      '重疾绿色通道覆盖广'
    ]),
    competitors: JSON.stringify(['大黄蜂16号旗舰版', '小青龙7号A款', '达尔文12号宝贝计划']),
    competitorComparison: '相比大黄蜂16号旗舰版：重疾病种更多（137 vs 125），白血病保障更强（148% vs 130%），但缺少先天性疾病保障；相比小青龙7号：缺少重疾6次赔，但价格更低；相比达尔文12号宝贝计划：央企背景更强，但特色手术保障较少',
    drawbacks: JSON.stringify(['缺少先天性疾病保障（旗舰版独有）', '不含重疾6次赔（需附加）', '保费比大黄蜂16号略高', '不含心理健康/自闭症保障'])
  },

  // === 大黄蜂16号旗舰版 (id=8) ===
  {
    id: 8,
    highlightsSevere: JSON.stringify([
      '125种重疾，少儿高发病种全覆盖',
      '少儿特疾1年后130%赔付，罕见病210%（赔付比例最高梯队）',
      '白血病造血干细胞移植：18岁前额外80%'
    ]),
    highlightsMild: JSON.stringify([
      '轻症与中症共享6次赔付',
      '重疾后轻症无间隔期继续赔',
      '原位癌额外赔付'
    ]),
    highlightsWaiver: JSON.stringify([
      '投保人轻症/重疾/身故/全残豁免',
      '少儿投保人豁免条件宽松'
    ]),
    highlightsSpecial: JSON.stringify([
      '先天性疾病保险金：3岁前确诊5种先天性疾病赔20%（市场罕见）',
      '严重肥胖减重手术保障',
      '特定传染病住院津贴',
      '重疾多次赔后，特疾/罕见病额外多赔10%'
    ]),
    highlightsValue: JSON.stringify([
      '癌症拓展金：轻癌→重癌再赔100%',
      '忠诚客户权益：定期转终身免健康告知'
    ]),
    advantagesPrice: JSON.stringify([
      '少儿重疾险价格最低梯队',
      '0岁/50万/终身/30年交，年保费约2200元（基础责任）'
    ]),
    advantagesCoverage: JSON.stringify([
      '少儿特疾1年后130%赔付（高于青云卫6号和小青龙7号）',
      '罕见病210%赔付，市场最高水平',
      '先天性疾病保障（独有竞争力）',
      '传染病住院津贴实用'
    ]),
    advantagesUW: JSON.stringify([
      '健康告知相对宽松',
      '支持智能核保'
    ]),
    advantagesService: JSON.stringify([
      '复星保德信+美国保德信联合背书',
      '全国分支机构多'
    ]),
    competitors: JSON.stringify(['青云卫6号', '大黄蜂17号全能版', '小青龙7号', '达尔文12号宝贝计划']),
    competitorComparison: '相比青云卫6号：价格更低，先天性疾病保障独有（20%），特疾1年后赔付更高（130% vs 120%），但白血病保障较弱（80% vs 148%），重疾病种更少（125 vs 137）；相比大黄蜂17号全能版：多次重疾时特疾多赔10%，但缺少意外重疾额外赔、心理健康保障和保费返还',
    drawbacks: JSON.stringify(['白血病保障弱于青云卫6号（80% vs 148%）', '缺少意外导致重疾额外赔（全能版独有）', '缺少心理健康/自闭症保障', '缺少保费返还责任', '先天性疾病限制3岁前'])
  },

  // === 大黄蜂17号全能版 (id=9) ===
  {
    id: 9,
    highlightsSevere: JSON.stringify([
      '125种重疾，含少儿高发重疾',
      '重疾持续增长金：第2年起每年+2%，最高累计108%（新增/升级）',
      '少儿特疾120%赔付，罕见病200%，无时间限制'
    ]),
    highlightsMild: JSON.stringify([
      '轻症与重疾共享6次赔付',
      '重疾后轻症无间隔期继续赔'
    ]),
    highlightsWaiver: JSON.stringify([
      '投保人轻症/重疾/身故/全残豁免',
      '确诊重疾或中症，返还已交保费'
    ]),
    highlightsSpecial: JSON.stringify([
      '心理健康保障：重度自闭症+30%、严重抑郁症+10%（市场领先）',
      '严重抑郁症手术：18岁前5种手术赔20%',
      '意外导致13种重疾额外+20%（市场稀缺）',
      '质子重离子：30岁前重度癌症额外+50%',
      '白血病造血干细胞移植：18岁前额外80%'
    ]),
    highlightsValue: JSON.stringify([
      '癌症拓展金：轻癌→重癌再赔100%',
      '忠诚客户权益：定期转终身免核保'
    ]),
    advantagesPrice: JSON.stringify([
      '0岁/50万/终身/30年交，年保费3145元（中等水平）',
      '癌症无限赔附加费低于同类'
    ]),
    advantagesCoverage: JSON.stringify([
      '心理健康保障：自闭症30%+抑郁症10%，市场领先',
      '意外重疾额外赔20%（独有竞争力）',
      '质子重离子30岁前额外50%',
      '确诊重疾/中症返还保费（双重保障）',
      '特疾/罕见病无时间限制'
    ]),
    advantagesUW: JSON.stringify([
      '健康告知相对宽松',
      '支持智能核保'
    ]),
    advantagesService: JSON.stringify([
      '北京人寿背书',
      '全国分支机构较多'
    ]),
    competitors: JSON.stringify(['大黄蜂16号全能版', '青云卫6号', '小青龙8号', '达尔文12号宝贝计划']),
    competitorComparison: '相比大黄蜂16号全能版（前辈）：新增重疾增长金（最高108%）和心理健康保障（自闭症30%+抑郁症10%），质子重离子扩展到30岁前；相比青云卫6号：心理健康保障更强，自闭症保障独有，但白血病148%保障弱于青云卫；相比小青龙8号：不含重疾6次赔，但心理健康保障更全面',
    drawbacks: JSON.stringify(['白血病保障弱于青云卫6号（80% vs 148%）', '缺少先天性疾病保障（旗舰版独有）', '多次重疾赔付时特疾只多赔10%（弱于旗舰版）', '暂无明显缺点'])
  },

  // === 蓝医保长期医疗险 (id=10) ===
  {
    id: 10,
    highlightsSevere: JSON.stringify([
      '20年保证续保，续保写入条款',
      '162种特药100%报销（含3种CAR-T）',
      '86种CAR-T药品全额报销'
    ]),
    highlightsMild: JSON.stringify([
      '质子重离子治疗100%报销',
      '特殊门诊（肾透析/肿瘤免疫疗法）覆盖',
      '门诊手术费用报销'
    ]),
    highlightsWaiver: JSON.stringify([]),
    highlightsSpecial: JSON.stringify([
      '特药种类162种（同类最多梯队）',
      'CAR-T药品覆盖86种（行业领先）',
      '家庭单投保享95折优惠',
      '健康管理服务：住院垫付/专家手术/绿色通道'
    ]),
    highlightsValue: JSON.stringify([
      '特药垫付服务',
      '重疾住院绿通',
      '在线问诊服务'
    ]),
    advantagesPrice: JSON.stringify([
      '30岁/有社保/标准体，年保费247元',
      '0岁/有社保，年保费368元',
      '同类20年续保产品中价格有竞争力'
    ]),
    advantagesCoverage: JSON.stringify([
      '特药162种，同类最多',
      'CAR-T覆盖86种，行业领先',
      '20年保证续保写入条款（非承诺）',
      '质子重离子100%报销'
    ]),
    advantagesUW: JSON.stringify([
      '健康告知较严格（需详细阅读）',
      '支持智能核保',
      '既往症定义明确，减少纠纷'
    ]),
    advantagesService: JSON.stringify([
      '太平洋健康大品牌背书',
      '全国服务网点多',
      '特药直付网络覆盖广'
    ]),
    competitors: JSON.stringify(['好医保长期医疗20年版', '平安长相安2号', '医享无忧惠享版']),
    competitorComparison: '相比好医保：特药更多（162 vs 93种），CAR-T覆盖更全，但核保更严格，条款略复杂；相比平安长相安2号：价格相近，特药种类更多；相比医享无忧惠享版：保证续保期更长（20年 vs 6年）',
    drawbacks: JSON.stringify(['健康告知较严格', '特殊药品需在指定药店', '质子重离子仅限指定机构', '等待期90天（比好医保稍长）'])
  },

  // === 好医保长期医疗20年版 (id=11) ===
  {
    id: 11,
    highlightsSevere: JSON.stringify([
      '20年保证续保，续保稳定',
      '100种重大疾病津贴1万（一次性给付）',
      '重疾绿通覆盖全国三甲医院'
    ]),
    highlightsMild: JSON.stringify([
      '特殊门诊（肾透析/抗排异/肿瘤免疫）报销',
      '门诊手术费用报销',
      '住院前后30天门急诊报销'
    ]),
    highlightsWaiver: JSON.stringify([]),
    highlightsSpecial: JSON.stringify([
      '核保最宽松：甲状腺结节/乳腺结节/乙肝等符合条件可投保',
      '人保健康背书，支付宝平台投保便捷',
      '100种重疾津贴1万（一次性，给付型）',
      '赴日医疗可选（附加险）'
    ]),
    highlightsValue: JSON.stringify([
      '住院垫付服务',
      '重疾绿通',
      '在线问诊（好医保平台）'
    ]),
    advantagesPrice: JSON.stringify([
      '30岁/有社保，年保费262元',
      '体况复杂人群性价比最高（核保宽松）'
    ]),
    advantagesCoverage: JSON.stringify([
      '20年保证续保稳定性强',
      '核保宽松，覆盖亚健康人群',
      '100种重疾津贴1万（给付型，非报销）'
    ]),
    advantagesUW: JSON.stringify([
      '核保最宽松（市场公认）',
      '支持智能核保+人工核保',
      '甲状腺/乳腺/乙肝等常见异常可承保',
      '体况复杂人群首选'
    ]),
    advantagesService: JSON.stringify([
      '人保健康（央企）背书',
      '支付宝平台，服务体系成熟',
      '理赔体验好，支持线上理赔'
    ]),
    competitors: JSON.stringify(['蓝医保长期医疗险', '平安长相安2号', '医享无忧惠享版']),
    competitorComparison: '相比蓝医保：核保宽松是最大优势，特药种类较少（93 vs 162种），适合体况复杂无法投保蓝医保的人群；相比平安长相安2号：核保更宽松，但品牌服务略弱；相比医享无忧惠享版：保证续保期更长（20年 vs 6年）',
    drawbacks: JSON.stringify(['特药种类较少（93种）', 'CAR-T药品未单独列出', '条款表述较复杂，需仔细阅读', '有免赔额1万（蓝医保有5000免赔版本）', '质子重离子需附加'])
  },

  // === 大麦定寿4.0 (id=12) ===
  {
    id: 12,
    highlightsSevere: JSON.stringify([
      '健康告知仅3条，最宽松梯队',
      '免责条款仅3条最少',
      '最高保额350万（一线城市）'
    ]),
    highlightsMild: JSON.stringify([
      '可选责任丰富：航空/公共交通/猝死保障',
      '1-6类职业均可投保',
      '无累计风险保额限制'
    ]),
    highlightsWaiver: JSON.stringify([]),
    highlightsSpecial: JSON.stringify([
      '健康告知3条：甲状腺/乳腺结节可投保',
      '免责3条：酒驾/无证驾驶/吸毒不赔（行业最少）',
      '最高保额350万，满足高保障需求',
      '等待期仅90天（同类较短）'
    ]),
    highlightsValue: JSON.stringify([
      '线上投保便捷',
      '华贵保险专注定寿，服务专注'
    ]),
    advantagesPrice: JSON.stringify([
      '30岁男/100万保额/30年交/保30年，年保费325元',
      '同类健康告知宽松产品中价格最低'
    ]),
    advantagesCoverage: JSON.stringify([
      '健康告知仅3条，甲状腺/乳腺结节可承保',
      '免责条款仅3条最少',
      '最高350万保额（同类产品最高）',
      '1-6类职业全覆盖'
    ]),
    advantagesUW: JSON.stringify([
      '健康告知最宽松之一',
      '甲状腺结节/乳腺结节2级可投保',
      '肺结节符合条件可投保',
      '支持智能核保'
    ]),
    advantagesService: JSON.stringify([
      '华贵保险专注定期寿险，服务专业',
      '线上理赔便捷'
    ]),
    competitors: JSON.stringify(['同方臻爱2024', '阳光挚爱', '达尔文12号定期版']),
    competitorComparison: '相比同方臻爱2024：健康告知更少（3 vs 4条），免责条款更少（3 vs 4条），价格相近；相比阳光挚爱：健康告知更宽松；相比达尔文12号定期版：专注定寿保障，无重疾责任，但健康告知更少',
    drawbacks: JSON.stringify(['不包含重疾/医疗保障', '5-6类职业保费较贵', '不支持转换为终身寿险', '无可选猝死保障（需单独附加）'])
  },

  // === 小蜜蜂6号 (id=13) ===
  {
    id: 13,
    highlightsSevere: JSON.stringify([
      '意外身故/伤残最高150万（尊享版）',
      '猝死保障最高50万（优享/尊享版）',
      '航空意外最高500万（尊享版）'
    ]),
    highlightsMild: JSON.stringify([
      '意外医疗0免赔，不限社保100%报销',
      '经典版到至尊版4个版本灵活可选',
      '住院津贴每天50-100元（经典版除外）'
    ]),
    highlightsWaiver: JSON.stringify([]),
    highlightsSpecial: JSON.stringify([
      '意外医疗0免赔+不限社保（核心亮点）',
      '至尊版ICU住院津贴200元/天',
      '公共场所个人责任险（尊享版）',
      '预防接种意外身故/伤残（尊享版）'
    ]),
    highlightsValue: JSON.stringify([
      '意外医疗住院垫付',
      '全国三甲医院绿色通道',
      '线上理赔便捷（太平洋大品牌）'
    ]),
    advantagesPrice: JSON.stringify([
      '30岁/尊享版/年保费296元（50万保额）',
      '0岁/典藏版/年保费116元（20万保额）',
      '同类大公司意外险中性价比高'
    ]),
    advantagesCoverage: JSON.stringify([
      '意外医疗0免赔（多数竞品100元免赔）',
      '不限社保报销（同类少见）',
      '猝死保障写入条款（非附加险）',
      '航空意外保额高达500万',
      '至尊版ICU津贴200元/天'
    ]),
    advantagesUW: JSON.stringify([
      '1-3类职业投保宽松',
      '无需健康告知（直接投保）',
      '猝死保障覆盖广'
    ]),
    advantagesService: JSON.stringify([
      '太平洋财险大品牌背书',
      '全国服务网点最多之一',
      '线上理赔体验好，速度快'
    ]),
    competitors: JSON.stringify(['大护甲6号旗舰版', '小蜜蜂5号（已停售）', '亚太麒麟pro']),
    competitorComparison: '相比大护甲6号旗舰版：太平洋品牌更强，0免赔不限社保是优势，但大护甲6号特定交通额外赔更高；相比小蜜蜂5号（已停售）：取消150万版本，新增80万优享版，价格更均衡；相比亚太麒麟pro：太平洋品牌优势明显，但亚太特定场景保障略弱',
    drawbacks: JSON.stringify(['4类以上职业保费较贵', '无儿童专属保障', '无驾乘额外赔（需附加）', '至尊版保费较高（356元/年）'])
  }
];

async function main() {
  await client.connect();
  console.log('连接数据库成功\n');

  for (const p of products) {
    const { id, ...fields } = p;
    const sets = Object.keys(fields).map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = Object.values(fields);

    await client.query(
      `UPDATE insurance_products SET ${sets}, "updatedAt" = NOW() WHERE id = $${values.length + 1}`,
      [...values, id]
    );
    console.log(`✅ 产品 ${id} 更新完成`);
  }

  // 验证
  const r = await client.query('SELECT id, name, \"highlightsSevere\", \"advantagesPrice\" FROM insurance_products WHERE id BETWEEN 7 AND 13');
  r.rows.forEach(row => {
    const hl = row.highlightsSevere ? JSON.parse(row.highlightsSevere).length : 0;
    const ap = row.advantagesPrice ? JSON.parse(row.advantagesPrice).length : 0;
    console.log(`  ${row.id}. ${row.name} - 亮点${hl}条, 优势${ap}条`);
  });

  await client.end();
  console.log('\n完成！');
}

main().catch(console.error);
