/**
 * 爆款标题模板库
 *
 * 收集整理各类爆款标题模板，供 AI 生成时参考
 */

export interface TitleTemplate {
  id: string
  type: string
  template: string
  description: string
  examples: string[]
  viralFactors: string[]
  applicableScenarios: string[]
  category: string[]
}

// 震惊体模板
export const SHOCK_TEMPLATES: TitleTemplate[] = [
  {
    id: 'shock-001',
    type: '震惊体',
    template: '【紧急】{数字}%的人都不知道，{主题}竟然会{后果}！',
    description: '利用紧急感和信息差制造点击欲望',
    examples: [
      '【紧急】99%的人都不知道，保险理赔竟然会被拒！',
      '【紧急】90%的人都不知道，重疾险这样买最划算！',
    ],
    viralFactors: ['紧迫感', '信息差', '好奇心'],
    applicableScenarios: ['保险避坑', '产品测评', '政策解读'],
    category: ['INSURANCE', 'FINANCE'],
  },
  {
    id: 'shock-002',
    type: '震惊体',
    template: '千万别买{主题}，除非你看完这篇文章！',
    description: '反其道而行之，利用逆反心理',
    examples: [
      '千万别买年金险，除非你看完这篇文章！',
      '千万别买医疗险，除非你知道这3个秘密！',
    ],
    viralFactors: ['逆反心理', '好奇心', '警示性'],
    applicableScenarios: ['产品评测', '风险提示'],
    category: ['INSURANCE'],
  },
]

// 数字体模板
export const NUMBER_TEMPLATES: TitleTemplate[] = [
  {
    id: 'number-001',
    type: '数字体',
    template: '{数字}个{主题}的技巧，看完最后一个太扎心了！',
    description: '用具体数字增加可信度和记忆点',
    examples: [
      '99个买保险的技巧，看完最后一个太扎心了！',
      '7个保险理赔的真相，第三个99%的人都忽略了！',
    ],
    viralFactors: ['具体数字', '情感共鸣', '实用价值'],
    applicableScenarios: ['技巧分享', '知识科普', '避坑指南'],
    category: ['INSURANCE', 'EDUCATION'],
  },
  {
    id: 'number-002',
    type: '数字体',
    template: '花{金额}元买保险，{时间}后{结果}，{原因}！',
    description: '用金钱和时间维度构建场景',
    examples: [
      '花3000元买保险，10年后发现亏大了，原因太现实！',
      '花5000元买重疾险，20年后患病理赔了80万，真相来了！',
    ],
    viralFactors: ['金钱数字', '时间跨度', '结果对比'],
    applicableScenarios: ['产品对比', '收益分析', '真实案例'],
    category: ['INSURANCE', 'FINANCE'],
  },
]

// 故事体模板
export const STORY_TEMPLATES: TitleTemplate[] = [
  {
    id: 'story-001',
    type: '故事体',
    template: '从{身份1}到{身份2}，我{时间}的{主题}经历告诉你...',
    description: '用个人经历增加代入感',
    examples: [
      '从保险小白到理赔高手，我3年的经历告诉你怎么买！',
      '从被拒赔到获赔50万，我的保险理赔经历分享！',
    ],
    viralFactors: ['真实经历', '情感共鸣', '身份认同'],
    applicableScenarios: ['经验分享', '理赔故事', '心路历程'],
    category: ['INSURANCE'],
  },
  {
    id: 'story-002',
    type: '故事体',
    template: '{数字}岁{身份}的{主题}，看完我沉默了...',
    description: '用年龄和身份构建典型场景',
    examples: [
      '35岁宝妈的保险规划，看完我沉默了...',
      '40岁中年人的养老规划，看完破防了...',
    ],
    viralFactors: ['年龄代入', '身份认同', '情感触动'],
    applicableScenarios: ['人群分析', '养老规划', '家庭保障'],
    category: ['INSURANCE', 'FINANCE'],
  },
]

// 对比体模板
export const COMPARE_TEMPLATES: TitleTemplate[] = [
  {
    id: 'compare-001',
    type: '对比体',
    template: '同样是买{主题}，{结果1}和{结果2}差{差距}！',
    description: '用强烈对比制造反差',
    examples: [
      '同样是买重疾险，有保险和没保险差50万！',
      '同样是交社保，有个人养老金和没有差距太大了！',
    ],
    viralFactors: ['强烈对比', '利益得失', '选择重要性'],
    applicableScenarios: ['产品对比', '方案对比', '结果分析'],
    category: ['INSURANCE', 'FINANCE'],
  },
  {
    id: 'compare-002',
    type: '对比体',
    template: '{时间}前VS现在，{主题}发生了{变化}！',
    description: '用时间变化展现趋势',
    examples: [
      '3年前VS现在，买保险发生了这些变化！',
      '延迟退休前VS后，养老规划完全不同了！',
    ],
    viralFactors: ['时间变化', '趋势洞察', '对比冲击'],
    applicableScenarios: ['政策解读', '行业分析', '趋势预测'],
    category: ['INSURANCE', 'FINANCE', 'SOCIAL'],
  },
]

// 情绪体模板
export const EMOTION_TEMPLATES: TitleTemplate[] = [
  {
    id: 'emotion-001',
    type: '情绪体',
    template: '{情绪词}！{主题}的{痛点}，你经历过吗？',
    description: '精准戳中情绪痛点',
    examples: [
      '破防了！买保险踩坑的痛苦，你经历过吗？',
      '太真实了！老人买保险的无奈，说出了多少人的心声！',
    ],
    viralFactors: ['情绪共鸣', '痛点精准', '代入感强'],
    applicableScenarios: ['情感共鸣', '痛点分析', '用户心声'],
    category: ['INSURANCE', 'SOCIAL'],
  },
  {
    id: 'emotion-002',
    type: '情绪体',
    template: '看完这篇，我决定{行动}了！',
    description: '用决定感引发行动',
    examples: [
      '看完这篇，我决定重新买保险了！',
      '看完这篇，我决定给父母加保了！',
    ],
    viralFactors: ['行动触发', '决定感', '代入参与'],
    applicableScenarios: ['行动指南', '购买建议', '决策参考'],
    category: ['INSURANCE'],
  },
]

// 反差别模板
export const CONTRAST_TEMPLATES: TitleTemplate[] = [
  {
    id: 'contrast-001',
    type: '反差别',
    template: '{主题}，{结果}才是{正确的做法}！',
    description: '打破常规认知',
    examples: [
      '买保险，越贵越坑！',
      '保险理赔，打官司才赔钱！',
      '个人养老金，存钱不如买房！',
    ],
    viralFactors: ['打破常规', '颠覆认知', '争议性强'],
    applicableScenarios: ['观点输出', '争议话题', '认知刷新'],
    category: ['INSURANCE', 'FINANCE'],
  },
  {
    id: 'contrast-002',
    type: '反差别',
    template: '为什么{结果}？{原因}！',
    description: '解释现象背后的原因',
    examples: [
      '为什么保险拒赔这么多？内行人说出了真相！',
      '为什么越有钱越要买保险？看完终于明白了！',
    ],
    viralFactors: ['解释疑惑', '权威背书', '逻辑清晰'],
    applicableScenarios: ['深度分析', '原因解读', '专家视角'],
    category: ['INSURANCE', 'FINANCE'],
  },
]

// 疑问体模板
export const QUESTION_TEMPLATES: TitleTemplate[] = [
  {
    id: 'question-001',
    type: '疑问体',
    template: '{主题}？{问题}，{问题2}...',
    description: '用多个问题引发思考',
    examples: [
      '保险怎么买？重疾险和医疗险哪个更重要？',
      '延迟退休后，养老怎么办？年轻人还要交社保吗？',
    ],
    viralFactors: ['问题引发思考', '信息量大', '实用性强'],
    applicableScenarios: ['知识科普', '方案解答', '热点解读'],
    category: ['INSURANCE', 'FINANCE', 'SOCIAL'],
  },
  {
    id: 'question-002',
    type: '疑问体',
    template: '{主题}，到底是{答案1}还是{答案2}？',
    description: '给出选择引发讨论',
    examples: [
      '保险是消费还是投资，到底是坑还是护身符？',
      '个人养老金是智商税还是福利？看完你就懂了！',
    ],
    viralFactors: ['选择对比', '讨论空间', '结论引导'],
    applicableScenarios: ['观点对比', '选择分析', '结论引导'],
    category: ['INSURANCE', 'FINANCE'],
  },
]

// 实用体模板
export const PRACTICAL_TEMPLATES: TitleTemplate[] = [
  {
    id: 'practical-001',
    type: '实用体',
    template: '{主题}指南|{数字}个{技巧}，建议收藏！',
    description: '强调实用价值和收藏属性',
    examples: [
      '保险配置指南|5个技巧，90%的人都收藏了！',
      '2024保险攻略|这6点不知道，千万别买保险！',
    ],
    viralFactors: ['实用价值', '收藏属性', '年度总结'],
    applicableScenarios: ['攻略汇总', '配置指南', '年度盘点'],
    category: ['INSURANCE', 'FINANCE'],
  },
  {
    id: 'practical-002',
    type: '实用体',
    template: '{主题}，这一篇就够了！',
    description: '一站式解决方案',
    examples: [
      '宝宝保险怎么买，这一篇就够了！',
      '重疾险怎么选，这一篇彻底讲清楚！',
    ],
    viralFactors: ['一站式', '省时间', '全面性'],
    applicableScenarios: ['入门指南', '选择指南', '扫盲帖'],
    category: ['INSURANCE'],
  },
]

// 所有模板汇总
export const ALL_TEMPLATES: TitleTemplate[] = [
  ...SHOCK_TEMPLATES,
  ...NUMBER_TEMPLATES,
  ...STORY_TEMPLATES,
  ...COMPARE_TEMPLATES,
  ...EMOTION_TEMPLATES,
  ...CONTRAST_TEMPLATES,
  ...QUESTION_TEMPLATES,
  ...PRACTICAL_TEMPLATES,
]

// 按类型分组
export const TEMPLATES_BY_TYPE = {
  '震惊体': SHOCK_TEMPLATES,
  '数字体': NUMBER_TEMPLATES,
  '故事体': STORY_TEMPLATES,
  '对比体': COMPARE_TEMPLATES,
  '情绪体': EMOTION_TEMPLATES,
  '反差别': CONTRAST_TEMPLATES,
  '疑问体': QUESTION_TEMPLATES,
  '实用体': PRACTICAL_TEMPLATES,
}

// 按行业分类
export const TEMPLATES_BY_CATEGORY = {
  'INSURANCE': ALL_TEMPLATES.filter(t => t.category.includes('INSURANCE')),
  'FINANCE': ALL_TEMPLATES.filter(t => t.category.includes('FINANCE')),
  'SOCIAL': ALL_TEMPLATES.filter(t => t.category.includes('SOCIAL')),
  'EDUCATION': ALL_TEMPLATES.filter(t => t.category.includes('EDUCATION')),
}

/**
 * 根据关键词获取相关模板
 */
export function getTemplatesByKeyword(keyword: string): TitleTemplate[] {
  const lowerKeyword = keyword.toLowerCase()

  return ALL_TEMPLATES.filter(template => {
    // 检查关键词是否匹配模板的适用场景
    const matches = template.applicableScenarios.some(
      scenario => scenario.toLowerCase().includes(lowerKeyword) ||
                  lowerKeyword.includes(scenario.toLowerCase())
    )

    // 或者模板描述中包含关键词
    const descMatch = template.description.toLowerCase().includes(lowerKeyword)

    return matches || descMatch
  })
}

/**
 * 获取随机模板
 */
export function getRandomTemplates(count: number = 5): TitleTemplate[] {
  const shuffled = [...ALL_TEMPLATES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * 获取模板统计
 */
export function getTemplateStats() {
  const typeStats = Object.entries(TEMPLATES_BY_TYPE).map(([type, templates]) => ({
    type,
    count: templates.length,
    examples: templates[0]?.examples || []
  }))

  return {
    total: ALL_TEMPLATES.length,
    byType: typeStats,
    byCategory: {
      '保险': TEMPLATES_BY_CATEGORY['INSURANCE'].length,
      '金融': TEMPLATES_BY_CATEGORY['FINANCE'].length,
      '社会': TEMPLATES_BY_CATEGORY['SOCIAL'].length,
      '教育': TEMPLATES_BY_CATEGORY['EDUCATION'].length,
    }
  }
}
