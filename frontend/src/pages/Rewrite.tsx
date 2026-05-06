import { useState } from 'react'
import {
  Card, Input, Button, Radio, Tag, Divider,
  message, Spin, Steps, Tooltip, Alert, Row, Col, Typography, Space
} from 'antd'
import {
  LinkOutlined, EditOutlined, CopyOutlined,
  BulbOutlined, ThunderboltOutlined,
  RedditOutlined, WechatOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import api from '../utils/api'

const { TextArea } = Input
const { Title, Paragraph, Text } = Typography

interface OriginalAnalysis {
  topic: string
  coreIdea: string
  structure: string
  styleFeatures: string
  hooks: string[]
}

interface RewrittenContent {
  title: string
  content: string
  hashtags: string[]
  callToAction: string
}

interface RewriteResult {
  style: 'xhs' | 'wechat'
  originalAnalysis: OriginalAnalysis
  rewrittenContent: RewrittenContent
  writingNotes: string
}

interface ApiResponse {
  success: boolean
  sourceUrl: string | null
  originalTitle: string
  result: RewriteResult
  generatedAt: string
}

export default function Rewrite() {
  const [url, setUrl] = useState('')
  const [manualContent, setManualContent] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [style, setStyle] = useState<'xhs' | 'wechat'>('xhs')
  const [inputMode, setInputMode] = useState<'url' | 'manual'>('url')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const handleRewrite = async () => {
    if (inputMode === 'url' && !url.trim()) {
      message.warning('请输入文章链接')
      return
    }
    if (inputMode === 'manual' && !manualContent.trim()) {
      message.warning('请粘贴文章内容')
      return
    }

    setLoading(true)
    setResult(null)
    setCurrentStep(1)

    try {
      const payload: any = { style }
      if (inputMode === 'url') {
        payload.url = url.trim()
      } else {
        payload.title = manualTitle.trim()
        payload.content = manualContent.trim()
      }

      setCurrentStep(2)
      const { data } = await api.post('/rewrite', payload)
      setResult(data)
      setCurrentStep(3)
      message.success('仿写完成！')
    } catch (error: any) {
      setCurrentStep(0)
      message.error(error.response?.data?.error || '仿写失败，请检查 AI 配置或稍后重试')
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
    const { rewrittenContent } = result.result
    const full = [
      rewrittenContent.title,
      '',
      rewrittenContent.content,
      '',
      rewrittenContent.callToAction,
      '',
      rewrittenContent.hashtags.map(t => '#' + t).join(' ')
    ].join('\n')
    copyText(full, '完整内容')
  }

  const styleLabel = style === 'xhs' ? '小红书' : '公众号'
  const styleColor = style === 'xhs' ? '#ff2442' : '#07c160'
  const StyleIcon = style === 'xhs' ? RedditOutlined : WechatOutlined

  return (
    <div className="max-w-5xl mx-auto">
      {/* 页头 */}
      <div className="mb-6">
        <Title level={3} style={{ marginBottom: 4 }}>
          ✍️ 一键仿写
        </Title>
        <Paragraph type="secondary">
          输入任意文章链接，AI 自动解析选题思路、内容结构、风格特点，生成一篇全新的保险内容
        </Paragraph>
      </div>

      <Row gutter={24}>
        {/* 左侧：输入区域 */}
        <Col xs={24} lg={10}>
          <Card
            title={<span><EditOutlined /> 输入原文</span>}
            className="mb-4"
          >
            {/* 输入方式切换 */}
            <Radio.Group
              value={inputMode}
              onChange={e => setInputMode(e.target.value)}
              className="mb-4 w-full"
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="url" style={{ width: '50%', textAlign: 'center' }}>
                <LinkOutlined /> 粘贴链接
              </Radio.Button>
              <Radio.Button value="manual" style={{ width: '50%', textAlign: 'center' }}>
                <EditOutlined /> 手动粘贴
              </Radio.Button>
            </Radio.Group>

            {inputMode === 'url' ? (
              <div>
                <Input
                  prefix={<LinkOutlined className="text-gray-400" />}
                  placeholder="粘贴文章链接，如公众号、知乎、头条..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  size="large"
                  allowClear
                />
                <Alert
                  message="支持公众号、知乎、头条等主流平台；小红书因登录限制，建议手动粘贴内容"
                  type="info"
                  showIcon
                  className="mt-3"
                  style={{ fontSize: 12 }}
                />
              </div>
            ) : (
              <div>
                <Input
                  placeholder="原文标题（可选）"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  className="mb-2"
                />
                <TextArea
                  placeholder="把文章内容粘贴到这里..."
                  value={manualContent}
                  onChange={e => setManualContent(e.target.value)}
                  rows={8}
                  showCount
                  maxLength={5000}
                />
              </div>
            )}

            <Divider style={{ margin: '16px 0' }} />

            {/* 风格选择 */}
            <div className="mb-4">
              <Text strong className="block mb-2">仿写风格</Text>
              <Radio.Group
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="w-full"
              >
                <Row gutter={12}>
                  <Col span={12}>
                    <div
                      onClick={() => setStyle('xhs')}
                      className="cursor-pointer rounded-lg p-3 border-2 transition-all"
                      style={{
                        borderColor: style === 'xhs' ? '#ff2442' : '#e5e7eb',
                        background: style === 'xhs' ? '#fff5f6' : 'white'
                      }}
                    >
                      <Radio value="xhs">
                        <div>
                          <div style={{ color: '#ff2442', fontWeight: 600 }}>
                            📕 小红书风格
                          </div>
                          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                            emoji + 口语 + 互动
                          </div>
                        </div>
                      </Radio>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div
                      onClick={() => setStyle('wechat')}
                      className="cursor-pointer rounded-lg p-3 border-2 transition-all"
                      style={{
                        borderColor: style === 'wechat' ? '#07c160' : '#e5e7eb',
                        background: style === 'wechat' ? '#f0fff4' : 'white'
                      }}
                    >
                      <Radio value="wechat">
                        <div>
                          <div style={{ color: '#07c160', fontWeight: 600 }}>
                            💬 公众号风格
                          </div>
                          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                            深度 + 逻辑 + 专业感
                          </div>
                        </div>
                      </Radio>
                    </div>
                  </Col>
                </Row>
              </Radio.Group>
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<ThunderboltOutlined />}
              onClick={handleRewrite}
              loading={loading}
              style={{ height: 48, fontSize: 16 }}
            >
              {loading ? 'AI 仿写中...' : '一键仿写'}
            </Button>
          </Card>

          {/* 进度步骤 */}
          {loading && (
            <Card size="small">
              <Steps
                direction="vertical"
                size="small"
                current={currentStep}
                items={[
                  { title: '准备中', description: '解析输入内容' },
                  { title: '抓取文章', description: inputMode === 'url' ? '正在访问链接...' : '读取粘贴内容' },
                  { title: 'AI 分析仿写', description: 'DeepSeek 深度分析中...' },
                  { title: '生成完成', description: '准备展示结果' },
                ]}
              />
            </Card>
          )}
        </Col>

        {/* 右侧：结果展示 */}
        <Col xs={24} lg={14}>
          {!result && !loading && (
            <Card className="h-full flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
              <div className="text-center py-16 text-gray-400">
                <EditOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div style={{ fontSize: 16 }}>输入链接或文章内容，点击「一键仿写」</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>AI 将自动分析选题、结构、风格，生成全新内容</div>
              </div>
            </Card>
          )}

          {loading && (
            <Card style={{ minHeight: 400 }} className="flex items-center justify-center">
              <div className="text-center py-16">
                <Spin size="large" />
                <div className="mt-4 text-gray-500">AI 正在深度分析并仿写，通常需要 15-30 秒...</div>
              </div>
            </Card>
          )}

          {result && !loading && (
            <Space direction="vertical" size={16} className="w-full">
              {/* 原文分析 */}
              <Card
                title={<span><BulbOutlined style={{ color: '#faad14' }} /> 原文解析</span>}
                size="small"
                extra={
                  <Tag color="orange">学习原文精华</Tag>
                }
              >
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <div className="bg-orange-50 rounded p-2">
                      <Text type="secondary" style={{ fontSize: 11 }}>📌 选题方向</Text>
                      <div className="font-medium mt-1">{result.result.originalAnalysis.topic}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="bg-blue-50 rounded p-2">
                      <Text type="secondary" style={{ fontSize: 11 }}>💡 核心思路</Text>
                      <div className="font-medium mt-1">{result.result.originalAnalysis.coreIdea}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="bg-purple-50 rounded p-2">
                      <Text type="secondary" style={{ fontSize: 11 }}>📐 内容结构</Text>
                      <div style={{ fontSize: 12 }} className="mt-1">{result.result.originalAnalysis.structure}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="bg-green-50 rounded p-2">
                      <Text type="secondary" style={{ fontSize: 11 }}>🎨 风格特点</Text>
                      <div style={{ fontSize: 12 }} className="mt-1">{result.result.originalAnalysis.styleFeatures}</div>
                    </div>
                  </Col>
                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: 11 }}>🎣 吸睛钩子</Text>
                    <div className="mt-1">
                      {result.result.originalAnalysis.hooks.map((hook, i) => (
                        <Tag key={i} color="gold" className="mb-1">{hook}</Tag>
                      ))}
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* 仿写结果 */}
              <Card
                title={
                  <span>
                    <StyleIcon style={{ color: styleColor }} /> {styleLabel}仿写结果
                  </span>
                }
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
                <div className="mb-4 p-3 rounded-lg" style={{ background: style === 'xhs' ? '#fff5f6' : '#f0fff4', border: `1px solid ${styleColor}30` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>📌 仿写标题</Text>
                      <div className="text-lg font-bold mt-1" style={{ color: styleColor }}>
                        {result.result.rewrittenContent.title}
                      </div>
                    </div>
                    <Tooltip title="复制标题">
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyText(result.result.rewrittenContent.title, '标题')}
                      />
                    </Tooltip>
                  </div>
                </div>

                {/* 正文 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text type="secondary" style={{ fontSize: 11 }}>📝 正文内容</Text>
                    <Tooltip title="复制正文">
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyText(result.result.rewrittenContent.content, '正文')}
                      />
                    </Tooltip>
                  </div>
                  <div
                    className="p-3 bg-gray-50 rounded text-sm leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}
                  >
                    {result.result.rewrittenContent.content}
                  </div>
                </div>

                {/* 互动引导 */}
                <div className="mb-3 p-2 bg-yellow-50 rounded">
                  <Text type="secondary" style={{ fontSize: 11 }}>💬 互动引导</Text>
                  <div className="text-sm mt-1 font-medium">{result.result.rewrittenContent.callToAction}</div>
                </div>

                {/* 话题标签 */}
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>🏷️ 话题标签</Text>
                  <div className="mt-1">
                    {result.result.rewrittenContent.hashtags.map((tag, i) => (
                      <Tag
                        key={i}
                        color={style === 'xhs' ? 'red' : 'green'}
                        className="mb-1 cursor-pointer"
                        onClick={() => copyText('#' + tag, '标签')}
                      >
                        #{tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Card>

              {/* 创作说明 */}
              <Card size="small" style={{ background: '#f8f9ff', borderColor: '#4f46e5' }}>
                <div className="flex gap-2">
                  <CheckCircleOutlined style={{ color: '#4f46e5', marginTop: 2 }} />
                  <div>
                    <Text strong style={{ fontSize: 12, color: '#4f46e5' }}>创作说明</Text>
                    <div className="text-sm text-gray-600 mt-1">{result.result.writingNotes}</div>
                  </div>
                </div>
              </Card>
            </Space>
          )}
        </Col>
      </Row>
    </div>
  )
}
