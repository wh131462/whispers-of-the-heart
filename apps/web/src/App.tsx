import { useEffect, lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminGuard from './components/AdminGuard';
import HomePage from './pages/HomePage';
import PostsPage from './pages/PostsPage';
import PostDetailPage from './pages/PostDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import { ToastProvider } from './contexts/ToastContext';
import { apiUtils } from '@whispers/utils';
import { useGlobalStore } from './stores/useGlobalStore';
import { useAuthStore } from './stores/useAuthStore';
import './i18n/config';
import './index.css';
import AboutPage from './pages/AboutPage';
import AppsPage from './pages/apps/AppsPage';
import AppDetailPage from './pages/apps/AppDetailPage';

// Admin pages (lazy loaded)
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AdminPostsPage = lazy(() => import('./pages/admin/PostManagementPage'));
const AdminPostEditPage = lazy(() => import('./pages/admin/PostEditPage'));
const AdminTagsPage = lazy(() => import('./pages/admin/TagManagementPage'));
const AdminCommentsPage = lazy(
  () => import('./pages/admin/CommentManagementPage')
);
const AdminMediaPage = lazy(() => import('./pages/admin/MediaPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminFeedbackPage = lazy(() => import('./pages/admin/FeedbackPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const AdminMailPage = lazy(() => import('./pages/admin/MailPage'));

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const setError = useGlobalStore(state => state.setError);
  const _hasHydrated = useAuthStore(state => state._hasHydrated);

  // 初始化 API 客户端 - 等待 hydration 完成后再初始化
  useEffect(() => {
    // 设置全局错误处理器
    apiUtils.setErrorHandler((error, _status) => {
      setError(error);
    });
  }, [setError]);

  // 在 hydration 完成后初始化 API 客户端
  useEffect(() => {
    if (_hasHydrated) {
      // hydration 完成后，token 已经被 onRehydrateStorage 设置到 localStorage
      apiUtils.initialize('auth_token');
    }
  }, [_hasHydrated]);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* 认证相关页面 - 独立页面，不使用主布局 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* 管理后台路由 */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboardPage />
                </Suspense>
              }
            />
            {/* 文章管理 */}
            <Route
              path="posts"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminPostsPage />
                </Suspense>
              }
            />
            <Route
              path="posts/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminPostEditPage />
                </Suspense>
              }
            />
            <Route
              path="posts/edit/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminPostEditPage />
                </Suspense>
              }
            />
            {/* 标签管理 */}
            <Route
              path="tags"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminTagsPage />
                </Suspense>
              }
            />
            {/* 评论管理 */}
            <Route
              path="comments"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminCommentsPage />
                </Suspense>
              }
            />
            {/* 媒体库 */}
            <Route
              path="media"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminMediaPage />
                </Suspense>
              }
            />
            {/* 反馈管理 */}
            <Route
              path="feedback"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminFeedbackPage />
                </Suspense>
              }
            />
            {/* 用户管理 */}
            <Route
              path="users"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminUsersPage />
                </Suspense>
              }
            />
            {/* 邮件管理 */}
            <Route
              path="mail"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminMailPage />
                </Suspense>
              }
            />
            {/* 站点配置 */}
            <Route
              path="settings"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminSettingsPage />
                </Suspense>
              }
            />
          </Route>

          {/* 主布局页面 */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="posts/:slug" element={<PostDetailPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="apps" element={<AppsPage />} />
            <Route path="apps/:appId" element={<AppDetailPage />} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
