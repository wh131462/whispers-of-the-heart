import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
// import { Switch } from '../components/ui/switch'
import ProtectedPage from '../components/ProtectedPage'
import { Separator } from '../components/ui/separator'
import { request } from '@whispers/utils'

interface SiteConfig {
  id?: string
  siteName: string
  siteDescription: string
  siteLogo?: string
  siteIcon?: string
  aboutMe: string
  contactEmail: string
  socialLinks: {
    github: string
    twitter: string
    linkedin: string
  }
  seoSettings: {
    metaTitle: string
    metaDescription: string
    keywords: string
  }
  ossConfig: {
    provider: 'local' | 'aliyun' | 'aws' | 'qiniu'
    accessKeyId?: string
    accessKeySecret?: string
    bucket?: string
    region?: string
    endpoint?: string
    cdnDomain?: string
  }
  createdAt?: string
  updatedAt?: string
}

const SiteSettingsPage: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>({
    siteName: 'Whispers of the Heart',
    siteDescription: '专注于分享知识和灵感的平台',
    siteLogo: '',
    siteIcon: '',
    aboutMe: '热爱技术，热爱生活，希望通过文字传递正能量。',
    contactEmail: 'contact@example.com',
    socialLinks: {
      github: 'https://github.com/yourusername',
      twitter: 'https://twitter.com/yourusername',
      linkedin: 'https://linkedin.com/in/yourusername',
    },
    seoSettings: {
      metaTitle: 'Whispers of the Heart - 知识分享平台',
      metaDescription: '专注于分享技术和生活感悟的平台',
      keywords: '技术,生活,感悟,分享,博客',
    },
    ossConfig: {
      provider: 'local',
      accessKeyId: '',
      accessKeySecret: '',
      bucket: '',
      region: '',
      endpoint: '',
      cdnDomain: '',
    },
  })

  // 获取站点配置
  const fetchSiteConfig = async () => {
    try {
      const response = await request<SiteConfig>('/site-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.success && response.data) {
        setConfig(response.data)
      } else {
        console.error('Failed to fetch site config:', response)
      }
    } catch (error) {
      console.error('Error fetching site config:', error)
    }
  }

  // 保存站点配置
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        return
      }

      const response = await request(`/site-config/${config.id || ''}`, {
        method: config.id ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: config
      })

      if (response.success) {
        console.log('站点配置保存成功')
        // 重新获取配置以确保数据同步
        fetchSiteConfig()
      } else {
        console.error('Failed to save site config:', response)
      }
    } catch (error) {
      console.error('Error saving site config:', error)
    }
  }

  useEffect(() => {
    fetchSiteConfig()
  }, [])

  const handleOssProviderChange = (provider: SiteConfig['ossConfig']['provider']) => {
    setConfig(prev => ({
      ...prev,
      ossConfig: { ...prev.ossConfig, provider }
    }))
  }

  return (
    <ProtectedPage>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">站点配置</h1>
        <p className="text-muted-foreground">管理网站的基本信息和系统设置</p>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="seo">SEO 设置</TabsTrigger>
          <TabsTrigger value="oss">文件存储</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">站点名称</Label>
                  <Input
                    id="siteName"
                    value={config.siteName}
                    onChange={(e) => setConfig(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">站点描述</Label>
                  <Input
                    id="siteDescription"
                    value={config.siteDescription}
                    onChange={(e) => setConfig(prev => ({ ...prev, siteDescription: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteLogo">站点 Logo URL</Label>
                  <Input
                    id="siteLogo"
                    value={config.siteLogo}
                    onChange={(e) => setConfig(prev => ({ ...prev, siteLogo: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteIcon">站点图标 URL</Label>
                  <Input
                    id="siteIcon"
                    value={config.siteIcon}
                    onChange={(e) => setConfig(prev => ({ ...prev, siteIcon: e.target.value }))}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aboutMe">关于我</Label>
                <Textarea
                  id="aboutMe"
                  value={config.aboutMe}
                  onChange={(e) => setConfig(prev => ({ ...prev, aboutMe: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">联系邮箱</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={config.contactEmail}
                  onChange={(e) => setConfig(prev => ({ ...prev, contactEmail: e.target.value }))}
                />
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">社交媒体链接</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={config.socialLinks.github}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, github: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={config.socialLinks.twitter}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={config.socialLinks.linkedin}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO 设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">页面标题</Label>
                <Input
                  id="metaTitle"
                  value={config.seoSettings.metaTitle}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    seoSettings: { ...prev.seoSettings, metaTitle: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">页面描述</Label>
                <Textarea
                  id="metaDescription"
                  value={config.seoSettings.metaDescription}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    seoSettings: { ...prev.seoSettings, metaDescription: e.target.value }
                  }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">关键词</Label>
                <Input
                  id="keywords"
                  value={config.seoSettings.keywords}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    seoSettings: { ...prev.seoSettings, keywords: e.target.value }
                  }))}
                  placeholder="用逗号分隔多个关键词"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>文件存储配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>存储提供商</Label>
                <div className="flex space-x-4">
                  {(['local', 'aliyun', 'aws', 'qiniu'] as const).map((provider) => (
                    <label key={provider} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="ossProvider"
                        value={provider}
                        checked={config.ossConfig.provider === provider}
                        onChange={() => handleOssProviderChange(provider)}
                        className="mr-2"
                      />
                      <span className="capitalize">{provider}</span>
                    </label>
                  ))}
                </div>
              </div>

              {config.ossConfig.provider !== 'local' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accessKeyId">Access Key ID</Label>
                      <Input
                        id="accessKeyId"
                        value={config.ossConfig.accessKeyId}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          ossConfig: { ...prev.ossConfig, accessKeyId: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accessKeySecret">Access Key Secret</Label>
                      <Input
                        id="accessKeySecret"
                        type="password"
                        value={config.ossConfig.accessKeySecret}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          ossConfig: { ...prev.ossConfig, accessKeySecret: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bucket">Bucket 名称</Label>
                      <Input
                        id="bucket"
                        value={config.ossConfig.bucket}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          ossConfig: { ...prev.ossConfig, bucket: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">区域</Label>
                      <Input
                        id="region"
                        value={config.ossConfig.region}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          ossConfig: { ...prev.ossConfig, region: e.target.value }
                        }))}
                        placeholder="如：oss-cn-hangzhou"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endpoint">Endpoint</Label>
                      <Input
                        id="endpoint"
                        value={config.ossConfig.endpoint}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          ossConfig: { ...prev.ossConfig, endpoint: e.target.value }
                        }))}
                        placeholder="如：https://oss-cn-hangzhou.aliyuncs.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cdnDomain">CDN 域名</Label>
                      <Input
                        id="cdnDomain"
                        value={config.ossConfig.cdnDomain}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          ossConfig: { ...prev.ossConfig, cdnDomain: e.target.value }
                        }))}
                        placeholder="如：cdn.example.com"
                      />
                    </div>
                  </div>
                </>
              )}

              {config.ossConfig.provider === 'local' && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    使用本地存储，文件将保存在服务器本地目录中。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8">
          保存配置
        </Button>
      </div>
    </div>
    </ProtectedPage>
  )
}

export default SiteSettingsPage
