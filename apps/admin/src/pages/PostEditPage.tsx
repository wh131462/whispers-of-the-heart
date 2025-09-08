import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Switch } from '../components/ui/switch'
import { Combobox, MultiCombobox } from '../components/ui/combobox'
import ProtectedPage from '../components/ProtectedPage'
import { 
  Save, 
  Calendar,
  ArrowLeft,
  Trash2,
  Eye,
  Heart,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import { TiptapEditor } from '@whispers/ui'
import { blogApi, type CreatePostDto, type UpdatePostDto, type Category, type Tag, api, setTokenFromStorage } from '@whispers/utils'
import { useToastContext } from '../contexts/ToastContext'

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
  views?: number
  likes?: number
  comments?: number
}

const PostEditPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { success, error } = useToastContext()
  const isEditing = !!id
  
  const [post, setPost] = useState<LocalPost>({
    title: '',
    content: '',
    excerpt: '',
    tags: [],
    category: '',
    status: 'draft',
    views: 0,
    likes: 0,
    comments: 0
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    // 初始化token
    const token = localStorage.getItem('admin_token')
    if (token) {
      blogApi.setToken(token)
    }
    
    fetchCategoriesAndTags()
    
    if (isEditing) {
      fetchPost()
    }
  }, [id])

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        blogApi.getCategories(),
        blogApi.getTags()
      ])
      
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data)
      }
      
      if (tagsRes.success && tagsRes.data) {
        setTags(tagsRes.data)
      }
    } catch (err) {
      console.error('Failed to fetch categories and tags:', err)
      error('获取分类和标签列表失败')
    }
  }

  const fetchPost = async () => {
    try {
      setLoading(true)
      // 使用专门的编辑方法，不会增加访问量
      const response = await blogApi.getPostForEdit(id!)
      
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
          views: apiPost.views || 0,
          likes: apiPost.likes || 0,
          comments: apiPost.comments || 0,
        }
        setPost(localPost)
        setIsPublished(apiPost.status === 'PUBLISHED')
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


  const handleSave = async (publishStatus?: boolean) => {
    try {
      setSaving(true)
      
      // 确保 token 是最新的
      const token = localStorage.getItem('admin_token')
      if (token) {
        blogApi.setToken(token)
      } else {
        error('请先登录')
        navigate('/admin/login')
        return
      }
      
      // 使用当前发布状态或传入的状态
      const shouldPublish = publishStatus !== undefined ? publishStatus : isPublished
      
      // 转换本地数据格式到API格式
      const apiData: CreatePostDto | UpdatePostDto = {
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        category: post.category,
        coverImage: post.coverImage,
        status: shouldPublish ? 'PUBLISHED' : 'DRAFT',
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
        setIsPublished(shouldPublish)
        setPost(prev => ({ ...prev, status: shouldPublish ? 'published' : 'draft' }))
        success(shouldPublish ? '文章发布成功！' : '文章保存成功！')
      } else {
        error(response.message || '保存失败')
      }
    } catch (err: any) {
      console.error('Failed to save post:', err)
      
      // 处理不同类型的错误
      if (err.statusCode === 409) {
        error('文章标题已存在，请修改标题后重试')
      } else if (err.statusCode === 401) {
        error('登录已过期，请重新登录')
      } else if (err.message) {
        error(`保存失败：${err.message}`)
      } else {
        error('保存失败，请稍后重试')
      }
    } finally {
      setSaving(false)
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
        setTokenFromStorage('admin_token')
        await api.delete(`/blog/post/${id}`)
        success('文章删除成功！')
        navigate('/admin/posts')
      }
    } catch (err) {
      console.error('Failed to delete post:', err)
      error('删除文章失败，请检查网络连接')
    }
  }

  const generateSummary = () => {
    if (!post.content) {
      error('请先输入文章内容')
      return
    }
    
    // 简单的摘要生成：取前150个字符
    const textContent = post.content
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/[#*`]/g, '') // 移除Markdown标记
      .trim()
    
    const summary = textContent.length > 150 
      ? textContent.substring(0, 150) + '...'
      : textContent
    
    setPost(prev => ({ ...prev, excerpt: summary }))
    success('摘要已自动生成！')
  }

  const handleCreateCategory = async (categoryName: string) => {
    try {
      const response = await blogApi.createCategory({ name: categoryName })
      if (response.success && response.data) {
        const newCategory = response.data
        setCategories(prev => [...prev, newCategory])
        setPost(prev => ({ ...prev, category: newCategory.name }))
        success(`分类"${categoryName}"创建成功！`)
      } else {
        error(response.message || '创建分类失败')
      }
    } catch (err: any) {
      console.error('Failed to create category:', err)
      if (err.statusCode === 409) {
        error('分类名称已存在')
      } else {
        error('创建分类失败，请稍后重试')
      }
    }
  }

  const handleCreateTag = async (tagName: string) => {
    try {
      const response = await blogApi.createTag({ name: tagName })
      if (response.success && response.data) {
        const newTag = response.data
        setTags(prev => [...prev, newTag])
        setPost(prev => ({ ...prev, tags: [...prev.tags, newTag.name] }))
        success(`标签"${tagName}"创建成功！`)
      } else {
        error(response.message || '创建标签失败')
      }
    } catch (err: any) {
      console.error('Failed to create tag:', err)
      if (err.statusCode === 409) {
        error('标签名称已存在')
      } else {
        error('创建标签失败，请稍后重试')
      }
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
            <div className="flex items-center space-x-2">
              <Switch
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <span className="text-sm text-gray-600">
                {isPublished ? '已发布' : '草稿'}
              </span>
            </div>
            <Button
              onClick={() => handleSave()}
              disabled={saving}
              className={isPublished ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : (isPublished ? '发布文章' : '保存草稿')}
            </Button>
          </div>
        </div>

        {/* 文章统计信息（仅编辑时显示） */}
        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">浏览量</p>
                    <p className="text-lg font-semibold">{post.views || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">点赞数</p>
                    <p className="text-lg font-semibold">{post.likes || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">评论数</p>
                    <p className="text-lg font-semibold">{post.comments || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">更新时间</p>
                    <p className="text-sm font-medium">
                      {new Date(post.updatedAt || '').toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 标签和分类控制区域 */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 分类选择 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">文章分类</label>
                <Combobox
                  options={categories.map(cat => ({
                    value: cat.name,
                    label: cat.name,
                    color: cat.color
                  }))}
                  value={post.category}
                  onValueChange={(value) => setPost(prev => ({ ...prev, category: value }))}
                  placeholder="选择或创建分类..."
                  searchPlaceholder="搜索分类..."
                  emptyText="未找到分类"
                  allowCreate={true}
                  onCreateNew={handleCreateCategory}
                  className="w-full"
                />
              </div>

              {/* 标签管理 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">文章标签</label>
                <MultiCombobox
                  options={tags.map(tag => ({
                    value: tag.name,
                    label: tag.name,
                    color: tag.color
                  }))}
                  values={post.tags}
                  onValuesChange={(values) => setPost(prev => ({ ...prev, tags: values }))}
                  placeholder="选择或创建标签..."
                  searchPlaceholder="搜索标签..."
                  emptyText="未找到标签"
                  allowCreate={true}
                  onCreateNew={handleCreateTag}
                  className="w-full"
                />
                
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.tags.map((tag) => {
                      const tagInfo = tags.find(t => t.name === tag)
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          style={tagInfo?.color ? {
                            backgroundColor: `${tagInfo.color}20`,
                            color: tagInfo.color,
                            borderColor: tagInfo.color
                          } : {}}
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 hover:opacity-70"
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主编辑区域 - 统一的标题和内容编辑器 */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* 文章标题 */}
              <div>
                <Input
                  placeholder="输入文章标题..."
                  value={post.title}
                  onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
                  className="text-2xl font-bold border-0 px-0 focus:ring-0 placeholder:text-gray-400"
                />
              </div>

              {/* 文章摘要 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">文章摘要</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSummary}
                    disabled={!post.content}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    自动生成
                  </Button>
                </div>
                <Textarea
                  placeholder="输入文章摘要..."
                  value={post.excerpt}
                  onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* 封面图片 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">封面图片</label>
                <div className="flex space-x-4">
                  <Input
                    placeholder="输入图片 URL..."
                    value={post.coverImage || ''}
                    onChange={(e) => setPost(prev => ({ ...prev, coverImage: e.target.value }))}
                    className="flex-1"
                  />
                  {post.coverImage && (
                    <div className="relative">
                      <img
                        src={post.coverImage}
                        alt="封面预览"
                        className="w-20 h-12 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <hr className="my-6" />

              {/* 文章内容编辑器 */}
              <div>
                <TiptapEditor
                  content={post.content}
                  onChange={(value) => setPost(prev => ({ ...prev, content: value }))}
                  placeholder="开始编写你的文章内容..."
                  editable={true}
                  showToolbar={true}
                  authToken={typeof window !== 'undefined' ? localStorage.getItem('admin_token') || undefined : undefined}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  )
}

export default PostEditPage
