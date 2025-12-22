import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp'
import { Label } from '../components/ui/label'
import { useAuthStore } from '../stores/useAuthStore'
import { Eye, EyeOff, Mail, User, Lock, ArrowLeft, Loader2, CheckCircle, KeyRound } from 'lucide-react'
import { api } from '@whispers/utils'

type RegisterStep = 'email' | 'verify' | 'complete'

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  // 步骤状态
  const [step, setStep] = useState<RegisterStep>('email')

  // 表单数据
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    code: ''
  })

  // UI 状态
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 发送验证码
  const handleSendCode = async () => {
    setError('')

    if (!formData.email.trim()) {
      setError('请输入邮箱')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/auth/send-register-code', {
        email: formData.email,
      })

      if (response.data?.success) {
        setStep('verify')
        setCountdown(60)
      } else {
        setError(response.data?.message || '发送验证码失败')
      }
    } catch (err: any) {
      console.error('Send code error:', err)
      setError(err.response?.data?.message || '发送验证码失败，请检查邮箱是否已被注册')
    } finally {
      setLoading(false)
    }
  }

  // 重新发送验证码
  const handleResendCode = async () => {
    if (countdown > 0) return
    await handleSendCode()
  }

  // 验证码验证成功后进入完成步骤
  const handleVerifyCode = () => {
    setError('')

    if (!formData.code || formData.code.length < 6) {
      setError('请输入6位验证码')
      return
    }

    setStep('complete')
  }

  // 完成注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username.trim()) {
      setError('请输入用户名')
      return
    }

    if (formData.username.length < 3) {
      setError('用户名至少需要3个字符')
      return
    }

    if (formData.password.length < 6) {
      setError('密码至少需要6位字符')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    try {
      setLoading(true)

      const response = await api.post('/auth/register-with-code', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        code: formData.code,
      })

      if (response.data?.success) {
        // 注册成功后自动登录
        await login(formData.email, formData.password)
        navigate('/')
      } else {
        setError(response.data?.message || '注册失败，请重试')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.response?.data?.message || '注册失败，请检查验证码是否正确')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  // 返回上一步
  const handleBack = () => {
    if (step === 'verify') {
      setStep('email')
    } else if (step === 'complete') {
      setStep('verify')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            创建新账户
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            已有账户？
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80 ml-1"
            >
              立即登录
            </Link>
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${step === 'email' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'email' ? 'bg-primary text-primary-foreground' :
              step === 'verify' || step === 'complete' ? 'bg-green-500 text-white' : 'bg-muted'
            }`}>
              {step === 'verify' || step === 'complete' ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="ml-2 text-sm hidden sm:inline">验证邮箱</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center ${step === 'verify' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'verify' ? 'bg-primary text-primary-foreground' :
              step === 'complete' ? 'bg-green-500 text-white' : 'bg-muted'
            }`}>
              {step === 'complete' ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span className="ml-2 text-sm hidden sm:inline">输入验证码</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center ${step === 'complete' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm hidden sm:inline">完成注册</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {step === 'email' && '验证邮箱'}
              {step === 'verify' && '输入验证码'}
              {step === 'complete' && '完善信息'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 'email' && '我们需要验证您的邮箱地址'}
              {step === 'verify' && `验证码已发送至 ${formData.email}`}
              {step === 'complete' && '设置您的用户名和密码'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 步骤 1: 输入邮箱 */}
            {step === 'email' && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>邮箱</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="请输入邮箱地址"
                    required
                    className="mt-1"
                  />
                </div>

                {error && (
                  <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      发送中...
                    </>
                  ) : (
                    '发送验证码'
                  )}
                </Button>
              </div>
            )}

            {/* 步骤 2: 输入验证码 */}
            {step === 'verify' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="flex items-center space-x-2 justify-center">
                    <KeyRound className="h-4 w-4" />
                    <span>验证码</span>
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={formData.code}
                      onChange={(value) => handleInputChange('code', value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  {countdown > 0 ? (
                    <span>{countdown}秒后可重新发送</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-primary hover:underline"
                      disabled={loading}
                    >
                      重新发送验证码
                    </button>
                  )}
                </div>

                {error && (
                  <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleBack}
                  >
                    返回
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleVerifyCode}
                    disabled={formData.code.length < 6}
                  >
                    下一步
                  </Button>
                </div>
              </div>
            )}

            {/* 步骤 3: 完成注册 */}
            {step === 'complete' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 用户名 */}
                <div>
                  <Label htmlFor="username" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>用户名</span>
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="请输入用户名（至少3个字符）"
                    required
                    className="mt-1"
                  />
                </div>

                {/* 密码 */}
                <div>
                  <Label htmlFor="password" className="flex items-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>密码</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="请输入密码（至少6位）"
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* 确认密码 */}
                <div>
                  <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>确认密码</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="请再次输入密码"
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleBack}
                  >
                    返回
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        注册中...
                      </>
                    ) : (
                      '完成注册'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* 返回首页 */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
