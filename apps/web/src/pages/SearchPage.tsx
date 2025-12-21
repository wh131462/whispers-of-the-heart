import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import {
  Search,
  FileText,
  Video,
  Music,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Play,
  Volume2
} from 'lucide-react'
import { api } from '@whispers/utils'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'post' | 'video' | 'audio'
  category: string
  views: number
  likes: number
  comments: number
  publishedAt: string
  createdAt: string
  author: {
    id: string
    username: string
    avatar?: string
  }
  tags: string[]
  // 文章特有
  excerpt?: string
  slug?: string
  // 视频特有
  thumbnail?: string
  duration?: number
  // 音频特有
  coverImage?: string
  audioDuration?: number
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const query = searchParams.get('q') || ''

  useEffect(() => {
    if (query) {
      setSearchQuery(query)
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      // 调用搜索 API
      const response = await api.get('/blog/search', {
        params: {
          q: searchTerm,
          limit: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      })

      if (response.data?.success && response.data?.data?.items) {
        // 转换 API 数据为 SearchResult 格式
        const searchResults: SearchResult[] = response.data.data.items.map((post: any) => {
          // 提取分类名称
          const categoryName = typeof post.category === 'object' && post.category
            ? post.category.name
            : (post.category || '未分类')

          // 提取标签
          const tags = post.postTags?.map((pt: any) => pt.tag?.name).filter(Boolean) || []

          return {
            id: post.id,
            title: post.title,
            description: post.excerpt || post.content?.substring(0, 200) || '',
            type: 'post' as const,
            category: categoryName,
            views: post.views || 0,
            likes: post._count?.postLikes || 0,
            comments: post._count?.postComments || 0,
            publishedAt: post.publishedAt || post.createdAt,
            createdAt: post.createdAt,
            author: post.author,
            tags,
            excerpt: post.excerpt || '',
            slug: post.slug,
            coverImage: post.coverImage
          }
        })

        setResults(searchResults)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() })
    }
  }

  const filteredResults = results.filter(result => {
    if (activeTab === 'all') return true
    return result.type === activeTab
  })

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FileText className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'post':
        return '文章'
      case 'video':
        return '视频'
      case 'audio':
        return '音频'
      default:
        return '文章'
    }
  }

  return (
    <div className="space-y-8">
      {/* 搜索头部 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">搜索结果</h1>
        <p className="text-lg text-muted-foreground">
          {query ? `搜索 "${query}" 的结果` : '请输入搜索关键词'}
        </p>
      </div>

      {/* 搜索框 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索文章、视频、音频..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? '搜索中...' : '搜索'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 搜索结果 */}
      {query && (
        <div className="space-y-6">
          {/* 结果统计 */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              找到 {filteredResults.length} 个结果
            </p>
            
            {/* 分类标签 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="post">文章</TabsTrigger>
                <TabsTrigger value="video">视频</TabsTrigger>
                <TabsTrigger value="audio">音频</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 结果列表 */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-muted-foreground">搜索中...</div>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      {/* 缩略图 */}
                      {(result.thumbnail || result.coverImage) && (
                        <div className="flex-shrink-0">
                          <img
                            src={result.thumbnail || result.coverImage}
                            alt={result.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getTypeIcon(result.type)}
                              <Badge variant="outline">
                                {getTypeLabel(result.type)}
                              </Badge>
                              <Badge variant="secondary">
                                {result.category}
                              </Badge>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              {result.title}
                            </h3>

                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {result.excerpt || result.description}
                            </p>

                            {/* 标签 */}
                            {result.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {result.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {result.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{result.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* 统计信息 */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center space-x-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{result.views}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Heart className="h-3 w-3" />
                                  <span>{result.likes}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <MessageCircle className="h-3 w-3" />
                                  <span>{result.comments}</span>
                                </span>
                                {result.duration && (
                                  <span className="flex items-center space-x-1">
                                    <Play className="h-3 w-3" />
                                    <span>{formatDuration(result.duration)}</span>
                                  </span>
                                )}
                                {result.audioDuration && (
                                  <span className="flex items-center space-x-1">
                                    <Volume2 className="h-3 w-3" />
                                    <span>{formatDuration(result.audioDuration)}</span>
                                  </span>
                                )}
                              </div>
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(result.publishedAt)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground/50 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  没有找到相关结果
                </h3>
                <p className="text-muted-foreground">
                  尝试使用不同的关键词或调整搜索条件
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchPage
