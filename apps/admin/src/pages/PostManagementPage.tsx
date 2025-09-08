import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { DataTable } from '../components/tables/DataTable'
import ProtectedPage from '../components/ProtectedPage'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText,
  Calendar,
  Filter,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { blogApi, type Post, api, setTokenFromStorage } from '@whispers/utils'
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
      setTokenFromStorage('admin_token')
      await api.delete(`/blog/post/${encodeURIComponent(postId)}`)
      setPosts(prev => prev.filter(post => post.id !== postId))
      success('文章删除成功！')
    } catch (err) {
      console.error('Failed to delete post:', err)
      error('删除文章失败，请检查网络连接')
    }
  }

  const handleToggleStatus = async (postId: string, currentStatus: string) => {
    if (!validateInput(postId, 'string')) {
      error('无效的文章ID')
      return
    }

    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    
    try {
      setTokenFromStorage('admin_token')
      const response = await api.patch(`/blog/post/${encodeURIComponent(postId)}`, {
        status: newStatus
      })
      
      if (response.data) {
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, status: newStatus } : post
        ))
        success(`文章已${newStatus === 'PUBLISHED' ? '发布' : '设为草稿'}！`)
      }
    } catch (err) {
      console.error('Failed to toggle status:', err)
      error('状态切换失败，请检查网络连接')
    }
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
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredPosts}
            columns={[
              {
                key: 'title',
                title: '标题',
                render: (post: Post) => (
                  <div className="max-w-xs">
                    <div className="font-medium text-gray-900 truncate">
                      {post.title}
                    </div>
                    {post.coverImage && (
                      <div className="mt-1">
                        <img
                          src={post.coverImage}
                          alt=""
                          className="w-16 h-10 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: 'excerpt',
                title: '摘要',
                render: (post: Post) => (
                  <div className="max-w-sm text-sm text-gray-600 line-clamp-2">
                    {post.excerpt || '暂无摘要'}
                  </div>
                )
              },
              {
                key: 'category',
                title: '分类',
                render: (post: Post) => (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {post.category || '未分类'}
                  </span>
                )
              },
              {
                key: 'tags',
                title: '标签',
                render: (post: Post) => (
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(post.tags || []).slice(0, 2).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {(post.tags || []).length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{(post.tags || []).length - 2}
                      </span>
                    )}
                  </div>
                )
              },
              {
                key: 'createdAt',
                title: '发布时间',
                render: (post: Post) => (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                )
              },
              {
                key: 'updatedAt',
                title: '更新时间',
                render: (post: Post) => (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(post.updatedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                )
              },
              {
                key: 'status',
                title: '发布状态',
                render: (post: Post) => (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={post.status === 'PUBLISHED'}
                      onCheckedChange={() => handleToggleStatus(post.id, post.status)}
                    />
                    <span className="text-sm text-gray-600">
                      {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </span>
                  </div>
                )
              },
              {
                key: 'actions',
                title: '操作',
                render: (post: Post) => (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      编辑
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
                )
              }
            ]}
            pageSize={10}
          />
        </CardContent>
      </Card>

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

    </div>
    </ProtectedPage>
    </ErrorBoundary>
  )
}

export default PostManagementPage
