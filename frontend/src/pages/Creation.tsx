import { useState } from 'react'
import {
  Card, Input, Button, Tag, Divider,
  message, Spin, Row, Col, Typography, Space, Alert
} from 'antd'
import {
  EditOutlined, CopyOutlined, ThunderboltOutlined,
  CheckCircleOutlined, LightbulbOutlined
} from '@ant-design/icons'
import api from '../utils/api'

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
  }
]

export default function Creation() {
  const [topic, setTopic] = useState('')
  const [reference, setReference] = useState('')
  const [customStyleDesc, setCustomStyleDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  // 选项状态
  const [selectedStructure, setSelectedStructure] = useState<string>('')
  const [selectedStructureSub, setSelectedStructureSub] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [selectedMaster, setSelectedMaster] = useState<string>('')

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
  }

  const handleCreate = async () => {
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
      if (selectedStructure) {
        requestData.structure = selectedStructure
      }
      if (selectedStructureSub) {
        requestData.structureSub = selectedStructureSub
      }
      if (customStyleDesc.trim()) {
        requestData.customStyleDesc = customStyleDesc.trim()
      }
      if (reference.trim()) {
        requestData.reference = reference.trim()
      }

      const { data } = await api.post('/creation', requestData)
      setResult(data)
      message.success('创作完成！')
    } catch (error: any) {
      message.error(error.response?.data?.error || '创作失败，请稍后重试')
    } finally {
      setLoading(false)
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页头 */}
      <div className="mb-6">
        <Title level={3} style={{ marginBottom: 4 }}>
          ✨ 笔记创作
        </Title>
        <Paragraph type="secondary">
          从零开始创作保险笔记，输入选题，选择风格，AI 自动生成完整的小红书爆款内容
        </Paragraph>
      </div>

      <Row gutter={24}>
        {/* 左侧：输入区域 */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size={16} className="w-full">
            {/* 选题输入 */}
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
                  <LightbulbOutlined className="mr-2" />
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

            {/* 内容结构选择 */}
            <Card 
              title={
                <span>
                  <span className="mr-2">1️⃣</span>
                  内容结构（可选）
                </span>
              }
            >
              <Row gutter={[12, 12]}>
                {contentStructures.map(struct => (
                  <Col span={12} key={struct.value}>
                    <div
                      onClick={() => {
                        setSelectedStructure(selectedStructure === struct.value ? '' : struct.value)
                        setSelectedStructureSub('')
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
                        onClick={() => setSelectedStructureSub(selectedStructureSub === sub.value ? '' : sub.value)}
                        className="cursor-pointer px-3 py-1.5 rounded-full text-sm transition-all border"
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
            </Card>

            {/* 风格选择 */}
            <Card 
              title={
                <span>
                  <span className="mr-2">2️⃣</span>
                  风格选择
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
              {selectedMaster === 'custom-imitation' && (
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

            {/* 创作按钮 */}
            <Button
              type="primary"
              size="large"
              block
              icon={<ThunderboltOutlined />}
              onClick={handleCreate}
              loading={loading}
              disabled={!topic.trim() || !selectedStyle || !selectedMaster}
              style={{ height: 56, fontSize: 16 }}
            >
              {loading ? 'AI 创作中...' : '开始创作'}
            </Button>
          </Space>
        </Col>

        {/* 右侧：结果展示 */}
        <Col xs={24} lg={12}>
          {!result && !loading && (
            <Card className="h-full flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
              <div className="text-center py-16 text-gray-400">
                <EditOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div style={{ fontSize: 16 }}>输入选题，选择风格</div>
                <div style={{ fontSize: 16 }}>点击「开始创作」</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>AI 将为你生成完整的小红书保险笔记</div>
              </div>
            </Card>
          )}

          {loading && (
            <Card style={{ minHeight: 400 }} className="flex items-center justify-center">
              <div className="text-center py-16">
                <Spin size="large" />
                <div className="mt-4 text-gray-500">AI 正在创作中，通常需要 15-30 秒...</div>
              </div>
            </Card>
          )}

          {result && !loading && (
            <Space direction="vertical" size={16} className="w-full">
              <Card
                title={<span><CheckCircleOutlined style={{ color: '#52c41a' }} /> 创作完成</span>}
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
                  <LightbulbOutlined style={{ color: '#4f46e5', marginTop: 2 }} />
                  <div>
                    <Text strong style={{ fontSize: 12, color: '#4f46e5' }}>创作说明</Text>
                    <div className="text-sm text-gray-600 mt-1">
                      以上内容由 AI 基于「{rewriteStyles.find(s => s.value === selectedStyle)?.label}」×「{currentStyleMasters.find(m => m.value === selectedMaster)?.name}」风格创作
                    </div>
                    {result.usageTip && (
                      <div className="text-sm text-gray-500 mt-1">
                        {result.usageTip}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* 重新创作 */}
              <Button block onClick={() => setResult(null)}>
                重新创作
              </Button>
            </Space>
          )}
        </Col>
      </Row>
    </div>
  )
}
