import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Input, Button, Tag, List, Rate, message, Spin, Modal, Switch, Tooltip, Row, Col } from 'antd'
import { ThunderboltOutlined, SaveOutlined, CopyOutlined, FireOutlined, ExperimentOutlined, BulbOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { TextArea } = Input

// 风格类型定义
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
  A: '#ef4444', // red
  B: '#f97316', // orange
  C: '#eab308', // gold
  D: '#22c55e', // green
  E: '#3b82f6', // blue
  F: '#a855f7', // purple
  CROSS_DOMAIN: '#ec4899', // pink
};

const STYLE_EMOJIS: Record<string, string> = {
  A: '🔴',
  B: '🟠',
  C: '🟡',
  D: '🟢',
  E: '🔵',
  F: '🟣',
  CROSS_DOMAIN: '🌐',
};

export default function Generator() {
  const [searchParams] = useSearchParams()
  const [keywords, setKeywords] = useState(searchParams.get('keyword') || '')
  const [context, setContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [titles, setTitles] = useState<GeneratedTitle[]>([])
  const [selectedTitle, setSelectedTitle] = useState<GeneratedTitle | null>(null)
  const [saving, setSaving] = useState(false)
  
  // 新增：风格选择状态
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['A'])
  const [enableCrossDomain, setEnableCrossDomain] = useState(false)
  const [crossDomainType, setCrossDomainType] = useState<string>('职场')
  const [styles, setStyles] = useState<StyleDefinition[]>([])
  const [showLegacyMode, setShowLegacyMode] = useState(false)
  const [generationMode, setGenerationMode] = useState<'style' | 'legacy'>('style')

  // 加载风格定义
  useEffect(() => {
    loadStyleDefinitions()
  }, [])

  const loadStyleDefinitions = async () => {
    try {
      const response = await api.get('/generator/styles')
      if (response.data.success) {
        setStyles(response.data.styles)
      }
    } catch (error) {
      console.error('加载风格定义失败:', error)
      // 使用默认风格定义
      setStyles([
        { id: 'A', name: '反直觉反向', emoji: '🔴', color: '#ef4444', description: '不推销、只劝退/揭秘，反向博取好感', coreLogic: '制造预期违背', exampleTitles: ['我已经不卖保险了，但还想说点大实话', '干了10年保险，我反而劝年轻人别急着买'] },
        { id: 'B', name: '行业内幕揭秘', emoji: '🟠', color: '#f97316', description: '输出圈内稀缺信息，打破信息差', coreLogic: '圈内人爆料', exampleTitles: ['干了10年保险，说点小红书上搜不到的行业真相', '保险合同第3条，90%投保人都直接跳过不看'] },
        { id: 'C', name: '精准人群痛点', emoji: '🟡', color: '#eab308', description: '绑定年龄、职业、身份、预算标签', coreLogic: '精准标签锁定受众', exampleTitles: ['30岁上班族，保险这么配不花一分冤枉钱', '宝妈买保险，最容易浪费的3笔冤枉钱'] },
        { id: 'D', name: '权威背书+亲身实操', emoji: '🟢', color: '#22c55e', description: '第三方权威加持+真实实操经历', coreLogic: '权威佐证+亲身实操', exampleTitles: ['和儿科医生聊完，我把宝宝的保险全部换掉了', '律师朋友看完我的保单，只说了一句话'] },
        { id: 'E', name: '数字/清单/对比', emoji: '🔵', color: '#3b82f6', description: '数字清晰、对比强烈、干货密集', coreLogic: '数字冲击+对比反差', exampleTitles: ['保险买对vs买错，几年下来差距居然这么大', '90%的人都踩过的5个保险误区'] },
        { id: 'F', name: '情绪/故事/悬念', emoji: '🟣', color: '#a855f7', description: '用情绪、真实故事、悬念抓住用户共情', coreLogic: '情绪驱动+故事悬念', exampleTitles: ['我后悔了，保险真的不该买太早', '28岁一场小病，让我彻底读懂了保险的意义'] },
      ])
    }
  }

  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev => {
      if (prev.includes(styleId)) {
        // 如果已选中且有多个，则移除
        if (prev.length > 1) {
          return prev.filter(id => id !== styleId)
        }
        return prev
      }
      return [...prev, styleId]
    })
  }

  const handleGenerate = async () => {
    const keywordList = keywords.split(/[,，、\n]/).filter(k => k.trim())
    if (keywordList.length === 0) {
      message.warning('请输入关键词')
      return
    }

    setGenerating(true)
    setTitles([])
    setSelectedTitle(null)

    try {
      let response
      
      if (generationMode === 'style') {
        // 新模式：按风格类型生成
        response = await api.post('/generator/by-style', {
          keywords: keywordList,
          styleTypes: selectedStyles,
          enableCrossDomain,
          crossDomainTypes: enableCrossDomain ? [crossDomainType] : undefined,
          count: 10
        })
      } else {
        // 原有模式：关键词+背景
        response = await api.post('/generator', {
          keywords: keywordList,
          context: context || undefined
        })
      }
      
      setTitles(response.data.titles || [])
      if (response.data.titles?.length > 0) {
        message.success(`生成了 ${response.data.titles.length} 个标题`)
      } else {
        message.error('生成失败，请稍后重试')
      }
    } catch (error: any) {
      // 兼容处理
      const errorData = error?.response?.data
      if (errorData?.error && errorData.error.includes('AI 返回格式错误')) {
        try {
          const errorText = errorData.error.replace('AI 返回格式错误，返回内容: ', '')
          let cleanText = errorText.trim()
          if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').trim()
          }
          if (cleanText.endsWith('```')) {
            cleanText = cleanText.replace(/\n?```$/, '').trim()
          }
          const braceStart = cleanText.indexOf('{')
          const braceEnd = cleanText.lastIndexOf('}')
          if (braceStart !== -1 && braceEnd !== -1) {
            const jsonStr = cleanText.substring(braceStart, braceEnd + 1)
            const parsed = JSON.parse(jsonStr)
            if (parsed.titles && parsed.titles.length > 0) {
              setTitles(parsed.titles)
              message.success(`生成了 ${parsed.titles.length} 个标题`)
              return
            }
          }
        } catch (parseErr) {
          // 解析失败
        }
      }
      message.error('生成失败，请检查 AI 配置或稍后重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async (title: GeneratedTitle) => {
    setSaving(true)
    try {
      await api.post('/generator/save', {
        keywords: keywords.split(/[,，、\n]/).filter(k => k.trim()),
        generatedTitles: titles,
        finalTitle: title.title
      })
      message.success('已保存到收藏')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  }

  const getStyleTagColor = (styleType?: string): string => {
    if (!styleType) return 'default'
    return STYLE_COLORS[styleType.toUpperCase()] || 'default'
  }

  const getStyleEmoji = (styleType?: string): string => {
    if (!styleType) return '📝'
    return STYLE_EMOJIS[styleType.toUpperCase()] || '📝'
  }

  return (
    <div className="space-y-6">
      {/* 模式切换 */}
      <Card size="small">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FireOutlined className="text-orange-500" />
            <span className="font-medium">选择生成模式：</span>
          </div>
          <div className="flex gap-2">
            <Button 
              type={generationMode === 'style' ? 'primary' : 'default'}
              onClick={() => setGenerationMode('style')}
              icon={<BulbOutlined />}
            >
              🎯 风格选择（推荐）
            </Button>
            <Button 
              type={generationMode === 'legacy' ? 'primary' : 'default'}
              onClick={() => setGenerationMode('legacy')}
              icon={<ExperimentOutlined />}
            >
              📝 关键词模式
            </Button>
          </div>
        </div>
      </Card>

      {/* ========== 风格选择模式 ========== */}
      {generationMode === 'style' && (
        <>
          {/* 风格类型选择器 */}
          <Card
            title={
              <span className="flex items-center gap-2">
                <ThunderboltOutlined className="text-yellow-500" />
                <span>选择标题风格（可多选）</span>
              </span>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {styles.map((style) => (
                <div
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                  className={`
                    cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md
                    ${selectedStyles.includes(style.id) 
                      ? 'border-solid shadow-md' 
                      : 'border-dashed border-gray-300 hover:border-gray-400'}
                  `}
                  style={{
                    borderColor: selectedStyles.includes(style.id) ? style.color : undefined,
                    backgroundColor: selectedStyles.includes(style.id) ? `${style.color}10` : undefined
                  }}
                >
                  <div className="text-2xl mb-1">{style.emoji}</div>
                  <div className="font-medium text-sm mb-1">
                    <span className="text-gray-500">类型{style.id}：</span>
                    {style.name}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-2">{style.description}</div>
                  {selectedStyles.includes(style.id) && (
                    <div className="mt-2">
                      <Tag color={style.color} className="text-xs">已选择</Tag>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 已选风格预览 */}
            {selectedStyles.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">已选风格：</div>
                <div className="flex flex-wrap gap-2">
                  {selectedStyles.map(styleId => {
                    const style = styles.find(s => s.id === styleId)
                    return style ? (
                      <Tag key={styleId} color={style.color} className="text-sm">
                        {style.emoji} {style.name}
                      </Tag>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* 跨赛道借鉴开关 */}
          <Card
            title={
              <span className="flex items-center gap-2">
                <ExperimentOutlined className="text-pink-500" />
                <span>🌐 跨赛道借鉴</span>
                <Switch 
                  size="small" 
                  checked={enableCrossDomain}
                  onChange={setEnableCrossDomain}
                />
              </span>
            }
            extra={
              <span className="text-xs text-gray-500">借鉴职场/情感/育儿等赛道爆款钩子</span>
            }
          >
            {enableCrossDomain && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  选择要借鉴的赛道风格：
                </div>
                <div className="flex flex-wrap gap-2">
                  {['职场', '情感', '育儿', '理财', '健康'].map(type => (
                    <Tag
                      key={type}
                      color={crossDomainType === type ? 'pink' : 'default'}
                      className="cursor-pointer px-3 py-1"
                      onClick={() => setCrossDomainType(type)}
                    >
                      {type}
                    </Tag>
                  ))}
                </div>
                <div className="text-xs text-gray-500 bg-pink-50 p-2 rounded">
                  <div className="font-medium mb-1">借鉴示例：</div>
                  {crossDomainType === '职场' && '"我不是怕你没保险，我是怕你买错了还浑然不知"'}
                  {crossDomainType === '情感' && '"跟资深保险人聊完，我终于搞懂怎么买保险了"'}
                  {crossDomainType === '育儿' && '"后悔没有早点给孩子买对保险，少花几万冤枉钱"'}
                  {crossDomainType === '理财' && '"年薪10万，我用保险守住了全家的经济底线"'}
                  {crossDomainType === '健康' && '"核保老师说出这句话时，我才懂投保的关键"'}
                </div>
              </div>
            )}
          </Card>

          {/* 关键词输入 */}
          <Card title="📝 关键词输入">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  关键词（用逗号分隔，最多5个）
                </label>
                <TextArea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="例如：延迟退休, 孩子保险, 重疾险, 宝妈..."
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </div>

              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                loading={generating}
                onClick={handleGenerate}
                className="w-full"
                style={{ 
                  backgroundColor: selectedStyles.length === 1 
                    ? styles.find(s => s.id === selectedStyles[0])?.color 
                    : undefined 
                }}
              >
                {generating ? 'AI 正在思考中...' : `🚀 生成 ${selectedStyles.length} 种风格标题`}
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* ========== 关键词+背景模式 ========== */}
      {generationMode === 'legacy' && (
        <Card
          title={
            <span className="flex items-center gap-2">
              <ThunderboltOutlined className="text-yellow-500" />
              <span>AI 爆款标题生成器</span>
            </span>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">关键词（用逗号分隔，最多5个）</label>
              <TextArea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="例如：延迟退休, 孩子保险, 重疾险..."
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">补充背景（可选）</label>
              <Input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="例如：针对30岁白领人群，聚焦养老焦虑"
              />
            </div>

            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              loading={generating}
              onClick={handleGenerate}
              className="w-full"
            >
              {generating ? 'AI 正在思考中...' : '🚀 一键生成爆款标题'}
            </Button>
          </div>
        </Card>
      )}

      {/* 生成结果 */}
      {generating && (
        <div className="text-center py-12">
          <Spin size="large" tip="AI 正在生成爆款标题，请稍候..." />
        </div>
      )}

      {titles.length > 0 && (
        <Card title={`✨ 生成了 ${titles.length} 个标题`}>
          <List
            dataSource={titles}
            renderItem={(item) => (
              <List.Item
                className={`cursor-pointer transition p-4 rounded-lg ${
                  selectedTitle?.title === item.title 
                    ? 'bg-primary/10 border border-primary' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTitle(item)}
                extra={
                  <div className="flex gap-2">
                    <Tooltip title="复制标题">
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(item.title); }}
                      />
                    </Tooltip>
                    <Tooltip title="保存到收藏">
                      <Button
                        type="text"
                        icon={<SaveOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleSave(item); }}
                        loading={saving}
                      />
                    </Tooltip>
                  </div>
                }
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* 风格标签 */}
                      {item.styleType && (
                        <Tag 
                          color={getStyleTagColor(item.styleType)}
                          className="text-sm"
                        >
                          {getStyleEmoji(item.styleType)} 类型{item.styleType}
                        </Tag>
                      )}
                      {/* 标题类型 */}
                      <Tag color={getStyleTagColor(item.styleType)}>
                        {item.type}
                      </Tag>
                      {/* 标题文字 */}
                      <span className="font-medium text-lg">{item.title}</span>
                      {/* 评分 */}
                      <Rate disabled value={item.score / 2} className="text-sm" />
                      <Tag color={item.score >= 8 ? 'red' : item.score >= 6 ? 'orange' : 'default'}>
                        {item.score.toFixed(1)}分
                      </Tag>
                      {/* 精准人群 */}
                      {item.targetAudience && (
                        <Tag color="blue" className="text-xs">
                          👤 {item.targetAudience}
                        </Tag>
                      )}
                    </div>
                  }
                  description={
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.hashtags?.map((tag, i) => (
                        <Tag key={i}>#{tag}</Tag>
                      ))}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 详情 Modal */}
      <Modal
        title="📝 标题详情"
        open={!!selectedTitle}
        onCancel={() => setSelectedTitle(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedTitle(null)}>关闭</Button>,
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => { copyToClipboard(selectedTitle?.title || ''); }}
          >
            复制标题
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => { handleSave(selectedTitle!); setSelectedTitle(null); }}
          >
            保存到收藏
          </Button>
        ]}
      >
        {selectedTitle && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {selectedTitle.styleType && (
                  <Tag color={getStyleTagColor(selectedTitle.styleType)}>
                    {getStyleEmoji(selectedTitle.styleType)} 类型{selectedTitle.styleType}
                  </Tag>
                )}
                <Tag color={getStyleTagColor(selectedTitle.styleType)}>
                  {selectedTitle.type}
                </Tag>
                <span className="font-bold text-lg">{selectedTitle.title}</span>
              </div>
              <div className="text-gray-500">
                爆款概率：
                <span className={selectedTitle.score >= 8 ? 'text-red-500 font-bold' : ''}>
                  {selectedTitle.score}/10
                </span>
              </div>
              {selectedTitle.targetAudience && (
                <div className="text-gray-500 mt-1">
                  目标人群：<span className="text-blue-500">{selectedTitle.targetAudience}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">💡 为什么这个标题好</h4>
              <p>{selectedTitle.explanation}</p>
            </div>

            {selectedTitle.selfCriticism && (
              <div className="bg-yellow-50 p-3 rounded">
                <h4 className="font-medium mb-1 text-yellow-700">🤔 自我批评</h4>
                <p className="text-sm text-yellow-700">{selectedTitle.selfCriticism}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">🏷️ 推荐标签</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTitle.hashtags?.map((tag, i) => (
                  <Tag key={i} color="blue">#{tag}</Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 风格说明卡片 */}
      <Card title="📖 风格类型说明" size="small">
        <Row gutter={[16, 16]}>
          {styles.map((style) => (
            <Col key={style.id} xs={24} sm={12} md={8}>
              <div className="p-3 border rounded-lg" style={{ borderColor: style.color + '50' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{style.emoji}</span>
                  <span className="font-medium">类型{style.id}：{style.name}</span>
                </div>
                <div className="text-sm text-gray-600 mb-2">{style.description}</div>
                <div className="text-xs text-gray-500">
                  <div className="font-medium mb-1">核心逻辑：</div>
                  <div>{style.coreLogic}</div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">示例：</div>
                  {style.exampleTitles.slice(0, 2).map((ex, i) => (
                    <div key={i} className="text-xs text-gray-600 italic truncate">
                      "{ex}"
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}
