import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

interface AdminGuardProps {
  children: React.ReactNode
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { isAuthenticated, user, validateToken, logout, accessToken, _hasHydrated, setHasHydrated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const location = useLocation()

  // 备用机制：如果 hydration 在 100ms 内没有完成，手动触发
  useEffect(() => {
    if (_hasHydrated) return

    const timer = setTimeout(() => {
      if (!useAuthStore.getState()._hasHydrated) {
        setHasHydrated(true)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [_hasHydrated, setHasHydrated])

  useEffect(() => {
    // 必须等待 hydration 完成后再检查认证
    if (!_hasHydrated) return

    const checkAuth = async () => {
      try {
        // 如果有 token，验证其有效性
        if (accessToken) {
          const isValid = await validateToken()
          if (!isValid) {
            // token无效，清除认证状态
            logout()
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        logout()
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
    // 只在 hydration 完成和 accessToken 变化时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, accessToken])

  // 显示加载状态（等待 hydration 或 token 验证）
  if (!_hasHydrated || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">验证登录状态中...</p>
        </div>
      </div>
    )
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 如果不是管理员，重定向到首页
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />
  }

  // 如果已认证且是管理员，渲染子组件
  return <>{children}</>
}

export default AdminGuard
