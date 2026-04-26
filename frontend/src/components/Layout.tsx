import { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  HomeOutlined,
  FireOutlined,
  BookOutlined,
  EditOutlined,
  StarOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ShoppingOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuthStore } from '../store/auth'
import api from '../utils/api'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/intelligence', icon: <FireOutlined />, label: '情报中心' },
  { key: '/products', icon: <ShoppingOutlined />, label: '产品中心 🆕' },
  { key: '/cases', icon: <BookOutlined />, label: '爆款案例' },
  { key: '/generator', icon: <EditOutlined />, label: '标题生成' },
  { key: '/title-optimizer', icon: <ThunderboltOutlined />, label: '标题优化 ✨' },
  { key: '/templates', icon: <BarChartOutlined />, label: '模板库' },
  { key: '/saved', icon: <StarOutlined />, label: '我的收藏' },
  { key: '/materials', icon: <UploadOutlined />, label: '素材上传 🆕' },
  { key: '/dashboard', icon: <BarChartOutlined />, label: '数据看板' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
]

export default function LayoutComponent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [teamName, setTeamName] = useState<string>('')

  useEffect(() => {
    if (user?.teamId) {
      api.get('/teams/me').then(res => {
        if (res.data.team) {
          setTeamName(res.data.team.name)
        }
      })
    }
  }, [user?.teamId])

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/settings')
    },
    {
      key: 'team',
      icon: <TeamOutlined />,
      label: teamName || '我的团队',
      onClick: () => navigate('/settings?tab=team')
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      }
    }
  ]

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between bg-white shadow-sm px-6">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-primary">
            🔥 爆款情报站
          </div>
          {teamName && (
            <Badge count={teamName} style={{ backgroundColor: '#4ecdc4' }} />
          )}
        </div>

        <div className="flex items-center gap-4">
          <Badge count={5} size="small">
            <BellOutlined className="text-xl cursor-pointer" />
          </Badge>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar style={{ backgroundColor: '#ff6b6b' }}>
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
              <span className="font-medium">{user?.username}</span>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Layout>
        <Sider width={200} className="bg-white">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className="border-r-0"
          />
        </Sider>

        <Content className="p-6 bg-gray-50">
          <div className="bg-white rounded-lg p-6 min-h-full">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
