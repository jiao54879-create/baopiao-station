/**
 * 模板 API 路由
 *
 * 提供爆款标题模板和内容模板的查询接口
 */

import { Router } from 'express'
import {
  ALL_TEMPLATES as TITLE_TEMPLATES,
  TEMPLATES_BY_TYPE as TITLE_BY_TYPE,
  TEMPLATES_BY_CATEGORY as TITLE_BY_CATEGORY,
  getTemplatesByKeyword,
  getRandomTemplates,
  getTemplateStats
} from '../services/title_templates.js'

import {
  ALL_CONTENT_TEMPLATES,
  TEMPLATES_BY_TYPE as CONTENT_BY_TYPE,
  TEMPLATES_BY_PLATFORM as CONTENT_BY_PLATFORM,
  getTemplatesByTopic,
  getTemplatesByPlatform,
  getContentTemplateStats
} from '../services/content_templates.js'

const router = Router()

// ==================== 标题模板 API ====================

/**
 * 获取所有标题模板
 * GET /api/templates/titles
 */
router.get('/titles', (req, res) => {
  const { type, category, keyword, limit } = req.query

  let templates = [...TITLE_TEMPLATES]

  // 按类型筛选
  if (type && typeof type === 'string') {
    templates = TITLE_BY_TYPE[type] || templates
  }

  // 按分类筛选
  if (category && typeof category === 'string') {
    const categoryMap: Record<string, string> = {
      '保险': 'INSURANCE',
      '金融': 'FINANCE',
      '社会': 'SOCIAL',
      '教育': 'EDUCATION'
    }
    const categoryKey = categoryMap[category] || category.toUpperCase()
    templates = TITLE_BY_CATEGORY[categoryKey] || templates
  }

  // 按关键词筛选
  if (keyword && typeof keyword === 'string') {
    templates = getTemplatesByKeyword(keyword)
  }

  // 限制数量
  if (limit) {
    templates = templates.slice(0, parseInt(limit as string))
  }

  res.json({
    success: true,
    data: templates,
    total: templates.length
  })
})

/**
 * 获取随机标题模板
 * GET /api/templates/titles/random
 */
router.get('/titles/random', (req, res) => {
  const { count } = req.query
  const countNum = count ? parseInt(count as string) : 5

  const templates = getRandomTemplates(countNum)

  res.json({
    success: true,
    data: templates
  })
})

/**
 * 获取标题模板统计
 * GET /api/templates/titles/stats
 */
router.get('/titles/stats', (req, res) => {
  const stats = getTemplateStats()

  res.json({
    success: true,
    data: stats
  })
})

/**
 * 获取标题模板类型列表
 * GET /api/templates/titles/types
 */
router.get('/titles/types', (req, res) => {
  const types = Object.keys(TITLE_BY_TYPE).map(type => ({
    type,
    count: TITLE_BY_TYPE[type].length,
    examples: TITLE_BY_TYPE[type][0]?.examples || []
  }))

  res.json({
    success: true,
    data: types
  })
})

/**
 * 获取指定类型的标题模板
 * GET /api/templates/titles/type/:type
 */
router.get('/titles/type/:type', (req, res) => {
  const { type } = req.params

  const templates = TITLE_BY_TYPE[type]

  if (!templates) {
    return res.status(404).json({
      success: false,
      error: `类型 "${type}" 不存在`
    })
  }

  res.json({
    success: true,
    data: templates,
    total: templates.length
  })
})

// ==================== 内容模板 API ====================

/**
 * 获取所有内容模板
 * GET /api/templates/content
 */
router.get('/content', (req, res) => {
  const { type, platform, topic, limit } = req.query

  let templates = [...ALL_CONTENT_TEMPLATES]

  // 按类型筛选
  if (type && typeof type === 'string') {
    templates = CONTENT_BY_TYPE[type] || templates
  }

  // 按平台筛选
  if (platform && typeof platform === 'string') {
    const upperPlatform = platform.toUpperCase() as 'XHS' | 'WX' | 'DOUYIN'
    templates = getTemplatesByPlatform(upperPlatform)
  }

  // 按话题筛选
  if (topic && typeof topic === 'string') {
    templates = getTemplatesByTopic(topic)
  }

  // 限制数量
  if (limit) {
    templates = templates.slice(0, parseInt(limit as string))
  }

  res.json({
    success: true,
    data: templates,
    total: templates.length
  })
})

/**
 * 获取内容模板统计
 * GET /api/templates/content/stats
 */
router.get('/content/stats', (req, res) => {
  const stats = getContentTemplateStats()

  res.json({
    success: true,
    data: stats
  })
})

/**
 * 获取内容模板类型列表
 * GET /api/templates/content/types
 */
router.get('/content/types', (req, res) => {
  const types = Object.keys(CONTENT_BY_TYPE).map(type => ({
    type,
    count: CONTENT_BY_TYPE[type].length,
    description: CONTENT_BY_TYPE[type][0]?.structure?.opening?.slice(0, 50) || ''
  }))

  res.json({
    success: true,
    data: types
  })
})

/**
 * 获取指定平台的内容模板
 * GET /api/templates/content/platform/:platform
 */
router.get('/content/platform/:platform', (req, res) => {
  const { platform } = req.params

  const upperPlatform = platform.toUpperCase()
  if (!['XHS', 'WX', 'DOUYIN'].includes(upperPlatform)) {
    return res.status(400).json({
      success: false,
      error: '不支持的平台，请使用 xhs、wx 或 douyin'
    })
  }

  const templates = CONTENT_BY_PLATFORM[upperPlatform]

  res.json({
    success: true,
    data: templates,
    total: templates.length
  })
})

// ==================== 定时任务 API ====================

import {
  getAllTasks,
  getEnabledTasks,
  getTaskStats,
  cronToDescription
} from '../services/scheduled_tasks.js'

/**
 * 获取所有定时任务
 * GET /api/templates/scheduler/tasks
 */
router.get('/scheduler/tasks', (req, res) => {
  const { enabled } = req.query

  let tasks = enabled === 'true' ? getEnabledTasks() : getAllTasks()

  // 添加中文描述
  const tasksWithDesc = tasks.map(task => ({
    ...task,
    scheduleDescription: cronToDescription(task.schedule)
  }))

  res.json({
    success: true,
    data: tasksWithDesc,
    total: tasksWithDesc.length
  })
})

/**
 * 获取任务执行统计
 * GET /api/templates/scheduler/stats
 */
router.get('/scheduler/stats', (req, res) => {
  const stats = getTaskStats()

  res.json({
    success: true,
    data: stats
  })
})

export default router
