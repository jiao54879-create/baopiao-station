import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Tabs, Form, Input, Button, Table, Tag, message, Select, Divider } from 'antd'
import { UserOutlined, TeamOutlined, BellOutlined } from '@ant-design/icons'
import api from '../utils/api'
import { useAuthStore } from '../store/auth'

export default function Settings() {
  const [searchParams] = useSearchParams()
  const { user, checkAuth } = useAuthStore()
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [inviting, setInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  const activeTab = searchParams.get('tab') || 'profile'

  useEffect(() => {
    if (user?.teamId) {
      fetchTeamMembers()
    }
  }, [user?.teamId])

  const fetchTeamMembers = async () => {
    try {
      const { data } = await api.get('/teams/members')
      setTeamMembers(data.data)
    } catch (error) {
      console.error('获取团队成员失败', error)
    }
  }

  const handleProfileUpdate = async (values: any) => {
    try {
      await api.patch('/users/me', values)
      await checkAuth()
      message.success('个人资料已更新')
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handlePasswordChange = async (values: any) => {
    try {
      await api.post('/users/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      passwordForm.resetFields()
      message.success('密码已修改')
    } catch (error: any) {
      message.error(error.response?.data?.error || '修改失败')
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) {
      message.warning('请输入邮箱')
      return
    }

    setInviting(true)
    try {
      const { data } = await api.post('/teams/invite', {
        email: inviteEmail,
        role: inviteRole
      })
      setInviteLink(data.inviteLink)
      message.success('邀请链接已生成')
      setInviteEmail('')
    } catch (error: any) {
      message.error(error.response?.data?.error || '邀请失败')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    try {
      await api.delete(`/teams/members/${memberId}`)
      setTeamMembers(prev => prev.filter(m => m.id !== memberId))
      message.success('已移除成员')
    } catch (error: any) {
      message.error(error.response?.data?.error || '移除失败')
    }
  }

  const memberColumns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role: string) => <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '从未登录'
    },
    {
      title: '操作',
      render: (_: any, record: any) => (
        record.role !== 'ADMIN' && (
          <Button
            type="link"
            danger
            onClick={() => handleRemoveMember(record.id)}
          >
            移除
          </Button>
        )
      )
    }
  ]

  const tabItems = [
    {
      key: 'profile',
      label: <span><UserOutlined /> 个人资料</span>,
      children: (
        <div className="max-w-md">
          <Form
            form={profileForm}
            layout="vertical"
            initialValues={{
              username: user?.username,
              email: user?.email
            }}
            onFinish={handleProfileUpdate}
          >
            <Form.Item label="用户名" name="username">
              <Input />
            </Form.Item>
            <Form.Item label="邮箱" name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">保存</Button>
            </Form.Item>
          </Form>

          <Divider>修改密码</Divider>

          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
          >
            <Form.Item
              label="当前密码"
              name="currentPassword"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' }
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">修改密码</Button>
            </Form.Item>
          </Form>
        </div>
      )
    },
    ...(user?.teamId ? [{
      key: 'team',
      label: <span><TeamOutlined /> 团队管理</span>,
      children: (
        <div className="space-y-6">
          <Card title="团队信息">
            <p>团队ID：{user?.teamId}</p>
          </Card>

          <Card title="邀请新成员">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="输入邮箱地址"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ width: 250 }}
              />
              <Select
                value={inviteRole}
                onChange={setInviteRole}
                style={{ width: 120 }}
                options={[
                  { value: 'ADMIN', label: '管理员' },
                  { value: 'MEMBER', label: '成员' },
                  { value: 'VIEWER', label: '只读' }
                ]}
              />
              <Button
                type="primary"
                onClick={handleInvite}
                loading={inviting}
              >
                生成邀请链接
              </Button>
            </div>

            {inviteLink && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500 mb-2">邀请链接（7天内有效）：</p>
                <Input value={inviteLink} disabled />
                <Button
                  type="link"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink)
                    message.success('已复制到剪贴板')
                  }}
                >
                  复制链接
                </Button>
              </div>
            )}
          </Card>

          <Card title="团队成员">
            <Table
              dataSource={teamMembers}
              columns={memberColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </div>
      )
    }] : [{
      key: 'team',
      label: <span><TeamOutlined /> 团队管理</span>,
      children: (
        <Card>
          <div className="text-center py-8">
            <TeamOutlined className="text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">你还没有加入团队</p>
            <Button type="primary" disabled>创建团队（即将上线）</Button>
          </div>
        </Card>
      )
    }]),
    {
      key: 'notifications',
      label: <span><BellOutlined /> 通知设置</span>,
      children: (
        <div className="max-w-md">
          <p className="text-gray-500">通知功能正在开发中...</p>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">⚙️ 设置</h2>

      <Card>
        <Tabs
          activeKey={activeTab}
          items={tabItems}
        />
      </Card>
    </div>
  )
}
