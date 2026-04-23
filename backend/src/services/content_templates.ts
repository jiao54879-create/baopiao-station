/**
 * 内容模板库
 *
 * 提供各类小红书/公众号内容模板
 */

export interface ContentTemplate {
  id: string
  type: string
  platform: 'XHS' | 'WX' | 'DOUYIN'
  title: string
  outline: string[]
  structure: {
    opening: string
    body: string[]
    ending: string
  }
  tips: string[]
  applicableTopics: string[]
  category: string[]
}

// 产品测评模板
export const PRODUCT_REVIEW_TEMPLATE: ContentTemplate = {
  id: 'review-001',
  type: '产品测评',
  platform: 'XHS',
  title: '{产品名}测评|{数字}个维度全面解析',
  outline: [
    '1. 产品基本信息（公司、保障期限、保费范围）',
    '2. {维度1}分析（如：保障范围）',
    '3. {维度2}分析（如：性价比）',
    '4. {维度3}分析（如：适合人群）',
    '5. 优缺点总结',
    '6. 购买建议'
  ],
  structure: {
    opening: '最近很多朋友问我{产品名}怎么样，今天来给大家详细测评一下！',
    body: [
      '先说说基本保障：{保障内容}',
      '优点：{优点1}、{优点2}',
      '缺点：{缺点1}、{缺点2}',
      '适合人群：{人群描述}'
    ],
    ending: '总的来说，{产品名}{结论}。有什么问题评论区见~'
  },
  tips: [
    '产品名称要准确，避免违规词汇',
    '对比数据要客观，注明数据来源',
    '购买建议要因人而异，避免绝对化表述'
  ],
  applicableTopics: ['重疾险测评', '医疗险对比', '年金险分析'],
  category: ['INSURANCE']
}

// 避坑指南模板
export const AVOID_PITFALL_TEMPLATE: ContentTemplate = {
  id: 'pitfall-001',
  type: '避坑指南',
  platform: 'XHS',
  title: '买{产品}必看|{数字}个坑千万别踩！',
  outline: [
    '1. 坑1：{描述} → {应对方法}',
    '2. 坑2：{描述} → {应对方法}',
    '3. 坑3：{描述} → {应对方法}',
    '4. 正确的选购姿势',
    '5. 总结建议'
  ],
  structure: {
    opening: '买{产品}最怕什么？踩坑！今天整理了{数字}个常见坑，看完少走弯路！',
    body: [
      '第{数字}坑：{坑的描述}',
      '很多人都会在这里翻车，因为{原因}',
      '正确做法：{正确做法}',
      '注意：{注意事项}'
    ],
    ending: '还有什么问题，评论区告诉我！觉得有用记得收藏~'
  },
  tips: [
    '案例要真实，可以用"粉丝投稿"形式',
    '应对方法要具体可操作',
    '语气要温和，避免过于绝对'
  ],
  applicableTopics: ['保险避坑', '买保险注意事项', '保险防骗'],
  category: ['INSURANCE']
}

// 知识科普模板
export const KNOWLEDGE_TEMPLATE: ContentTemplate = {
  id: 'knowledge-001',
  type: '知识科普',
  platform: 'XHS',
  title: '{主题}详解|一篇讲清楚！',
  outline: [
    '1. {主题}是什么？',
    '2. {主题}有哪些分类/类型？',
    '3. {主题}适合谁？',
    '4. 如何选择{主题}产品？',
    '5. 常见问题解答Q&A'
  ],
  structure: {
    opening: '很多粉丝问我{主题}是什么，今天用一篇文章讲清楚！建议收藏~',
    body: [
      '{主题}简单来说就是{定义}',
      '主要有{类型1}和{类型2}两种',
      '{类型1}的特点是{特点1}，适合{人群1}',
      '{类型2}的特点是{特点2}，适合{人群2}'
    ],
    ending: '今天的分享就到这里，有问题评论区见！'
  },
  tips: [
    '概念解释要通俗易懂',
    '多用类比帮助理解',
    '结尾要留互动钩子'
  ],
  applicableTopics: ['保险知识', '重疾险科普', '医疗险科普', '保险术语解释'],
  category: ['INSURANCE', 'EDUCATION']
}

// 真实案例模板
export const CASE_STUDY_TEMPLATE: ContentTemplate = {
  id: 'case-001',
  type: '真实案例',
  platform: 'XHS',
  title: '粉丝真实经历|{主题}的{经历描述}',
  outline: [
    '1. 背景介绍（年龄、职业、家庭情况）',
    '2. 事件经过',
    '3. 结果分析',
    '4. 经验总结'
  ],
  structure: {
    opening: '今天分享一个粉丝的真实经历，希望能给大家一些启发（已获得授权）',
    body: [
      '基本情况：{年龄}岁，{职业}，{家庭情况}',
      '事情经过：{详细描述}',
      '结果：{结果}',
      '我的分析：{分析内容}'
    ],
    ending: '这个案例告诉我们{总结}。如果你也有类似经历，欢迎评论区分享~'
  },
  tips: [
    '隐私信息要脱敏处理',
    '分析要客观，避免引导性',
    '可以做成"案例+分析"的形式'
  ],
  applicableTopics: ['保险理赔案例', '保险拒赔案例', '保险配置案例'],
  category: ['INSURANCE']
}

// 人群分析模板
export const AUDIENCE_ANALYSIS_TEMPLATE: ContentTemplate = {
  id: 'audience-001',
  type: '人群分析',
  platform: 'XHS',
  title: '{人群}保险怎么买？专属攻略来了！',
  outline: [
    '1. {人群}的特点分析',
    '2. {人群}面临的风险',
    '3. 推荐的保险配置',
    '4. 预算建议',
    '5. 注意事项'
  ],
  structure: {
    opening: '{人群}买保险和普通人不一样！这篇专门给你们整理了攻略~',
    body: [
      '{人群}的特点：{特点描述}',
      '面临的风险：{风险1}、{风险2}',
      '推荐配置：{险种1}+{险种2}+{险种3}',
      '预算建议：{预算范围}'
    ],
    ending: '每个家庭情况不同，具体方案还是要量身定制。有问题私信我~'
  },
  tips: [
    '人群定位要精准',
    '方案要具体但不过于复杂',
    '预算要有弹性区间'
  ],
  applicableTopics: ['宝宝保险', '老人保险', '女性保险', '年轻人保险', '家庭保险'],
  category: ['INSURANCE']
}

// 政策解读模板
export const POLICY_TEMPLATE: ContentTemplate = {
  id: 'policy-001',
  type: '政策解读',
  platform: 'WX',
  title: '重磅！{政策名称}解读，对你有什么影响？',
  outline: [
    '1. 政策背景',
    '2. 核心内容解读',
    '3. 对普通人的影响',
    '4. 我们应该如何应对',
    '5. 总结和建议'
  ],
  structure: {
    opening: '刚刚！{政策名称}发布，很多人在问对我们有什么影响，今天来详细解读~',
    body: [
      '政策背景：{背景描述}',
      '核心变化：{变化1}、{变化2}',
      '对{人群}的影响：{影响描述}',
      '应对建议：{建议1}、{建议2}'
    ],
    ending: '政策解读就到这里，大家还有什么疑问？欢迎留言讨论~'
  },
  tips: [
    '政策内容要准确，引用官方文件',
    '影响分析要客观',
    '应对建议要实用'
  ],
  applicableTopics: ['延迟退休', '个人养老金', '医保改革', '保险政策'],
  category: ['INSURANCE', 'FINANCE', 'SOCIAL']
}

// 热点借势模板
export const TREND_TEMPLATE: ContentTemplate = {
  id: 'trend-001',
  type: '热点借势',
  platform: 'XHS',
  title: '{热点事件}启示录|{主题}该怎么做？',
  outline: [
    '1. 热点事件回顾',
    '2. 从事件看{主题}的重要性',
    '3. 我们应该怎么做',
    '4. 产品/方案推荐'
  ],
  structure: {
    opening: '{热点事件}大家都在讨论，从这件事我看到了{主题}的重要性...',
    body: [
      '事件回顾：{简要描述}',
      '这告诉我们：{启示}',
      '具体做法：{做法1}、{做法2}',
      '产品推荐：{推荐}'
    ],
    ending: '希望今天的分享对大家有帮助，喜欢的点个赞~'
  },
  tips: [
    '热点结合要自然，不生硬',
    '要有自己的观点和见解',
    '推荐要谨慎，避免广告嫌疑'
  ],
  applicableTopics: ['社会热点', '新闻事件', '热门话题'],
  category: ['INSURANCE', 'SOCIAL']
}

// 年终盘点模板
export const YEAR_END_TEMPLATE: ContentTemplate = {
  id: 'yearend-001',
  type: '年终盘点',
  platform: 'XHS',
  title: '{年份}保险大盘点|这一年我们都经历了什么',
  outline: [
    '1. {年份}保险大事件回顾',
    '2. {年份}保险产品盘点TOP榜',
    '3. {年份}保险避坑指南',
    '4. {年份}+1年保险规划建议'
  ],
  structure: {
    opening: '{年份}年就要过去了，这一年保险行业发生了不少大事，来一起盘点一下~',
    body: [
      '大事件：{事件1}、{事件2}',
      '热门产品：{产品1}、{产品2}',
      '常见坑：{坑1}、{坑2}',
      '新一年建议：{建议}'
    ],
    ending: '感谢大家一年的陪伴，新的一年一起加油！有什么想看的可以留言~'
  },
  tips: [
    '事件要全面但不冗长',
    '数据要准确',
    '展望要积极向上'
  ],
  applicableTopics: ['年度总结', '年度盘点'],
  category: ['INSURANCE']
}

// 所有模板汇总
export const ALL_CONTENT_TEMPLATES: ContentTemplate[] = [
  PRODUCT_REVIEW_TEMPLATE,
  AVOID_PITFALL_TEMPLATE,
  KNOWLEDGE_TEMPLATE,
  CASE_STUDY_TEMPLATE,
  AUDIENCE_ANALYSIS_TEMPLATE,
  POLICY_TEMPLATE,
  TREND_TEMPLATE,
  YEAR_END_TEMPLATE,
]

// 按类型分组
export const TEMPLATES_BY_TYPE = {
  '产品测评': [PRODUCT_REVIEW_TEMPLATE],
  '避坑指南': [AVOID_PITFALL_TEMPLATE],
  '知识科普': [KNOWLEDGE_TEMPLATE],
  '真实案例': [CASE_STUDY_TEMPLATE],
  '人群分析': [AUDIENCE_ANALYSIS_TEMPLATE],
  '政策解读': [POLICY_TEMPLATE],
  '热点借势': [TREND_TEMPLATE],
  '年终盘点': [YEAR_END_TEMPLATE],
}

// 按平台分组
export const TEMPLATES_BY_PLATFORM = {
  'XHS': ALL_CONTENT_TEMPLATES.filter(t => t.platform === 'XHS'),
  'WX': ALL_CONTENT_TEMPLATES.filter(t => t.platform === 'WX'),
  'DOUYIN': ALL_CONTENT_TEMPLATES.filter(t => t.platform === 'DOUYIN'),
}

/**
 * 根据话题获取模板
 */
export function getTemplatesByTopic(topic: string): ContentTemplate[] {
  const lowerTopic = topic.toLowerCase()

  return ALL_CONTENT_TEMPLATES.filter(template =>
    template.applicableTopics.some(t => t.toLowerCase().includes(lowerTopic))
  )
}

/**
 * 根据平台获取模板
 */
export function getTemplatesByPlatform(platform: 'XHS' | 'WX' | 'DOUYIN'): ContentTemplate[] {
  return TEMPLATES_BY_PLATFORM[platform]
}

/**
 * 获取模板统计
 */
export function getContentTemplateStats() {
  return {
    total: ALL_CONTENT_TEMPLATES.length,
    byType: Object.entries(TEMPLATES_BY_TYPE).map(([type, templates]) => ({
      type,
      count: templates.length
    })),
    byPlatform: {
      '小红书': TEMPLATES_BY_PLATFORM['XHS'].length,
      '微信公众号': TEMPLATES_BY_PLATFORM['WX'].length,
      '抖音': TEMPLATES_BY_PLATFORM['DOUYIN'].length,
    }
  }
}
