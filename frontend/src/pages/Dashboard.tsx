import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Tag, List, Progress, Spin, Button, message } from 'antd'
import {
  FireOutlined,
  StarOutlined,
  UserOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  EyeOutlined,
  SendOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import api from '../utils/api'

dayjs.extend(relativeTime)

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/stats/dashboard')
      setStats(data)
    } catch (error) {
      message.error('获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  const sendDailySummary = async () => {
    setSending(true)
    try {
      await api.post('/stats/send-daily-summary')
      message.success('每日摘要已发送')
    } catch (error) {
      message.error('发送失败')
    } finally {
      setSending(false)
    }
  }

  if (loading || !stats) {
    return <Spin size="large" className="flex justify-center py-20" />
  }

  const { overview, hotTrends, viralInsights, userActivity, recentActivity } = stats

  const categoryColors: Record<string, string> = {
    INSURANCE: 'red',
    FINANCE: 'gold',
    EDUCATION: 'green',
    TECH: 'blue',
    SOCIAL: 'purple',
    HEALTH: 'cyan'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">📊 数据统计看板</h2>
        <div className="flex gap-2">
          <Button icon={<SendOutlined />} onClick={sendDailySummary} loading={sending}>
            发送每日摘要
          </Button>
          <Button onClick={fetchDashboard}>刷新数据</Button>
        </div>
      </div>

      {/* 概览统计 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="总情报数"
              value={overview.totalIntelligence}
              prefix={<FireOutlined className="text-primary" />}
              suffix={<span className="text-sm text-gray-400">+{overview.todayNewIntelligence} 今日</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="爆款案例"
              value={overview.totalCases}
              prefix={<StarOutlined className="text-secondary" />}
              suffix={<span className="text-sm text-gray-400">+{overview.todayNewCases} 今日</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="团队用户"
              value={overview.totalUsers}
              prefix={<UserOutlined className="text-blue-500" />}
              suffix={<span className="text-sm text-gray-400">{userActivity.activeUsers} 活跃</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="平均爆款分"
              value={viralInsights.avgViralScore?.toFixed(1) || 0}
              prefix={<RiseOutlined className="text-green-500" />}
              suffix="/ 100"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 热门关键词 */}
        <Col span={8}>
          <Card title={<><FireOutlined className="text-primary mr-2" />热门关键词</>}>
            <div className="space-y-2">
              {hotTrends.hotKeywords.slice(0, 10).map((item: any, index: number) => (
                <div key={item.keyword} className="flex items-center gap-2">
                  <span className="w-6 text-center text-gray-400">{index + 1}</span>
                  <span className="flex-1">{item.keyword}</span>
                  <Tag color={index < 3 ? 'red' : 'default'}>{item.count}</Tag>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 热门分类 */}
        <Col span={8}>
          <Card title={<><ThunderboltOutlined className="text-secondary mr-2" />情报分类分布</>}>
            <div className="space-y-3">
              {hotTrends.hotCategories.map((item: any) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <Tag color={categoryColors[item.category] || 'default'}>
                      {item.category === 'INSURANCE' ? '保险' :
                       item.category === 'FINANCE' ? '金融' :
                       item.category === 'EDUCATION' ? '教育' :
                       item.category === 'TECH' ? '科技' :
                       item.category === 'SOCIAL' ? '社会' : '健康'}
                    </Tag>
                    <span className="text-sm text-gray-500">{item.count}</span>
                  </div>
                  <Progress
                    percent={Math.round((item.count / overview.totalIntelligence) * 100)}
                    showInfo={false}
                    strokeColor={categoryColors[item.category] === 'red' ? '#ff6b6b' :
                                  categoryColors[item.category] === 'gold' ? '#faad14' :
                                  '#4ecdc4'}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 热门来源 */}
        <Col span={8}>
          <Card title={<><EyeOutlined className="text-blue-500 mr-2" />热门来源 TOP10</>}>
            <List
              size="small"
              dataSource={hotTrends.hotSources}
              renderItem={(item: any) => (
                <List.Item className="px-0">
                  <span>{item.source}</span>
                  <Tag color="blue">{item.count}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 爆款案例 TOP10 */}
        <Col span={12}>
          <Card title={<><StarOutlined className="text-secondary mr-2" />爆款案例 TOP10</>}>
            <List
              size="small"
              dataSource={viralInsights.topCases}
              renderItem={(item: any, index: number) => (
                <List.Item className="hover:bg-gray-50 rounded px-2 py-1">
                  <div className="flex items-center gap-3 w-full">
                    <span className="w-6 text-center font-bold text-gray-400">{index + 1}</span>
                    <Tag color="magenta">{item.platform}</Tag>
                    <span className="flex-1 truncate">{item.title}</span>
                    <span className="text-orange-500">👍 {item.likesCount}</span>
                    <span className={item.viralScore > 80 ? 'text-red-500 font-bold' : 'text-gray-400'}>
                      {item.viralScore?.toFixed(0)}
                    </span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 用户活跃榜 */}
        <Col span={12}>
          <Card title={<><UserOutlined className="text-primary mr-2" />用户活跃榜</>}>
            <List
              size="small"
              dataSource={userActivity.topUsers.slice(0, 10)}
              renderItem={(item: any, index: number) => (
                <List.Item className="hover:bg-gray-50 rounded px-2 py-1">
                  <div className="flex items-center gap-3 w-full">
                    <span className={`w-6 text-center font-bold ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-orange-400' : 'text-gray-300'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="flex-1">{item.username}</span>
                    <span className="text-sm text-gray-500">
                      收藏 {item.savedCount} · 生成 {item.generatedCount}
                    </span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近活动 */}
      <Card title="最近活动">
        <List
          size="small"
          dataSource={recentActivity.slice(0, 15)}
          renderItem={(item: any) => (
            <List.Item>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Tag>{item.type}</Tag>
                  <span>{item.description}</span>
                </div>
                <div className="text-gray-400 text-sm">
                  {item.user} · {dayjs(item.time).fromNow()}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
