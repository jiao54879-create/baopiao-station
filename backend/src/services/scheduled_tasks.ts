/**
 * 定时任务配置
 *
 * 定义各类定时采集和数据处理任务
 */

export interface ScheduledTask {
  id: string
  name: string
  description: string
  schedule: string // cron 表达式
  enabled: boolean
  taskType: 'scrape' | 'process' | 'notify' | 'cleanup'
  config: Record<string, any>
}

// 数据采集任务
export const SCRAPE_TASKS: ScheduledTask[] = [
  {
    id: 'scrape-xhs-hourly',
    name: '小红书每小时采集',
    description: '每小时采集一次小红书保险相关内容',
    schedule: '0 * * * *', // 每小时
    enabled: true,
    taskType: 'scrape',
    config: {
      source: 'xiaohongshu',
      keywords: [
        '保险怎么买', '保险避坑', '保险理赔', '重疾险',
        '医疗险', '年金险', '宝宝保险', '养老规划'
      ],
      minLikes: 500,
      limit: 20
    }
  },
  {
    id: 'scrape-wechat-daily',
    name: '微信公众号每日采集',
    description: '每天早晚各采集一次公众号文章',
    schedule: '0 8,20 * * *', // 每天8点和20点
    enabled: true,
    taskType: 'scrape',
    config: {
      source: 'wechat',
      keywords: [
        '保险怎么买', '保险骗局', '保险理赔', '重疾险推荐',
        '医疗险测评', '年金险', '个人养老金'
      ],
      minReads: 5000,
      limit: 30
    }
  },
  {
    id: 'scrape-trending-morning',
    name: '热点早报采集',
    description: '每天早上采集各平台热搜榜',
    schedule: '0 7 * * *', // 每天早上7点
    enabled: true,
    taskType: 'scrape',
    config: {
      sources: ['baidu_hot', 'weibo_hot', 'zhihu_hot'],
      filterKeywords: ['保险', '养老', '医疗', '延迟退休', '生育'],
      limit: 50
    }
  },
  {
    id: 'scrape-insurance-daily',
    name: '保险行业日报',
    description: '每天采集保险行业动态',
    schedule: '0 9,18 * * *', // 每天9点和18点
    enabled: true,
    taskType: 'scrape',
    config: {
      sources: ['cbirc', 'insurance_dot_com', 'insurance_weekly'],
      keywords: ['政策', '产品', '责任', '理赔', '监管'],
      limit: 20
    }
  },
]

// 数据处理任务
export const PROCESS_TASKS: ScheduledTask[] = [
  {
    id: 'process-calculate-viral',
    name: '爆款评分计算',
    description: '定时重新计算所有内容的爆款评分',
    schedule: '0 */4 * * *', // 每4小时
    enabled: true,
    taskType: 'process',
    config: {
      recalculateDays: 7, // 只重新计算最近7天的数据
      minScore: 50 // 低于此分数的不再更新
    }
  },
  {
    id: 'process-extract-keywords',
    name: '关键词提取',
    description: '从新内容中提取热门关键词',
    schedule: '30 * * * *', // 每小时30分
    enabled: true,
    taskType: 'process',
    config: {
      minContentLength: 100,
      maxKeywordsPerContent: 5
    }
  },
  {
    id: 'process-generate-daily-report',
    name: '每日报告生成',
    description: '生成每日数据报告',
    schedule: '0 22 * * *', // 每天晚上10点
    enabled: true,
    taskType: 'process',
    config: {
      includeSections: ['overview', 'hot_content', 'trends', 'recommendations'],
      notifyTeam: true
    }
  },
]

// 通知任务
export const NOTIFY_TASKS: ScheduledTask[] = [
  {
    id: 'notify-morning-briefing',
    name: '早间简报推送',
    description: '每天早上推送今日热点和待关注内容',
    schedule: '0 8 * * 1-5', // 工作日早上8点
    enabled: true,
    taskType: 'notify',
    config: {
      channels: ['feishu', 'email'],
      includeContent: ['hot_trends', 'insurance_news', 'reminders'],
      format: 'brief'
    }
  },
  {
    id: 'notify-new-follow-alert',
    name: '关键词追踪提醒',
    description: '当发现关注关键词的新内容时立即通知',
    schedule: '', // 实时触发，不使用 cron
    enabled: true,
    taskType: 'notify',
    config: {
      channels: ['feishu'],
      threshold: 60, // 热度阈值
      batchMinutes: 30 // 30分钟内合并通知
    }
  },
  {
    id: 'notify-viral-alert',
    name: '爆款内容提醒',
    description: '当出现极高热度内容时通知',
    schedule: '', // 实时触发
    enabled: true,
    taskType: 'notify',
    config: {
      channels: ['feishu'],
      threshold: 90, // 爆款阈值
      notifyAllTeam: true
    }
  },
]

// 清理任务
export const CLEANUP_TASKS: ScheduledTask[] = [
  {
    id: 'cleanup-old-data',
    name: '旧数据清理',
    description: '定期清理过期数据',
    schedule: '0 3 * * 0', // 每周日凌晨3点
    enabled: true,
    taskType: 'cleanup',
    config: {
      retention: {
        intelligence: 90, // 情报保留90天
        viral_cases: 180, // 爆款案例保留180天
        activity_logs: 30, // 操作日志保留30天
        alerts: 7 // 提醒保留7天
      }
    }
  },
  {
    id: 'cleanup-temp-files',
    name: '临时文件清理',
    description: '清理爬虫临时文件',
    schedule: '0 4 * * *', // 每天凌晨4点
    enabled: true,
    taskType: 'cleanup',
    config: {
      patterns: ['*.tmp', '*.log', 'cache/*'],
      maxAge: 7 // 超过7天的删除
    }
  },
]

// 所有任务汇总
export const ALL_SCHEDULED_TASKS: ScheduledTask[] = [
  ...SCRAPE_TASKS,
  ...PROCESS_TASKS,
  ...NOTIFY_TASKS,
  ...CLEANUP_TASKS,
]

// 任务执行统计
export interface TaskExecutionStats {
  taskId: string
  lastRunAt: Date | null
  lastSuccessAt: Date | null
  lastErrorAt: Date | null
  lastError: string | null
  successCount: number
  errorCount: number
  avgDuration: number // 毫秒
}

// 默认统计
export const DEFAULT_TASK_STATS: Record<string, TaskExecutionStats> = {}

// 初始化统计
for (const task of ALL_SCHEDULED_TASKS) {
  DEFAULT_TASK_STATS[task.id] = {
    taskId: task.id,
    lastRunAt: null,
    lastSuccessAt: null,
    lastErrorAt: null,
    lastError: null,
    successCount: 0,
    errorCount: 0,
    avgDuration: 0
  }
}

/**
 * 获取所有任务列表
 */
export function getAllTasks(): ScheduledTask[] {
  return ALL_SCHEDULED_TASKS
}

/**
 * 获取启用的任务
 */
export function getEnabledTasks(): ScheduledTask[] {
  return ALL_SCHEDULED_TASKS.filter(t => t.enabled)
}

/**
 * 获取任务统计
 */
export function getTaskStats(): Record<string, TaskExecutionStats> {
  // TODO: 从数据库读取实际统计
  return DEFAULT_TASK_STATS
}

/**
 * 验证 cron 表达式
 */
export function isValidCron(expression: string): boolean {
  const parts = expression.split(' ')
  if (parts.length !== 5) return false

  const patterns = [
    /^(\*|[0-9,\-\/]+)$/, // 分钟
    /^(\*|[0-9,\-\/]+)$/, // 小时
    /^(\*|[0-9,\-\/]+)$/, // 日期
    /^(\*|[0-9,\-\/]+)$/, // 月份
    /^(\*|[0-9,\-\/]+)$/, // 星期
  ]

  return parts.every((part, i) => patterns[i].test(part))
}

/**
 * cron 表达式转中文描述
 */
export function cronToDescription(expression: string): string {
  const parts = expression.split(' ')
  const [minute, hour, day, month, week] = parts

  if (minute === '0' && hour === '*') {
    return '每小时整点'
  }

  if (minute === '0' && hour !== '*') {
    return `每天 ${hour}:00`
  }

  if (week.includes('1-5')) {
    return `工作日 ${hour}:${minute.padStart(2, '0')}`
  }

  if (day === '*' && month === '*' && week === '*') {
    return `每天 ${hour}:${minute.padStart(2, '0')}`
  }

  return expression
}
