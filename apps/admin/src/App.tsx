import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PostManagementPage from './pages/PostManagementPage'
import PostEditPage from './pages/PostEditPage'
import CategoryManagementPage from './pages/CategoryManagementPage'
import TagManagementPage from './pages/TagManagementPage'
import CommentManagementPage from './pages/CommentManagementPage'
import UserManagementPage from './pages/UserManagementPage'
import FileManagementPage from './pages/FileManagementPage'
import SiteSettingsPage from './pages/SiteSettingsPage'
import AuthGuard from './components/AuthGuard'
import { ToastProvider } from './contexts/ToastContext'
import './index.css'

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* 登录页面 */}
          <Route path="/admin/login" element={<LoginPage />} />
          
          {/* 受保护的管理后台路由 */}
          <Route path="/admin" element={
            <AuthGuard>
              <AdminLayout />
            </AuthGuard>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="posts" element={<PostManagementPage />} />
            <Route path="posts/new" element={<PostEditPage />} />
            <Route path="posts/edit/:id" element={<PostEditPage />} />
            <Route path="categories" element={<CategoryManagementPage />} />
            <Route path="tags" element={<TagManagementPage />} />
            <Route path="comments" element={<CommentManagementPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="files" element={<FileManagementPage />} />
            <Route path="settings" element={<SiteSettingsPage />} />
          </Route>
          
          {/* 默认重定向 */}
          <Route path="/" element={<Navigate to="/admin/" replace />} />
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App
