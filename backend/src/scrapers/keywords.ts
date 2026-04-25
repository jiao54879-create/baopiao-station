// 关键词过滤工具 - 保险内容精准采集
// 确保只采集与保险、医疗、养老、理财相关的内容

// 必含关键词（标题或内容必须包含至少一个）
export const MUST_INCLUDE_KEYWORDS = [
  // 保险核心词
  '保险', '投保', '理赔', '拒赔', '保单', '保费', '保额',
  // 保险产品类型
  '重疾险', '医疗险', '寿险', '年金险', '养老险', '意外险',
  '增额终身寿', '终身寿险', '定期寿险', '两全险', '分红险',
  '万能险', '投连险', '护理险', '防癌险', '孕产险', '齿科险',
  // 保险相关动作
  '健康告知', '免责条款', '等待期', '观察期', '核保',
  '如实告知', '保险责任', '保险条款', '退保', '减保', '加保',
  // 保险公司/渠道
  '保险公司', '保险代理人', '保险经纪人', '保险经纪', '保险中介',
  // 保险配置
  '保险配置', '保险方案', '保险规划', '买保险', '如何选保险',
  // 养老/储蓄
  '养老金', '个人养老金', '养老规划', '延迟退休', '第三支柱',
  '养老社区', '以房养老', '储蓄险', '教育金', '婚嫁金',
  // 医疗健康相关（与保险强相关）
  '带病投保', '既往症', '外购药', '靶向药', 'CAR-T', '质子重离子',
  // 其他保险相关
  '保险科普', '保险避坑', '保险坑', '保险骗局', '保险套路',
  '相互宝', '水滴保', '轻松保', '惠民保', '特药险',
  '穗岁康', '沪惠保', '北京普惠保', '深圳专属医疗'
];

// 排除关键词（包含以下词的内容会被过滤掉）
export const EXCLUDE_KEYWORDS = [
  // 完全不相关的领域
  '明星八卦', '娱乐圈', '绯闻', '出轨', '离婚',
  '游戏攻略', '电竞比赛', '游戏评测',
  '美妆教程', '化妆品', '护肤品推荐',
  '美食探店', '餐厅推荐', '食谱大全',
  // 过于宽泛的词（单独出现时不够精准）
  '今日头条', '天气预报', '星座运势',
  // 娱乐内容
  '演唱会', '电影票房', '电视剧', '综艺节目'
];

// 行业分类关键词（用于内容分类）
export const CATEGORY_KEYWORDS = {
  INSURANCE_PRODUCT: [
    '重疾险', '医疗险', '寿险', '年金险', '意外险', '增额终身寿',
    '两全险', '分红险', '万能险', '防癌险', '护理险'
  ],
  INSURANCE_CLAIM: [
    '理赔', '拒赔', '报案', '审核', '核赔', '给付', '垫付'
  ],
  PENSION: [
    '养老金', '个人养老金', '延迟退休', '养老规划', '养老社区',
    '第三支柱', '以房养老', '退休年龄'
  ],
  POLICY: [
    '银保监会', '监管', '政策', '规范', '通知', '规定', '办法',
    '国务院', '人社部', '医保局', '暂行办法', '征求意见'
  ],
  MEDICAL: [
    '带病投保', '既往症', '外购药', '靶向药', 'CAR-T',
    '惠民保', '特药', '百万医疗', '中高端医疗'
  ]
};

// 行业优先级（用于多关键词匹配时判断内容类别）
export const PRIORITY_TAGS = {
  HIGH: ['保险', '重疾险', '医疗险', '寿险', '年金险', '养老', '理赔', '拒赔'],
  MEDIUM: ['保单', '保费', '核保', '健康告知', '保险条款', '个人养老金'],
  LOW: ['储蓄', '理财', '资产配置']
};

// 权重配置（匹配关键词时的分数权重）
export const KEYWORD_WEIGHTS: Record<string, number> = {
  '保险': 10,
  '重疾险': 8,
  '医疗险': 8,
  '寿险': 7,
  '年金险': 7,
  '增额终身寿': 8,
  '养老金': 7,
  '个人养老金': 8,
  '延迟退休': 7,
  '理赔': 6,
  '拒赔': 6,
  '核保': 5,
  '健康告知': 5,
  '保险条款': 5,
  '保单': 4,
  '保费': 3,
  '投保': 5,
  '储蓄': 2,
  '理财': 1
};

// 过滤结果
export interface FilterResult {
  isValid: boolean;           // 是否通过过滤
  matchedKeywords: string[];  // 匹配的关键词
  relevanceScore: number;      // 相关度分数
  primaryCategory: string;    // 主要分类
  tags: string[];             // 标签
  reason?: string;            // 过滤原因（如果不通过）
}

/**
 * 检查内容是否与保险相关
 * @param title 标题
 * @param content 内容摘要（可选）
 * @param minScore 最低相关度分数（默认5）
 */
export function filterInsuranceContent(
  title: string,
  content?: string,
  minScore: number = 5
): FilterResult {
  const text = `${title} ${content || ''}`;
  
  // 检查排除关键词
  for (const keyword of EXCLUDE_KEYWORDS) {
    if (text.includes(keyword)) {
      return {
        isValid: false,
        matchedKeywords: [],
        relevanceScore: 0,
        primaryCategory: 'EXCLUDED',
        tags: [],
        reason: `包含排除词: ${keyword}`
      };
    }
  }

  // 检查必含关键词并计算分数
  let matchedKeywords: string[] = [];
  let relevanceScore = 0;
  
  for (const keyword of MUST_INCLUDE_KEYWORDS) {
    if (text.includes(keyword)) {
      matchedKeywords.push(keyword);
      relevanceScore += KEYWORD_WEIGHTS[keyword] || 1;
    }
  }

  // 必须至少匹配一个必含关键词
  if (matchedKeywords.length === 0) {
    return {
      isValid: false,
      matchedKeywords: [],
      relevanceScore: 0,
      primaryCategory: 'UNRELATED',
      tags: [],
      reason: '未匹配任何保险相关关键词'
    };
  }

  // 检查相关度分数
  if (relevanceScore < minScore) {
    return {
      isValid: false,
      matchedKeywords,
      relevanceScore,
      primaryCategory: 'LOW_RELEVANCE',
      tags: [],
      reason: `相关度分数 ${relevanceScore} 低于阈值 ${minScore}`
    };
  }

  // 判断主要分类
  let primaryCategory = 'INSURANCE';
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => matchedKeywords.includes(k))) {
      primaryCategory = category;
      break;
    }
  }

  // 生成标签
  const tags = matchedKeywords.slice(0, 5);

  return {
    isValid: true,
    matchedKeywords,
    relevanceScore,
    primaryCategory,
    tags
  };
}

/**
 * 从标题中提取保险相关标签
 */
export function extractTags(title: string, content?: string): string[] {
  const text = `${title} ${content || ''}`;
  const tags: string[] = [];

  for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    }
  }

  // 如果没有匹配到分类关键词，尝试匹配必含关键词
  if (tags.length === 0) {
    for (const keyword of MUST_INCLUDE_KEYWORDS.slice(0, 20)) {
      if (text.includes(keyword) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    }
  }

  return tags.slice(0, 5);
}

/**
 * 计算内容的爆款潜力分数
 */
export function calculateViralPotential(
  title: string,
  content?: string,
  metrics?: { likes?: number; favorites?: number; comments?: number }
): number {
  let score = 0;

  // 基础分：标题包含爆款特征词
  const viralTitleWords = ['重磅', '揭秘', '必看', '收藏', '建议', '干货',
    '避坑', '指南', '攻略', '真相', '内幕', '曝光', '紧急', '突发'];
  
  for (const word of viralTitleWords) {
    if (title.includes(word)) {
      score += 2;
    }
  }

  // 数字型标题加分
  if (/\d+%|\d+万|\d+元|\d+岁/.test(title)) {
    score += 3;
  }

  // 问句型标题加分
  if (title.includes('？') || title.includes('?')) {
    score += 2;
  }

  // 互动指标分数
  if (metrics) {
    score += Math.log10((metrics.likes || 0) + 1) * 2;
    score += Math.log10((metrics.favorites || 0) + 1) * 3;
    score += Math.log10((metrics.comments || 0) + 1) * 4;
  }

  return Math.round(score);
}

/**
 * 判断内容是否为近一个月内发布
 */
export function isWithinLastMonth(publishTime: Date | string | undefined): boolean {
  if (!publishTime) return true; // 没有时间戳默认通过

  const date = typeof publishTime === 'string' ? new Date(publishTime) : publishTime;
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  return date >= oneMonthAgo;
}

export default {
  filterInsuranceContent,
  extractTags,
  calculateViralPotential,
  isWithinLastMonth,
  MUST_INCLUDE_KEYWORDS,
  EXCLUDE_KEYWORDS,
  CATEGORY_KEYWORDS
};
