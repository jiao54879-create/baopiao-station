import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Statistic, List, Tag, Badge, Input, Button, Spin } from 'antd'
import { FireOutlined, ThunderboltOutlined, EditOutlined, StarOutlined, RightOutlined } from '@ant-design/icons'
import api from '../utils/api'
import { useAuthStore } from '../store/auth'

const { Search } = Input

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [hotWords, setHotWords] = useState<any[]>([])
  const [recentIntelligences, setRecentIntelligences] = useState<any[]>([])
  const [topCases, setTopCases] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 并行获取公开数据
    Promise.all([
      api.get('/intelligence/hot?limit=10'),
      api.get('/intelligence?limit=5'),
      api.get('/cases?limit=5')
    ]).then(([hotRes, recentRes, casesRes]) => {
      setHotWords(hotRes.data.data)
      setRecentIntelligences(recentRes.data.data)
      setTopCases(casesRes.data.data)
    }).finally(() => setLoading(false))

    // 只有登录用户才获取个人统计
    if (isAuthenticated) {
      api.get('/users/stats').then(res => {
        setStats(res.data)
      }).catch(() => {
        // 忽略错误，未登录用户不需要统计
      })
    }
  }, [isAuthenticated])

  const onSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/generator?keyword=${encodeURIComponent(value)}`)
    }
  }

  if (loading) {
    return <Spin size="large" className="flex justify-center py-20" />
  }

  return (
    <div className="space-y-6">
      {/* 搜索区域 */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-8 text-white text-center">
        <h1 className="text-3xl font-bold mb-4">欢迎使用爆款情报站</h1>
        <p className="mb-6 opacity-90">输入关键词，AI 帮你生成爆款标题</p>
        <Search
          placeholder="例如：延迟退休、孩子保险、重疾险..."
          size="large"
          className="max-w-xl"
          prefix={<EditOutlined />}
          enterButton={<Button type="primary" className="bg-white text-primary">生成标题</Button>}
          onSearch={onSearch}
        />
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="收藏情报"
              value={stats.savedIntelligences || 0}
              prefix={<FireOutlined className="text-primary" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="收藏案例"
              value={stats.savedCases || 0}
              prefix={<StarOutlined className="text-secondary" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="生成标题"
              value={stats.savedTitles || 0}
              prefix={<EditOutlined className="text-accent" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="今日新增情报"
              value={recentIntelligences.length}
              prefix={<ThunderboltOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 热门词汇 */}
        <Col span={8}>
          <Card
            title={<><FireOutlined className="text-primary mr-2" />今日热词</>}
            extra={<a onClick={() => navigate('/intelligence')}>更多 <RightOutlined /></a>}
          >
            <div className="flex flex-wrap gap-2">
              {hotWords.map((item, idx) => (
                <Tag
                  key={item.id}
                  color={idx < 3 ? 'red' : idx < 6 ? 'orange' : 'default'}
                  className={`cursor-pointer hover:scale-105 transition ${idx < 3 ? 'hot-tag' : ''}`}
                  onClick={() => onSearch(item.title)}
                >
                  {idx + 1}. {item.title.slice(0, 15)}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>

        {/* 紧急提醒 */}
        <Col span={8}>
          <Card
            title={<><Badge status="error" className="mr-2" />紧急提醒</>}
            extra={<a onClick={() => navigate('/intelligence?category=INSURANCE')}>查看</a>}
          >
            <List
              size="small"
              dataSource={recentIntelligences.filter(i => i.category === 'INSURANCE').slice(0, 4)}
              renderItem={(item) => (
                <List.Item>
                  <div className="w-full">
                    <div className="text-sm truncate">{item.title}</div>
                    <div className="text-xs text-gray-400">{item.source}</div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 爆款案例 */}
        <Col span={8}>
          <Card
            title={<><StarOutlined className="text-secondary mr-2" />热门案例</>}
            extra={<a onClick={() => navigate('/cases')}>更多 <RightOutlined /></a>}
          >
            <List
              size="small"
              dataSource={topCases}
              renderItem={(item) => (
                <List.Item>
                  <div className="w-full">
                    <div className="text-sm truncate">{item.title}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Tag color="magenta" className="text-xs">{item.platform}</Tag>
                      <span>👍 {item.likesCount}</span>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
