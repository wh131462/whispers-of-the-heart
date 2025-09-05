import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import ProtectedPage from '../components/ProtectedPage'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  FileText,
  Calendar,
  Tag,
  Filter,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { blogApi, type Post } from '@whispers/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { useToastContext } from '../contexts/ToastContext'

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PostManagementPage Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">页面加载出错</h3>
            <p className="text-gray-600 mb-4">请刷新页面重试</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新页面
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const PostManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { success, error } = useToastContext()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [errorState, setErrorState] = useState<{
    hasError: boolean
    message: string
    canRetry: boolean
  }>({
    hasError: false,
    message: '',
    canRetry: true
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // 输入验证函数
  const validateInput = (input: any, type: 'string' | 'number' | 'array'): boolean => {
    if (input === null || input === undefined) return false
    switch (type) {
      case 'string':
        return typeof input === 'string' && input.trim().length > 0
      case 'number':
        return typeof input === 'number' && !isNaN(input) && isFinite(input)
      case 'array':
        return Array.isArray(input)
      default:
        return false
    }
  }

  // 安全的文章数据验证
  const validatePost = (post: any): post is Post => {
    return (
      post &&
      typeof post === 'object' &&
      validateInput(post.id, 'string') &&
      validateInput(post.title, 'string') &&
      validateInput(post.content, 'string') &&
      validateInput(post.slug, 'string') &&
      ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(post.status) &&
      typeof post.views === 'number' &&
      typeof post.likes === 'number' &&
      typeof post.comments === 'number' &&
      validateInput(post.createdAt, 'string') &&
      validateInput(post.updatedAt, 'string') &&
      validateInput(post.authorId, 'string') &&
      post.author &&
      typeof post.author === 'object' &&
      validateInput(post.author.id, 'string') &&
      validateInput(post.author.username, 'string')
    )
  }


  const fetchPosts = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true)
      setErrorState({ hasError: false, message: '', canRetry: true })

      // 验证搜索参数
      const searchParams = {
        page: 1,
        limit: 100,
        search: searchTerm && searchTerm.trim() ? searchTerm.trim() : undefined,
        status: statusFilter === 'all' ? undefined : statusFilter.toUpperCase(),
      }

      // 防止过长的搜索词
      if (searchParams.search && searchParams.search.length > 100) {
        searchParams.search = searchParams.search.substring(0, 100)
      }

      const response = await blogApi.getPosts(searchParams)
      
      if (response.success && response.data && validateInput(response.data.items, 'array')) {
        // 验证每个文章数据
        const validPosts = response.data.items.filter(validatePost)
        
        if (validPosts.length !== response.data.items.length) {
          console.warn('Some posts were filtered out due to invalid data')
        }
        
        setPosts(validPosts)
        setErrorState({ hasError: false, message: '', canRetry: true })
      } else {
        console.error('Invalid API response format:', response)
        throw new Error('API 响应格式无效')
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      
      const errorMessage = error instanceof Error ? error.message : '获取文章列表失败'
      
      setErrorState({ 
        hasError: true, 
        message: errorMessage, 
        canRetry: retryCount < 2 
      })
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter])

  // 重试函数
  const retryFetchPosts = useCallback(() => {
    fetchPosts(1)
  }, [fetchPosts])

  useEffect(() => {
    // 初始化token
    const token = localStorage.getItem('admin_token')
    if (token) {
      blogApi.setToken(token)
    }
    
    fetchPosts()
  }, [fetchPosts])

  // 搜索防抖
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchPosts()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, fetchPosts])

  // 状态筛选变化时重新获取数据
  useEffect(() => {
    fetchPosts()
  }, [statusFilter, categoryFilter, fetchPosts])

  const handleDelete = async (postId: string) => {
    // 验证 postId
    if (!validateInput(postId, 'string')) {
      error('无效的文章ID')
      return
    }

    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return
    }

    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        error('请先登录')
        return
      }

      const response = await fetch(`http://localhost:7777/api/v1/blog/post/${encodeURIComponent(postId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok || response.status === 404) {
        setPosts(prev => prev.filter(post => post.id !== postId))
        success('文章删除成功！')
      } else {
        const errorText = await response.text()
        console.error('Delete failed:', response.status, errorText)
        error(`删除文章失败: ${response.status}`)
      }
    } catch (err) {
      console.error('Failed to delete post:', err)
      error('删除文章失败，请检查网络连接')
    }
  }

  const handlePreview = (post: Post) => {
    setPreviewPost(post)
    setShowPreview(true)
  }

  const closePreview = () => {
    setShowPreview(false)
    setPreviewPost(null)
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'draft' && post.status === 'DRAFT') ||
                         (statusFilter === 'published' && post.status === 'PUBLISHED')
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    if (status === 'PUBLISHED') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          已发布
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        草稿
      </span>
    )
  }

  // 错误显示组件
  const ErrorDisplay = () => (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
        <p className="text-gray-600 mb-4">{errorState.message}</p>
        {errorState.canRetry && (
          <Button onClick={retryFetchPosts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-gray-500 mx-auto mb-2 animate-spin" />
          <div className="text-lg text-gray-500">加载中...</div>
        </div>
      </div>
    )
  }

  if (errorState.hasError && posts.length === 0) {
    return (
      <ProtectedPage>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">文章管理</h1>
              <p className="text-gray-600">管理所有文章内容，包括创建、编辑和删除</p>
            </div>
            <Button onClick={() => navigate('/admin/posts/new')}>
              <Plus className="h-4 w-4 mr-2" />
              新建文章
            </Button>
          </div>
          <ErrorDisplay />
        </div>
      </ProtectedPage>
    )
  }

  return (
    <ErrorBoundary>
      <ProtectedPage>
        <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">文章管理</h1>
            <p className="text-gray-600">管理所有文章内容，包括创建、编辑和删除</p>
          </div>
          <Button onClick={() => navigate('/admin/posts/new')}>
            <Plus className="h-4 w-4 mr-2" />
            新建文章
          </Button>
        </div>

        {/* 错误提示 */}
        {errorState.hasError && posts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center text-yellow-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">{errorState.message}</span>
                {errorState.canRetry && (
                  <Button 
                    onClick={retryFetchPosts} 
                    variant="outline" 
                    size="sm" 
                    className="ml-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    重试
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索文章标题或内容..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value
                  // 限制搜索词长度，防止过长的输入
                  if (value.length <= 100) {
                    setSearchTerm(value)
                  }
                }}
                className="pl-10"
                maxLength={100}
              />
            </div>

            {/* 状态筛选 */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | 'draft' | 'published')}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
              </SelectContent>
            </Select>

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
                <SelectItem value="前端开发">前端开发</SelectItem>
                <SelectItem value="后端开发">后端开发</SelectItem>
                <SelectItem value="编程语言">编程语言</SelectItem>
                <SelectItem value="DevOps">DevOps</SelectItem>
              </SelectContent>
            </Select>

            {/* 重置筛选 */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setCategoryFilter('all')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 文章列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => {
          // 安全性检查：确保文章数据有效
          if (!validatePost(post)) {
            console.warn('Invalid post data:', post)
            return null
          }
          
          return (
          <Card key={post.id} className="hover:shadow-lg transition-shadow">
            {/* 封面图片 */}
            {post.coverImage && (
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(post.status)}
                </div>
              </div>
            )}

            <CardContent className="p-6">
              {/* 文章标题 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {post.title}
              </h3>

              {/* 文章摘要 */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {post.excerpt || '暂无摘要'}
              </p>

              {/* 分类和标签 */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-gray-500">分类：</span>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {post.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(post.tags || []).slice(0, 3).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {(post.tags || []).length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{(post.tags || []).length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* 统计信息 */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{post.views}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>{post.likes}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Tag className="h-3 w-3" />
                    <span>{post.comments}</span>
                  </span>
                </div>
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(post)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  预览
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      {/* 空状态 */}
      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? '没有找到匹配的文章'
                : '还没有文章'
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? '尝试调整搜索条件或筛选器'
                : '开始创建你的第一篇文章吧！'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
              <Button onClick={() => navigate('/admin/posts/new')}>
                <Plus className="h-4 w-4 mr-2" />
                新建文章
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 预览模态框 */}
      {showPreview && previewPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">文章预览</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePreview}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 模态框内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* 文章标题 */}
              <h1 className="text-3xl font-bold mb-4">{previewPost.title}</h1>
              
              {/* 文章元信息 */}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(previewPost.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>{previewPost.status === 'PUBLISHED' ? '已发布' : '草稿'}</span>
                </div>
                {previewPost.category && (
                  <div className="flex items-center space-x-1">
                    <Tag className="h-4 w-4" />
                    <span>{previewPost.category}</span>
                  </div>
                )}
              </div>
              
              {/* 文章摘要 */}
              {previewPost.excerpt && (
                <div className="bg-muted p-4 rounded-lg mb-6">
                  <p className="text-muted-foreground italic">{previewPost.excerpt}</p>
                </div>
              )}
              
              {/* 文章内容 */}
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {previewPost.content || '*暂无内容*'}
                </ReactMarkdown>
              </div>
              
              {/* 标签 */}
              {previewPost.tags && previewPost.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex flex-wrap gap-2">
                    {previewPost.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 模态框底部 */}
            <div className="flex items-center justify-end space-x-2 p-6 border-t bg-muted/50">
              <Button variant="outline" onClick={closePreview}>
                关闭
              </Button>
              <Button onClick={() => {
                closePreview()
                navigate(`/admin/posts/edit/${previewPost.id}`)
              }}>
                编辑文章
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedPage>
    </ErrorBoundary>
  )
}

export default PostManagementPage
