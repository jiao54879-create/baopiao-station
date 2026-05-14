import { useState, useEffect } from 'react'
import { Card, Row, Col, Tag, Select, Input, Spin, Empty, Button, Modal, List, Tooltip, Alert, message, Upload, Space, Divider } from 'antd'
import { StarOutlined, SaveOutlined, ThunderboltOutlined, DownloadOutlined, WechatOutlined, CopyOutlined, UploadOutlined, EditOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import api from '../utils/api'

const { Search } = Input

// 内容结构配置 - 4种内容结构类型
const contentStructures = [
  {
    value: 'strategy',
    label: '思路类',
    icon: '🧭',
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

// 风格配置 - 5种风格 x 3个大佬锚点 + 不模仿 + 自定义模仿
const rewriteStyles = [
  {
    value: 'hearth',
    label: '走心唠嗑风',
    desc: '像闺蜜聊天，用真实故事打动人',
    icon: '💬',
    masters: [
      { value: 'mimeng', name: '咪蒙模式', avatar: '🧡', desc: '自黑式开头，情绪饱满，一句话独立成段' },
      { value: 'houcuicui', name: '侯翠翠模式', avatar: '💚', desc: '闺蜜八卦式碎碎念，抱怨中带温暖' },
      { value: 'leijun', name: '雷军模式', avatar: '💙', desc: '真诚大白话，偶尔自嘲，给朴素建议' },
      { value: 'no-imitation', name: '不模仿，自由发挥', avatar: '🎨', desc: '不用任何大佬风格，AI根据内容自然发挥' },
      { value: 'custom-imitation', name: '自定义风格', avatar: '✏️', desc: '输入你想模仿的风格描述，AI按你的要求来' }
    ]
  },
  {
    value: 'practical',
    label: '干货避坑风',
    desc: '专业+实用，列要点讲清楚',
    icon: '📋',
    masters: [
      { value: 'banfo', name: '半佛仙人模式', avatar: '🧣', desc: '颠覆性结论开头，一句话一段，快节奏' },
      { value: 'zhangxuefeng', name: '张雪峰模式', avatar: '🧢', desc: '极端判断抓注意，干货+段子，东北味' },
      { value: 'kazike', name: '卡兹克模式', avatar: '🧤', desc: '真实体验切入，Slogan式干货，拒绝套话' },
      { value: 'no-imitation', name: '不模仿，自由发挥', avatar: '🎨', desc: '不用任何大佬风格，AI根据内容自然发挥' },
      { value: 'custom-imitation', name: '自定义风格', avatar: '✏️', desc: '输入你想模仿的风格描述，AI按你的要求来' }
    ]
  },
  {
    value: 'twist',
    label: '反转打脸风',
    desc: '先抛常识→再颠覆→给方案',
    icon: '🎭',
    masters: [
      { value: 'baguamangguo', name: '八卦芒果模式', avatar: '🥭', desc: '八卦式切入，先站队再反转，打脸共同敌人' },
      { value: 'mimeng-slap', name: '咪蒙打脸模式', avatar: '💜', desc: '一句话打脸→展开论证→金句锤死' },
      { value: 'banfo-twist', name: '半佛反转模式', avatar: '🎪', desc: '颠覆结论→极端案例轰炸→拆解底层逻辑' },
      { value: 'no-imitation', name: '不模仿，自由发挥', avatar: '🎨', desc: '不用任何大佬风格，AI根据内容自然发挥' },
      { value: 'custom-imitation', name: '自定义风格', avatar: '✏️', desc: '输入你想模仿的风格描述，AI按你的要求来' }
    ]
  },
  {
    value: 'anxiety',
    label: '焦虑共鸣风',
    desc: '戳痛点→引发共鸣→提供出路',
    icon: '🔥',
    masters: [
      { value: 'zhangxuefeng-anxiety', name: '张雪峰焦虑模式', avatar: '🔴', desc: '用具体数字制造紧迫感，"急"字当头给出路' },
      { value: 'baolocaomei', name: '暴躁草莓模式', avatar: '🍓', desc: '抱怨吐槽真实困境，把痛苦写成段子' },
      { value: 'mimeng-resonate', name: '咪蒙共鸣模式', avatar: '💗', desc: '戳中隐秘痛点，排比+反问，先共情再给力量' },
      { value: 'no-imitation', name: '不模仿，自由发挥', avatar: '🎨', desc: '不用任何大佬风格，AI根据内容自然发挥' },
      { value: 'custom-imitation', name: '自定义风格', avatar: '✏️', desc: '输入你想模仿的风格描述，AI按你的要求来' }
    ]
  },
  {
    value: 'data',
    label: '数据震撼风',
    desc: '用数据说话，制造认知冲击',
    icon: '📊',
    masters: [
      { value: 'kazike-data', name: '卡兹克数据模式', avatar: '📈', desc: '震惊数据开头，Slogan式结论，数据支撑' },
      { value: 'banfo-data', name: '半佛数据模式', avatar: '📉', desc: '一串数字砸脸，每个观点三个信源' },
      { value: 'zhangxuefeng-data', name: '张雪峰数据模式', avatar: '💹', desc: '极端数据制造冲击，数据+金句配合' },
      { value: 'no-imitation', name: '不模仿，自由发挥', avatar: '🎨', desc: '不用任何大佬风格，AI根据内容自然发挥' },
      { value: 'custom-imitation', name: '自定义风格', avatar: '✏️', desc: '输入你想模仿的风格描述，AI按你的要求来' }
    ]
  }
]

const platformMap: Record<string, { label: string; color: string }> = {
  XHS: { label: '小红书', color: 'red' },
  WX: { label: '公众号', color: 'blue' },
  DOUYIN: { label: '抖音', color: 'cyan' },
  WEIBO: { label: '微博', color: 'orange' },
  ZHIHU: { label: '知乎', color: 'geekblue' }
}

const insuranceTypeMap: Record<string, string> = {
  medical: '医疗险',
  critical: '重疾险',
  annuity: '年金险',
  life: '寿险',
  accident: '意外险',
  child: '少儿险',
  pension: '养老险'
}

// 推荐订阅的公众号列表（说明如何获取真实RSS）
const recommendedAccounts = [
  { name: '深蓝保', bizId: 'gh_8b9c0d7a8f5c', description: '深蓝保官方公众号' },
  { name: '多保鱼', bizId: 'gh_7d5c9b3f6e4a', description: '多保鱼官方公众号' },
  { name: '小骆驼', bizId: 'gh_6a8b2c4e5d9f', description: '小骆驼教你保' },
  { name: '学霸说保险', bizId: 'gh_5f9a1b3c7e2d', description: '学霸说保险官方公众号' },
  { name: '奶爸保', bizId: 'gh_4e8a0c5f6b1d', description: '奶爸保官方公众号' },
  { name: '小雨伞', bizId: 'gh_3d7f9a2c5e8b', description: '小雨伞官方公众号' },
]

export default function Cases() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedInsuranceType, setSelectedInsuranceType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false)
  const [subscribeUrl, setSubscribeUrl] = useState('')
  const [subscribeWechatId, setSubscribeWechatId] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribedList, setSubscribedList] = useState<any[]>([])
  // 一键仿写相关状态
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false)
  const [rewriteCase, setRewriteCase] = useState<any>(null)
  const [selectedStructure, setSelectedStructure] = useState<string>('')
  const [selectedStructureSub, setSelectedStructureSub] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [selectedMaster, setSelectedMaster] = useState<string>('')
  const [customStyleDesc, setCustomStyleDesc] = useState<string>('')
  const [rewriting, setRewriting] = useState(false)
  const [rewriteResult, setRewriteResult] = useState<any>(null)

  // 当前选中风格的大佬列表
  const currentStyleMasters = rewriteStyles.find(s => s.value === selectedStyle)?.masters || []
  // 当前选中的内容结构
  const currentStructure = contentStructures.find(s => s.value === selectedStructure)
  // 当前内容结构的子选项
  const currentStructureSubOptions = currentStructure?.subOptions || []

  // 打开仿写弹窗
  const handleRewrite = (caseItem: any) => {
    setRewriteCase(caseItem)
    setSelectedStructure('')
    setSelectedStructureSub('')
    setSelectedStyle('')
    setSelectedMaster('')
    setCustomStyleDesc('')
    setRewriteResult(null)
    setRewriteModalOpen(true)
  }

  // 风格选择变化时，自动选中第一个大佬
  const handleStyleChange = (styleValue: string) => {
    setSelectedStyle(styleValue)
    const style = rewriteStyles.find(s => s.value === styleValue)
    if (style && style.masters.length > 0) {
      setSelectedMaster(style.masters[0].value)
    } else {
      setSelectedMaster('')
    }
  }

  // 执行仿写
  const executeRewrite = async () => {
    if (!selectedStyle || !selectedMaster) {
      message.warning('请选择仿写风格和大佬模式')
      return
    }
    if (selectedMaster === 'custom-imitation' && !customStyleDesc.trim()) {
      message.warning('请输入自定义风格描述')
      return
    }
    setRewriting(true)
    setRewriteResult(null)
    try {
      const requestData: any = {
        style: selectedStyle,
        master: selectedMaster
      }
      if (selectedStructure) {
        requestData.structure = selectedStructure
      }
      if (selectedStructureSub) {
        requestData.structureSub = selectedStructureSub
      }
      if (customStyleDesc.trim()) {
        requestData.customStyleDesc = customStyleDesc.trim()
      }
      const { data: res } = await api.post(`/cases/${rewriteCase.id}/rewrite`, requestData)
      setRewriteResult(res)
    } catch (error: any) {
      message.error(error.response?.data?.error || '仿写失败，请稍后重试')
    } finally {
      setRewriting(false)
    }
  }

  // 复制仿写结果
  const copyRewriteResult = async (type: 'title' | 'content' | 'all') => {
    if (!rewriteResult) return
    let text = ''
    if (type === 'title') {
      text = rewriteResult.title
    } else if (type === 'content') {
      text = rewriteResult.content
    } else {
      text = `标题：${rewriteResult.title}\n\n正文：\n${rewriteResult.content}\n\n标签：${rewriteResult.tags?.join(' ') || ''}`
    }
    try {
      await navigator.clipboard.writeText(text)
      message.success('已复制到剪贴板')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      message.success('已复制到剪贴板')
    }
  }

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (selectedPlatform) params.platform = selectedPlatform
      if (selectedInsuranceType) params.insuranceType = selectedInsuranceType
      if (keyword) params.keyword = keyword

      const { data: res } = await api.get('/cases', { params })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedPlatform, selectedInsuranceType])

  const handleSave = async (caseId: number) => {
    try {
      await api.post(`/cases/${caseId}/save`)
      message.success('已收藏')
    } catch (error: any) {
      message.error(error.response?.data?.error || '收藏失败')
    }
  }

  const analyzeCase = async (caseItem: any) => {
    setSelectedCase(caseItem)
    setAnalyzing(true)
    try {
      const { data } = await api.post('/cases/analyze', {
        title: caseItem.title,
        content: caseItem.content || '',
        metrics: {
          likes: caseItem.likesCount,
          favorites: caseItem.favoritesCount,
          comments: caseItem.commentsCount
        }
      })
      setSelectedCase({ ...caseItem, analysis: data })
    } catch (error) {
      message.error('AI分析功能暂不可用，请稍后重试')
    } finally {
      setAnalyzing(false)
    }
  }

  // 采集爆款数据（真实小红书笔记，需要 Chrome 已登录 + autocli 扩展）
  const handleCollect = async () => {
    setCollecting(true)
    try {
      const { data: res } = await api.post('/collect/viral')
      if (res.success) {
        message.success(res.message || '采集完成')
        fetchData()
      } else {
        // 采集失败（未连接 Chrome 扩展等）
        Modal.warning({
          title: '采集失败',
          content: (
            <div>
              <p style={{ marginBottom: 8 }}>{res.message}</p>
              <p style={{ color: '#666', fontSize: 13 }}>采集小红书真实笔记需要：</p>
              <ol style={{ paddingLeft: 18, fontSize: 13, color: '#666' }}>
                <li>在 Chrome 中打开并登录小红书</li>
                <li>安装 autocli Chrome 扩展</li>
                <li>确保 autocli 已正常运行（在终端执行 <code>autocli doctor</code> 检查）</li>
              </ol>
            </div>
          )
        })
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.response?.data?.error || '采集失败，请检查 Chrome 是否已登录小红书并安装 autocli 扩展'
      Modal.error({
        title: '采集失败',
        content: (
          <div>
            <p>{errMsg}</p>
            <p style={{ color: '#666', fontSize: 13, marginTop: 8 }}>采集小红书真实笔记需要：</p>
            <ol style={{ paddingLeft: 18, fontSize: 13, color: '#666' }}>
              <li>在 Chrome 中打开并登录小红书</li>
              <li>安装 autocli Chrome 扩展并保持连接</li>
              <li>终端执行 <code>autocli doctor</code> 确认状态</li>
            </ol>
          </div>
        )
      })
    } finally {
      setCollecting(false)
    }
  }

  // 订阅公众号
  const handleSubscribe = async () => {
    // 如果有 wechatId，直接用 wechatId 订阅
    if (subscribeWechatId) {
      setSubscribing(true)
      try {
        await api.post('/subscribe/wechat', {
          wechatId: subscribeWechatId,
          wechatName: subscribeWechatId
        })
        message.success('订阅成功！')
        setSubscribeWechatId('')
        setSubscribeModalOpen(false)
      } catch (error: any) {
        message.error(error.response?.data?.error || '订阅失败')
      } finally {
        setSubscribing(false)
      }
      return
    }
    
    // 否则使用文章链接
    if (!subscribeUrl.trim()) {
      message.warning('请输入公众号文章链接或微信号')
      return
    }
    
    // 验证是否是微信文章链接
    if (!subscribeUrl.includes('mp.weixin.qq.com')) {
      message.error('请输入正确的微信公众号文章链接')
      return
    }

    setSubscribing(true)
    try {
      await api.post('/subscribe/wechat', {
        articleUrl: subscribeUrl
      })
      message.success('订阅成功！系统将自动采集该公众号的最新文章')
      setSubscribeUrl('')
      setSubscribeModalOpen(false)
    } catch (error: any) {
      message.error(error.response?.data?.error || '订阅失败')
    } finally {
      setSubscribing(false)
    }
  }

  // 快速订阅公众号
  const handleQuickSubscribe = async (bizId: string, name: string) => {
    setSubscribeWechatId(bizId)
    setSubscribing(true)
    try {
      await api.post('/subscribe/wechat', {
        wechatId: bizId,
        wechatName: name
      })
      message.success(`已订阅 ${name}！`)
    } catch (error: any) {
      message.error(error.response?.data?.error || '订阅失败')
    } finally {
      setSubscribing(false)
      setSubscribeWechatId('')
    }
  }

  // 导入本地采集的 JSON 文件
  const handleImportJSON: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file as File)
      await api.post('/cases/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      message.success('导入成功')
      fetchData()
      onSuccess?.(null)
    } catch (error: any) {
      message.error(error.response?.data?.error || '导入失败')
      onError?.(new Error(error.response?.data?.error || '导入失败'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">🔥 爆款情报站</h1>
        <div className="flex gap-2 mb-4">
          <Tooltip title="采集小红书真实笔记（需安装 AutoCLI Chrome 扩展并已登录）">
            <Button 
              type="primary" 
              icon={<ThunderboltOutlined />} 
              onClick={handleCollect}
              loading={collecting}
              danger
            >
              采集爆款
            </Button>
          </Tooltip>
          <Tooltip title="订阅公众号自动采集文章">
            <Button 
              icon={<WechatOutlined />} 
              onClick={() => setSubscribeModalOpen(true)}
              size="small"
            >
              订阅公众号
            </Button>
          </Tooltip>
          <Upload
            accept=".json"
            showUploadList={false}
            customRequest={handleImportJSON}
            disabled={importing}
          >
            <Tooltip title="导入本地采集的 JSON 文件（需先运行 collect-xhs-local.js 脚本）">
              <Button icon={<UploadOutlined />} loading={importing} size="small">
                导入JSON
              </Button>
            </Tooltip>
          </Upload>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            placeholder="选择平台"
            allowClear
            value={selectedPlatform || undefined}
            onChange={setSelectedPlatform}
            style={{ width: 100 }}
            options={Object.entries(platformMap).map(([value, { label }]) => ({ value, label }))}
          />
          <Select
            placeholder="选择险种"
            allowClear
            value={selectedInsuranceType || undefined}
            onChange={setSelectedInsuranceType}
            style={{ width: 100 }}
            options={Object.entries(insuranceTypeMap).map(([value, label]) => ({ value, label }))}
          />
          <Search
            placeholder="搜索案例..."
            onSearch={(v) => { setKeyword(v); fetchData() }}
            style={{ width: 200 }}
            allowClear
          />
        </div>
      </div>

      {/* 数据说明 */}
      <Alert
        message="数据来源说明"
        description={
          <div className="text-sm">
            当前数据为示例数据。如需真实数据，点击「订阅公众号」按钮，粘贴公众号文章链接即可订阅。
            小红书数据需要安装 AutoCLI Chrome 扩展。
          </div>
        }
        type="info"
        showIcon
      />

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {data.map((item) => (
            <Col key={item.id} span={12}>
              <Card
                hoverable
                className="hover-lift"
                actions={[
                  <Button key="save" type="text" icon={<SaveOutlined />} onClick={() => handleSave(item.id)}>
                    收藏
                  </Button>,
                  <Button key="analyze" type="text" icon={<ThunderboltOutlined />} onClick={() => analyzeCase(item)}>
                    AI分析
                  </Button>,
                  <Button key="rewrite" type="text" icon={<EditOutlined />} onClick={() => handleRewrite(item)}>
                    一键仿写
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <div className="flex items-center gap-2 mb-2">
                      <Tag color={platformMap[item.platform]?.color}>
                        {platformMap[item.platform]?.label}
                      </Tag>
                      {item.insuranceType && (
                        <Tag color="purple">{insuranceTypeMap[item.insuranceType] || item.insuranceType}</Tag>
                      )}
                      <Tag color={item.viralScore && item.viralScore > 80 ? 'red' : 'default'}>
                        <StarOutlined /> {item.viralScore?.toFixed(1) || '?'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <h3 className="font-medium text-base mb-2">{item.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>👍 {item.likesCount}</span>
                        <span>⭐ {item.favoritesCount}</span>
                        <span>💬 {item.commentsCount}</span>
                        {item.author && <span>作者：{item.author}</span>}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        {data.length === 0 && !loading && (
          <Empty description="暂无爆款案例，点击「订阅公众号」开始采集" />
        )}
      </Spin>

      {/* AI 分析 Modal */}
      <Modal
        title="🔥 爆款分析"
        open={!!selectedCase}
        onCancel={() => setSelectedCase(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedCase(null)}>关闭</Button>,
          <Button key="save" type="primary" onClick={() => { handleSave(selectedCase.id); setSelectedCase(null); }}>
            收藏此案例
          </Button>
        ]}
        width={700}
      >
        {selectedCase && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">原文标题</h4>
              <p>{selectedCase.title}</p>
            </div>

            {analyzing ? (
              <div className="text-center py-8">
                <Spin tip="AI 正在分析中..." />
              </div>
            ) : selectedCase.analysis ? (
              <>
                <div>
                  <h4 className="font-medium text-primary">🔥 爆款因素</h4>
                  <ul className="list-disc pl-5">
                    {selectedCase.analysis.viralFactors?.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-secondary">📝 内容结构</h4>
                  <p><strong>开头：</strong>{selectedCase.analysis.contentStructure?.opening}</p>
                  <p><strong>中间：</strong>{selectedCase.analysis.contentStructure?.middle}</p>
                  <p><strong>结尾：</strong>{selectedCase.analysis.contentStructure?.ending}</p>
                </div>

                <div>
                  <h4 className="font-medium text-blue-500">💡 可复用公式</h4>
                  <p className="bg-blue-50 p-3 rounded">{selectedCase.analysis.reusableFormula}</p>
                </div>

                <div>
                  <h4 className="font-medium text-green-500">✨ 模仿建议</h4>
                  <ul className="list-disc pl-5">
                    {selectedCase.analysis.suggestions?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <Alert
                message="AI分析功能说明"
                description="当前案例为示例数据，无法进行真实的AI分析。请订阅真实的公众号后，采集真实数据即可使用AI分析功能。"
                type="warning"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>

      {/* 订阅公众号 Modal */}
      <Modal
        title={<><WechatOutlined /> 订阅公众号</>}
        open={subscribeModalOpen}
        onCancel={() => { setSubscribeModalOpen(false); setSubscribeUrl(''); setSubscribeWechatId(''); }}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <Alert
            message="一键订阅推荐公众号"
            description="点击下方按钮直接订阅，无需复制链接"
            type="info"
            showIcon
          />

          <div className="space-y-2">
            {recommendedAccounts.map((account) => (
              <div key={account.bizId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <WechatOutlined style={{ fontSize: 24, color: '#07C160' }} />
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-xs text-gray-500">{account.description}</div>
                  </div>
                </div>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleQuickSubscribe(account.bizId, account.name)}
                  loading={subscribing && subscribeWechatId === account.bizId}
                >
                  订阅
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">自定义订阅</h4>
            <div className="space-y-2">
              <Input
                placeholder="输入公众号文章链接（mp.weixin.qq.com/s/...）"
                value={subscribeUrl}
                onChange={(e) => setSubscribeUrl(e.target.value)}
                status={subscribeUrl && !subscribeUrl.includes('mp.weixin.qq.com') ? 'error' : undefined}
              />
              <Input
                placeholder="或输入公众号原始ID（如 gh_8b9c0d7a8f5c）"
                value={subscribeWechatId}
                onChange={(e) => setSubscribeWechatId(e.target.value)}
              />
              <Button 
                type="primary" 
                block 
                loading={subscribing} 
                onClick={handleSubscribe}
                disabled={!subscribeUrl.includes('mp.weixin.qq.com') && !subscribeWechatId}
              >
                确认订阅
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 一键仿写 Modal - 新版三步选择 */}
      <Modal
        title={<><EditOutlined /> 一键仿写爆款</>}
        open={rewriteModalOpen}
        onCancel={() => { setRewriteModalOpen(false); setRewriteResult(null); }}
        footer={null}
        width={900}
      >
        {rewriteCase && (
          <div className="space-y-4">
            {/* 原案例信息 */}
            <Alert
              message="原爆款笔记"
              description={
                <div>
                  <div className="font-medium">{rewriteCase.title}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    👍 {rewriteCase.likesCount} ⭐ {rewriteCase.favoritesCount} 💬 {rewriteCase.commentsCount}
                    {rewriteCase.author && <span> | 作者：{rewriteCase.author}</span>}
                  </div>
                </div>
              }
              type="info"
              showIcon
            />

            {/* 第一步：选择内容结构（可选） */}
            <div>
              <h4 className="font-medium mb-2">
                第一步：选择内容结构 <span className="text-gray-500 font-normal text-sm">（可选，不选则AI自由发挥）</span>
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {contentStructures.map((structure) => (
                  <div
                    key={structure.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all text-center ${
                      selectedStructure === structure.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => {
                      setSelectedStructure(selectedStructure === structure.value ? '' : structure.value)
                      setSelectedStructureSub('')
                    }}
                  >
                    <div className="text-2xl mb-1">{structure.icon}</div>
                    <div className="font-medium text-sm">{structure.label}</div>
                    <div className="text-xs text-gray-500">{structure.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 第二步：选择子选项（根据内容结构动态显示） */}
            {selectedStructure && currentStructureSubOptions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">
                  第二步：选择具体方向 <span className="text-gray-500 font-normal text-sm">（可选）</span>
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {currentStructureSubOptions.map((sub) => (
                    <div
                      key={sub.value}
                      className={`p-2 border rounded-lg cursor-pointer transition-all text-center ${
                        selectedStructureSub === sub.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => setSelectedStructureSub(selectedStructureSub === sub.value ? '' : sub.value)}
                    >
                      <span className="text-xl mr-1">{sub.icon}</span>
                      <span className="text-sm">{sub.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 第三步：选择风格大类 */}
            <div>
              <h4 className="font-medium mb-2">第三步：选择风格大类</h4>
              <div className="grid grid-cols-5 gap-2">
                {rewriteStyles.map((style) => (
                  <div
                    key={style.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all text-center ${
                      selectedStyle === style.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleStyleChange(style.value)}
                  >
                    <div className="text-2xl mb-1">{style.icon}</div>
                    <div className="font-medium text-sm">{style.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 第四步：选择大佬模式 */}
            {selectedStyle && (
              <div>
                <h4 className="font-medium mb-2">
                  第四步：选择写作模式 <span className="text-gray-500 font-normal text-sm">（AI将按该模式生成内容）</span>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {currentStyleMasters.map((master) => (
                    <div
                      key={master.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedMaster === master.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedMaster(master.value)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{master.avatar}</span>
                        <div className="font-medium">{master.name}</div>
                      </div>
                      <div className="text-xs text-gray-500">{master.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 自定义风格输入框 */}
            {selectedMaster === 'custom-imitation' && (
              <div>
                <h4 className="font-medium mb-2">
                  请描述你想要的风格 <span className="text-red-500">*</span>
                </h4>
                <Input.TextArea
                  placeholder="例如：用小蔡碎碎念的风格写，像跟朋友聊天一样自然亲切"
                  value={customStyleDesc}
                  onChange={(e) => setCustomStyleDesc(e.target.value)}
                  rows={3}
                  maxLength={200}
                  showCount
                />
                <div className="text-xs text-gray-500 mt-1">
                  描述越详细，AI越能按你的要求来写
                </div>
              </div>
            )}

            {/* 执行按钮 */}
            <Button
              type="primary"
              block
              size="large"
              loading={rewriting}
              onClick={executeRewrite}
              disabled={!selectedStyle || !selectedMaster || (selectedMaster === 'custom-imitation' && !customStyleDesc.trim())}
              icon={<EditOutlined />}
            >
              {rewriting ? 'AI 正在仿写中...' : '开始仿写'}
            </Button>

            {/* 仿写结果 */}
            {rewriteResult && (
              <div className="space-y-4 mt-4">
                <Divider>✨ 仿写结果</Divider>

                {/* 标题 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">📌 标题</h4>
                    <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyRewriteResult('title')}>
                      复制
                    </Button>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-lg font-medium">
                    {rewriteResult.title}
                  </div>
                </div>

                {/* 正文 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">📝 正文</h4>
                    <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyRewriteResult('content')}>
                      复制
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed max-h-80 overflow-y-auto">
                    {rewriteResult.content}
                  </div>
                </div>

                {/* 标签 */}
                {rewriteResult.tags && rewriteResult.tags.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">🏷️ 推荐标签</h4>
                      <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyRewriteResult('all')}>
                        复制全部
                      </Button>
                    </div>
                    <Space wrap>
                      {rewriteResult.tags.map((tag: string, i: number) => (
                        <Tag key={i} color="blue">{tag}</Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button type="primary" block icon={<CopyOutlined />} onClick={() => copyRewriteResult('all')}>
                    一键复制全部内容
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
