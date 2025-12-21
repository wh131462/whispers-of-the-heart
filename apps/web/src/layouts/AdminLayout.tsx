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
  LogOut,
  User,
  Tag,
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@whispers/ui'
import { useAuthStore } from '../stores/useAuthStore'
import { blogApi } from '@whispers/utils'
import logoImg from '../assets/logo.png'

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false) // 移动端展开
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // 桌面端收起
  const [currentTime, setCurrentTime] = useState(new Date())
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, token } = useAuthStore()

  // 判断是否是文章编辑页面（需要全屏无侧边栏）
  const isPostEditPage = location.pathname.startsWith('/admin/posts/new') ||
    location.pathname.startsWith('/admin/posts/edit')

  // 初始化token
  useEffect(() => {
    if (token) {
      blogApi.setToken(token)
    }
  }, [token])

  // 实时更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const navigation = [
    { name: '仪表盘', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: '文章管理', href: '/admin/posts', icon: FileText },
    { name: '标签管理', href: '/admin/tags', icon: Tag },
    { name: '评论管理', href: '/admin/comments', icon: MessageSquare },
    { name: '用户管理', href: '/admin/users', icon: Users },
    { name: '媒体库', href: '/admin/media', icon: FolderOpen },
    { name: '站点配置', href: '/admin/settings', icon: Settings },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (href: string) => {
    return location.pathname === href
  }

  // 文章编辑页面使用全屏布局
  if (isPostEditPage) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Outlet />
      </div>
    )
  }

  const sidebarWidth = sidebarCollapsed ? '4rem' : '16rem'

  return (
    <div className="min-h-screen bg-background font-sans">
      <style>{`
        @media (min-width: 1024px) {
          .admin-main-content {
            padding-left: ${sidebarWidth};
          }
        }
      `}</style>
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-card border-r shadow-sm transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ width: sidebarCollapsed ? '4rem' : '16rem' }}
      >
        {/* 头部 */}
        <div className={`flex items-center h-16 border-b ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-6'}`}>
          <div className={`flex items-center ${sidebarCollapsed ? '' : 'space-x-2'}`}>
            <img src={logoImg} alt="Logo" className="h-8 w-8 rounded-lg object-cover shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-foreground font-serif">管理后台</span>
            )}
          </div>
        </div>

        {/* 用户信息 */}
        <div className={`border-b ${sidebarCollapsed ? 'py-4 flex justify-center' : 'px-6 py-4'}`}>
          {sidebarCollapsed ? (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center" title={user?.username || 'Admin'}>
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-foreground truncate">{user?.username || 'Admin'}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                    user?.isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {user?.isAdmin ? '管理员' : '用户'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@example.com'}</p>
              </div>
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className={`py-4 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href)
                  setSidebarOpen(false)
                }}
                title={sidebarCollapsed ? item.name : undefined}
                className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors ${
                  sidebarCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5'
                } ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </button>
            )
          })}
        </nav>

        {/* 底部操作 */}
        <div className={`absolute bottom-0 left-0 right-0 border-t space-y-2 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {/* 收起/展开按钮 - 仅桌面端显示 */}
          <Button
            variant="ghost"
            size={sidebarCollapsed ? 'icon' : 'default'}
            className={`hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-accent ${
              sidebarCollapsed ? 'w-full justify-center' : 'w-full justify-start'
            }`}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 mr-3" />
                收起侧边栏
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size={sidebarCollapsed ? 'icon' : 'default'}
            className={`text-muted-foreground hover:text-foreground hover:bg-accent ${
              sidebarCollapsed ? 'w-full justify-center' : 'w-full justify-start'
            }`}
            onClick={() => navigate('/')}
            title={sidebarCollapsed ? '返回前台' : undefined}
          >
            <Home className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
            {!sidebarCollapsed && '返回前台'}
          </Button>
          <Button
            variant="ghost"
            size={sidebarCollapsed ? 'icon' : 'default'}
            className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${
              sidebarCollapsed ? 'w-full justify-center' : 'w-full justify-start'
            }`}
            onClick={handleLogout}
            title={sidebarCollapsed ? '退出登录' : undefined}
          >
            <LogOut className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
            {!sidebarCollapsed && '退出登录'}
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="admin-main-content transition-all duration-300">
        {/* 顶部栏 */}
        <header className="bg-card border-b">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-4 ml-auto">
              <div className="text-sm text-muted-foreground font-mono">
                {currentTime.toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
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
