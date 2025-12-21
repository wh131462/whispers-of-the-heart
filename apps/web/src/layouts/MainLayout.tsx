import React, { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  FileText,
  User,
  Search,
  Menu,
  LogIn,
  LogOut,
  Settings,
  ChevronDown,
  Edit3,
  Bookmark,
  Sun,
  Moon
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAuthStore } from '../stores/useAuthStore'
import { useTheme, useHitokoto } from '../stores/useGlobalStore'
import { DEFAULT_AVATAR } from '../constants/images'
import SearchDialog from '../components/SearchDialog'
import { api } from '@whispers/utils'
import logoImg from '../assets/logo.png'

interface SiteConfig {
  siteName: string
  siteDescription?: string | null
  siteLogo?: string | null
  ownerName?: string | null
  ownerAvatar?: string | null
  contactEmail?: string | null
  socialLinks?: {
    github?: string | null
    twitter?: string | null
    linkedin?: string | null
  } | null
}

const MainLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const { hitokoto, fetchHitokoto } = useHitokoto()

  const userMenuRef = useRef<HTMLDivElement>(null)

  // 检查是否在首页
  const isHomePage = location.pathname === '/'
  
  const navigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '文章', href: '/posts', icon: FileText },
    { name: '关于', href: '/about', icon: User },
  ]

  useEffect(() => {
    fetchSiteConfig()
    fetchHitokoto() // 使用全局缓存的 hitokoto

    // 初始化主题
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setTheme('system')
    }
  }, [fetchHitokoto, setTheme])

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    if (isHomePage) {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    } else {
      setIsScrolled(true) // 非首页时始终显示背景
    }
  }, [isHomePage])

  // 监听窗口大小变化，当切换到桌面端时关闭移动菜单
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 点击外部区域关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const fetchSiteConfig = async () => {
    try {
      const response = await api.get('/site-config')
      if (response.data?.success && response.data?.data) {
        setSiteConfig(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch site config:', error)
    }
  }

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchDialog(true)
      }
      // Esc 关闭搜索
      if (e.key === 'Escape') {
        setShowSearchDialog(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isHomePage && !isScrolled 
          ? 'border-b-0 bg-transparent' 
          : 'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src={siteConfig?.siteLogo || logoImg}
                  alt={siteConfig?.siteName || 'Whispers'}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className={`text-xl font-bold transition-colors ${
                  isHomePage && !isScrolled ? 'text-foreground' : 'text-primary'
                }`}>
                  {siteConfig?.siteName || 'Whispers'}
                </span>
              </Link>
            </div>

            {/* 桌面端导航 */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isHomePage && !isScrolled
                          ? 'text-foreground/80 hover:text-foreground hover:bg-foreground/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* 右侧操作区 */}
            <div className="flex items-center space-x-2">
              {/* 主题切换按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={isHomePage && !isScrolled ? 'text-foreground hover:bg-foreground/10' : ''}
                title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              >
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              {/* 搜索功能 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearchDialog(true)}
                className={isHomePage && !isScrolled ? 'text-foreground hover:bg-foreground/10' : ''}
                title="搜索 (⌘K)"
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* 用户头像/登录 */}
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-2 p-2 ${
                      isHomePage && !isScrolled ? 'text-foreground hover:bg-foreground/10' : ''
                    }`}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <img
                      src={user.avatar || DEFAULT_AVATAR}
                      alt={user.username}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.png'
                      }}
                    />
                    <span className="hidden sm:block text-sm font-medium">
                      {user.username}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  {/* 用户菜单 */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 z-50 border border-border">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        个人资料
                      </Link>
                      <Link
                        to="/favorites"
                        className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        我的收藏
                      </Link>
                      {user?.isAdmin && (
                        <>
                          <div className="border-t border-border" />
                          <Link
                            to="/admin/posts/new"
                            className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            写博客
                          </Link>
                          <Link
                            to="/admin/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            管理后台
                          </Link>
                        </>
                      )}
                      <div className="border-t border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login">
                  <Button
                    variant={isHomePage && !isScrolled ? 'ghost' : 'outline'}
                    className={`flex items-center space-x-2 ${
                      isHomePage && !isScrolled
                        ? 'text-foreground/90 hover:text-foreground hover:bg-foreground/10 border border-foreground/30'
                        : ''
                    }`}
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:block">登录</span>
                  </Button>
                </Link>
              )}
              
              {/* 移动端菜单按钮 - 仅在移动端显示 */}
              <Button
                variant="ghost"
                size="icon"
                className={`flex md:!hidden ${
                  isHomePage && !isScrolled ? 'text-foreground hover:bg-foreground/10' : ''
                }`}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 移动端菜单 - 仅在移动端显示 */}
          {showMobileMenu && (
            <div className={`block md:!hidden py-4 ${
              isHomePage && !isScrolled ? 'border-t border-foreground/20' : 'border-t'
            }`}>
              <nav className="flex flex-col space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isHomePage && !isScrolled
                            ? 'text-foreground/80 hover:text-foreground hover:bg-foreground/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <main className={isHomePage ? '' : 'container mx-auto px-4 py-8'}>
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer className="border-t bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-2 italic">
              "{hitokoto?.hitokoto || '生活不止眼前的代码，还有诗和远方。'}"
            </p>
            <p className="text-muted-foreground text-xs mb-4">
              —— {hitokoto?.from || '佚名'}
            </p>
            <p className="text-muted-foreground text-xs">
              &copy; 2024 {siteConfig?.siteName || 'Whispers of the Heart'}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 搜索对话框 */}
      <SearchDialog 
        isOpen={showSearchDialog} 
        onClose={() => setShowSearchDialog(false)} 
      />
    </div>
  )
}

export default MainLayout
