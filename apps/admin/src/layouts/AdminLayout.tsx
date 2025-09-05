import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Users, 
  FolderOpen, 
  Settings,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAuthStore } from '../stores/useAuthStore'
import { blogApi } from '@whispers/utils'

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, token } = useAuthStore()

  // 初始化token
  useEffect(() => {
    if (token) {
      blogApi.setToken(token)
    }
  }, [token])

  const navigation = [
    { name: '仪表盘', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: '文章管理', href: '/admin/posts', icon: FileText },
    { name: '评论管理', href: '/admin/comments', icon: MessageSquare },
    { name: '用户管理', href: '/admin/users', icon: Users },
    { name: '文件管理', href: '/admin/files', icon: FolderOpen },
    { name: '站点配置', href: '/admin/settings', icon: Settings },
  ]

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const isActive = (href: string) => {
    return location.pathname === href
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">管理后台</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 用户信息 */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.username || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>

        {/* 退出登录 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            退出登录
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="lg:pl-64">
        {/* 顶部栏 */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
