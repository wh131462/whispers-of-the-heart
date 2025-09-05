import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

interface AuthGuardProps {
  children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, checkWebAuth, validateToken, logout } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 如果admin项目未登录，尝试检查web项目的登录状态
        if (!isAuthenticated) {
          const webAuthSuccess = checkWebAuth()
          if (!webAuthSuccess) {
            setIsChecking(false)
            return
          }
        }

        // 如果已登录，验证token是否有效
        if (isAuthenticated) {
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
  }, [isAuthenticated, checkWebAuth, validateToken, logout])

  // 显示加载状态
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">验证登录状态中...</p>
        </div>
      </div>
    )
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // 如果已认证，渲染子组件
  return <>{children}</>
}

export default AuthGuard
