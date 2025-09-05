import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  FileText, 
  Video, 
  Music, 
  User, 
  Search, 
  Menu, 
  LogIn,
  LogOut,
  Settings,
  ChevronDown,
  Edit3,
  ExternalLink,
  Bookmark
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAuthStore } from '../stores/useAuthStore'
import { DEFAULT_AVATAR } from '../constants/images'
import SearchDialog from '../components/SearchDialog'

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

interface SiteConfig {
  siteName: string
  siteDescription: string
  siteLogo: string
  siteIcon: string
  aboutMe: string
  contactEmail: string
  socialLinks: {
    github: string
    twitter: string
    linkedin: string
  }
  seoSettings: {
    metaTitle: string
    metaDescription: string
    keywords: string
  }
}

const MainLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [hitokoto, setHitokoto] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  
  const { user, isAuthenticated, logout } = useAuthStore()
  
  // 检查是否在首页
  const isHomePage = location.pathname === '/'
  
  const navigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '文章', href: '/posts', icon: FileText },
    { name: '视频', href: '/videos', icon: Video },
    { name: '音频', href: '/audios', icon: Music },
    { name: '关于', href: '/about', icon: User },
  ]

  useEffect(() => {
    fetchSiteConfig()
    fetchHitokoto()
  }, [])

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

  const fetchHitokoto = async () => {
    try {
      const response = await fetch('http://localhost:7777/api/v1/hitokoto')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setHitokoto(result.data.hitokoto)
        } else {
          setHitokoto('生活不止眼前的代码，还有诗和远方。')
        }
      } else {
        setHitokoto('生活不止眼前的代码，还有诗和远方。')
      }
    } catch (error) {
      console.error('Failed to fetch hitokoto:', error)
      setHitokoto('生活不止眼前的代码，还有诗和远方。')
    }
  }

  const fetchSiteConfig = async () => {
    try {
      const response = await fetch('http://localhost:7777/api/v1/site-config')
      if (response.ok) {
        const configData = await response.json()
        setSiteConfig(configData)
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
                {siteConfig?.siteLogo ? (
                  <img 
                    src={siteConfig.siteLogo} 
                    alt={siteConfig.siteName} 
                    className="h-8 w-8 rounded-lg"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">
                      {siteConfig?.siteName?.charAt(0) || 'W'}
                    </span>
                  </div>
                )}
                <span className={`text-xl font-bold transition-colors ${
                  isHomePage && !isScrolled ? 'text-white' : 'text-primary'
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
                        ? isHomePage && !isScrolled 
                          ? 'bg-white/20 text-white' 
                          : 'bg-primary text-primary-foreground'
                        : isHomePage && !isScrolled
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
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
            <div className="flex items-center space-x-4">
              {/* 搜索功能 */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSearchDialog(true)}
                className={isHomePage && !isScrolled ? 'text-white hover:bg-white/10' : ''}
                title="搜索 (⌘K)"
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* 用户头像/登录 */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-2 p-2 ${
                      isHomePage && !isScrolled ? 'text-white hover:bg-white/10' : ''
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        个人资料
                      </Link>
                      <Link
                        to="/favorites"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        我的收藏
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        设置
                      </Link>
                      <div className="border-t border-gray-100" />
                      <a
                        href={`${getAdminUrl()}/admin/posts/new`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        <span className="flex-1">写博客</span>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </a>
                      <div className="border-t border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                    variant="outline" 
                    className={`flex items-center space-x-2 ${
                      isHomePage && !isScrolled 
                        ? 'border-white/20 text-white hover:bg-white/10' 
                        : ''
                    }`}
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:block">登录</span>
                  </Button>
                </Link>
              )}
              
              {/* 移动端菜单按钮 */}
              <Button 
                variant="ghost" 
                size="icon" 
                className={`md:hidden ${
                  isHomePage && !isScrolled ? 'text-white hover:bg-white/10' : ''
                }`}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 移动端菜单 */}
          {showMobileMenu && (
            <div className={`md:hidden py-4 ${
              isHomePage && !isScrolled ? 'border-t border-white/20' : 'border-t'
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
                        ? isHomePage && !isScrolled 
                          ? 'bg-white/20 text-white' 
                          : 'bg-primary text-primary-foreground'
                        : isHomePage && !isScrolled
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
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
            <p className="text-muted-foreground text-sm mb-4 italic">
              {hitokoto || '生活不止眼前的代码，还有诗和远方。'}
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
