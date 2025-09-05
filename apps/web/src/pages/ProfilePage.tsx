import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { useAuthStore } from '../stores/useAuthStore'
import { User, Mail, Calendar, Edit, Save, X, Camera } from 'lucide-react'
import { DEFAULT_AVATAR } from '../constants/images'

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  })

  const handleSave = async () => {
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
      email: user?.email || '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    })
    setIsEditing(false)
    setAvatarError(false)
  }

  const handleAvatarError = () => {
    setAvatarError(true)
  }

  const getAvatarSrc = () => {
    if (avatarError || !formData.avatar) {
      return DEFAULT_AVATAR
    }
    return formData.avatar
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">请先登录</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面头部 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">个人资料</h1>
        <p className="text-lg text-gray-600">管理您的个人信息和账户设置</p>
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
                    className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                    onError={handleAvatarError}
                  />
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* 用户信息 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
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
                  <div className="p-3 bg-gray-50 rounded-md">
                    {formData.username || '未设置'}
                  </div>
                )}
              </div>

              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="请输入邮箱"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    {formData.email || '未设置'}
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
                  <div className="p-3 bg-gray-50 rounded-md min-h-[100px]">
                    {formData.bio || '这个人很懒，什么都没有留下...'}
                  </div>
                )}
              </div>

              {/* 头像URL */}
              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="avatar">头像URL</Label>
                  <Input
                    id="avatar"
                    value={formData.avatar}
                    onChange={(e) => {
                      setFormData({ ...formData, avatar: e.target.value })
                      setAvatarError(false) // 重置错误状态
                    }}
                    placeholder="请输入头像图片URL"
                  />
                  <p className="text-xs text-gray-500">
                    支持 JPG、PNG、GIF 格式，建议尺寸 200x200 像素以上
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
