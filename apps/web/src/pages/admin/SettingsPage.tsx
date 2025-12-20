import React, { useEffect, useState, useRef } from 'react'
import { Globe, Share2, Save, FileText, Upload, User } from 'lucide-react'
import { Button, Input } from '@whispers/ui'
import { api } from '@whispers/utils'

interface SiteConfig {
  siteName: string
  siteDescription: string
  aboutMe: string
  avatar: string
  socialLinks: {
    github: string
    twitter: string
    email: string
  }
}

const defaultConfig: SiteConfig = {
  siteName: 'Whispers of the Heart',
  siteDescription: '',
  aboutMe: '',
  avatar: '',
  socialLinks: {
    github: '',
    twitter: '',
    email: '',
  },
}

const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await api.get('/site-config')
      if (response.data) {
        setConfig({
          ...defaultConfig,
          ...response.data,
          socialLinks: {
            ...defaultConfig.socialLinks,
            ...(response.data.socialLinks || {}),
          },
        })
      }
    } catch (err) {
      console.error('Failed to fetch site config:', err)
      setError('获取站点配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      await api.put('/admin/site-config', config)
      setSuccess('保存成功')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save site config:', err)
      setError('保存配置失败')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateSocialLink = (platform: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data?.success && response.data?.data?.url) {
        setConfig((prev) => ({ ...prev, avatar: response.data.data.url }))
        setSuccess('头像上传成功')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError('上传失败')
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      setError('上传头像失败')
    } finally {
      setUploading(false)
      // 清空 input 以便可以再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">站点配置</h1>
          <p className="text-muted-foreground mt-1">管理博客的基本信息</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '保存中...' : '保存配置'}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg">{success}</div>
      )}

      {/* 基本信息 */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Globe className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-foreground">基本信息</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              站点名称
            </label>
            <Input
              value={config.siteName}
              onChange={(e) => updateConfig('siteName', e.target.value)}
              placeholder="我的博客"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              站点描述
            </label>
            <Input
              value={config.siteDescription}
              onChange={(e) => updateConfig('siteDescription', e.target.value)}
              placeholder="记录生活的点滴..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              头像
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {config.avatar ? (
                  <img
                    src={config.avatar}
                    alt="头像"
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? '上传中...' : '上传头像'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  支持 JPG、PNG、GIF，最大 5MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 关于我 */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-foreground">关于我</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            个人介绍
          </label>
          <textarea
            value={config.aboutMe}
            onChange={(e) => updateConfig('aboutMe', e.target.value)}
            placeholder="介绍一下你自己..."
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px]"
          />
        </div>
      </div>

      {/* 社交链接 */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Share2 className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-foreground">社交链接</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              GitHub
            </label>
            <Input
              value={config.socialLinks.github}
              onChange={(e) => updateSocialLink('github', e.target.value)}
              placeholder="https://github.com/username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Twitter / X
            </label>
            <Input
              value={config.socialLinks.twitter}
              onChange={(e) => updateSocialLink('twitter', e.target.value)}
              placeholder="https://twitter.com/username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              邮箱
            </label>
            <Input
              type="email"
              value={config.socialLinks.email}
              onChange={(e) => updateSocialLink('email', e.target.value)}
              placeholder="your@email.com"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
