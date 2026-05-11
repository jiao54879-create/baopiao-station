import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Input, Button, Tag, List, Rate, message, Spin, Modal } from 'antd'
import { ThunderboltOutlined, SaveOutlined, CopyOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { TextArea } = Input

interface GeneratedTitle {
  title: string
  type: string
  score: number
  explanation: string
  hashtags: string[]
}

export default function Generator() {
  const [searchParams] = useSearchParams()
  const [keywords, setKeywords] = useState(searchParams.get('keyword') || '')
  const [context, setContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [titles, setTitles] = useState<GeneratedTitle[]>([])
  const [selectedTitle, setSelectedTitle] = useState<GeneratedTitle | null>(null)
  const [saving, setSaving] = useState(false)

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      message.warning('请输入关键词')
      return
    }

    const keywordList = keywords.split(/[,，、\n]/).filter(k => k.trim())
    if (keywordList.length === 0) {
      message.warning('请输入有效的关键词')
      return
    }

    setGenerating(true)
    setTitles([])
    setSelectedTitle(null)

    try {
      const response = await api.post('/generator', {
        keywords: keywordList,
        context: context || undefined
      })
      setTitles(response.data.titles || [])
      if (response.data.titles && response.data.titles.length > 0) {
        message.success(`生成了 ${response.data.titles.length} 个标题`)
      } else {
        message.error('生成失败，请稍后重试')
      }
    } catch (error: any) {
      // 兼容处理：后端返回500但错误信息中包含AI生成的标题JSON
      const errorData = error?.response?.data;
      if (errorData?.error && errorData.error.includes('AI 返回格式错误')) {
        try {
          const errorText = errorData.error.replace('AI 返回格式错误，返回内容: ', '');
          let cleanText = errorText.trim();
          // 去掉markdown代码块包裹
          if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').trim();
          }
          if (cleanText.endsWith('```')) {
            cleanText = cleanText.replace(/\n?```$/, '').trim();
          }
          // 提取JSON
          const braceStart = cleanText.indexOf('{');
          const braceEnd = cleanText.lastIndexOf('}');
          if (braceStart !== -1 && braceEnd !== -1) {
            const jsonStr = cleanText.substring(braceStart, braceEnd + 1);
            const parsed = JSON.parse(jsonStr);
            if (parsed.titles && parsed.titles.length > 0) {
              setTitles(parsed.titles);
              message.success(`生成了 ${parsed.titles.length} 个标题`);
              return;
            }
          }
        } catch (parseErr) {
          // 解析也失败了
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

  const titleTypeColors: Record<string, string> = {
    '震惊体': 'red',
    '数字体': 'blue',
    '故事体': 'green',
    '对比体': 'orange',
    '情绪体': 'purple',
    '反差别': 'magenta',
    '实用体': 'cyan',
    '疑问体': 'gold'
  }

  return (
    <div className="space-y-6">
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
                className={`cursor-pointer transition p-4 rounded-lg ${selectedTitle?.title === item.title ? 'bg-primary/10 border border-primary' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedTitle(item)}
                extra={
                  <div className="flex gap-2">
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(item.title); }}
                    />
                    <Button
                      type="text"
                      icon={<SaveOutlined />}
                      onClick={(e) => { e.stopPropagation(); handleSave(item); }}
                      loading={saving}
                    />
                  </div>
                }
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-3">
                      <Tag color={titleTypeColors[item.type] || 'default'}>{item.type}</Tag>
                      <span className="font-medium text-lg">{item.title}</span>
                      <Rate disabled value={item.score / 2} className="text-sm" />
                      <Tag color={item.score >= 8 ? 'red' : item.score >= 6 ? 'orange' : 'default'}>
                        {item.score.toFixed(1)}分
                      </Tag>
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
              <div className="flex items-center gap-2 mb-2">
                <Tag color={titleTypeColors[selectedTitle.type]}>{selectedTitle.type}</Tag>
                <span className="font-bold text-lg">{selectedTitle.title}</span>
              </div>
              <div className="text-gray-500">
                爆款概率：<span className={selectedTitle.score >= 8 ? 'text-red-500 font-bold' : ''}>{selectedTitle.score}/10</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">💡 适用场景</h4>
              <p>{selectedTitle.explanation}</p>
            </div>

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
    </div>
  )
}
