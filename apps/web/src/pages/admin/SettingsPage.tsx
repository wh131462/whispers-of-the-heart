import React, { useEffect, useState, useRef } from 'react'
import { Globe, Share2, Save, Upload, User, X, MessageSquare, Plus, Shield } from 'lucide-react'
import { Button, Input } from '@whispers/ui'
import { api } from '@whispers/utils'
import logoImg from '../../assets/logo.png'

interface SiteConfig {
  siteName: string
  siteDescription: string
  siteLogo: string
  ownerName: string
  ownerAvatar: string
  contactEmail: string
  socialLinks: {
    github: string
    twitter: string
    linkedin: string
  }
  commentSettings: {
    autoModeration: boolean
    bannedWords: string[]
  }
}

const defaultConfig: SiteConfig = {
  siteName: 'Whispers of the Heart',
  siteDescription: '',
  siteLogo: '',
  ownerName: '',
  ownerAvatar: '',
  contactEmail: '',
  socialLinks: {
    github: '',
    twitter: '',
    linkedin: '',
  },
  commentSettings: {
    autoModeration: true,
    bannedWords: [],
  },
}

const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingOwnerAvatar, setUploadingOwnerAvatar] = useState(false)
  const [newBannedWord, setNewBannedWord] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ownerAvatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await api.get('/site-config')
      if (response.data?.success && response.data?.data) {
        const configData = response.data.data
        setConfig({
          ...defaultConfig,
          ...configData,
          socialLinks: {
            ...defaultConfig.socialLinks,
            ...(configData.socialLinks || {}),
          },
          commentSettings: {
            ...defaultConfig.commentSettings,
            ...(configData.commentSettings || {}),
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

  const toggleAutoModeration = () => {
    setConfig((prev) => ({
      ...prev,
      commentSettings: {
        ...prev.commentSettings,
        autoModeration: !prev.commentSettings.autoModeration,
      },
    }))
  }

  const addBannedWord = () => {
    const word = newBannedWord.trim()
    if (!word) return
    if (config.commentSettings.bannedWords.includes(word)) {
      setError('该违禁词已存在')
      setTimeout(() => setError(null), 2000)
      return
    }
    setConfig((prev) => ({
      ...prev,
      commentSettings: {
        ...prev.commentSettings,
        bannedWords: [...prev.commentSettings.bannedWords, word],
      },
    }))
    setNewBannedWord('')
  }

  const removeBannedWord = (word: string) => {
    setConfig((prev) => ({
      ...prev,
      commentSettings: {
        ...prev.commentSettings,
        bannedWords: prev.commentSettings.bannedWords.filter((w) => w !== word),
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
        setConfig((prev) => ({ ...prev, siteLogo: response.data.data.url }))
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

  const handleOwnerAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadingOwnerAvatar(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data?.success && response.data?.data?.url) {
        setConfig((prev) => ({ ...prev, ownerAvatar: response.data.data.url }))
        setSuccess('博主头像上传成功')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError('上传失败')
      }
    } catch (err) {
      console.error('Failed to upload owner avatar:', err)
      setError('上传博主头像失败')
    } finally {
      setUploadingOwnerAvatar(false)
      // 清空 input 以便可以再次选择同一文件
      if (ownerAvatarInputRef.current) {
        ownerAvatarInputRef.current.value = ''
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
              网站 Logo
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              用于导航栏左上角显示，清除后将使用默认 Logo
            </p>
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={config.siteLogo || logoImg}
                  alt="网站 Logo"
                  className="h-20 w-20 rounded-full object-cover border-2 border-border"
                  onError={(e) => {
                    e.currentTarget.src = logoImg
                  }}
                />
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}
                {config.siteLogo && (
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, siteLogo: '' }))}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    title="清除 Logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? '上传中...' : '上传 Logo'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  支持 JPG、PNG、GIF，最大 5MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 博主信息 */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-foreground">博主信息</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          用于首页 Banner 区域展示
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              博主名称
            </label>
            <Input
              value={config.ownerName}
              onChange={(e) => updateConfig('ownerName', e.target.value)}
              placeholder="你的名字或昵称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              博主头像
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {config.ownerAvatar ? (
                  <>
                    <img
                      src={config.ownerAvatar}
                      alt="博主头像"
                      className="h-20 w-20 rounded-full object-cover border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, ownerAvatar: '' }))}
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                      title="清除头像"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {uploadingOwnerAvatar && (
                  <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={ownerAvatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleOwnerAvatarUpload}
                  className="hidden"
                  id="owner-avatar-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ownerAvatarInputRef.current?.click()}
                  disabled={uploadingOwnerAvatar}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingOwnerAvatar ? '上传中...' : '上传头像'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  支持 JPG、PNG、GIF，最大 5MB
                </p>
              </div>
            </div>
          </div>
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
              联系邮箱
            </label>
            <Input
              type="email"
              value={config.contactEmail}
              onChange={(e) => updateConfig('contactEmail', e.target.value)}
              placeholder="your@email.com"
            />
          </div>
        </div>
      </div>

      {/* 评论设置 */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <MessageSquare className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-foreground">评论设置</h2>
        </div>
        <div className="space-y-6">
          {/* 自动审核开关 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <label className="block text-sm font-medium text-foreground">
                  自动内容审核
                </label>
                <p className="text-xs text-muted-foreground">
                  开启后，系统会自动检测评论内容，包含敏感词或垃圾信息的评论将被标记为待审核
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleAutoModeration}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                config.commentSettings.autoModeration ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  config.commentSettings.autoModeration ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 违禁词管理 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              自定义违禁词
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              添加自定义违禁词，包含这些词汇的评论将被标记为待审核（系统已内置常见敏感词）
            </p>
            <div className="flex gap-2 mb-3">
              <Input
                value={newBannedWord}
                onChange={(e) => setNewBannedWord(e.target.value)}
                placeholder="输入违禁词..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addBannedWord()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addBannedWord}
                disabled={!newBannedWord.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </div>
            {config.commentSettings.bannedWords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {config.commentSettings.bannedWords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm"
                  >
                    {word}
                    <button
                      type="button"
                      onClick={() => removeBannedWord(word)}
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                暂无自定义违禁词
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
