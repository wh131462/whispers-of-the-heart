import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { useAuthStore } from '../stores/useAuthStore'
import { User, Mail, Calendar, Edit, Save, X, Upload, Loader2, CheckCircle } from 'lucide-react'
import { DEFAULT_AVATAR } from '../constants/images'
import { api } from '@whispers/utils'

// 更换邮箱步骤
type EmailChangeStep = 'idle' | 'input' | 'verify' | 'success'

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  })

  // 更换邮箱相关状态
  const [emailChangeStep, setEmailChangeStep] = useState<EmailChangeStep>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const handleSave = async () => {
    if (!user) return
    try {
      // 这里应该调用 API 更新用户信息
      // await updateUserProfile(formData)
      updateUser({ ...user, ...formData })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    })
    setIsEditing(false)
    setAvatarError(false)
  }

  const handleAvatarError = () => {
    setAvatarError(true)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setUploadError('请选择图片文件')
      return
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('图片大小不能超过 5MB')
      return
    }

    try {
      setUploading(true)
      setUploadError(null)

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await api.post('/media/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data?.success && response.data?.data?.url) {
        setFormData((prev) => ({ ...prev, avatar: response.data.data.url }))
        setAvatarError(false)
      } else {
        setUploadError('上传失败')
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      setUploadError('上传头像失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getAvatarSrc = () => {
    if (avatarError || !formData.avatar) {
      return DEFAULT_AVATAR
    }
    return formData.avatar
  }

  // 开始更换邮箱流程
  const handleStartEmailChange = () => {
    setEmailChangeStep('input')
    setNewEmail('')
    setVerifyCode('')
    setEmailError(null)
  }

  // 取消更换邮箱
  const handleCancelEmailChange = () => {
    setEmailChangeStep('idle')
    setNewEmail('')
    setVerifyCode('')
    setEmailError(null)
  }

  // 验证邮箱格式
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // 发送验证码
  const handleSendVerifyCode = async () => {
    if (!newEmail) {
      setEmailError('请输入新邮箱地址')
      return
    }

    if (!isValidEmail(newEmail)) {
      setEmailError('请输入有效的邮箱地址')
      return
    }

    if (newEmail === user?.email) {
      setEmailError('新邮箱不能与当前邮箱相同')
      return
    }

    try {
      setEmailLoading(true)
      setEmailError(null)

      const response = await api.post('/user/send-email-change-code', { newEmail })

      if (response.data?.success) {
        setEmailChangeStep('verify')
        // 开始倒计时 60 秒
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setEmailError(response.data?.message || '发送验证码失败')
      }
    } catch (err: unknown) {
      console.error('Failed to send verify code:', err)
      const error = err as { response?: { data?: { message?: string } } }
      setEmailError(error.response?.data?.message || '发送验证码失败，请稍后重试')
    } finally {
      setEmailLoading(false)
    }
  }

  // 确认更换邮箱
  const handleConfirmEmailChange = async () => {
    if (!verifyCode) {
      setEmailError('请输入验证码')
      return
    }

    if (verifyCode.length !== 6) {
      setEmailError('验证码应为6位数字')
      return
    }

    try {
      setEmailLoading(true)
      setEmailError(null)

      const response = await api.post('/user/change-email', {
        newEmail,
        code: verifyCode
      })

      if (response.data?.success && user) {
        // 更新本地用户信息
        updateUser({ ...user, email: newEmail } as typeof user)
        setEmailChangeStep('success')
        // 3秒后关闭
        setTimeout(() => {
          setEmailChangeStep('idle')
        }, 3000)
      } else {
        setEmailError(response.data?.message || '更换邮箱失败')
      }
    } catch (err: unknown) {
      console.error('Failed to change email:', err)
      const error = err as { response?: { data?: { message?: string } } }
      setEmailError(error.response?.data?.message || '更换邮箱失败，请稍后重试')
    } finally {
      setEmailLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">请先登录</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面头部 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">个人资料</h1>
        <p className="text-lg text-muted-foreground">管理您的个人信息和账户设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 头像和基本信息 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>基本信息</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 头像 */}
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={getAvatarSrc()}
                    alt={user.username}
                    className="h-32 w-32 rounded-full object-cover border-4 border-border"
                    onError={handleAvatarError}
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                  {isEditing && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="profile-avatar-upload"
                      />
                      <Button
                        size="icon"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                {uploadError && (
                  <p className="text-sm text-destructive mt-2">{uploadError}</p>
                )}
              </div>

              {/* 用户信息 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>注册时间: {new Date().toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>详细信息</CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>编辑</span>
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>取消</span>
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>保存</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 用户名 */}
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                {isEditing ? (
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="请输入用户名"
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formData.username || '未设置'}
                  </div>
                )}
              </div>

              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>

                {emailChangeStep === 'idle' && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-md text-muted-foreground">
                      {user.email || '未设置'}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEmailChange}
                    >
                      更换邮箱
                    </Button>
                  </div>
                )}

                {emailChangeStep === 'input' && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      当前邮箱：<span className="text-foreground">{user.email}</span>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">新邮箱地址</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="请输入新邮箱地址"
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSendVerifyCode}
                        disabled={emailLoading}
                      >
                        {emailLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            发送中...
                          </>
                        ) : (
                          '发送验证码'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleCancelEmailChange}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                )}

                {emailChangeStep === 'verify' && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      验证码已发送至：<span className="text-foreground">{newEmail}</span>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="verifyCode">验证码</Label>
                      <Input
                        id="verifyCode"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="请输入6位验证码"
                        maxLength={6}
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleConfirmEmailChange}
                        disabled={emailLoading}
                      >
                        {emailLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            验证中...
                          </>
                        ) : (
                          '确认更换'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSendVerifyCode}
                        disabled={countdown > 0 || emailLoading}
                      >
                        {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleCancelEmailChange}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                )}

                {emailChangeStep === 'success' && (
                  <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>邮箱更换成功！</span>
                  </div>
                )}
              </div>

              {/* 个人简介 */}
              <div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="介绍一下自己..."
                    rows={4}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md min-h-[100px]">
                    {formData.bio || '这个人很懒，什么都没有留下...'}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
