import { useState, useEffect } from 'react'
import { Card, Row, Col, Tag, Input, Spin, Empty, Button, Modal, List, Tooltip, message, Upload, Space, Divider } from 'antd'
import { StarOutlined, SaveOutlined, ThunderboltOutlined, DownloadOutlined, WechatOutlined, CopyOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import api from '../utils/api'

const { Search } = Input

// 内容结构配置 - 4种内容结构类型
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

// 风格配置 - 5种风格 x 3个大佬锚点 + 不模仿 + 自定义模仿
const rewriteStyles = [
  {
    value: 'hearth',
    label: '走心唠嗑风',
    desc: '像闺蜜聊天，用真实故事打动人',
    icon: '💬',
    color: '#ec4899',
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
    color: '#10b981',
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
    color: '#f97316',
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
    color: '#ef4444',
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
    color: '#6366f1',
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

// 推荐订阅的公众号列表
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

  // 采集爆款数据
  const handleCollect = async () => {
    setCollecting(true)
    try {
      const { data: res } = await api.post('/collect/viral')
      if (res.success) {
        message.success(res.message || '采集完成')
        fetchData()
      } else {
        Modal.warning({
          title: '采集失败',
          content: (
            <div>
              <p style={{ marginBottom: 8 }}>{res.message}</p>
              <p style={{ color: '#666', fontSize: 13 }}>采集小红书真实笔记需要：</p>
              <ol style={{ paddingLeft: 18, fontSize: 13, color: '#666' }}>
                <li>在 Chrome 中打开并登录小红书</li>
                <li>安装 autocli Chrome 扩展</li>
                <li>确保 autocli 已正常运行</li>
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
    
    if (!subscribeUrl.trim()) {
      message.warning('请输入公众号文章链接或微信号')
      return
    }
    
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
            <Button icon={<UploadOutlined />} size="small" loading={importing}>
              导入JSON
            </Button>
          </Upload>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Input.Search
            placeholder="搜索案例标题/内容"
            onSearch={(val) => {
              setKeyword(val)
              fetchData()
            }}
            style={{ width: 250 }}
            allowClear
          />
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={selectedPlatform}
            onChange={e => setSelectedPlatform(e.target.value)}
          >
            <option value="">全部平台</option>
            {Object.entries(platformMap).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={selectedInsuranceType}
            onChange={e => setSelectedInsuranceType(e.target.value)}
          >
            <option value="">全部险种</option>
            {Object.entries(insuranceTypeMap).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" />
        </div>
      ) : data.length === 0 ? (
        <Empty description="暂无数据，请先采集或导入" />
      ) : (
        <Row gutter={[16, 16]}>
          {data.map((item) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={item.id}>
              <Card
                hoverable
                className="h-full"
                cover={
                  item.coverImage ? (
                    <img 
                      src={item.coverImage} 
                      alt="封面" 
                      style={{ height: 160, objectFit: 'cover' }}
                    />
                  ) : undefined
                }
                actions={[
                  <Tooltip key="rewrite" title="一键仿写">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleRewrite(item)}>
                      仿写
                    </Button>
                  </Tooltip>,
                  <Tooltip key="save" title="收藏">
                    <Button type="text" icon={<StarOutlined />} onClick={() => handleSave(item.id)}>
                      收藏
                    </Button>
                  </Tooltip>,
                  <Tooltip key="analyze" title="AI分析">
                    <Button type="text" icon={<ThunderboltOutlined />} onClick={() => analyzeCase(item)}>
                      分析
                    </Button>
                  </Tooltip>,
                ]}
              >
                <Card.Meta
                  title={
                    <div className="text-sm font-medium line-clamp-2">
                      {item.title}
                    </div>
                  }
                  description={
                    <div className="mt-2">
                      <div className="flex gap-1 mb-2 flex-wrap">
                        <Tag color={platformMap[item.platform]?.color || 'default'}>
                          {platformMap[item.platform]?.label || item.platform}
                        </Tag>
                        {item.insuranceType && (
                          <Tag>{insuranceTypeMap[item.insuranceType] || item.insuranceType}</Tag>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex gap-3">
                        <span>👍 {item.likesCount || 0}</span>
                        <span>⭐ {item.favoritesCount || 0}</span>
                        <span>💬 {item.commentsCount || 0}</span>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 订阅公众号弹窗 */}
      <Modal
        title="订阅公众号"
        open={subscribeModalOpen}
        onCancel={() => {
          setSubscribeModalOpen(false)
          setSubscribeUrl('')
          setSubscribeWechatId('')
        }}
        footer={null}
      >
        <div className="mb-4">
          <Input
            prefix={<WechatOutlined />}
            placeholder="粘贴微信公众号文章链接"
            value={subscribeUrl}
            onChange={e => setSubscribeUrl(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            或直接输入微信号ID（如：gh_xxx）
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">快速订阅</div>
          <div className="flex flex-wrap gap-2">
            {recommendedAccounts.map(acc => (
              <Button
                key={acc.bizId}
                size="small"
                onClick={() => handleQuickSubscribe(acc.bizId, acc.name)}
                loading={subscribing && subscribeWechatId === acc.bizId}
              >
                {acc.name}
              </Button>
            ))}
          </div>
        </div>

        <Button type="primary" block onClick={handleSubscribe} loading={subscribing}>
          确认订阅
        </Button>
      </Modal>

      {/* 仿写弹窗 - 新卡片式UI */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl">✍️</span>
            <span>一键仿写爆款笔记</span>
          </div>
        }
        open={rewriteModalOpen}
        onCancel={() => {
          setRewriteModalOpen(false)
          setRewriteResult(null)
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        {rewriteCase && (
          <div className="py-4">
            {/* 参考案例信息 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">参考案例</div>
              <div className="font-medium">{rewriteCase.title}</div>
            </div>

            {/* 仿写结果展示 */}
            {rewriteResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">✨ 仿写完成</span>
                    <Button size="small" onClick={() => copyRewriteResult('all')}>
                      复制全文
                    </Button>
                  </div>
                  <div className="text-lg font-bold mb-3 text-green-800">{rewriteResult.title}</div>
                  <div 
                    className="text-sm whitespace-pre-wrap mb-3 max-h-64 overflow-y-auto"
                    style={{ lineHeight: 1.8 }}
                  >
                    {rewriteResult.content}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {rewriteResult.tags?.map((tag: string, i: number) => (
                      <Tag key={i} color="green">{tag}</Tag>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setRewriteResult(null)}>重新生成</Button>
                  <Button type="primary" onClick={() => copyRewriteResult('all')}>
                    复制到剪贴板
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 第一步：内容结构选择 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">1</span>
                    <span className="font-medium">选择内容结构</span>
                    <span className="text-xs text-gray-400">(必选)</span>
                  </div>
                  <Row gutter={[12, 12]}>
                    {contentStructures.map(struct => (
                      <Col span={6} key={struct.value}>
                        <div
                          onClick={() => {
                            setSelectedStructure(struct.value)
                            setSelectedStructureSub('')
                          }}
                          className="cursor-pointer rounded-lg p-3 text-center transition-all border-2"
                          style={{
                            borderColor: selectedStructure === struct.value ? struct.color : '#e5e7eb',
                            background: selectedStructure === struct.value ? `${struct.color}10` : 'white'
                          }}
                        >
                          <div className="text-2xl mb-1">{struct.icon}</div>
                          <div className="font-medium text-sm">{struct.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{struct.desc}</div>
                          {selectedStructure === struct.value && (
                            <CheckOutlined className="absolute top-2 right-2" style={{ color: struct.color }} />
                          )}
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* 第二步：具体方向选择（根据结构动态显示） */}
                {selectedStructure && currentStructureSubOptions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">2</span>
                      <span className="font-medium">选择具体方向</span>
                      <span className="text-xs text-gray-400">(可选)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentStructureSubOptions.map(sub => (
                        <div
                          key={sub.value}
                          onClick={() => setSelectedStructureSub(selectedStructureSub === sub.value ? '' : sub.value)}
                          className="cursor-pointer px-3 py-2 rounded-full text-sm transition-all border"
                          style={{
                            borderColor: selectedStructureSub === sub.value ? contentStructures.find(s => s.value === selectedStructure)?.color : '#e5e7eb',
                            background: selectedStructureSub === sub.value ? `${contentStructures.find(s => s.value === selectedStructure)?.color}15` : 'white'
                          }}
                        >
                          <span className="mr-1">{sub.icon}</span>
                          {sub.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 第三步：风格大类选择 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-medium">3</span>
                    <span className="font-medium">选择风格大类</span>
                    <span className="text-xs text-gray-400">(必选)</span>
                  </div>
                  <Row gutter={[12, 12]}>
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
                            <CheckOutlined className="absolute top-2 right-2" style={{ color: style.color }} />
                          )}
                          <div className="text-2xl mb-1">{style.icon}</div>
                          <div className="font-medium text-sm">{style.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{style.desc}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* 第四步：大佬锚点选择（根据风格动态显示） */}
                {selectedStyle && currentStyleMasters.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-medium">4</span>
                      <span className="font-medium">选择大佬锚点</span>
                      <span className="text-xs text-gray-400">(必选)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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
                          {selectedMaster === master.value && (
                            <CheckOutlined 
                              className="absolute top-2 right-2" 
                              style={{ color: rewriteStyles.find(s => s.value === selectedStyle)?.color }} 
                            />
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{master.avatar}</span>
                            <div>
                              <div className="font-medium text-sm">{master.name}</div>
                              <div className="text-xs text-gray-500">{master.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 第五步：自定义风格输入 */}
                {selectedMaster === 'custom-imitation' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center font-medium">5</span>
                      <span className="font-medium">自定义风格描述</span>
                      <span className="text-xs text-gray-400">(必填)</span>
                    </div>
                    <Input.TextArea
                      placeholder="描述你想要模仿的风格特点，例如：像李佳琦直播那样有感染力，感叹词多，语气强烈..."
                      value={customStyleDesc}
                      onChange={e => setCustomStyleDesc(e.target.value)}
                      rows={3}
                      showCount
                      maxLength={200}
                    />
                  </div>
                )}

                {/* 确认按钮 */}
                <div className="pt-4 border-t">
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<ThunderboltOutlined />}
                    onClick={executeRewrite}
                    loading={rewriting}
                    disabled={!selectedStyle || !selectedMaster}
                  >
                    {rewriting ? 'AI 仿写中...' : '开始仿写'}
                  </Button>
                  {!selectedStyle && (
                    <div className="text-xs text-gray-400 text-center mt-2">请先选择内容结构和风格</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
