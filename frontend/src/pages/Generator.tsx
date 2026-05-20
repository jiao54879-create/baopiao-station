import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Input, Button, Tag, List, Rate, message, Spin, Modal, Switch, Tooltip, Row, Col } from 'antd'
import { ThunderboltOutlined, SaveOutlined, CopyOutlined, FireOutlined, BulbOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { TextArea } = Input

interface StyleDefinition {
  id: string
  name: string
  emoji: string
  color: string
  description: string
  coreLogic: string
  exampleTitles: string[]
  templateCount?: number
}

interface GeneratedTitle {
  title: string
  type: string
  score: number
  explanation: string
  hashtags: string[]
  selfCriticism?: string
  targetAudience?: string
  styleType?: string
}

const STYLE_COLORS: Record<string, string> = {
  A: '#ef4444', B: '#f97316', C: '#eab308',
  D: '#22c55e', E: '#3b82f6', F: '#a855f7',
  CROSS_DOMAIN: '#ec4899',
}

const STYLE_EMOJIS: Record<string, string> = {
  A: '🔴', B: '🟠', C: '🟡', D: '🟢', E: '🔵', F: '🟣', CROSS_DOMAIN: '🌐',
}

const DEFAULT_STYLES: StyleDefinition[] = [
  { id: 'A', name: '反直觉反向', emoji: '🔴', color: 'red', description: '不推销、只劝退/揭秘，反向博取好感', coreLogic: '制造预期违背', exampleTitles: ['我已经不卖保险了，但还想说点行业大实话'], templateCount: 5 },
  { id: 'B', name: '行业内幕揭秘', emoji: '🟠', color: 'orange', description: '圈内人爆料，打破信息差', coreLogic: '输出圈内稀缺信息', exampleTitles: ['干了10年保险，说点搜不到的行业真相'], templateCount: 4 },
  { id: 'C', name: '精准人群痛点', emoji: '🟡', color: 'gold', description: '绑定年龄/职业/身份/预算标签', coreLogic: '精准标签锁定受众', exampleTitles: ['30岁上班族，保险这么配不花冤枉钱'], templateCount: 4 },
  { id: 'D', name: '权威背书+实操', emoji: '🟢', color: 'green', description: '第三方权威加持+真实实操', coreLogic: '权威佐证+亲身实操', exampleTitles: ['和儿科医生聊完，我把宝宝保险全换了'], templateCount: 4 },
  { id: 'E', name: '数字/清单/对比', emoji: '🔵', color: 'blue', description: '数字清晰、对比强烈', coreLogic: '干货密集，用户收藏自用', exampleTitles: ['保险买对vs买错，差距居然这么大'], templateCount: 4 },
  { id: 'F', name: '情绪/故事/悬念', emoji: '🟣', color: 'purple', description: '情绪驱动，抓住用户共情', coreLogic: '打破陌生距离感', exampleTitles: ['我后悔了，保险真的不该买太早'], templateCount: 4 },
]

export default function Generator() {
  const [searchParams] = useSearchParams()
  const [keywords, setKeywords] = useState(searchParams.get('keyword') || '')
  const [generating, setGenerating] = useState(false)
  const [titles, setTitles] = useState<GeneratedTitle[]>([])
  const [selectedTitle, setSelectedTitle] = useState<GeneratedTitle | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['A'])
  const [enableCrossDomain, setEnableCrossDomain] = useState(false)
  const [styles, setStyles] = useState<StyleDefinition[]>(DEFAULT_STYLES)
  const [showLegacyMode, setShowLegacyMode] = useState(false)
  const [context, setContext] = useState('')

  useEffect(() => { loadStyleDefinitions() }, [])

  const loadStyleDefinitions = async () => {
    try {
      const response = await api.get('/generator/styles')
      if (response.data?.success && response.data.styles?.length > 0) {
        setStyles(response.data.styles)
      }
    } catch (error) {
      console.log('使用默认风格定义')
    }
  }

  const toggleStyle = (id: string) => {
    setSelectedStyles(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      message.warning('请输入关键词')
      return
    }

    setGenerating(true)
    setTitles([])

    try {
      let response
      if (showLegacyMode) {
        const keywordList = keywords.split(/[,，\s]+/).filter(Boolean)
        response = await api.post('/generator', {
          keywords: keywordList,
          context: context || undefined,
          count: 12
        })
        setTitles(response.data.titles || [])
      } else {
        const keywordList = keywords.split(/[,，\s]+/).filter(Boolean)
        response = await api.post('/generator/by-style', {
          keywords: keywordList,
          styleTypes: selectedStyles,
          enableCrossDomain,
          crossDomainTypes: enableCrossDomain ? ['职场', '情感', '育儿'] : undefined,
          count: 10
        })
        setTitles(response.data.titles || [])
      }
      message.success(`生成 ${response.data.titles?.length || 0} 个标题`)
    } catch (error: any) {
      message.error(error?.response?.data?.message || '生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async (title: GeneratedTitle) => {
    setSaving(true)
    try {
      await api.post('/generator/save', {
        keywords: keywords.split(/[,，\s]+/).filter(Boolean),
        generatedTitles: titles.map(t => t.title),
        finalTitle: title.title,
        notes: `类型: ${title.type}, 评分: ${title.score}`
      })
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('已复制')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        <ThunderboltOutlined className="mr-2 text-yellow-500" />
        爆款标题生成器
      </h1>

      {/* 模式切换 */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-gray-500">风格选择模式</span>
        <Switch 
          checked={showLegacyMode} 
          onChange={setShowLegacyMode}
          checkedChildren="旧模式"
          unCheckedChildren="新模式"
        />
        <span className="text-sm text-gray-500">关键词+背景模式</span>
      </div>

      {/* 关键词输入 */}
      <Card className="mb-4">
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">关键词（空格或逗号分隔）</label>
          <Input
            size="large"
            placeholder="例：重疾险 宝妈 避坑"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onPressEnter={handleGenerate}
          />
        </div>

        {!showLegacyMode && (
          <>
            {/* 风格选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">选择风格类型（可多选）</label>
              <Row gutter={[12, 12]}>
                {styles.map(style => (
                  <Col key={style.id} xs={12} sm={8} md={4}>
                    <div
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                        selectedStyles.includes(style.id) 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleStyle(style.id)}
                    >
                      <div className="text-2xl mb-1">{style.emoji}</div>
                      <div className="text-xs font-medium">{style.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{style.id}类</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>

            {/* 跨赛道借鉴 */}
            <div className="mb-3 flex items-center gap-2">
              <Switch 
                size="small"
                checked={enableCrossDomain} 
                onChange={setEnableCrossDomain}
              />
              <span className="text-sm">启用跨赛道借鉴（职场/情感/育儿钩子）</span>
            </div>
          </>
        )}

        {showLegacyMode && (
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">背景（可选）</label>
            <TextArea
              rows={2}
              placeholder="补充背景信息..."
              value={context}
              onChange={e => setContext(e.target.value)}
            />
          </div>
        )}

        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          loading={generating}
          onClick={handleGenerate}
          className="w-full"
        >
          {generating ? '生成中...' : '生成爆款标题'}
        </Button>
      </Card>

      {/* 结果列表 */}
      {titles.length > 0 && (
        <Card title={`生成结果 (${titles.length}个)`} className="mb-4">
          <List
            dataSource={titles}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Tooltip title="复制" key="copy">
                    <Button icon={<CopyOutlined />} size="small" onClick={() => copyToClipboard(item.title)} />
                  </Tooltip>,
                  <Tooltip title="保存" key="save">
                    <Button icon={<SaveOutlined />} size="small" loading={saving} onClick={() => handleSave(item)} />
                  </Tooltip>,
                  <Tooltip title="详情" key="detail">
                    <Button icon={<BulbOutlined />} size="small" onClick={() => setSelectedTitle(item)} />
                  </Tooltip>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">{item.title}</span>
                      {item.styleType && (
                        <Tag color={STYLE_COLORS[item.styleType] || 'default'}>
                          {STYLE_EMOJIS[item.styleType] || ''} {item.styleType}
                        </Tag>
                      )}
                    </div>
                  }
                  description={
                    <div className="flex items-center gap-3">
                      <Rate disabled value={Math.round(item.score / 2)} className="text-xs" />
                      <span className="text-sm text-gray-500">{item.score}分</span>
                      <Tag>{item.type}</Tag>
                      {item.targetAudience && <Tag color="blue">{item.targetAudience}</Tag>}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 风格说明 */}
      {!showLegacyMode && (
        <Card title="6大风格类型说明" size="small">
          <Row gutter={[12, 12]}>
            {styles.map(style => (
              <Col key={style.id} xs={24} sm={12} md={8}>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="font-medium mb-1">{style.emoji} {style.name}</div>
                  <div className="text-xs text-gray-500">{style.description}</div>
                  <div className="text-xs text-gray-400 mt-1">核心：{style.coreLogic}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 详情弹窗 */}
      <Modal
        open={!!selectedTitle}
        title="标题详情"
        onCancel={() => setSelectedTitle(null)}
        footer={[
          <Button key="copy" onClick={() => { copyToClipboard(selectedTitle!.title) }}>复制标题</Button>,
          <Button key="close" type="primary" onClick={() => setSelectedTitle(null)}>关闭</Button>
        ]}
      >
        {selectedTitle && (
          <div>
            <h3 className="text-lg font-bold mb-3">{selectedTitle.title}</h3>
            <p><strong>类型：</strong>{selectedTitle.type}</p>
            <p><strong>评分：</strong>{selectedTitle.score}/10</p>
            <p><strong>解释：</strong>{selectedTitle.explanation}</p>
            {selectedTitle.selfCriticism && <p><strong>自评：</strong>{selectedTitle.selfCriticism}</p>}
            {selectedTitle.targetAudience && <p><strong>目标人群：</strong>{selectedTitle.targetAudience}</p>}
            {selectedTitle.hashtags?.length > 0 && (
              <div className="mt-2">
                <strong>标签：</strong>
                {selectedTitle.hashtags.map((h, i) => <Tag key={i}>{h}</Tag>)}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
