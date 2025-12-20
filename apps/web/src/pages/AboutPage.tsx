import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import {
  Mail,
  FileText,
  MessageSquare,
  Eye,
  Heart,
  Loader2,
  Globe,
  MessageCircle,
  Code2
} from 'lucide-react'
import { api } from '@whispers/utils'
import GithubIcon from "@/assets/github.svg"

interface SiteConfig {
  siteName: string
  siteDescription: string
  siteLogo: string
  siteIcon: string
  aboutMe: string
  contactEmail: string
  avatar: string
  socialLinks: {
    github: string
    twitter: string
    linkedin: string
  }
}

interface SiteStats {
  totalPosts: number
  totalComments: number
  totalViews: number
  totalLikes: number
}

// GitHub 用户名
const GITHUB_USERNAME = 'wh131462'
// GitHub 头像 URL
const GITHUB_AVATAR_URL = `https://github.com/${GITHUB_USERNAME}.png`

const defaultConfig: SiteConfig = {
  siteName: 'EternalHeart',
  siteDescription: 'A frontend enthusiast, passionate about creating',
  siteLogo: '',
  siteIcon: '',
  avatar: GITHUB_AVATAR_URL,
  aboutMe: 'I am a frontend enthusiast, passionate about creating, and a frontend developer committed to transitioning into a full-stack role.',
  contactEmail: 'hao131462@qq.com',
  socialLinks: {
    github: `https://github.com/${GITHUB_USERNAME}`,
    twitter: '',
    linkedin: ''
  }
}

// 精简的技术栈数据
const techStacks = [
  {
    category: 'Frontend',
    items: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Angular', 'Vue', 'React']
  },
  {
    category: 'Backend',
    items: ['Node.js', 'NestJS', 'Java', 'Python', 'Rust']
  },
  {
    category: 'Mobile',
    items: ['Flutter', 'Swift']
  },
  {
    category: 'Tools',
    items: ['Git', 'Docker', 'Vite', 'Webpack']
  }
]

const AboutPage: React.FC = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [configResponse, statsResponse] = await Promise.all([
          api.get('/site-config'),
          api.get('/blog/stats').catch(() => ({ data: null }))
        ])

        if (configResponse.data?.success && configResponse.data?.data) {
          setSiteConfig(configResponse.data.data)
        } else if (configResponse.data && !configResponse.data.success) {
          setSiteConfig(defaultConfig)
        } else {
          setSiteConfig(configResponse.data || defaultConfig)
        }

        if (statsResponse.data?.success && statsResponse.data?.data) {
          setStats(statsResponse.data.data)
        } else if (statsResponse.data?.data) {
          setStats(statsResponse.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setSiteConfig(defaultConfig)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  const config = siteConfig || defaultConfig

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {/* Hero 区域 */}
      <section className="text-center py-8">
        <img
          src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=500&size=24&pause=1000&color=6366F1&center=true&vCenter=true&random=false&width=500&lines=Hello,+I'm+EternalHeart;A+Frontend+Developer;Passionate+about+Creating"
          alt="Typing SVG"
          className="mx-auto"
        />
      </section>

      {/* 个人介绍卡片 */}
      <section>
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* 头像 - 使用 GitHub 头像 */}
              <div className="flex-shrink-0">
                <img
                  src={config.avatar || GITHUB_AVATAR_URL}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-xl select-none"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.src = GITHUB_AVATAR_URL
                  }}
                />
              </div>

              {/* 信息 */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  EternalHeart
                </h1>
                <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                  I am a frontend enthusiast, passionate about creating, and a frontend developer committed to transitioning into a full-stack role. I aspire to become a recognized expert in the field of technology.
                </p>
                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground text-sm">
                  "Keep learning, let the heart stay passionate eternally..."
                </blockquote>

                {/* 社交链接 */}
                <div className="flex items-center justify-center md:justify-start gap-3 mt-6">
                  <a
                    href="https://github.com/wh131462"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-muted hover:bg-primary/10 transition-all hover:scale-110"
                    title="GitHub"
                  >
                    <img src={GithubIcon} alt="Github" className="h-5 w-5" />
                  </a>
                  <a
                    href="mailto:hao131462@qq.com"
                    className="p-2.5 rounded-full bg-muted hover:bg-primary/10 transition-all hover:scale-110"
                    title="Email"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                  <a
                    href="https://131462.wang"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-muted hover:bg-primary/10 transition-all hover:scale-110"
                    title="Website"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                  <span
                    className="p-2.5 rounded-full bg-muted cursor-help"
                    title="WeChat: proxy_why"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 统计数据 */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-4">
              <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.totalPosts}</p>
              <p className="text-xs text-muted-foreground">文章</p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-4">
              <MessageSquare className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.totalComments}</p>
              <p className="text-xs text-muted-foreground">评论</p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-4">
              <Eye className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.totalViews}</p>
              <p className="text-xs text-muted-foreground">浏览</p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-4">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.totalLikes}</p>
              <p className="text-xs text-muted-foreground">点赞</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 技术栈 */}
      <section>
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              技术栈
            </h2>
            <div className="space-y-4">
              {techStacks.map((stack) => (
                <div key={stack.category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">{stack.category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {stack.items.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-primary/10 transition-colors"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 联系我 */}
      <section>
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-foreground mb-4">联系我</h2>
            <p className="text-muted-foreground mb-6">
              如果您有任何问题、建议或合作意向，欢迎随时与我联系
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild>
                <a href="mailto:hao131462@qq.com">
                  <Mail className="h-4 w-4 mr-2" />
                  发送邮件
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://github.com/wh131462" target="_blank" rel="noopener noreferrer">
                  <img src={GithubIcon} alt="Github" className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://131462.wang" target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  主页
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default AboutPage
