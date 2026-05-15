import { useState, useRef } from 'react'
import {
  Card, Input, Button, Tag, Divider, Radio, Spin,
  message, Row, Col, Typography, Space, Alert, Switch
} from 'antd'
import {
  EditOutlined, CopyOutlined, ThunderboltOutlined,
  CheckCircleOutlined, BulbOutlined, LinkOutlined, SwapOutlined, PictureOutlined,
  RedditOutlined, WechatOutlined
} from '@ant-design/icons'
import api from '../utils/api'
import html2canvas from 'html2canvas'

const { TextArea } = Input
const { Title, Paragraph, Text } = Typography

// 内容结构配置 - 与Cases.tsx保持一致
const contentStructures = [
  {
    value: 'strategy',
    label: '思路类',
    icon: '🧭',
    color: '#3b82f6',
    desc: '讲不同人群如何配置保险',
    subOptions: [
      { value: 'baby', label: '宝宝/儿童', icon: '👶' },
      { value: 'adult', label: '成人', icon: '👤' },
      { value: 'elder', label: '老人/父母', icon: '👴' },
      { value: 'white-collar', label: '白领/打工人', icon: '💼' },
      { value: 'mom', label: '宝妈', icon: '👩‍👧' },
      { value: 'single-woman', label: '单身女性', icon: '👩' },
      { value: 'poor', label: '穷人/预算有限', icon: '💰' },
      { value: 'rich', label: '大佬/高净值', icon: '👑' },
      { value: 'doctor', label: '医生/医护', icon: '🩺' },
      { value: 'ordinary-family', label: '普通家庭', icon: '🏠' },
      { value: 'mortgage', label: '房贷族', icon: '🏦' },
      { value: 'only-child', label: '独生子女', icon: '1️⃣' },
    ]
  },
  {
    value: 'pitfall',
    label: '避坑类',
    icon: '⚠️',
    color: '#f59e0b',
    desc: '保险信息差和普通人容易踩的坑',
    subOptions: [
      { value: 'info-gap', label: '信息差揭秘', icon: '🔍' },
      { value: 'hidden-trap', label: '隐形坑点', icon: '🕳️' },
      { value: 'sales-trick', label: '销售套路', icon: '🎭' },
      { value: 'claim-trap', label: '理赔坑点', icon: '📋' },
      { value: 'product-trap', label: '产品坑点', icon: '🚫' },
    ]
  },
  {
    value: 'product',
    label: '产品类',
    icon: '📦',
    color: '#8b5cf6',
    desc: '保险产品测评对比',
    subOptions: [
      { value: 'critical-illness', label: '重疾险测评', icon: '❤️‍🩹' },
      { value: 'medical', label: '医疗险测评', icon: '🏥' },
      { value: 'life', label: '寿险测评', icon: '🛡️' },
      { value: 'accident', label: '意外险测评', icon: '⚡' },
      { value: 'annuity', label: '年金险测评', icon: '💵' },
      { value: 'whole-life', label: '增额终身寿测评', icon: '📈' },
      { value: 'child', label: '少儿险测评', icon: '🍼' },
      { value: 'comparison', label: '横向对比', icon: '⚖️' },
    ]
  },
  {
    value: 'demand',
    label: '需求激发类',
    icon: '🔥',
    color: '#ef4444',
    desc: '为什么需要买保险',
    subOptions: [
      { value: 'risk-awareness', label: '风险意识', icon: '⚡' },
      { value: 'family-responsibility', label: '家庭责任', icon: '👨‍👩‍👧' },
      { value: 'cost-of-illness', label: '疾病花费', icon: '💊' },
      { value: 'social-insurance-gap', label: '社保缺口', icon: '📉' },
      { value: 'age-urgency', label: '年龄紧迫', icon: '⏰' },
    ]
  }
]

// 风格配置 - 与Cases.tsx保持一致
const rewriteStyles = [
  {
    value: 'hearth',
    label: '走心唠嗑风',
    desc: '像闺蜜聊天，用真实故事打动人',
    icon: '💬',
    color: '#ec4899',
    masters: [
      { value: 'mimeng', name: '咪蒙模式', avatar: '🧡', desc: '自黑式开头，情绪饱满' },
      { value: 'houcuicui', name: '侯翠翠模式', avatar: '💚', desc: '闺蜜八卦式碎碎念' },
      { value: 'leijun', name: '雷军模式', avatar: '💙', desc: '真诚大白话，偶尔自嘲' },
      { value: 'no-imitation', name: '不模仿，自由发挥', avatar: '🎨', desc: 'AI根据内容自然发挥' },
      { value: 'custom-imitation', name: '自定义风格', avatar: '✏️', desc: '输入你的风格描述' }
    ]
  },
  {
    value: 'practical',
    label: '干货避坑风',
    desc: '专业+实用，列要点讲清楚',
    icon: '📋',
    color: '#10b981',
    masters: [
      { value: 'banfo', name: '半佛仙人模式', avatar: '🧣', desc: '颠覆性结论，一句话一段' },
      { value: 'zhangxuefeng', name: '张雪峰模式', avatar: '🧢', desc: '极端判断，干货+段子' },
      { value: 'kazike', name: '卡兹克模式', avatar: '🧤', desc: '真实体验，Slogan式干货' },
      { value: 'no-imitation', name: '不模仿，自由发挥', avatar: '🎨', desc: 'AI根据内容自然发挥' },
      { value: 'custom-imitation', name: '自定义风格', avatar: '✏️', desc: '输入你的风格描述' }
    ]
  },
  {
    value: 'twist',
    label: '反转打脸风',
    desc: '先抛常识→再颠覆→给方案',
    icon: '🎭',
    color: '#f97316',
    masters: [
      { value: 'baguamangguo', name: '八卦芒果模式', avatar: '🥭', desc: '先站队再反转，打脸共同敌人' },
      { value: 'mimeng-slap', name: '咪蒙打脸模式', avatar: '💜', desc: '一句话打脸→论证→金句锤死' },
      { value: 'banfo-twist', name: '半佛反转模式', avatar: '🎪', desc: '颠覆结论→极端案例轰炸' },
      { value: 'no-imitation', name: '不模仿，自由发挥', avatar: '🎨', desc: 'AI根据内容自然发挥' },
      { value: 'custom-imitation', name: '自定义风格', avatar: '✏️', desc: '输入你的风格描述' }
    ]
  },
  {
    value: 'anxiety',
    label: '焦虑共鸣风',
    desc: '戳痛点→引发共鸣→提供出路',
    icon: '🔥',
    color: '#ef4444',
    masters: [
      { value: 'zhangxuefeng-anxiety', name: '张雪峰焦虑模式', avatar: '🔴', desc: '用数字制造紧迫感' },
      { value: 'baolocaomei', name: '暴躁草莓模式', avatar: '🍓', desc: '抱怨吐槽真实困境' },
      { value: 'mimeng-resonate', name: '咪蒙共鸣模式', avatar: '💗', desc: '戳中隐秘痛点，排比反问' },
      { value: 'no-imitation', name: '不模仿，自由发挥', avatar: '🎨', desc: 'AI根据内容自然发挥' },
      { value: 'custom-imitation', name: '自定义风格', avatar: '✏️', desc: '输入你的风格描述' }
    ]
  },
  {
    value: 'data',
    label: '数据震撼风',
    desc: '用数据说话，制造认知冲击',
    icon: '📊',
    color: '#6366f1',
    masters: [
      { value: 'kazike-data', name: '卡兹克数据模式', avatar: '📈', desc: '震惊数据开头，Slogan式结论' },
      { value: 'banfo-data', name: '半佛数据模式', avatar: '📉', desc: '一串数字砸脸' },
      { value: 'zhangxuefeng-data', name: '张雪峰数据模式', avatar: '💹', desc: '极端数据制造冲击' },
      { value: 'no-imitation', name: '不模仿，自由发挥', avatar: '🎨', desc: 'AI根据内容自然发挥' },
      { value: 'custom-imitation', name: '自定义风格', avatar: '✏️', desc: '输入你的风格描述' }
    ]
  },
  {
    value: 'custom',
    label: '自定义风格',
    desc: '自由定义你的写作风格',
    icon: '✏️',
    color: '#14b8a6',
    masters: [
      { value: 'no-imitation', name: '自由发挥', avatar: '🎨', desc: 'AI根据你的描述自然发挥' },
    ]
  }
]

export default function Creation() {
  // 创作模式：create=从零创作，rewrite=仿写改写
  const [mode, setMode] = useState<'create' | 'rewrite'>('create')
  
  // 从零创作模式状态
  const [topic, setTopic] = useState('')
  const [reference, setReference] = useState('')
  
  // 仿写输入状态
  const [inputMode, setInputMode] = useState<'url' | 'manual'>('url')
  const [url, setUrl] = useState('')
  const [manualContent, setManualContent] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  
  // 跨领域仿写
  const [crossDomainEnabled, setCrossDomainEnabled] = useState(false)
  const [targetTopic, setTargetTopic] = useState('')
  
  // 仿写目标风格
  const [rewriteStyle, setRewriteStyle] = useState<'xhs' | 'wechat'>('xhs')
  
  // 公共状态
  const [customStyleDesc, setCustomStyleDesc] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imageLoading, setImageLoading] = useState(false)
  const [imageBgColor, setImageBgColor] = useState('#FFF5F5')
  const [imageContent, setImageContent] = useState('')
  const [markupLoading, setMarkupLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  // 选项状态
  const [selectedStructure, setSelectedStructure] = useState<string>('')
  const [selectedStructureSub, setSelectedStructureSub] = useState<string[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [selectedMaster, setSelectedMaster] = useState<string>('')
  const [articleLength, setArticleLength] = useState<'short' | 'medium' | 'long'>('medium')

  // 当前选中风格的大佬列表
  const currentStyleMasters = rewriteStyles.find(s => s.value === selectedStyle)?.masters || []
  // 当前选中的内容结构
  const currentStructure = contentStructures.find(s => s.value === selectedStructure)
  // 当前内容结构的子选项
  const currentStructureSubOptions = currentStructure?.subOptions || []

  // 风格选择变化时，自动选中第一个大佬
  const handleStyleChange = (styleValue: string) => {
    setSelectedStyle(styleValue)
    const style = rewriteStyles.find(s => s.value === styleValue)
    if (style && style.masters.length > 0) {
      setSelectedMaster(style.masters[0].value)
    } else {
      setSelectedMaster('')
    }
    // 自定义风格时，强制需要描述
    if (styleValue === 'custom') {
      setSelectedMaster('no-imitation')
    }
  }

  // 模式切换时重置状态
  const handleModeChange = (newMode: 'create' | 'rewrite') => {
    setMode(newMode)
    setResult(null)
    // 不重置公共状态：selectedStyle, selectedMaster, customStyleDesc, selectedStructure, selectedStructureSub
  }

  // 初始化图片内容
  const initImageContent = () => {
    if (result && !imageContent) {
      setImageContent(result.content)
    }
  }

  const handleAutoMarkup = async () => {
    if (!result) return
    setMarkupLoading(true)
    try {
      const { data } = await api.post('/images/auto-markup', {
        title: result.title,
        content: imageContent || result.content
      })
      if (data.success) {
        setImageContent(data.content)
        message.success('AI 标注完成！重点已自动高亮')
      }
    } catch (error: any) {
      message.error('AI标注失败，请手动标注')
    } finally {
      setMarkupLoading(false)
    }
  }

  const imageRef = useRef<HTMLDivElement>(null)

  // 解析标记语法
  const parseMarkupHtml = (text: string): string => {
    // **高亮** → 黄色背景
    text = text.replace(/\*\*(.+?)\*\*/g, '<span style="background:#FFE66D;padding:2px 6px;border-radius:4px;font-weight:600">$1</span>')
    // *换色* → 红色
    text = text.replace(/\*(.+?)\*/g, '<span style="color:#FF4757;font-weight:700">$1</span>')
    // __下划线__ → 下划线
    text = text.replace(/__(.+?)__/g, '<span style="text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:4px">$1</span>')
    return text
  }

  const handleGenerateImages = async () => {
    if (!result) return
    setImageLoading(true)
    try {
      const generatedImages: string[] = []
      const titleHtml = parseMarkupHtml(result.title)
      const noteContent = imageContent || result.content
      const lines = noteContent.split('\n').filter(l => l.trim())

      // 生成首图
      const coverDiv = document.createElement('div')
      coverDiv.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:540px;height:720px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px;font-family:-apple-system,BlinkMacSystemFont,PingFang SC,Microsoft YaHei,sans-serif;'
      coverDiv.style.background = imageBgColor
      coverDiv.innerHTML = '<div style="position:absolute;top:30px;left:30px;width:60px;height:4px;background:#FF4757;border-radius:2px"></div>' +
        '<div style="font-size:38px;font-weight:800;color:#333;line-height:1.5;text-align:center;word-break:break-word;max-width:460px">' + titleHtml + '</div>' +
        '<div style="position:absolute;bottom:30px;font-size:14px;color:#999;letter-spacing:2px">保险干货 | 关注不迷路</div>' +
        '<div style="position:absolute;bottom:30px;right:30px;width:60px;height:4px;background:#FF4757;border-radius:2px"></div>'
      document.body.appendChild(coverDiv)
      const coverCanvas = await html2canvas(coverDiv, { scale: 2, useCORS: true, backgroundColor: imageBgColor })
      generatedImages.push(coverCanvas.toDataURL('image/png'))
      document.body.removeChild(coverDiv)

      // 拆分内容生成内容图，每7行一张
      const LINES_PER_PAGE = 7
      const pages: string[][] = []
      for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
        pages.push(lines.slice(i, i + LINES_PER_PAGE))
      }

      for (const pageLines of pages) {
        const contentDiv = document.createElement('div')
        contentDiv.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:540px;height:720px;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,PingFang SC,Microsoft YaHei,sans-serif;'
        contentDiv.style.background = imageBgColor
        const linesHtml = pageLines.map(line => {
          const parsed = parseMarkupHtml(line)
          return '<div style="font-size:18px;line-height:2;color:#333;margin-bottom:10px;padding:12px 16px;background:white;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.04)">' + parsed + '</div>'
        }).join('')
        contentDiv.innerHTML = '<div style="background:#FF4757;padding:24px 30px;text-align:center"><div style="font-size:26px;font-weight:700;color:white;letter-spacing:2px">' + parseMarkupHtml(result.title) + '</div></div>' +
          '<div style="flex:1;padding:24px 20px;overflow:hidden">' + linesHtml + '</div>' +
          '<div style="text-align:center;padding:12px;font-size:12px;color:#999;letter-spacing:2px">保险干货 | 关注不迷路</div>'
        document.body.appendChild(contentDiv)
        const contentCanvas = await html2canvas(contentDiv, { scale: 2, useCORS: true, backgroundColor: imageBgColor })
        generatedImages.push(contentCanvas.toDataURL('image/png'))
        document.body.removeChild(contentDiv)
      }

      setImages(generatedImages)
      message.success('生成 ' + generatedImages.length + ' 张配图')
    } catch (error: any) {
      console.error('配图生成失败:', error)
      message.error('配图生成失败: ' + (error.message || '未知错误'))
    } finally {
      setImageLoading(false)
    }
  }

  const handleCreate = async () => {
    if (mode === 'create') {
      // 从零创作模式
      if (!topic.trim()) {
        message.warning('请输入选题/主题')
        return
      }
      if (!selectedStyle || !selectedMaster) {
        message.warning('请选择风格和大佬锚点')
        return
      }
      if (selectedMaster === 'custom-imitation' && !customStyleDesc.trim()) {
        message.warning('请输入自定义风格描述')
        return
      }

      setLoading(true)
      setResult(null)

      try {
        const requestData: any = {
          topic: topic.trim(),
          style: selectedStyle,
          master: selectedMaster
        }
        if (selectedStructure) requestData.structure = selectedStructure
        if (selectedStructureSub.length > 0) requestData.structureSub = selectedStructureSub.join(',')
        if (customStyleDesc.trim()) requestData.customStyleDesc = customStyleDesc.trim()
        if (reference.trim()) requestData.reference = reference.trim()
        requestData.length = articleLength

        const { data } = await api.post('/creation', requestData)
        setResult(data)
        message.success('创作完成！')
      } catch (error: any) {
        message.error(error.response?.data?.error || '创作失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    } else {
      // 仿写模式
      if (inputMode === 'url' && !url.trim()) {
        message.warning('请输入文章链接')
        return
      }
      if (inputMode === 'manual' && (!manualTitle.trim() || !manualContent.trim())) {
        message.warning('请填写标题和内容')
        return
      }
      if (crossDomainEnabled && !targetTopic.trim()) {
        message.warning('请填写目标保险选题方向')
        return
      }
      if (!selectedStyle || !selectedMaster) {
        message.warning('请选择风格和大佬锚点')
        return
      }

      setLoading(true)
      setResult(null)

      try {
        const payload: any = {
          style: rewriteStyle,
          rewriteStyle: selectedStyle || undefined,
          master: selectedMaster || undefined
        }
        if (inputMode === 'url') {
          payload.url = url.trim()
        } else {
          payload.title = manualTitle.trim()
          payload.content = manualContent.trim()
        }
        if (crossDomainEnabled && targetTopic.trim()) {
          payload.targetTopic = targetTopic.trim()
        }
        if (selectedStructure) payload.structure = selectedStructure
        if (customStyleDesc.trim()) payload.customStyleDesc = customStyleDesc.trim()
        payload.length = articleLength

        const { data } = await api.post('/rewrite', payload)
        setResult(data)
        message.success('仿写完成！')
      } catch (error: any) {
        message.error(error.response?.data?.error || '仿写失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }
  }

  const copyText = (text: string, label = '内容') => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${label}已复制到剪贴板`)
    })
  }

  const copyFullContent = () => {
    if (!result) return
    const full = [
      result.title,
      '',
      result.content,
      '',
      '---',
      '',
      (result.tags || []).map((t: string) => '#' + t).join(' ')
    ].join('\n')
    copyText(full, '完整内容')
  }

  // 判断按钮是否禁用
  const isButtonDisabled = () => {
    if (mode === 'create') {
      return !topic.trim() || !selectedStyle || !selectedMaster
    } else {
      const hasInput = inputMode === 'url' ? !!url.trim() : (!!manualTitle.trim() && !!manualContent.trim())
      return !hasInput || !selectedStyle || !selectedMaster
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页头 */}
      <div className="mb-6">
        <Title level={3} style={{ marginBottom: 4 }}>
          ✨ 笔记创作
        </Title>
        <Paragraph type="secondary">
          从零开始创作保险笔记，或仿写其他爆款内容为保险领域
        </Paragraph>
      </div>

      {/* 模式切换 */}
      <Card className="mb-4" style={{ background: '#f8f9ff', borderColor: '#4f46e5' }}>
        <Radio.Group 
          value={mode} 
          onChange={e => handleModeChange(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="create">
            <EditOutlined className="mr-1" />
            从零创作
          </Radio.Button>
          <Radio.Button value="rewrite">
            <SwapOutlined className="mr-1" />
            仿写改写
          </Radio.Button>
        </Radio.Group>
      </Card>

      <Row gutter={24}>
        {/* 左侧：输入区域 */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size={16} className="w-full">
            {/* 从零创作模式 - 选题输入 */}
            {mode === 'create' && (
              <>
                <Card 
                  title={
                    <span>
                      <EditOutlined className="mr-2" />
                      选题/主题
                    </span>
                  }
                >
                  <Input
                    placeholder="例如：宝宝保险怎么买、成人保险方案、父母保险攻略..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    size="large"
                    showCount
                    maxLength={100}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }} className="mt-2 block">
                    💡 输入你想写的保险话题，越具体越好
                  </Text>
                </Card>

                {/* 参考内容（可选） */}
                <Card 
                  title={
                    <span>
                      <BulbOutlined className="mr-2" />
                      参考素材（可选）
                    </span>
                  }
                  extra={<Tag>非必填</Tag>}
                >
                  <TextArea
                    placeholder="粘贴你已有的素材、灵感、或者想要参考的内容片段..."
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    rows={4}
                    showCount
                    maxLength={2000}
                  />
                </Card>
              </>
            )}

            {/* 仿写改写模式 - 输入原文 */}
            {mode === 'rewrite' && (
              <Card 
                title={
                  <span>
                    <SwapOutlined className="mr-2" />
                    输入原文
                  </span>
                }
              >
                {/* 输入方式切换 */}
                <Radio.Group 
                  value={inputMode} 
                  onChange={e => setInputMode(e.target.value)}
                  className="mb-4"
                >
                  <Radio.Button value="url">
                    <LinkOutlined className="mr-1" />
                    粘贴链接
                  </Radio.Button>
                  <Radio.Button value="manual">
                    <EditOutlined className="mr-1" />
                    手动粘贴
                  </Radio.Button>
                </Radio.Group>

                {/* URL模式 */}
                {inputMode === 'url' && (
                  <>
                    <Input
                      placeholder="请输入文章链接，如公众号、知乎、头条等文章链接..."
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      size="large"
                      prefix={<LinkOutlined style={{ color: '#999' }} />}
                    />
                    <Alert
                      type="info"
                      showIcon
                      icon={<LinkOutlined />}
                      message="支持公众号、知乎、头条等平台文章"
                      description="小红书内容建议使用手动粘贴模式"
                      className="mt-3"
                      style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
                    />
                  </>
                )}

                {/* Manual模式 */}
                {inputMode === 'manual' && (
                  <Space direction="vertical" size={12} className="w-full">
                    <Input
                      placeholder="请输入文章标题..."
                      value={manualTitle}
                      onChange={e => setManualTitle(e.target.value)}
                      prefix={<span style={{ color: '#999' }}>标题</span>}
                    />
                    <TextArea
                      placeholder="请粘贴文章正文内容..."
                      value={manualContent}
                      onChange={e => setManualContent(e.target.value)}
                      rows={8}
                      showCount
                      maxLength={5000}
                    />
                  </Space>
                )}

                <Divider style={{ margin: '20px 0 16px' }} />

                {/* 跨领域仿写 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Text strong>跨领域仿写</Text>
                      <Text type="secondary" style={{ fontSize: 12 }} className="ml-2">
                        <SwapOutlined className="mr-1" />
                        将其他领域爆款移植到保险
                      </Text>
                    </div>
                    <Switch 
                      checked={crossDomainEnabled} 
                      onChange={setCrossDomainEnabled}
                      checkedChildren="开"
                      unCheckedChildren="关"
                    />
                  </div>
                  
                  {crossDomainEnabled ? (
                    <Input
                      placeholder="请输入目标保险选题方向，如：宝宝保险、成人重疾险..."
                      value={targetTopic}
                      onChange={e => setTargetTopic(e.target.value)}
                      prefix={<SwapOutlined style={{ color: '#4f46e5' }} />}
                    />
                  ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      💡 开启后可将其他领域内容的爆款技巧应用到保险内容创作
                    </Text>
                  )}
                </div>

                <Divider style={{ margin: '16px 0' }} />

                {/* 目标平台风格 */}
                <div>
                  <Text strong className="mb-3 block">目标平台风格</Text>
                  <Row gutter={12}>
                    <Col span={12}>
                      <div
                        onClick={() => setRewriteStyle('xhs')}
                        className="cursor-pointer rounded-lg p-4 text-center transition-all border-2 relative"
                        style={{
                          borderColor: rewriteStyle === 'xhs' ? '#ff2442' : '#e5e7eb',
                          background: rewriteStyle === 'xhs' ? '#fff5f6' : 'white'
                        }}
                      >
                        {rewriteStyle === 'xhs' && (
                          <div 
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ background: '#ff2442' }}
                          >
                            ✓
                          </div>
                        )}
                        <RedditOutlined style={{ fontSize: 24, color: '#ff2442' }} className="mb-2" />
                        <div className="font-medium">小红书风格</div>
                        <div className="text-xs text-gray-500">简短精炼，带标签</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div
                        onClick={() => setRewriteStyle('wechat')}
                        className="cursor-pointer rounded-lg p-4 text-center transition-all border-2 relative"
                        style={{
                          borderColor: rewriteStyle === 'wechat' ? '#52c41a' : '#e5e7eb',
                          background: rewriteStyle === 'wechat' ? '#f6ffed' : 'white'
                        }}
                      >
                        {rewriteStyle === 'wechat' && (
                          <div 
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ background: '#52c41a' }}
                          >
                            ✓
                          </div>
                        )}
                        <WechatOutlined style={{ fontSize: 24, color: '#52c41a' }} className="mb-2" />
                        <div className="font-medium">公众号风格</div>
                        <div className="text-xs text-gray-500">深度长文，干货</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>
            )}

            {/* 内容结构选择 */}
            <Card 
              title={
                <span>
                  <span className="mr-2">{mode === 'create' ? '1️⃣' : '🔧'}</span>
                  内容结构{mode === 'create' ? '' : '（仿写可不选，默认跟随原文）'}
                </span>
              }
            >
              <Row gutter={[12, 12]}>
                {contentStructures.map(struct => (
                  <Col span={12} key={struct.value}>
                    <div
                      onClick={() => {
                        setSelectedStructure(selectedStructure === struct.value ? '' : struct.value)
                        setSelectedStructureSub([])
                      }}
                      className="cursor-pointer rounded-lg p-3 transition-all border-2"
                      style={{
                        borderColor: selectedStructure === struct.value ? struct.color : '#e5e7eb',
                        background: selectedStructure === struct.value ? `${struct.color}10` : 'white'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{struct.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{struct.label}</div>
                          <div className="text-xs text-gray-500">{struct.desc}</div>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* 具体方向 */}
              {selectedStructure && currentStructureSubOptions.length > 0 && (
                <div className="mt-4">
                  <Text type="secondary" style={{ fontSize: 12 }} className="mb-2 block">
                    具体方向：
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {currentStructureSubOptions.map(sub => (
                      <div
                        key={sub.value}
                        onClick={() => setSelectedStructureSub(selectedStructureSub.includes(sub.value) ? selectedStructureSub.filter(v => v !== sub.value) : [...selectedStructureSub, sub.value])}
                        className="cursor-pointer px-3 py-1.5 rounded-full text-sm transition-all border"
                        style={{
                          borderColor: selectedStructureSub.includes(sub.value) ? contentStructures.find(s => s.value === selectedStructure)?.color : '#e5e7eb',
                          background: selectedStructureSub.includes(sub.value) ? `${contentStructures.find(s => s.value === selectedStructure)?.color}15` : 'white'
                        }}
                      >
                        <span className="mr-1">{sub.icon}</span>
                        {sub.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* 风格选择 */}
            <Card 
              title={
                <span>
                  <span className="mr-2">{mode === 'create' ? '2️⃣' : '🎨'}</span>
                  风格选择{mode === 'create' ? '' : '（可选，不选则跟随原文风格）'}
                </span>
              }
            >
              <Row gutter={[12, 12]} className="mb-4">
                {rewriteStyles.map(style => (
                  <Col span={8} key={style.value}>
                    <div
                      onClick={() => handleStyleChange(style.value)}
                      className="cursor-pointer rounded-lg p-3 text-center transition-all border-2 relative"
                      style={{
                        borderColor: selectedStyle === style.value ? style.color : '#e5e7eb',
                        background: selectedStyle === style.value ? `${style.color}10` : 'white'
                      }}
                    >
                      {selectedStyle === style.value && (
                        <div 
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                          style={{ background: style.color }}
                        >
                          ✓
                        </div>
                      )}
                      <div className="text-2xl mb-1">{style.icon}</div>
                      <div className="font-medium text-sm">{style.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{style.desc}</div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* 大佬锚点 */}
              {selectedStyle && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }} className="mb-2 block">
                    大佬锚点：
                  </Text>
                  <div className="grid grid-cols-1 gap-2">
                    {currentStyleMasters.map(master => (
                      <div
                        key={master.value}
                        onClick={() => setSelectedMaster(master.value)}
                        className="cursor-pointer rounded-lg p-3 transition-all border-2 relative"
                        style={{
                          borderColor: selectedMaster === master.value ? rewriteStyles.find(s => s.value === selectedStyle)?.color : '#e5e7eb',
                          background: selectedMaster === master.value ? `${rewriteStyles.find(s => s.value === selectedStyle)?.color}10` : 'white'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{master.avatar}</span>
                          <div>
                            <div className="font-medium text-sm">{master.name}</div>
                            <div className="text-xs text-gray-500">{master.desc}</div>
                          </div>
                        </div>
                        {selectedMaster === master.value && (
                          <div 
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ background: rewriteStyles.find(s => s.value === selectedStyle)?.color }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 自定义风格输入 */}
              {(selectedMaster === 'custom-imitation' || selectedStyle === 'custom') && (
                <div className="mt-4">
                  <Text type="secondary" style={{ fontSize: 12 }} className="mb-2 block">
                    自定义风格描述：
                  </Text>
                  <TextArea
                    placeholder="描述你想要模仿的风格特点，例如：像李佳琦直播那样有感染力..."
                    value={customStyleDesc}
                    onChange={e => setCustomStyleDesc(e.target.value)}
                    rows={3}
                    showCount
                    maxLength={200}
                  />
                </div>
              )}
            </Card>

            {/* 文章长度 */}
            <Card title={<span><span className="mr-2">{mode === 'create' ? '3️⃣' : '📏'}</span>文章长度</span>}>
              <Row gutter={12}>
                <Col span={8}>
                  <div
                    onClick={() => setArticleLength('short')}
                    className="cursor-pointer rounded-lg p-3 text-center transition-all border-2"
                    style={{
                      borderColor: articleLength === 'short' ? '#f59e0b' : '#e5e7eb',
                      background: articleLength === 'short' ? '#fffbeb' : 'white'
                    }}
                  >
                    <div className="text-xl mb-1">⚡</div>
                    <div className="font-medium text-sm">短文</div>
                    <div className="text-xs text-gray-500 mt-1">1000字以内</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div
                    onClick={() => setArticleLength('medium')}
                    className="cursor-pointer rounded-lg p-3 text-center transition-all border-2"
                    style={{
                      borderColor: articleLength === 'medium' ? '#3b82f6' : '#e5e7eb',
                      background: articleLength === 'medium' ? '#eff6ff' : 'white'
                    }}
                  >
                    <div className="text-xl mb-1">📝</div>
                    <div className="font-medium text-sm">中长文</div>
                    <div className="text-xs text-gray-500 mt-1">1000-1500字</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div
                    onClick={() => setArticleLength('long')}
                    className="cursor-pointer rounded-lg p-3 text-center transition-all border-2"
                    style={{
                      borderColor: articleLength === 'long' ? '#8b5cf6' : '#e5e7eb',
                      background: articleLength === 'long' ? '#f5f3ff' : 'white'
                    }}
                  >
                    <div className="text-xl mb-1">📖</div>
                    <div className="font-medium text-sm">长文</div>
                    <div className="text-xs text-gray-500 mt-1">1500-2200字</div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 创作按钮 */}
            <Button
              type="primary"
              size="large"
              block
              icon={mode === 'create' ? <ThunderboltOutlined /> : <SwapOutlined />}
              onClick={handleCreate}
              loading={loading}
              disabled={isButtonDisabled()}
              style={{ height: 56, fontSize: 16 }}
            >
              {loading ? 'AI 创作中...' : mode === 'create' ? '开始创作' : '一键仿写'}
            </Button>
          </Space>
        </Col>

        {/* 右侧：结果展示 */}
        <Col xs={24} lg={12}>
          {!result && !loading && (
            <Card className="h-full flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
              <div className="text-center py-16 text-gray-400">
                <EditOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div style={{ fontSize: 16 }}>
                  {mode === 'create' ? '输入选题，选择风格' : '输入原文，选择风格'}
                </div>
                <div style={{ fontSize: 16 }}>
                  点击「{mode === 'create' ? '开始创作' : '一键仿写'}」
                </div>
                <div style={{ fontSize: 13, marginTop: 8 }}>
                  AI 将为你{mode === 'create' ? '创作' : '仿写'}保险笔记
                </div>
              </div>
            </Card>
          )}

          {loading && (
            <Card style={{ minHeight: 400 }} className="flex items-center justify-center">
              <div className="text-center py-16">
                <Spin size="large" />
                <div className="mt-4 text-gray-500">
                  AI 正在{mode === 'create' ? '创作' : '仿写'}中，通常需要 15-30 秒...
                </div>
              </div>
            </Card>
          )}

          {result && !loading && (
            <Space direction="vertical" size={16} className="w-full">
              <Card
                title={<span><CheckCircleOutlined style={{ color: '#52c41a' }} /> {mode === 'create' ? '创作' : '仿写'}完成</span>}
                extra={
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={copyFullContent}
                    type="primary"
                  >
                    一键复制全文
                  </Button>
                }
              >
                {/* 标题 */}
                <div className="mb-4 p-4 rounded-lg" style={{ background: '#fff5f6', border: '1px solid #ff244230' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>📌 标题</Text>
                  <div className="text-xl font-bold mt-1" style={{ color: '#ff2442' }}>
                    {result.title}
                  </div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {result.title.length}/20字
                  </Text>
                </div>

                {/* 正文 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text type="secondary" style={{ fontSize: 11 }}>📝 正文内容</Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyText(result.content, '正文')}
                    >
                      复制正文
                    </Button>
                  </div>
                  <div
                    className="p-4 bg-gray-50 rounded text-sm leading-relaxed"
                    style={{ 
                      whiteSpace: 'pre-wrap', 
                      maxHeight: 400, 
                      overflowY: 'auto',
                      lineHeight: 1.8
                    }}
                  >
                    {result.content}
                  </div>
                </div>

                {/* 标签 */}
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>🏷️ 话题标签</Text>
                  <div className="mt-2">
                    {(result.tags || []).map((tag: string, i: number) => (
                      <Tag
                        key={i}
                        color="red"
                        className="mr-2 mb-2 cursor-pointer"
                        onClick={() => copyText('#' + tag, '标签')}
                      >
                        #{tag}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                {result.callToAction && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded">
                    <Text type="secondary" style={{ fontSize: 11 }}>💬 互动引导</Text>
                    <div className="text-sm mt-1 font-medium">{result.callToAction}</div>
                  </div>
                )}
              </Card>

              {/* 创作说明 */}
              <Card size="small" style={{ background: '#f8f9ff', borderColor: '#4f46e5' }}>
                <div className="flex gap-2">
                  <BulbOutlined style={{ color: '#4f46e5', marginTop: 2 }} />
                  <div>
                    <Text strong style={{ fontSize: 12, color: '#4f46e5' }}>
                      {mode === 'create' ? '创作' : '仿写'}说明
                    </Text>
                    <div className="text-sm text-gray-600 mt-1">
                      以上内容由 AI 基于「{rewriteStyles.find(s => s.value === selectedStyle)?.label}」×「{currentStyleMasters.find(m => m.value === selectedMaster)?.name}」风格{mode === 'create' ? '创作' : '仿写'}
                    </div>
                    {result.usageTip && (
                      <div className="text-sm text-gray-500 mt-1">
                        {result.usageTip}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* 生成配图 */}
              <Card 
                title={<span><PictureOutlined style={{ color: '#ff4757' }} /> 一键生成配图</span>}
              >
                {/* 标注语法说明 + 可编辑内容区 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      编辑内容，标注重点后生成图片
                    </Text>
                    <Button 
                      size="small" 
                      type="dashed"
                      icon={<ThunderboltOutlined />}
                      onClick={handleAutoMarkup}
                      loading={markupLoading}
                    >
                      AI自动标注
                    </Button>
                  </div>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <Tag color="gold">**重点** = 高亮涂抹</Tag>
                    <Tag color="red">*警示* = 变色强调</Tag>
                    <Tag color="blue">__术语__ = 下划线</Tag>
                  </div>
                  <TextArea
                    value={imageContent || result?.content || ''}
                    onChange={e => setImageContent(e.target.value)}
                    rows={8}
                    style={{ fontSize: 13, lineHeight: 1.8 }}
                    placeholder="笔记内容会自动填入，你可以用标注语法标记重点..."
                  />
                </div>

                {/* 颜色选择 + 生成按钮 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2 items-center">
                    <Text type="secondary" style={{ fontSize: 12 }}>背景色：</Text>
                    {['#FFF5F5','#FFF8F0','#F0F5FF','#F0FFF4','#F5F0FF','#FFFFF0'].map(c => (
                      <div
                        key={c}
                        onClick={() => setImageBgColor(c)}
                        className="cursor-pointer w-6 h-6 rounded-full border-2 transition-all"
                        style={{
                          background: c,
                          borderColor: imageBgColor === c ? '#333' : '#ddd',
                          transform: imageBgColor === c ? 'scale(1.2)' : 'scale(1)'
                        }}
                      />
                    ))}
                  </div>
                  <Button
                    type="primary"
                    icon={<PictureOutlined />}
                    onClick={handleGenerateImages}
                    loading={imageLoading}
                  >
                    {imageLoading ? '生成中...' : '生成配图'}
                  </Button>
                </div>

                {/* 图片预览 */}
                {images.length === 0 && !imageLoading && (
                  <div className="text-center py-6 text-gray-400">
                    <PictureOutlined style={{ fontSize: 40 }} />
                    <div className="mt-2 text-sm">标注重点后点击「生成配图」</div>
                  </div>
                )}
                {imageLoading && (
                  <div className="text-center py-6">
                    <Spin size="large" />
                    <div className="mt-2 text-gray-500 text-sm">正在生成配图...</div>
                  </div>
                )}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={img} 
                          alt={index === 0 ? '首图' : '内容图' + index}
                          className="w-full rounded-lg border"
                        />
                        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {index === 0 ? '首图' : '内容图' + index}
                        </div>
                        <a
                          href={img}
                          download={index === 0 ? '首图.png' : '内容图' + index + '.png'}
                          className="absolute top-2 right-2 bg-white/80 text-gray-700 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          下载
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* 重新创作 */}
              <Button block onClick={() => { setResult(null); setImages([]) }}>
                重新{mode === 'create' ? '创作' : '仿写'}
              </Button>
            </Space>
          )}
        </Col>
      </Row>
    </div>
  )
}
