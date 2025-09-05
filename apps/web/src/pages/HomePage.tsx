import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ArrowRight } from 'lucide-react'
import PostCard from '../components/PostCard'

interface Post {
  id: string
  title: string
  content: string
  excerpt: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  category: string
  coverImage?: string
  views: number
  likes: number
  comments: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  authorId: string
  author: {
    id: string
    username: string
    avatar?: string
  }
  postTags: Array<{
    id: string
    postId: string
    tagId: string
    tag: {
      id: string
      name: string
      slug: string
      color?: string
      createdAt: string
      updatedAt: string
    }
  }>
  _count: {
    postComments: number
    postLikes: number
  }
}

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

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [hitokoto, setHitokoto] = useState('')

  useEffect(() => {
    fetchData()
    fetchHitokoto()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 并行获取文章和站点配置
      const [postsResponse, configResponse] = await Promise.all([
        fetch('http://localhost:7777/api/v1/blog'),
        fetch('http://localhost:7777/api/v1/site-config')
      ])

      // 处理文章数据
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        if (postsData.success && postsData.data && postsData.data.items) {
          // 只显示已发布的文章
          const publishedPosts = postsData.data.items.filter((post: Post) => post.status === 'PUBLISHED')
          setPosts(publishedPosts.slice(0, 6)) // 只显示前6篇文章
        }
      }

      // 处理站点配置
      if (configResponse.ok) {
        const configData = await configResponse.json()
        if (configData.success && configData.data) {
          setSiteConfig(configData.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHitokoto = async () => {
    try {
      const response = await fetch('http://localhost:7777/api/v1/hitokoto')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setHitokoto(result.data.hitokoto)
        } else {
          setHitokoto('生活不止眼前的代码，还有诗和远方。')
        }
      } else {
        setHitokoto('生活不止眼前的代码，还有诗和远方。')
      }
    } catch (error) {
      console.error('Failed to fetch hitokoto:', error)
      setHitokoto('生活不止眼前的代码，还有诗和远方。')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div>
      {/* 全屏 Banner */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 -mt-16 pt-16">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg">
            {siteConfig?.siteName || 'Whispers of the Heart'}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-md">
            {siteConfig?.siteDescription || '专注于分享知识和灵感的平台'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/posts">
              <Button size="lg" className="text-lg px-8 py-4">
                探索文章
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 bg-white/10 border-white/20 text-white hover:bg-white/20">
                了解更多
              </Button>
            </Link>
          </div>
        </div>
        
        {/* 滚动指示器 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* 文章列表区域 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">最新文章</h2>
            <p className="text-lg text-gray-600">发现最新的技术分享和生活感悟</p>
          </div>

          {posts.length > 0 ? (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
              {posts.map((post) => (
                <div key={post.id} className="break-inside-avoid mb-8">
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">
                暂无文章
              </div>
              <p className="text-sm text-gray-500">
                敬请期待更多精彩内容
              </p>
            </div>
          )}

          {/* 查看更多按钮 */}
          {posts.length > 0 && (
            <div className="text-center mt-12">
              <Link to="/posts">
                <Button size="lg" variant="outline">
                  查看更多文章
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage
