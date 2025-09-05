import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import PostCard from '../components/PostCard'
import { Bookmark, ArrowLeft, Home } from 'lucide-react'
import { blogApi } from '../services/blogApi'
import { useAuthStore } from '../stores/useAuthStore'

interface Post {
  id: string
  title: string
  content: string
  excerpt: string | null
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  category: string | null
  coverImage?: string | null
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
    avatar?: string | null
  }
  postTags: Array<{
    id: string
    postId: string
    tagId: string
    tag: {
      id: string
      name: string
      slug: string
      color?: string | null
      createdAt: string
      updatedAt: string
    }
  }>
  _count: {
    postComments: number
    postLikes: number
  }
}

const FavoritesPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [total, setTotal] = useState(0)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, page])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const result = await blogApi.getUserFavorites(page, 10)
      setPosts(result.items)
      setHasNext(result.hasNext)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <p className="text-muted-foreground mb-6">登录后可以查看您的收藏文章。</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              登录
            </Link>
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">我的收藏</h1>
          <p className="text-lg text-gray-600">共收藏了 {total} 篇文章</p>
        </div>
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Link>
      </div>

      {/* 收藏列表 */}
      {posts.length > 0 ? (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="break-inside-avoid mb-6">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <Bookmark className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              还没有收藏任何文章
            </h3>
            <p className="text-gray-500 mb-6">
              去浏览一些有趣的文章并收藏它们吧！
            </p>
            <Link 
              to="/posts" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              浏览文章
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 加载更多 */}
      {hasNext && (
        <div className="text-center">
          <Button
            onClick={() => setPage(prev => prev + 1)}
            disabled={loading}
            variant="outline"
          >
            {loading ? '加载中...' : '加载更多'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default FavoritesPage
