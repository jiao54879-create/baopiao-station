/**
 * 关键词追踪服务
 *
 * 功能：
 * 1. 追踪用户关注的关键词
 * 2. 发现新内容时自动提醒
 * 3. 记录追踪历史
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface KeywordTrack {
  id: number
  userId: number
  keyword: string
  category: string
  alertEnabled: boolean
  alertThreshold: number // 热度阈值
  createdAt: Date
  lastAlertAt: Date | null
}

export interface AlertRecord {
  id: number
  userId: number
  trackId: number
  keyword: string
  contentId: string
  contentTitle: string
  contentUrl: string
  hotScore: number
  alertType: 'new' | 'viral' | 'trend'
  createdAt: Date
  readAt: Date | null
}

// 预设追踪关键词
export const PRESET_KEYWORDS = {
  insurance: [
    { keyword: '保险怎么买', category: 'INSURANCE' },
    { keyword: '保险骗局', category: 'INSURANCE' },
    { keyword: '保险理赔', category: 'INSURANCE' },
    { keyword: '重疾险', category: 'INSURANCE' },
    { keyword: '医疗险', category: 'INSURANCE' },
    { keyword: '年金险', category: 'INSURANCE' },
    { keyword: '增额终身寿', category: 'INSURANCE' },
    { keyword: '延迟退休', category: 'INSURANCE' },
    { keyword: '个人养老金', category: 'INSURANCE' },
    { keyword: '宝宝保险', category: 'INSURANCE' },
  ],
  finance: [
    { keyword: '理财', category: 'FINANCE' },
    { keyword: '基金', category: 'FINANCE' },
    { keyword: '股票', category: 'FINANCE' },
    { keyword: '存款利率', category: 'FINANCE' },
    { keyword: '房贷利率', category: 'FINANCE' },
    { keyword: '通货膨胀', category: 'FINANCE' },
  ],
  hot: [
    { keyword: '生育率', category: 'SOCIAL' },
    { keyword: '老龄化', category: 'SOCIAL' },
    { keyword: '三胎', category: 'SOCIAL' },
    { keyword: '房价', category: 'SOCIAL' },
    { keyword: '就业', category: 'SOCIAL' },
  ],
  tech: [
    { keyword: 'AI', category: 'TECH' },
    { keyword: 'ChatGPT', category: 'TECH' },
    { keyword: '大模型', category: 'TECH' },
    { keyword: '人工智能', category: 'TECH' },
  ]
}

/**
 * 添加关键词追踪
 */
export async function addKeywordTrack(
  userId: number,
  keyword: string,
  category: string = 'INSURANCE',
  alertEnabled: boolean = true,
  alertThreshold: number = 60
): Promise<KeywordTrack> {
  // 检查是否已存在
  const existing = await prisma.scrapeTask.findFirst({
    where: { source: `track:${keyword}` }
  })

  if (existing) {
    throw new Error('该关键词已存在')
  }

  // 创建追踪任务
  const track = await prisma.scrapeTask.create({
    data: {
      name: `追踪: ${keyword}`,
      source: `track:${keyword}`,
      sourceUrl: '',
      category,
      schedule: '0 * * * *', // 每小时检查
      status: alertEnabled ? 'ACTIVE' : 'PAUSED',
      config: JSON.stringify({ alertThreshold, userId })
    }
  })

  return track as unknown as KeywordTrack
}

/**
 * 获取用户的关键词追踪列表
 */
export async function getUserTracks(userId: number): Promise<KeywordTrack[]> {
  const tracks = await prisma.scrapeTask.findMany({
    where: {
      source: { startsWith: 'track:' },
      config: { contains: String(userId) }
    }
  })

  return tracks as unknown as KeywordTrack[]
}

/**
 * 删除关键词追踪
 */
export async function deleteTrack(trackId: number): Promise<void> {
  await prisma.scrapeTask.delete({
    where: { id: trackId }
  })
}

/**
 * 记录提醒
 */
export async function createAlert(
  userId: number,
  trackId: number,
  keyword: string,
  content: {
    id: string
    title: string
    url: string
    hotScore: number
  },
  alertType: 'new' | 'viral' | 'trend' = 'new'
): Promise<AlertRecord> {
  // 检查是否已提醒过
  const existing = await prisma.activityLog.findFirst({
    where: {
      userId,
      action: `alert:${content.id}`,
      details: { contains: keyword }
    }
  })

  if (existing) {
    throw new Error('该内容已提醒过')
  }

  const alert = await prisma.activityLog.create({
    data: {
      userId,
      action: `alert:${alertType}`,
      resource: 'keyword_track',
      resourceId: trackId,
      details: JSON.stringify({
        keyword,
        contentId: content.id,
        contentTitle: content.title,
        contentUrl: content.url,
        hotScore: content.hotScore,
        alertType
      })
    }
  })

  return alert as unknown as AlertRecord
}

/**
 * 获取用户的提醒列表
 */
export async function getUserAlerts(
  userId: number,
  limit: number = 20
): Promise<AlertRecord[]> {
  const alerts = await prisma.activityLog.findMany({
    where: {
      userId,
      action: { startsWith: 'alert:' }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  return alerts.map(a => ({
    ...a,
    details: a.details ? JSON.parse(a.details) : {}
  })) as unknown as AlertRecord[]
}

/**
 * 标记提醒为已读
 */
export async function markAlertAsRead(alertId: number): Promise<void> {
  await prisma.activityLog.update({
    where: { id: alertId },
    data: { createdAt: new Date() }
  })
}

/**
 * 检查关键词是否触发提醒
 */
export function shouldAlert(
  track: KeywordTrack,
  hotScore: number
): boolean {
  if (!track.alertEnabled) return false
  return hotScore >= track.alertThreshold
}

/**
 * 批量添加预设关键词
 */
export async function addPresetKeywords(
  userId: number,
  preset: keyof typeof PRESET_KEYWORDS = 'insurance'
): Promise<number> {
  const keywords = PRESET_KEYWORDS[preset]
  let added = 0

  for (const kw of keywords) {
    try {
      await addKeywordTrack(userId, kw.keyword, kw.category)
      added++
    } catch (e) {
      // 忽略已存在的
    }
  }

  return added
}
