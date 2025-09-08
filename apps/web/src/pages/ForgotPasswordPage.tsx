import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@whispers/utils'

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 表单验证
    if (!email.trim()) {
      setError('请输入邮箱地址')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    try {
      setLoading(true)
      
      const response = await api.post('/auth/forgot-password', { email })

      if (response.data?.success) {
        setSuccess(true)
      } else {
        setError(response.data?.message || '发送重置邮件失败，请重试')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('网络错误，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (error) setError('')
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              邮件已发送
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              我们已向 <span className="font-medium">{email}</span> 发送了密码重置邮件
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  请检查您的邮箱，点击邮件中的链接重置密码。
                </p>
                <p className="text-xs text-gray-500">
                  如果没有收到邮件，请检查垃圾邮件文件夹，或稍后重试。
                </p>
                
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setSuccess(false)
                      setEmail('')
                    }}
                    className="w-full"
                  >
                    重新发送
                  </Button>
                  
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      返回登录
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回首页
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            忘记密码
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            输入您的邮箱地址，我们将发送密码重置链接
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">重置密码</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 邮箱 */}
              <div>
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>邮箱地址</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="请输入您的邮箱地址"
                  required
                  className="mt-1"
                />
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? '发送中...' : '发送重置邮件'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 返回登录 */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            记起密码了？
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80 ml-1"
            >
              立即登录
            </Link>
          </p>
          
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
