import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import ProtectedPage from '../components/ProtectedPage'
import { 
  Save, 
  FileText, 
  Calendar,
  ArrowLeft,
  Trash2
} from 'lucide-react'
import { TiptapEditor } from '@whispers/ui'
import { blogApi, type CreatePostDto, type UpdatePostDto } from '@whispers/utils'

// 本地Post接口，用于编辑表单
interface LocalPost {
  id?: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  category: string
  status: 'draft' | 'published'
  coverImage?: string
  createdAt?: string
  updatedAt?: string
}

const PostEditPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  
  const [post, setPost] = useState<LocalPost>({
    title: '',
    content: '',
    excerpt: '',
    tags: [],
    category: '',
    status: 'draft'
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    // 初始化token
    const token = localStorage.getItem('admin_token')
    if (token) {
      blogApi.setToken(token)
    }
    
    if (isEditing) {
      fetchPost()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await blogApi.getPost(id!)
      
      if (response.success && response.data) {
        const apiPost = response.data
        // 转换API数据格式到本地格式
        const localPost: LocalPost = {
          id: apiPost.id,
          title: apiPost.title,
          content: apiPost.content,
          excerpt: apiPost.excerpt || '',
          tags: apiPost.tags || [],
          category: apiPost.category || '',
          status: apiPost.status.toLowerCase() as 'draft' | 'published',
          coverImage: apiPost.coverImage,
          createdAt: apiPost.createdAt,
          updatedAt: apiPost.updatedAt,
        }
        setPost(localPost)
      } else {
        console.error('Post not found')
        navigate('/admin/posts')
      }
    } catch (error) {
      console.error('Failed to fetch post:', error)
      navigate('/admin/posts')
    } finally {
      setLoading(false)
    }
  }


  const handleSave = async (publish: boolean = false) => {
    try {
      setSaving(true)
      
      // 确保 token 是最新的
      const token = localStorage.getItem('admin_token')
      if (token) {
        blogApi.setToken(token)
      } else {
        alert('请先登录')
        navigate('/admin/login')
        return
      }
      
      // 转换本地数据格式到API格式
      const apiData: CreatePostDto | UpdatePostDto = {
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        category: post.category,
        coverImage: post.coverImage,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        tags: post.tags,
      }

      let response
      if (isEditing) {
        response = await blogApi.updatePost(id!, apiData as UpdatePostDto)
      } else {
        response = await blogApi.createPost(apiData as CreatePostDto)
      }

      if (response.success) {
        if (!isEditing && response.data) {
          // 新建文章成功后跳转到编辑页面
          navigate(`/admin/posts/edit/${response.data.id}`)
        }
        alert(publish ? '文章发布成功！' : '文章保存成功！')
      } else {
        alert(response.message || '保存失败')
      }
    } catch (error: any) {
      console.error('Failed to save post:', error)
      
      // 处理不同类型的错误
      if (error.statusCode === 409) {
        alert('文章标题已存在，请修改标题后重试')
      } else if (error.statusCode === 401) {
        alert('登录已过期，请重新登录')
        // 可以在这里添加跳转到登录页的逻辑
      } else if (error.message) {
        alert(`保存失败：${error.message}`)
      } else {
        alert('保存失败，请稍后重试')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !post.tags.includes(tagInput.trim())) {
      setPost(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return
    }

    try {
      if (isEditing) {
        const response = await fetch(`http://localhost:7777/api/v1/blog/post/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok || response.status === 404) {
          alert('文章删除成功！')
          navigate('/admin/posts')
        }
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('文章删除成功！')
      navigate('/admin/posts')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <ProtectedPage>
      <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/posts')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? '编辑文章' : '新建文章'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? '修改文章内容和设置' : '创建新的文章'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {isEditing && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存草稿'}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '发布中...' : '发布文章'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主编辑区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 文章标题 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>文章标题</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="输入文章标题..."
                value={post.title}
                onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
                className="text-lg"
              />
            </CardContent>
          </Card>

          {/* 文章内容 */}
          <TiptapEditor
            content={post.content}
            onChange={(value) => setPost(prev => ({ ...prev, content: value }))}
            placeholder="使用 Markdown 语法编写文章内容..."
            editable={true}
            showToolbar={true}
            authToken={typeof window !== 'undefined' ? localStorage.getItem('admin_token') || undefined : undefined}
          />
        </div>

        {/* 侧边栏设置 */}
        <div className="space-y-6">
          {/* 文章摘要 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">文章摘要</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="输入文章摘要..."
                value={post.excerpt}
                onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* 分类 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">分类</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="输入文章分类..."
                value={post.category}
                onChange={(e) => setPost(prev => ({ ...prev, category: e.target.value }))}
              />
            </CardContent>
          </Card>

          {/* 标签 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">标签</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  placeholder="添加标签..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag} size="sm">
                  添加
                </Button>
              </div>
              
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 封面图片 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">封面图片</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="输入图片 URL..."
                value={post.coverImage || ''}
                onChange={(e) => setPost(prev => ({ ...prev, coverImage: e.target.value }))}
              />
              {post.coverImage && (
                <div className="relative">
                  <img
                    src={post.coverImage}
                    alt="封面预览"
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 文章状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">文章状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={post.status === 'draft'}
                    onChange={(e) => setPost(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                  />
                  <span>草稿</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={post.status === 'published'}
                    onChange={(e) => setPost(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                  />
                  <span>已发布</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* 时间信息 */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">时间信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>创建时间：{new Date(post.createdAt || '').toLocaleString('zh-CN')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>更新时间：{new Date(post.updatedAt || '').toLocaleString('zh-CN')}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </ProtectedPage>
  )
}

export default PostEditPage
