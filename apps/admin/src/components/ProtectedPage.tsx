import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

interface ProtectedPageProps {
  children: React.ReactNode
  requiredRole?: string
}

const ProtectedPage: React.FC<ProtectedPageProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // 如果未认证，重定向到登录页面
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true })
      return
    }

    // 如果指定了角色要求，检查用户角色
    if (requiredRole && user?.role !== requiredRole) {
      // 角色不匹配，可以显示错误或重定向
      console.warn(`Access denied: Required role ${requiredRole}, but user has role ${user?.role}`)
      // 可以选择重定向到无权限页面或登出
      logout()
      navigate('/admin/login', { replace: true })
      return
    }
  }, [isAuthenticated, user, requiredRole, navigate, logout])

  // 如果未认证，不渲染任何内容（会重定向）
  if (!isAuthenticated) {
    return null
  }

  // 如果角色不匹配，不渲染任何内容（会重定向）
  if (requiredRole && user?.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}

export default ProtectedPage
