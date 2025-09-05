import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import PostCard from '../components/PostCard'
import { 
  Search, 
  X
} from 'lucide-react'

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

const PostsPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categories, setCategories] = useState<Array<{name: string, count: number}>>([])

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:7777/api/v1/blog')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.items) {
          setPosts(data.data.items)
        }
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:7777/api/v1/blog/categories')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setCategories(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 页面头部 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">文章列表</h1>
        <p className="text-lg text-gray-600">探索我们的最新文章和见解</p>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索文章..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 分类筛选 */}
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                {categories
                  .filter(category => category.name && category.name.trim() !== '')
                  .map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* 重置筛选 */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('all')
              }}
              className="flex items-center justify-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>重置</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 文章列表 - 瀑布流布局 */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {filteredPosts.map((post) => (
          <div key={post.id} className="break-inside-avoid mb-6">
            <PostCard post={post} />
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || categoryFilter !== 'all'
                ? '没有找到匹配的文章'
                : '还没有文章'
              }
            </h3>
            <p className="text-gray-500">
              {searchTerm || categoryFilter !== 'all'
                ? '尝试调整搜索条件或筛选器'
                : '敬请期待更多精彩内容！'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PostsPage
