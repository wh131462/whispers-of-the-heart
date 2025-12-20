import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@whispers/ui'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Filter,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react'
import { blogApi, api } from '@whispers/utils'
import { useToastContext } from '../../contexts/ToastContext'
import { useAuthStore } from '../../stores/useAuthStore'

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string
  coverImage?: string
  published: boolean
  publishedAt?: string
  views: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
  }
  postTags?: Array<{
    tag: {
      id: string
      name: string
      slug: string
    }
  }>
}

const PostManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { success, error: showError } = useToastContext()
  const { accessToken } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [errorState, setErrorState] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setErrorState(null)

      if (accessToken) {
        blogApi.setToken(accessToken)
      }

      const params: any = {
        page: 1,
        limit: 100,
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      if (statusFilter !== 'all') {
        params.published = statusFilter === 'published'
      }

      const response = await blogApi.getPosts(params)

      if (response.success && response.data?.items) {
        setPosts(response.data.items)
      } else {
        throw new Error('获取文章列表失败')
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
      setErrorState(err instanceof Error ? err.message : '获取文章列表失败')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, accessToken])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // 搜索防抖
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPosts()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleDelete = async (postId: string) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return
    }

    try {
      await api.delete(`/blog/post/${postId}`)
      setPosts(prev => prev.filter(post => post.id !== postId))
      success('文章删除成功！')
    } catch (err) {
      console.error('Failed to delete post:', err)
      showError('删除文章失败')
    }
  }

  const handleTogglePublish = async (post: Post) => {
    try {
      const response = await api.patch(`/blog/post/${post.id}`, {
        published: !post.published
      })

      if (response.data) {
        setPosts(prev => prev.map(p =>
          p.id === post.id ? { ...p, published: !post.published } : p
        ))
        success(post.published ? '文章已设为草稿' : '文章已发布！')
      }
    } catch (err) {
      console.error('Failed to toggle publish:', err)
      showError('操作失败')
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'draft' && !post.published) ||
      (statusFilter === 'published' && post.published)
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
          <div className="text-lg text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">文章管理</h1>
          <p className="text-muted-foreground mt-1">管理所有文章内容</p>
        </div>
        <Button onClick={() => navigate('/admin/posts/new')}>
          <Plus className="h-4 w-4 mr-2" />
          新建文章
        </Button>
      </div>

      {/* 错误提示 */}
      {errorState && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{errorState}</span>
            <Button onClick={fetchPosts} variant="outline" size="sm" className="ml-4">
              <Loader2 className="h-4 w-4 mr-1" />
              重试
            </Button>
          </div>
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文章标题..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

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

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            重置
          </Button>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                标题
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                标签
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                浏览量
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                更新时间
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredPosts.map((post) => (
              <tr key={post.id} className="hover:bg-muted/50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt=""
                        className="w-12 h-8 object-cover rounded mr-3"
                      />
                    )}
                    <div>
                      <div className="font-medium text-foreground truncate max-w-xs">
                        {post.title}
                      </div>
                      {post.excerpt && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {post.excerpt}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {post.postTags?.slice(0, 3).map((pt) => (
                      <span
                        key={pt.tag.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
                      >
                        {pt.tag.name}
                      </span>
                    ))}
                    {(post.postTags?.length || 0) > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{(post.postTags?.length || 0) - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleTogglePublish(post)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      post.published
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                    }`}
                  >
                    {post.published ? '已发布' : '草稿'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {post.views}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(post.updatedAt).toLocaleDateString('zh-CN')}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 空状态 */}
        {filteredPosts.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || statusFilter !== 'all' ? '没有找到匹配的文章' : '还没有文章'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all'
                ? '尝试调整搜索条件'
                : '开始创建你的第一篇文章吧！'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => navigate('/admin/posts/new')}>
                <Plus className="h-4 w-4 mr-2" />
                新建文章
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PostManagementPage
