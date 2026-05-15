import { useState, useEffect } from 'react'
import { Card, Row, Col, Tag, Input, Spin, Empty, Button, Modal, List, Tooltip, message, Space, Divider } from 'antd'
import { StarOutlined, SaveOutlined, ThunderboltOutlined, CopyOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'
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


export default function Cases() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedInsuranceType, setSelectedInsuranceType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  
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



  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">🔥 爆款情报站</h1>


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
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 500, 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      whiteSpace: 'normal',
                      lineHeight: 1.4
                    }}>
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
                      {item.author && (
                        <div className="text-xs text-gray-400 mb-1">
                          ✍️ {item.author}
                        </div>
                      )}
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

      {/* AI分析弹窗 */}
      <Modal
        title="🔥 爆款分析"
        open={!!selectedCase?.analysis}
        onCancel={() => setSelectedCase(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedCase(null)}>关闭</Button>,
          <Button key="rewrite" type="primary" icon={<EditOutlined />} onClick={() => { handleRewrite(selectedCase); setSelectedCase(null) }}>
            一键仿写
          </Button>
        ]}
        width={700}
      >
        {selectedCase?.analysis && (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-bold mb-2">{selectedCase.title}</div>
              <div className="flex gap-3 text-sm text-gray-500">
                <span>👍 {selectedCase.likesCount}</span>
                <span>⭐ {selectedCase.favoritesCount}</span>
                <span>💬 {selectedCase.commentsCount}</span>
              </div>
            </div>

            {/* 爆款指数 */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">📊 爆款指数</div>
                <div className="text-2xl font-bold" style={{ color: (selectedCase.analysis.viralScore || 0) >= 80 ? '#ef4444' : (selectedCase.analysis.viralScore || 0) >= 60 ? '#f59e0b' : '#6b7280' }}>
                  {selectedCase.analysis.viralScore || '?'}/100
                </div>
              </div>
              {selectedCase.analysis.viralFactors && selectedCase.analysis.viralFactors.length > 0 && (
                <div className="mt-2">
                  {selectedCase.analysis.viralFactors.map((f: string, i: number) => (
                    <Tag key={i} color="blue" className="mb-1">{f}</Tag>
                  ))}
                </div>
              )}
            </div>

            {/* 内容结构 */}
            {selectedCase.analysis.contentStructure && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-medium mb-2">🏗️ 内容结构拆解</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><span className="font-medium text-green-700">开头：</span>{selectedCase.analysis.contentStructure.opening}</div>
                  <div><span className="font-medium text-green-700">正文：</span>{selectedCase.analysis.contentStructure.body}</div>
                  <div><span className="font-medium text-green-700">结尾：</span>{selectedCase.analysis.contentStructure.ending}</div>
                </div>
              </div>
            )}

            {/* 选题角度 */}
            {selectedCase.analysis.topicAngle && (
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="font-medium mb-2">🎯 选题角度</div>
                <div className="text-sm text-gray-700">{selectedCase.analysis.topicAngle}</div>
              </div>
            )}

            {/* 爆款钩子 */}
            {selectedCase.analysis.hooks && selectedCase.analysis.hooks.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="font-medium mb-2">🪝 爆款钩子</div>
                <div className="space-y-1">
                  {selectedCase.analysis.hooks.map((h: string, i: number) => (
                    <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 语言风格 */}
            {selectedCase.analysis.styleFeatures && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-medium mb-2">✍️ 语言风格</div>
                <div className="text-sm text-gray-700">{selectedCase.analysis.styleFeatures}</div>
              </div>
            )}

            {/* 可复用公式 */}
            {selectedCase.analysis.reusableFormula && (
              <div className="p-4 bg-cyan-50 rounded-lg">
                <div className="font-medium mb-2">📋 可复用公式</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedCase.analysis.reusableFormula}</div>
              </div>
            )}

            {/* 仿写建议 */}
            {selectedCase.analysis.suggestions && selectedCase.analysis.suggestions.length > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="font-medium mb-2">💡 仿写建议</div>
                <div className="space-y-1">
                  {selectedCase.analysis.suggestions.map((s: string, i: number) => (
                    <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 分析加载中 */}
      <Modal
        title="🔥 爆款分析"
        open={analyzing}
        footer={null}
        closable={false}
      >
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-4 text-gray-500">AI 正在深度分析中...</div>
        </div>
      </Modal>
    </div>
  )
}
