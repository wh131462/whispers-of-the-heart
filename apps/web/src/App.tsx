import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import PostsPage from './pages/PostsPage'
import PostDetailPage from './pages/PostDetailPage'
import FavoritesPage from './pages/FavoritesPage'
import VideosPage from './pages/VideosPage'
import AudiosPage from './pages/AudiosPage'
import SearchPage from './pages/SearchPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import { ToastProvider } from './contexts/ToastContext'
import './index.css'

// 获取admin URL，支持不同环境
const getAdminUrl = () => {
  // 优先使用环境变量配置
  if (import.meta.env.VITE_ADMIN_URL) {
    return import.meta.env.VITE_ADMIN_URL
  }
  // 开发环境默认配置
  if (import.meta.env.DEV) {
    return 'http://localhost:9999'
  }
  // 生产环境默认配置
  return 'https://admin.whispers.local'
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* 认证相关页面 - 独立页面，不使用主布局 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* 管理后台重定向 */}
          <Route path="/admin" element={<Navigate to={getAdminUrl()} replace />} />
          
          {/* 主布局页面 */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="posts/:slug" element={<PostDetailPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="audios" element={<AudiosPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={
              <div className="text-center py-12">
                <h1 className="text-3xl font-bold mb-4">关于我们</h1>
                <p className="text-muted-foreground">Whispers of the Heart 是一个专注于分享知识和灵感的平台。</p>
              </div>
            } />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App
