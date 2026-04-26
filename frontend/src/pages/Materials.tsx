import { useState } from 'react'
import { Upload, message, Card, List, Button, Popconfirm, Tag } from 'antd'
import { InboxOutlined, DeleteOutlined, FileOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Dragger } = Upload

function FileIcon({ mimeType, size }: { mimeType: string; size?: number }) {
  const s = size || 32
  if (mimeType === 'application/pdf') return <FilePdfOutlined style={{ fontSize: s, color: '#e74c3c' }} />
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileWordOutlined style={{ fontSize: s, color: '#2b579a' }} />
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileExcelOutlined style={{ fontSize: s, color: '#217346' }} />
  return <FileOutlined style={{ fontSize: s }} />
}

export default function Materials() {
  const [_uploading, setUploading] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadMaterials = async () => {
    setLoading(true)
    try {
      const res = await api.get('/materials/list')
      if (res.data.success) setMaterials(res.data.data)
    } catch { message.error('加载素材失败') }
    finally { setLoading(false) }
  }

  const uploadProps = {
    name: 'file',
    beforeUpload: async (file: File) => {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await api.post('/materials/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        if (res.data.success) { message.success(`${file.name} 上传成功`); loadMaterials() }
      } catch (e: any) { message.error(e.response?.data?.error || '上传失败') }
      finally { setUploading(false) }
      return false
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await api.delete(`/materials/${id}`)
      if (res.data.success) { message.success('删除成功'); loadMaterials() }
    } catch { message.error('删除失败') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">素材上传</h1>
        <Button onClick={loadMaterials}>刷新</Button>
      </div>

      <Card className="mb-6">
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon"><InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} /></p>
          <p className="ant-upload-text">点击或拖拽文件上传</p>
          <p className="ant-upload-hint">支持：图片(JPG/PNG/GIF)、PDF、Word、Excel、TXT、Markdown，单文件最大10MB</p>
        </Dragger>
      </Card>

      <Card title="我的素材库">
        <List
          loading={loading}
          dataSource={materials}
          locale={{ emptyText: '暂无素材，请先上传' }}
          renderItem={(item: any) => (
            <List.Item actions={[
              <Popconfirm key="delete" title="确定删除此素材？" onConfirm={() => handleDelete(item.id)}>
                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            ]}>
              <List.Item.Meta avatar={
                item.mimeType?.startsWith('image/')
                  ? <img src={item.url} alt={item.filename} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                  : <FileIcon mimeType={item.mimeType || ''} size={32} />
              } title={item.filename} description={
                <div className="flex gap-2 items-center">
                  <Tag>{item.mimeType}</Tag>
                  <span className="text-gray-400 text-xs">{(item.size / 1024).toFixed(1)} KB</span>
                  <span className="text-gray-400 text-xs">|</span>
                  <span className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              } />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
