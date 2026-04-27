import { useState, useEffect } from 'react'
import { Card, Row, Col, Tag, Select, Input, Spin, Empty, Button, Modal } from 'antd'
import { StarOutlined, SaveOutlined, ThunderboltOutlined, DownloadOutlined } from '@ant-design/icons'
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

export default function Cases() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedInsuranceType, setSelectedInsuranceType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [collecting, setCollecting] = useState(false)

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
      fetchData() // 刷新数据
    } catch (error: any) {
      message.error(error.response?.data?.error || '采集失败')
    } finally {
      setCollecting(false)
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
          <Empty description="暂无爆款案例" />
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
    </div>
  )
}
