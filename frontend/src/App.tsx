import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { Spin } from 'antd'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Intelligence from './pages/Intelligence'
import Cases from './pages/Cases'
import Generator from './pages/Generator'
import Saved from './pages/Saved'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import TeamInvite from './pages/TeamInvite'
import Templates from './pages/Templates'
import TitleOptimizer from './pages/TitleOptimizer'
import Products from './pages/Products'
import Materials from './pages/Materials'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <Routes>
      {/* 公开路由 - 无需登录即可浏览 */}
      <Route path="/" element={<Layout publicMode={true} />}>
        <Route index element={<Home />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="cases" element={<Cases />} />
        <Route path="generator" element={<Generator />} />
        <Route path="title-optimizer" element={<TitleOptimizer />} />
        <Route path="templates" element={<Templates />} />
        <Route path="products" element={<Products />} />
      </Route>

      {/* 需登录的路由 - 个性化功能 */}
      <Route path="/" element={<Layout publicMode={false} />}>
        <Route path="saved" element={<Saved />} />
        <Route path="materials" element={<Materials />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 认证路由 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/teams/invite/:token" element={<TeamInvite />} />
    </Routes>
  )
}

export default App
