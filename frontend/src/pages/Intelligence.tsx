import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { List, Tag, Select, Input, Spin, Empty, Button, message } from 'antd'
import { FireOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import api from '../utils/api'

dayjs.extend(relativeTime)

const { Search } = Input

const categoryMap: Record<string, { label: string; color: string }> = {
  INSURANCE: { label: '保险', color: 'red' },
  FINANCE: { label: '金融', color: 'gold' },
  EDUCATION: { label: '教育', color: 'green' },
  TECH: { label: '科技', color: 'blue' },
  SOCIAL: { label: '社会', color: 'purple' },
  HEALTH: { label: '健康', color: 'cyan' }
}

export default function Intelligence() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (selectedCategory) params.category = selectedCategory
      if (keyword) params.keyword = keyword

      const { data: res } = await api.get('/intelligence', { params })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedCategory])

  const handleSearch = (value: string) => {
    setKeyword(value)
    setSearchParams({ keyword: value, category: selectedCategory })
    fetchData(1)
  }

  const handleSave = async (id: number) => {
    try {
      await api.post(`/intelligence/${id}/save`)
      message.success('已收藏')
    } catch (error: any) {
      message.error(error.response?.data?.error || '收藏失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">📰 情报中心</h2>
        <div className="flex gap-2">
          <Select
            placeholder="选择分类"
            allowClear
            value={selectedCategory || undefined}
            onChange={setSelectedCategory}
            style={{ width: 120 }}
            options={Object.entries(categoryMap).map(([value, { label }]) => ({ value, label }))}
          />
          <Search
            placeholder="搜索情报..."
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
        </div>
      </div>

      <Spin spinning={loading}>
        <List
          dataSource={data}
          locale={{ emptyText: <Empty description="暂无情报" /> }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="save"
                  type="text"
                  icon={<SaveOutlined />}
                  onClick={() => handleSave(item.id)}
                >
                  收藏
                </Button>,
                <Button
                  key="view"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(item.sourceUrl, '_blank')}
                >
                  查看原文
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2">
                    <Tag color={categoryMap[item.category]?.color}>
                      {categoryMap[item.category]?.label}
                    </Tag>
                    <span className="font-medium">{item.title}</span>
                    <Tag color="red" className={item.hotScore > 80 ? 'hot-tag' : ''}>
                      <FireOutlined /> {item.hotScore}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <div className="text-gray-600 text-sm mb-1">{item.summary}</div>
                    <div className="text-xs text-gray-400">
                      来源：{item.source} · {dayjs(item.publishTime || item.createdAt).fromNow()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Spin>
    </div>
  )
}
