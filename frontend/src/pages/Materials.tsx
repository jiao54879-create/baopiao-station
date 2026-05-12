import { useState, useEffect } from 'react'
import { Card, Button, Tag, Input, Select, Modal, Form, message, Popconfirm, Empty, Collapse, Typography } from 'antd'
import { PlusOutlined, SearchOutlined, CopyOutlined, StarOutlined, EditOutlined, DeleteOutlined, BookOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { TextArea } = Input
const { Panel } = Collapse
const { Text } = Typography

// 分类映射
const categoryMap: Record<string, { label: string; color: string }> = {
  PITFALL: { label: '避坑类', color: 'red' },
  INFO_GAP: { label: '信息差', color: 'blue' },
  TRICK: { label: '噱头营销', color: 'orange' },
  CLAIM: { label: '理赔注意', color: 'green' },
  COLD_FACT: { label: '冷知识', color: 'purple' },
}

interface MaterialItem {
  id: number
  category: string
  title: string
  content: string
  tags: string[]
  source?: string
  isBookmark: boolean
  usageCount: number
  createdAt: string
}

export default function Materials() {
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null)
  const [form] = Form.useForm()
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  const loadMaterials = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (selectedCategory) params.category = selectedCategory
      if (keyword) params.keyword = keyword
      const res = await api.get('/materials', { params })
      setMaterials(res.data.data)
    } catch {
      message.error('加载素材失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMaterials()
  }, [selectedCategory, keyword])

  const handleCopy = async (item: MaterialItem) => {
    try {
      await api.patch(`/materials/${item.id}/use`)
      await navigator.clipboard.writeText(item.content)
      message.success('已复制到剪贴板')
      loadMaterials()
    } catch {
      message.error('复制失败')
    }
  }

  const handleBookmark = async (id: number) => {
    try {
      await api.patch(`/materials/${id}/bookmark`)
      message.success('操作成功')
      loadMaterials()
    } catch {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/materials/${id}`)
      message.success('删除成功')
      loadMaterials()
    } catch {
      message.error('删除失败')
    }
  }

  const handleEdit = (item: MaterialItem) => {
    setEditingItem(item)
    form.setFieldsValue({
      category: item.category,
      title: item.title,
      content: item.content,
      tags: item.tags.join('、'),
      source: item.source,
    })
    setModalVisible(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        tags: values.tags ? values.tags.split('、').filter(Boolean) : [],
      }
      if (editingItem) {
        await api.put(`/materials/${editingItem.id}`, data)
        message.success('更新成功')
      } else {
        await api.post('/materials', data)
        message.success('添加成功')
      }
      setModalVisible(false)
      loadMaterials()
    } catch (e: any) {
      message.error(e.response?.data?.error || '操作失败')
    }
  }

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <div key={i}>{line || <br />}</div>
    ))
  }

  return (
    <div className="p-6">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <Button
            type={selectedCategory === '' ? 'primary' : 'default'}
            onClick={() => setSelectedCategory('')}
          >
            全部
          </Button>
          {Object.entries(categoryMap).map(([key, { label, color }]) => (
            <Button
              key={key}
              type={selectedCategory === key ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(key)}
              style={selectedCategory === key ? { backgroundColor: color, borderColor: color } : {}}
            >
              {label}
            </Button>
          ))}
        </div>
        <Input
          placeholder="搜索标题或内容..."
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增素材
        </Button>
      </div>

      {/* 素材列表 */}
      {materials.length === 0 ? (
        <Empty description="暂无素材" />
      ) : (
        <div className="grid gap-4">
          {materials.map(item => (
            <Card
              key={item.id}
              size="small"
              title={
                <div className="flex items-center gap-2">
                  <Tag color={categoryMap[item.category]?.color}>
                    {categoryMap[item.category]?.label}
                  </Tag>
                  <span className="font-medium">{item.title}</span>
                  {item.isBookmark && <StarOutlined style={{ color: '#faad14' }} />}
                </div>
              }
              extra={
                <div className="flex gap-2 items-center">
                  <Text type="secondary" className="text-xs">
                    使用 {item.usageCount} 次
                  </Text>
                  <Button
                    type="text"
                    icon={item.isBookmark ? <StarOutlined style={{ color: '#faad14' }} /> : <StarOutlined />}
                    onClick={() => handleBookmark(item.id)}
                    size="small"
                  />
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(item)}
                    size="small"
                  />
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(item)}
                    size="small"
                  />
                  <Popconfirm
                    title="确定删除此素材？"
                    onConfirm={() => handleDelete(item.id)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
                </div>
              }
            >
              <Collapse
                ghost
                activeKey={expandedKeys.includes(String(item.id)) ? [String(item.id)] : []}
                onChange={(keys) => setExpandedKeys(keys as string[])}
              >
                <Panel
                  key={String(item.id)}
                  header={
                    <span className="text-sm">
                      {expandedKeys.includes(String(item.id)) ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      <span className="ml-2">点击{expandedKeys.includes(String(item.id)) ? '收起' : '展开'}内容</span>
                    </span>
                  }
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 rounded">
                    {renderContent(item.content)}
                  </div>
                </Panel>
              </Collapse>
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1 mt-3 flex-wrap">
                  {item.tags.map((tag, i) => (
                    <Tag key={i} className="text-xs">{tag}</Tag>
                  ))}
                </div>
              )}
              {item.source && (
                <Text type="secondary" className="text-xs block mt-2">
                  来源：{item.source}
                </Text>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 新增/编辑 Modal */}
      <Modal
        title={editingItem ? '编辑素材' : '新增素材'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              {Object.entries(categoryMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={8} placeholder="请输入内容（支持Markdown格式）" />
          </Form.Item>
          <Form.Item
            name="tags"
            label="标签"
            extra="多个标签用顿号（、）分隔"
          >
            <Input placeholder="如：重疾险、返还型、消费型" />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Input placeholder="可选，填写素材来源" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
