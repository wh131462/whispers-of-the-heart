import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

interface SiteConfig {
  siteName: string
  siteDescription: string
  siteLogo: string
  siteIcon: string
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
}

const AboutPage: React.FC = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSiteConfig()
  }, [])

  const fetchSiteConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:7777/api/v1/site-config')
      if (response.ok) {
        const configData = await response.json()
        setSiteConfig(configData)
      } else {
        // 使用默认配置
        setSiteConfig({
          siteName: 'Whispers of the Heart',
          siteDescription: '专注于分享知识和灵感的平台',
          siteLogo: '',
          siteIcon: '',
          aboutMe: '热爱技术，热爱生活，希望通过文字传递正能量。我是一个充满激情的开发者，专注于前端技术和用户体验设计。在这里，我分享我的技术见解、学习心得和生活感悟。',
          contactEmail: 'contact@example.com',
          socialLinks: {
            github: 'https://github.com/yourusername',
            twitter: 'https://twitter.com/yourusername',
            linkedin: 'https://linkedin.com/in/yourusername'
          },
          seoSettings: {
            metaTitle: 'Whispers of the Heart - 知识分享平台',
            metaDescription: '专注于分享技术和生活感悟的平台',
            keywords: '技术,生活,感悟,分享,博客'
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch site config:', error)
      // 使用默认配置
      setSiteConfig({
        siteName: 'Whispers of the Heart',
        siteDescription: '专注于分享知识和灵感的平台',
        siteLogo: '',
        siteIcon: '',
        aboutMe: '热爱技术，热爱生活，希望通过文字传递正能量。我是一个充满激情的开发者，专注于前端技术和用户体验设计。在这里，我分享我的技术见解、学习心得和生活感悟。',
        contactEmail: 'contact@example.com',
        socialLinks: {
          github: 'https://github.com/yourusername',
          twitter: 'https://twitter.com/yourusername',
          linkedin: 'https://linkedin.com/in/yourusername'
        },
        seoSettings: {
          metaTitle: 'Whispers of the Heart - 知识分享平台',
          metaDescription: '专注于分享技术和生活感悟的平台',
          keywords: '技术,生活,感悟,分享,博客'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          关于我们
        </h1>
        <p className="text-xl text-muted-foreground">
          了解更多关于 {siteConfig?.siteName || 'Whispers of the Heart'} 的信息
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主要内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 关于我们 */}
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6">关于我们</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {siteConfig?.aboutMe || '热爱技术，热爱生活，希望通过文字传递正能量。'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 网站介绍 */}
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6">网站介绍</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {siteConfig?.siteDescription || '专注于分享知识和灵感的平台'}
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  在这个快速发展的数字时代，我们致力于创建一个知识分享和思想交流的平台。
                  无论您是技术爱好者、设计师、还是对生活有独特见解的人，这里都是您表达想法的地方。
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  我们相信，每一个想法都有其价值，每一份分享都能激发灵感。
                  让我们一起构建一个更加开放、包容、富有创造力的社区。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 我们的愿景 */}
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6">我们的愿景</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3 text-primary">知识分享</h3>
                  <p className="text-muted-foreground text-sm">
                    打造一个高质量的知识分享平台，让每个人都能找到有价值的内容。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3 text-primary">社区建设</h3>
                  <p className="text-muted-foreground text-sm">
                    构建一个积极向上的社区环境，促进思想碰撞和创新。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3 text-primary">持续学习</h3>
                  <p className="text-muted-foreground text-sm">
                    鼓励终身学习，与时俱进，跟上技术和时代的发展步伐。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3 text-primary">开放协作</h3>
                  <p className="text-muted-foreground text-sm">
                    倡导开放的协作精神，共同创造更美好的数字世界。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 联系信息 */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">联系我们</h3>
              <div className="space-y-4">
                {siteConfig?.contactEmail && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <a 
                      href={`mailto:${siteConfig.contactEmail}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {siteConfig.contactEmail}
                    </a>
                  </div>
                )}
                
                {/* 社交链接 */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">关注我们</p>
                  <div className="flex space-x-3">
                    {siteConfig?.socialLinks?.github && (
                      <a 
                        href={siteConfig.socialLinks.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {siteConfig?.socialLinks?.twitter && (
                      <a 
                        href={siteConfig.socialLinks.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {siteConfig?.socialLinks?.linkedin && (
                      <a 
                        href={siteConfig.socialLinks.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 技术栈 */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">技术栈</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">前端</p>
                  <p className="text-xs text-muted-foreground">React, TypeScript, TailwindCSS</p>
                </div>
                <div>
                  <p className="text-sm font-medium">后端</p>
                  <p className="text-xs text-muted-foreground">NestJS, Prisma, PostgreSQL</p>
                </div>
                <div>
                  <p className="text-sm font-medium">部署</p>
                  <p className="text-xs text-muted-foreground">Docker, Nginx</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计信息 */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">网站统计</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">50+</p>
                  <p className="text-xs text-muted-foreground">文章发布</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">1K+</p>
                  <p className="text-xs text-muted-foreground">页面浏览</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">100+</p>
                  <p className="text-xs text-muted-foreground">用户访问</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">20+</p>
                  <p className="text-xs text-muted-foreground">技术分享</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
