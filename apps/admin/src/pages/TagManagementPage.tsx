import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
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
  RefreshCw,
  Tag as TagIcon,
  Eye
} from 'lucide-react'
import { blogApi, type Tag, type CreateTagDto, type UpdateTagDto } from '@whispers/utils'
import { useToastContext } from '../contexts/ToastContext'

interface TagFormData {
  name: string
  description: string
  color: string
}

const TagManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { success, error } = useToastContext()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    description: '',
    color: '#10B981'
  })
  const [saving, setSaving] = useState(false)

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      if (token) {
        blogApi.setToken(token)
      }
      
      const response = await blogApi.getTags()
      if (response.success && response.data) {
        setTags(response.data)
      } else {
        error('获取标签列表失败')
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err)
      error('获取标签列表失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const handleCreateTag = async () => {
    if (!formData.name.trim()) {
      error('请输入标签名称')
      return
    }

    try {
      setSaving(true)
      const tagData: CreateTagDto = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color
      }

      const response = await blogApi.createTag(tagData)
      if (response.success && response.data) {
        setTags(prev => [...prev, response.data])
        setFormData({ name: '', description: '', color: '#10B981' })
        setShowCreateForm(false)
        success('标签创建成功！')
      } else {
        error(response.message || '创建标签失败')
      }
    } catch (err: any) {
      console.error('Failed to create tag:', err)
      if (err.statusCode === 409) {
        error('标签名称已存在，请使用其他名称')
      } else {
        error('创建标签失败，请稍后重试')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !formData.name.trim()) {
      error('请输入标签名称')
      return
    }

    try {
      setSaving(true)
      const tagData: UpdateTagDto = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color
      }

      const response = await blogApi.updateTag(editingTag.id, tagData)
      if (response.success && response.data) {
        setTags(prev => prev.map(tag => 
          tag.id === editingTag.id ? response.data : tag
        ))
        setFormData({ name: '', description: '', color: '#10B981' })
        setEditingTag(null)
        success('标签更新成功！')
      } else {
        error(response.message || '更新标签失败')
      }
    } catch (err: any) {
      console.error('Failed to update tag:', err)
      if (err.statusCode === 409) {
        error('标签名称已存在，请使用其他名称')
      } else {
        error('更新标签失败，请稍后重试')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    const tag = tags.find(t => t.id === tagId)
    if (!tag) return

    if (tag.postCount > 0) {
      error(`无法删除标签"${tag.name}"，该标签下还有 ${tag.postCount} 篇文章`)
      return
    }

    if (!confirm(`确定要删除标签"${tag.name}"吗？此操作不可恢复。`)) {
      return
    }

    try {
      const response = await blogApi.deleteTag(tagId)
      if (response.success) {
        setTags(prev => prev.filter(tag => tag.id !== tagId))
        success('标签删除成功！')
      } else {
        error(response.message || '删除标签失败')
      }
    } catch (err) {
      console.error('Failed to delete tag:', err)
      error('删除标签失败，请检查网络连接')
    }
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color || '#10B981'
    })
    setShowCreateForm(true)
  }

  const handleCancelEdit = () => {
    setEditingTag(null)
    setFormData({ name: '', description: '', color: '#10B981' })
    setShowCreateForm(false)
  }

  const handleViewPosts = (tagId: string) => {
    navigate(`/admin/posts?tag=${tagId}`)
  }

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tag.description || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <ProtectedPage>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">标签管理</h1>
            <p className="text-gray-600">管理文章标签，包括创建、编辑和删除</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建标签
          </Button>
        </div>

        {/* 创建/编辑标签表单 */}
        {showCreateForm && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {editingTag ? '编辑标签' : '创建新标签'}
                  </h3>
                  <Button variant="ghost" onClick={handleCancelEdit}>
                    取消
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">标签名称 *</label>
                    <Input
                      placeholder="输入标签名称..."
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">标签颜色</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#10B981"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">标签描述</label>
                  <Textarea
                    placeholder="输入标签描述..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Button
                    onClick={editingTag ? handleUpdateTag : handleCreateTag}
                    disabled={saving || !formData.name.trim()}
                  >
                    {saving ? '保存中...' : (editingTag ? '更新标签' : '创建标签')}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    取消
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 搜索 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索标签名称或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                <Filter className="h-4 w-4 mr-2" />
                重置
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 标签列表 */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              data={filteredTags}
              columns={[
                {
                  key: 'name',
                  title: '标签名称',
                  render: (tag: Tag) => (
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: tag.color || '#10B981' }}
                      />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                  )
                },
                {
                  key: 'description',
                  title: '描述',
                  render: (tag: Tag) => (
                    <div className="max-w-xs text-sm text-gray-600 truncate">
                      {tag.description || '无描述'}
                    </div>
                  )
                },
                {
                  key: 'postCount',
                  title: '文章数量',
                  render: (tag: Tag) => (
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{tag.postCount}</span>
                    </div>
                  )
                },
                {
                  key: 'createdAt',
                  title: '创建时间',
                  render: (tag: Tag) => (
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(tag.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'actions',
                  title: '操作',
                  render: (tag: Tag) => (
                    <div className="flex items-center space-x-2">
                      {tag.postCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPosts(tag.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看文章
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTag(tag)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={tag.postCount > 0}
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
        {filteredTags.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? '没有找到匹配的标签' : '还没有标签'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? '尝试调整搜索条件' : '开始创建你的第一个标签吧！'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建标签
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedPage>
  )
}

export default TagManagementPage
