import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { List, Tag, Select, Input, Spin, Empty, Button, message, Modal, Checkbox, Popconfirm } from 'antd'
import { FireOutlined, SaveOutlined, EyeOutlined, DeleteOutlined, DeleteFilled } from '@ant-design/icons'
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [deleting, setDeleting] = useState(false)

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 50 }  // 增加每页数量
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
  }, [selectedCategory, keyword])

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

  // 删除单条情报
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/intelligence/${id}`)
      message.success('已删除')
      setData(data.filter(item => item.id !== id))
      setSelectedRowKeys(selectedRowKeys.filter(key => key !== id))
    } catch (error: any) {
      message.error('删除失败')
    }
  }

  // 批量删除选中的情报
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的情报')
      return
    }

    setDeleting(true)
    try {
      const res = await api.post('/intelligence/batch-delete', { ids: selectedRowKeys })
      message.success(res.data.message)
      setData(data.filter(item => !selectedRowKeys.includes(item.id)))
      setSelectedRowKeys([])
    } catch (error: any) {
      message.error('批量删除失败')
    } finally {
      setDeleting(false)
    }
  }

  // 清空当前分类的所有情报
  const handleClearCategory = async () => {
    if (!selectedCategory) {
      message.warning('请先选择一个分类')
      return
    }

    Modal.confirm({
      title: '确认清空',
      content: `确定要清空「${categoryMap[selectedCategory]?.label}」分类下的所有情报吗？此操作不可恢复！`,
      okText: '确定清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await api.delete(`/intelligence/category/${selectedCategory}`)
          message.success(res.data.message)
          fetchData()
          setSelectedRowKeys([])
        } catch (error: any) {
          message.error('清空失败')
        }
      }
    })
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
            onChange={(val) => {
              setSelectedCategory(val || '')
              setSelectedRowKeys([])
            }}
            style={{ width: 120 }}
            options={Object.entries(categoryMap).map(([value, { label }]) => ({ value, label }))}
          />
          <Search
            placeholder="搜索情报..."
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      {/* 批量操作栏 */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <Checkbox
          indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < data.length}
          checked={selectedRowKeys.length === data.length && data.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys(data.map(item => item.id))
            } else {
              setSelectedRowKeys([])
            }
          }}
        >
          全选
        </Checkbox>
        <span className="text-gray-500">
          已选择 {selectedRowKeys.length} 条
        </span>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleBatchDelete}
          loading={deleting}
          disabled={selectedRowKeys.length === 0}
        >
          批量删除
        </Button>
        {selectedCategory && (
          <Popconfirm
            title="确认清空此分类？"
            description="此操作不可恢复，确定要删除吗？"
            onConfirm={handleClearCategory}
            okText="确定"
            cancelText="取消"
            okType="danger"
          >
            <Button danger icon={<DeleteFilled />}>
              清空「{categoryMap[selectedCategory]?.label}」分类
            </Button>
          </Popconfirm>
        )}
      </div>

      <Spin spinning={loading}>
        <List
          dataSource={data}
          locale={{ emptyText: <Empty description="暂无情报" /> }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="delete"
                  title="确认删除？"
                  description="删除后不可恢复"
                  onConfirm={() => handleDelete(item.id)}
                  okText="删除"
                  cancelText="取消"
                  okType="danger"
                >
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
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
                  onClick={() => {
                    if (!item.sourceUrl) {
                      message.warning('该情报暂无原文链接');
                    } else {
                      window.open(item.sourceUrl, '_blank');
                    }
                  }}
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
                    {item.hotScore > 0 && (
                      <Tag color="red" className={item.hotScore > 80 ? 'hot-tag' : ''}>
                        <FireOutlined /> {item.hotScore}
                      </Tag>
                    )}
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
