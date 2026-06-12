import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  Moon,
  LayoutGrid,
  Rss,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../stores/useAuthStore';
import { useTheme, useHitokoto } from '../stores/useGlobalStore';
import { DEFAULT_AVATAR } from '../constants/images';
import SearchDialog from '../components/SearchDialog';
import FeedbackDialog from '../components/FeedbackDialog';
import { api, getMediaUrl } from '@whispers/utils';
import logoImg from '../assets/logo.png';

// 社会主义核心价值观文字列表（穿插可爱符号）
const CORE_VALUES = [
  '富强',
  '⭐',
  '民主',
  '❄️',
  '文明',
  '✨',
  '和谐',
  '🌸',
  '自由',
  '💫',
  '平等',
  '🌟',
  '公正',
  '❀',
  '法治',
  '☘️',
  '爱国',
  '🍀',
  '敬业',
  '♡',
  '诚信',
  '✿',
  '友善',
  '🌙',
];

interface SiteConfig {
  siteName: string;
  siteDescription?: string | null;
  siteLogo?: string | null;
  ownerName?: string | null;
  ownerAvatar?: string | null;
  contactEmail?: string | null;
  socialLinks?: {
    github?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
  } | null;
}

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { hitokoto, fetchHitokoto } = useHitokoto();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const valueIndexRef = useRef(0);

  // 检查是否在首页
  const isHomePage = location.pathname === '/';

  const navigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '文章', href: '/posts', icon: FileText },
    { name: '关于', href: '/about', icon: User },
  ];

  useEffect(() => {
    fetchSiteConfig();
    fetchHitokoto(); // 使用全局缓存的 hitokoto

    // 初始化主题
    const savedTheme = localStorage.getItem('theme') as
      | 'light'
      | 'dark'
      | 'system'
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('system');
    }
  }, [fetchHitokoto, setTheme]);

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    if (isHomePage) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      setIsScrolled(true); // 非首页时始终显示背景
    }
  }, [isHomePage]);

  // 监听窗口大小变化，当切换到桌面端时关闭移动菜单
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 点击外部区域关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const rssUrl = (() => {
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    const base = (apiUrl || 'https://api.131462.wang')
      .replace(/\/+$/, '')
      .replace(/\/api\/v1$/, '');
    return `${base}/rss.xml`;
  })();

  const fetchSiteConfig = async () => {
    try {
      const response = await api.get('/site-config');
      if (response.data?.success && response.data?.data) {
        setSiteConfig(response.data.data);
      }
    } catch {
      // 获取站点配置失败时静默处理
    }
  };

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchDialog(true);
      }
      // Esc 关闭搜索
      if (e.key === 'Escape') {
        setShowSearchDialog(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  // 全局点击冒泡文字动画
  const createBubbleText = useCallback((e: MouseEvent) => {
    // 获取当前文字并更新索引
    const text = CORE_VALUES[valueIndexRef.current];
    valueIndexRef.current = (valueIndexRef.current + 1) % CORE_VALUES.length;

    // 创建冒泡文字元素
    const bubble = document.createElement('span');
    bubble.textContent = text;
    const hue = Math.random() * 360;
    bubble.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      pointer-events: none;
      user-select: none;
      font-size: 16px;
      font-weight: bold;
      color: hsl(${hue}, 100%, 65%);
      text-shadow: 0 0 1px hsl(${hue}, 100%, 80%), 0 0 2px hsl(${hue}, 100%, 70%);
      z-index: 9999;
      animation: bubble-rise 1s ease-out forwards;
      transform: translateX(-50%);
    `;

    document.body.appendChild(bubble);

    // 动画结束后移除元素
    bubble.addEventListener('animationend', () => {
      bubble.remove();
    });
  }, []);

  // 注入冒泡动画 CSS 并监听全局点击事件
  useEffect(() => {
    // 注入 CSS 动画
    const styleId = 'bubble-rise-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes bubble-rise {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-80px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // 监听全局点击事件
    document.addEventListener('click', createBubbleText);

    return () => {
      document.removeEventListener('click', createBubbleText);
    };
  }, [createBubbleText]);

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isHomePage && !isScrolled
            ? 'border-b-0 bg-transparent'
            : 'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
        }`}
      >
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
                <span
                  className={`text-xl font-bold transition-colors line-clamp-2 ${
                    isHomePage && !isScrolled
                      ? 'text-foreground'
                      : 'text-primary'
                  }`}
                >
                  {siteConfig?.siteName || 'Whispers'}
                </span>
              </Link>
            </div>

            {/* 右侧区域：桌面端导航 + 操作区 */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* 桌面端导航 */}
              <nav className="hidden md:flex items-center space-x-1 mr-4">
                {navigation.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

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
                  );
                })}
              </nav>

              {/* 应用中心入口 - 移动端隐藏 */}
              <Link to="/apps" className="hidden sm:!flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className={
                    isHomePage && !isScrolled
                      ? 'text-foreground hover:bg-foreground/10'
                      : ''
                  }
                  title="应用中心"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </Link>

              {/* AI 对话入口 - 移动端隐藏 */}
              <Link to="/chat" className="hidden sm:!flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className={
                    location.pathname.startsWith('/chat')
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                      : isHomePage && !isScrolled
                        ? 'text-foreground hover:bg-foreground/10'
                        : ''
                  }
                  title="AI 对话"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </Link>

              {/* 主题切换按钮 - 移动端隐藏 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`hidden sm:!flex ${
                  isHomePage && !isScrolled
                    ? 'text-foreground hover:bg-foreground/10'
                    : ''
                }`}
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
                className={
                  isHomePage && !isScrolled
                    ? 'text-foreground hover:bg-foreground/10'
                    : ''
                }
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
                      isHomePage && !isScrolled
                        ? 'text-foreground hover:bg-foreground/10'
                        : ''
                    }`}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <img
                      src={getMediaUrl(user.avatar) || DEFAULT_AVATAR}
                      alt={user.username}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={e => {
                        e.currentTarget.src = DEFAULT_AVATAR;
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
                  isHomePage && !isScrolled
                    ? 'text-foreground hover:bg-foreground/10'
                    : ''
                }`}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 移动端菜单 - 浮动下拉，不影响布局 */}
          {showMobileMenu && (
            <div className="absolute top-full left-0 right-0 md:!hidden bg-background/95 backdrop-blur border-b shadow-lg z-50">
              <nav className="flex flex-col p-4 space-y-1">
                {navigation.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* 分隔线 */}
                <div className="my-2 border-t" />

                {/* AI 对话 */}
                <Link
                  to="/chat"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/chat')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>AI 对话</span>
                </Link>

                {/* 应用中心 */}
                <Link
                  to="/apps"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/apps'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>应用中心</span>
                </Link>

                {/* 主题切换 */}
                <button
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    setShowMobileMenu(false);
                  }}
                >
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span>{theme === 'dark' ? '深色模式' : '浅色模式'}</span>
                </button>
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
              &quot;{hitokoto?.hitokoto || '生活不止眼前的代码，还有诗和远方。'}
              &quot;
            </p>
            <p className="text-muted-foreground text-xs mb-4">
              —— {hitokoto?.from || '佚名'}
            </p>
            <p className="text-muted-foreground text-xs">
              &copy; 2022
              {new Date().getFullYear() > 2022
                ? `-${new Date().getFullYear()}`
                : ''}{' '}
              {siteConfig?.siteName || 'Whispers of the Heart'}. All rights
              reserved.
              <span className="mx-2">|</span>
              <button
                onClick={() => setShowFeedbackDialog(true)}
                className="hover:text-foreground transition-colors"
              >
                Feedback
              </button>
              <span className="mx-2">|</span>
              <a
                href={rssUrl}
                target="_blank"
                rel="noopener"
                aria-label="RSS"
                title="RSS 订阅"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors align-middle"
              >
                <Rss className="h-3.5 w-3.5" />
                <span>RSS</span>
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* 搜索对话框 */}
      <SearchDialog
        isOpen={showSearchDialog}
        onClose={() => setShowSearchDialog(false)}
      />

      {/* 反馈对话框 */}
      <FeedbackDialog
        isOpen={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
      />
    </div>
  );
};

export default MainLayout;
