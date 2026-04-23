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
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/teams/invite/:token" element={<TeamInvite />} />

      {/* 受保护的路由 */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="cases" element={<Cases />} />
        <Route path="generator" element={<Generator />} />
        <Route path="saved" element={<Saved />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="templates" element={<Templates />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
