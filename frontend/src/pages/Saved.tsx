import { useState, useEffect } from 'react'
import { Card, Tabs, List, Tag, Empty, Button, message } from 'antd'
import { StarOutlined, FireOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import api from '../utils/api'

dayjs.extend(relativeTime)

export default function Saved() {
  const [intelligences, setIntelligences] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [titles, setTitles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('intelligence')

  useEffect(() => {
    fetchSaved()
  }, [])

  const fetchSaved = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users/saved')
      setIntelligences(data.intelligence)
      setCases(data.cases)
      setTitles(data.titles)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = async (type: string, id: number) => {
    try {
      if (type === 'intelligence') {
        await api.delete(`/intelligence/${id}/save`)
        setIntelligences(prev => prev.filter(i => i.intelligence.id !== id))
      } else if (type === 'case') {
        await api.delete(`/cases/${id}/save`)
        setCases(prev => prev.filter(c => c.case.id !== id))
      }
      message.success('已取消收藏')
    } catch (error) {
      message.error('操作失败')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  }

  const tabItems = [
    {
      key: 'intelligence',
      label: <span><FireOutlined /> 情报 {intelligences.length}</span>,
      children: (
        <List
          loading={loading}
          locale={{ emptyText: <Empty description="暂无收藏的情报" /> }}
          dataSource={intelligences}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleUnsave('intelligence', item.intelligence.id)}
                />
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2">
                    <Tag color="red">{item.intelligence.category}</Tag>
                    <span>{item.intelligence.title}</span>
                  </div>
                }
                description={
                  <span className="text-xs text-gray-400">
                    收藏于 {dayjs(item.createdAt).fromNow()}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )
    },
    {
      key: 'cases',
      label: <span><StarOutlined /> 案例 {cases.length}</span>,
      children: (
        <List
          loading={loading}
          locale={{ emptyText: <Empty description="暂无收藏的案例" /> }}
          dataSource={cases}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Button
                  key="view"
                  type="text"
                  onClick={() => window.open(item.case.url, '_blank')}
                >
                  查看原文
                </Button>,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleUnsave('case', item.case.id)}
                />
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2">
                    <Tag color="blue">{item.case.platform}</Tag>
                    <span>{item.case.title}</span>
                  </div>
                }
                description={
                  <span className="text-xs text-gray-400">
                    👍 {item.case.likesCount} · 收藏于 {dayjs(item.createdAt).fromNow()}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )
    },
    {
      key: 'titles',
      label: <span><EditOutlined /> 标题 {titles.length}</span>,
      children: (
        <List
          loading={loading}
          locale={{ emptyText: <Empty description="暂无收藏的标题" /> }}
          dataSource={titles}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Button
                  key="copy"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => copyToClipboard(item.finalTitle || item.generatedTitles?.[0]?.title || '')}
                >
                  复制
                </Button>,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {/* TODO */}}
                />
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.finalTitle ? (
                      <Tag color="green">精选</Tag>
                    ) : (
                      <Tag color="default">草稿</Tag>
                    )}
                    {item.finalTitle ? (
                      <span className="font-medium">{item.finalTitle}</span>
                    ) : (
                      <div className="space-y-1">
                        {item.generatedTitles?.slice(0, 3).map((t: any, i: number) => (
                          <div key={i} className="text-sm text-gray-600">{t.title}</div>
                        ))}
                        {item.generatedTitles?.length > 3 && (
                          <div className="text-xs text-gray-400">...共{item.generatedTitles.length}个</div>
                        )}
                      </div>
                    )}
                  </div>
                }
                description={
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>关键词：{item.keywords?.join(', ')}</span>
                    <span>·</span>
                    <span>{dayjs(item.createdAt).fromNow()}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )
    }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">⭐ 我的收藏</h2>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  )
}
