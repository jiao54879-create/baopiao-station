import { useState, useEffect } from 'react'
import { Card, Row, Col, Tag, Select, Input, Spin, Empty, Button, Modal, List, Space, InputRef, Tooltip } from 'antd'
import { StarOutlined, SaveOutlined, ThunderboltOutlined, DownloadOutlined, PlusOutlined, WechatOutlined, DeleteOutlined } from '@ant-design/icons'
import api from '../utils/api'
import { message } from 'antd'

const { Search } = Input

const platformMap: Record<string, { label: string; color: string }> = {
  XHS: { label: '小红书', color: 'red' },
  WX: { label: '公众号', color: 'blue' },
  DOUYIN: { label: '抖音', color: 'cyan' },
  WEIBO: { label: '微博', color: 'orange' },
  ZHIHU: { label: '知乎', color: 'geekblue' }
}

const insuranceTypeMap: Record<string, string> = {
  medical: '医疗险',
  critical: '重疾险',
  annuity: '年金险',
  life: '寿险',
  accident: '意外险',
  child: '少儿险',
  pension: '养老险'
}

// 公众号订阅配置
const wechatAccounts = [
  { id: 1, name: '深蓝保', bizId: 'gh_8b9c0d7a8f5c', url: 'https://rsshub.app/wechat/mp/gh_8b9c0d7a8f5c' },
  { id: 2, name: '多保鱼', bizId: 'gh_7d5c9b3f6e4a', url: 'https://rsshub.app/wechat/mp/gh_7d5c9b3f6e4a' },
  { id: 3, name: '小骆驼教你保', bizId: 'gh_6a8b2c4e5d9f', url: 'https://rsshub.app/wechat/mp/gh_6a8b2c4e5d9f' },
  { id: 4, name: '学霸说保险', bizId: 'gh_5f9a1b3c7e2d', url: 'https://rsshub.app/wechat/mp/gh_5f9a1b3c7e2d' },
  { id: 5, name: '奶爸保选险', bizId: 'gh_4e8a0c5f6b1d', url: 'https://rsshub.app/wechat/mp/gh_4e8a0c5f6b1d' },
  { id: 6, name: '小雨伞', bizId: 'gh_3d7f9a2c5e8b', url: 'https://rsshub.app/wechat/mp/gh_3d7f9a2c5e8b' },
]

export default function Cases() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedInsuranceType, setSelectedInsuranceType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false)
  const [subscribeUrl, setSubscribeUrl] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (selectedPlatform) params.platform = selectedPlatform
      if (selectedInsuranceType) params.insuranceType = selectedInsuranceType
      if (keyword) params.keyword = keyword

      const { data: res } = await api.get('/cases', { params })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedPlatform, selectedInsuranceType])

  const handleSave = async (caseId: number) => {
    try {
      await api.post(`/cases/${caseId}/save`)
      message.success('已收藏')
    } catch (error: any) {
      message.error(error.response?.data?.error || '收藏失败')
    }
  }

  const analyzeCase = async (caseItem: any) => {
    setSelectedCase(caseItem)
    setAnalyzing(true)
    try {
      const { data } = await api.post('/cases/analyze', {
        title: caseItem.title,
        content: caseItem.content || '',
        metrics: {
          likes: caseItem.likesCount,
          favorites: caseItem.favoritesCount,
          comments: caseItem.commentsCount
        }
      })
      setSelectedCase({ ...caseItem, analysis: data })
    } catch (error) {
      message.error('分析失败，请重试')
    } finally {
      setAnalyzing(false)
    }
  }

  // 采集爆款数据
  const handleCollect = async () => {
    setCollecting(true)
    try {
      const { data: res } = await api.post('/collect/viral')
      message.success(res.message || '采集完成')
      fetchData()
    } catch (error: any) {
      message.error(error.response?.data?.error || '采集失败')
    } finally {
      setCollecting(false)
    }
  }

  // 订阅公众号
  const handleSubscribe = async () => {
    if (!subscribeUrl.trim()) {
      message.warning('请输入公众号文章链接')
      return
    }
    
    // 验证是否是微信文章链接
    if (!subscribeUrl.includes('mp.weixin.qq.com')) {
      message.error('请输入正确的微信公众号文章链接')
      return
    }

    setSubscribing(true)
    try {
      const { data: res } = await api.post('/subscribe/wechat', {
        articleUrl: subscribeUrl
      })
      message.success(res.message || '订阅成功')
      setSubscribeUrl('')
      setSubscribeModalOpen(false)
    } catch (error: any) {
      message.error(error.response?.data?.error || '订阅失败')
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">🔥 爆款案例库</h2>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            loading={collecting}
            onClick={handleCollect}
            size="small"
          >
            采集数据
          </Button>
          <Tooltip title="订阅公众号文章">
            <Button 
              icon={<WechatOutlined />} 
              onClick={() => setSubscribeModalOpen(true)}
              size="small"
            >
              订阅公众号
            </Button>
          </Tooltip>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            placeholder="选择平台"
            allowClear
            value={selectedPlatform || undefined}
            onChange={setSelectedPlatform}
            style={{ width: 100 }}
            options={Object.entries(platformMap).map(([value, { label }]) => ({ value, label }))}
          />
          <Select
            placeholder="选择险种"
            allowClear
            value={selectedInsuranceType || undefined}
            onChange={setSelectedInsuranceType}
            style={{ width: 100 }}
            options={Object.entries(insuranceTypeMap).map(([value, label]) => ({ value, label }))}
          />
          <Search
            placeholder="搜索案例..."
            onSearch={(v) => { setKeyword(v); fetchData() }}
            style={{ width: 200 }}
            allowClear
          />
        </div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {data.map((item) => (
            <Col key={item.id} span={12}>
              <Card
                hoverable
                className="hover-lift"
                actions={[
                  <Button key="save" type="text" icon={<SaveOutlined />} onClick={() => handleSave(item.id)}>
                    收藏
                  </Button>,
                  <Button key="analyze" type="text" icon={<ThunderboltOutlined />} onClick={() => analyzeCase(item)}>
                    AI分析
                  </Button>,
                  <Button key="link" type="text" onClick={() => window.open(item.url, '_blank')}>
                    查看原文
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <div className="flex items-center gap-2 mb-2">
                      <Tag color={platformMap[item.platform]?.color}>
                        {platformMap[item.platform]?.label}
                      </Tag>
                      {item.insuranceType && (
                        <Tag color="purple">{insuranceTypeMap[item.insuranceType] || item.insuranceType}</Tag>
                      )}
                      <Tag color={item.viralScore && item.viralScore > 80 ? 'red' : 'default'}>
                        <StarOutlined /> {item.viralScore?.toFixed(1) || '?'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <h3 className="font-medium text-base mb-2">{item.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>👍 {item.likesCount}</span>
                        <span>⭐ {item.favoritesCount}</span>
                        <span>💬 {item.commentsCount}</span>
                        {item.author && <span>作者：{item.author}</span>}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        {data.length === 0 && !loading && (
          <Empty description="暂无爆款案例，点击「订阅公众号」开始采集" />
        )}
      </Spin>

      {/* AI 分析 Modal */}
      <Modal
        title="🔥 爆款分析"
        open={!!selectedCase}
        onCancel={() => setSelectedCase(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedCase(null)}>关闭</Button>,
          <Button key="save" type="primary" onClick={() => { handleSave(selectedCase.id); setSelectedCase(null); }}>
            收藏此案例
          </Button>
        ]}
        width={700}
      >
        {selectedCase && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">原文标题</h4>
              <p>{selectedCase.title}</p>
            </div>

            {analyzing ? (
              <div className="text-center py-8">
                <Spin tip="AI 正在分析中..." />
              </div>
            ) : selectedCase.analysis ? (
              <>
                <div>
                  <h4 className="font-medium text-primary">🔥 爆款因素</h4>
                  <ul className="list-disc pl-5">
                    {selectedCase.analysis.viralFactors?.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-secondary">📝 内容结构</h4>
                  <p><strong>开头：</strong>{selectedCase.analysis.contentStructure?.opening}</p>
                  <p><strong>中间：</strong>{selectedCase.analysis.contentStructure?.middle}</p>
                  <p><strong>结尾：</strong>{selectedCase.analysis.contentStructure?.ending}</p>
                </div>

                <div>
                  <h4 className="font-medium text-blue-500">💡 可复用公式</h4>
                  <p className="bg-blue-50 p-3 rounded">{selectedCase.analysis.reusableFormula}</p>
                </div>

                <div>
                  <h4 className="font-medium text-green-500">✨ 模仿建议</h4>
                  <ul className="list-disc pl-5">
                    {selectedCase.analysis.suggestions?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </div>
        )}
      </Modal>

      {/* 订阅公众号 Modal */}
      <Modal
        title={<><WechatOutlined /> 订阅公众号</>}
        open={subscribeModalOpen}
        onCancel={() => { setSubscribeModalOpen(false); setSubscribeUrl('') }}
        footer={[
          <Button key="cancel" onClick={() => { setSubscribeModalOpen(false); setSubscribeUrl('') }}>
            取消
          </Button>,
          <Button key="subscribe" type="primary" loading={subscribing} onClick={handleSubscribe}>
            确认订阅
          </Button>
        ]}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">输入公众号文章链接</h4>
            <Input
              placeholder="粘贴任意公众号文章链接，如：https://mp.weixin.qq.com/s/xxxx"
              value={subscribeUrl}
              onChange={(e) => setSubscribeUrl(e.target.value)}
              status={subscribeUrl && !subscribeUrl.includes('mp.weixin.qq.com') ? 'error' : undefined}
            />
            <p className="text-gray-500 text-sm mt-1">
              系统将从文章中提取公众号信息并订阅
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">已订阅的保险公众号</h4>
            <List
              size="small"
              dataSource={wechatAccounts}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button 
                      key="collect" 
                      type="link" 
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      采集
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<WechatOutlined style={{ fontSize: 20, color: '#07C160' }} />}
                    title={item.name}
                    description={`ID: ${item.bizId}`}
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
