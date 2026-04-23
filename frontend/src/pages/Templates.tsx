import { useState, useEffect } from 'react'
import { Card, Row, Col, Tabs, Tag, Empty, Spin, Button, Select, message } from 'antd'
import { ThunderboltOutlined, FileTextOutlined, CopyOutlined } from '@ant-design/icons'
import api from '../utils/api'

interface TitleTemplate {
  id: string
  type: string
  template: string
  description: string
  examples: string[]
  viralFactors: string[]
  applicableScenarios: string[]
}

interface ContentTemplate {
  id: string
  type: string
  platform: string
  title: string
  structure: {
    opening: string
    body: string[]
    ending: string
  }
  tips: string[]
  applicableTopics: string[]
}

export default function Templates() {
  const [titleTemplates, setTitleTemplates] = useState<TitleTemplate[]>([])
  const [contentTemplates, setContentTemplates] = useState<ContentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')
  const [randomTitles, setRandomTitles] = useState<TitleTemplate[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [titleRes, contentRes] = await Promise.all([
        api.get('/templates/titles'),
        api.get('/templates/content')
      ])
      setTitleTemplates(titleRes.data.data)
      setContentTemplates(contentRes.data.data)
    } catch (error) {
      message.error('获取模板失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchRandomTitles = async () => {
    try {
      const res = await api.get('/templates/titles/random', { params: { count: 5 } })
      setRandomTitles(res.data.data)
    } catch (error) {
      message.error('获取失败')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  }

  const typeColors: Record<string, string> = {
    '震惊体': 'red',
    '数字体': 'blue',
    '故事体': 'green',
    '对比体': 'orange',
    '情绪体': 'purple',
    '反差别': 'magenta',
    '实用体': 'cyan',
    '疑问体': 'gold'
  }

  const typeStats = Object.entries(
    titleTemplates.reduce((acc: Record<string, number>, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1
      return acc
    }, {})
  ).map(([type, count]) => ({ type, count }))

  const filteredTitles = selectedType
    ? titleTemplates.filter(t => t.type === selectedType)
    : titleTemplates

  const filteredContent = selectedPlatform
    ? contentTemplates.filter(t => t.platform === selectedPlatform)
    : contentTemplates

  const titleTabItems = [
    {
      key: 'list',
      label: <span><FileTextOutlined /> 模板列表</span>,
      children: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Select
              placeholder="筛选类型"
              allowClear
              value={selectedType || undefined}
              onChange={setSelectedType}
              style={{ width: 150 }}
              options={typeStats.map(({ type, count }) => ({
                value: type,
                label: `${type} (${count})`
              }))}
            />
            <Button onClick={fetchRandomTitles} icon={<ThunderboltOutlined />}>
              随机推荐5个
            </Button>
          </div>

          {randomTitles.length > 0 && (
            <Card title="🎲 随机推荐" className="bg-yellow-50">
              <div className="space-y-3">
                {randomTitles.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-white p-3 rounded">
                    <div>
                      <Tag color={typeColors[t.type]}>{t.type}</Tag>
                      <span className="ml-2">{t.template}</span>
                    </div>
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(t.template)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Row gutter={[16, 16]}>
            {filteredTitles.map(template => (
              <Col key={template.id} xs={24} md={12} lg={8}>
                <Card
                  hoverable
                  className="h-full"
                  title={
                    <div className="flex items-center gap-2">
                      <Tag color={typeColors[template.type]}>{template.type}</Tag>
                      <span>{template.applicableScenarios.slice(0, 2).join('、')}</span>
                    </div>
                  }
                  extra={
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(template.template)}
                    />
                  }
                >
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded text-base">
                      {template.template}
                    </div>
                    <div className="text-sm text-gray-600">
                      {template.description}
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">爆款因素：</div>
                      <div className="flex flex-wrap gap-1">
                        {template.viralFactors.map((factor, i) => (
                          <Tag key={i} className="text-xs">{factor}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">示例：</div>
                      {template.examples.slice(0, 2).map((ex, i) => (
                        <div key={i} className="text-xs text-gray-500 italic">• {ex}</div>
                      ))}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )
    },
    {
      key: 'types',
      label: <span><ThunderboltOutlined /> 类型统计</span>,
      children: (
        <Row gutter={[16, 16]}>
          {typeStats.map(({ type, count }) => (
            <Col key={type} xs={12} md={6}>
              <Card hoverable>
                <div className="text-center">
                  <Tag color={typeColors[type]} className="mb-2">{type}</Tag>
                  <div className="text-3xl font-bold">{count}</div>
                  <div className="text-gray-400">个模板</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )
    }
  ]

  const contentTabItems = [
    {
      key: 'list',
      label: <span><FileTextOutlined /> 内容模板</span>,
      children: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select
              placeholder="筛选平台"
              allowClear
              value={selectedPlatform || undefined}
              onChange={setSelectedPlatform}
              style={{ width: 150 }}
              options={[
                { value: 'XHS', label: '小红书' },
                { value: 'WX', label: '微信公众号' },
                { value: 'DOUYIN', label: '抖音' }
              ]}
            />
          </div>

          <Row gutter={[16, 16]}>
            {filteredContent.map(template => (
              <Col key={template.id} xs={24} lg={12}>
                <Card hoverable className="h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Tag color={template.platform === 'XHS' ? 'red' : template.platform === 'WX' ? 'blue' : 'cyan'}>
                        {template.platform === 'XHS' ? '小红书' : template.platform === 'WX' ? '公众号' : '抖音'}
                      </Tag>
                      <span className="font-medium">{template.type}</span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-400 mb-1">模板框架：</div>
                      <div className="space-y-1 text-sm">
                        <div><strong>开头：</strong>{template.structure.opening}</div>
                        <div><strong>正文：</strong></div>
                        {template.structure.body.map((b, i) => (
                          <div key={i} className="ml-2">• {b}</div>
                        ))}
                        <div><strong>结尾：</strong>{template.structure.ending}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-1">适用话题：</div>
                      <div className="flex flex-wrap gap-1">
                        {template.applicableTopics.map((topic, i) => (
                          <Tag key={i} className="text-xs">{topic}</Tag>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-1">写作提示：</div>
                      <ul className="text-xs text-gray-600 pl-4">
                        {template.tips.map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {filteredContent.length === 0 && (
            <Empty description="暂无匹配模板" />
          )}
        </div>
      )
    }
  ]

  if (loading) {
    return <Spin size="large" className="flex justify-center py-20" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">📚 爆款模板库</h2>
        <div className="text-sm text-gray-400">
          共 {titleTemplates.length} 个标题模板 · {contentTemplates.length} 个内容模板
        </div>
      </div>

      <Tabs
        defaultActiveKey="titles"
        items={[
          {
            key: 'titles',
            label: <span><ThunderboltOutlined /> 标题模板</span>,
            children: (
              <Card>
                <Tabs items={titleTabItems} />
              </Card>
            )
          },
          {
            key: 'content',
            label: <span><FileTextOutlined /> 内容模板</span>,
            children: (
              <Card>
                <Tabs items={contentTabItems} />
              </Card>
            )
          }
        ]}
      />
    </div>
  )
}
