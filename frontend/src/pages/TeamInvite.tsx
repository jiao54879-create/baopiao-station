import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Result, Button, message } from 'antd'
import { CheckCircleOutlined, TeamOutlined } from '@ant-design/icons'
import api from '../utils/api'
import { useAuthStore } from '../store/auth'

export default function TeamInvite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [inviteInfo, setInviteInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (token) {
      fetchInviteInfo()
    }
  }, [token])

  const fetchInviteInfo = async () => {
    try {
      const { data } = await api.get(`/teams/invite/${token}`)
      setInviteInfo(data.invite || data)
    } catch (error: any) {
      message.error(error.response?.data?.error || '邀请链接无效')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!isAuthenticated) {
      message.info('请先登录后再接受邀请')
      navigate(`/login?redirect=/teams/invite/${token}`)
      return
    }

    setJoining(true)
    try {
      await api.post(`/teams/invite/${token}/accept`)
      message.success('已成功加入团队！')
      navigate('/')
    } catch (error: any) {
      message.error(error.response?.data?.error || '加入失败')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card loading />
      </div>
    )
  }

  if (!inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Result
          status="error"
          title="邀请链接无效"
          subTitle="该邀请链接可能已过期或已被使用"
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="max-w-md text-center">
        <div className="mb-6">
          <TeamOutlined className="text-5xl text-primary" />
        </div>

        <Result
          icon={<CheckCircleOutlined className="text-green-500" />}
          title="团队邀请"
          subTitle={
            <div>
              <p className="text-lg font-medium mb-2">{inviteInfo.teamName}</p>
              <p className="text-gray-500">
                邀请你以 <span className="font-medium">{inviteInfo.role === 'ADMIN' ? '管理员' : inviteInfo.role === 'MEMBER' ? '成员' : '只读'}</span> 身份加入团队
              </p>
            </div>
          }
          extra={
            <Button
              type="primary"
              size="large"
              onClick={handleAccept}
              loading={joining}
            >
              {isAuthenticated ? '接受邀请' : '登录后接受邀请'}
            </Button>
          }
        />
      </Card>
    </div>
  )
}
