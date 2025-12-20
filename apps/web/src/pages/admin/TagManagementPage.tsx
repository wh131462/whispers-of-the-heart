import React, { useState, useEffect } from 'react'
import { Button, Input } from '@whispers/ui'
import {
  Plus,
  Edit,
  Trash2,
  Tag as TagIcon,
  Search,
  Loader2,
  X
} from 'lucide-react'
import { blogApi, api } from '@whispers/utils'
import { useToastContext } from '../../contexts/ToastContext'
import { useAuthStore } from '../../stores/useAuthStore'

interface Tag {
  id: string
  name: string
  slug: string
  color?: string
  postCount?: number
  createdAt: string
  updatedAt: string
}

const TagManagementPage: React.FC = () => {
  const { success, error: showError } = useToastContext()
  const { accessToken } = useAuthStore()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // 编辑/新建对话框状态
  const [showDialog, setShowDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [tagForm, setTagForm] = useState({ name: '', color: '#3B82F6' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (accessToken) {
      blogApi.setToken(accessToken)
    }
    fetchTags()
  }, [accessToken])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const response = await blogApi.getTags()
      if (response.success && response.data) {
        setTags(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err)
      showError('获取标签列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag)
      setTagForm({ name: tag.name, color: tag.color || '#3B82F6' })
    } else {
      setEditingTag(null)
      setTagForm({ name: '', color: '#3B82F6' })
    }
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingTag(null)
    setTagForm({ name: '', color: '#3B82F6' })
  }

  const handleSaveTag = async () => {
    if (!tagForm.name.trim()) {
      showError('请输入标签名称')
      return
    }

    try {
      setSaving(true)

      if (editingTag) {
        // 更新标签
        const response = await api.patch(`/admin/tags/${editingTag.id}`, {
          name: tagForm.name,
          color: tagForm.color
        })
        if (response.data?.success) {
          setTags(prev => prev.map(t =>
            t.id === editingTag.id ? { ...t, ...response.data.data } : t
          ))
          success('标签更新成功')
        }
      } else {
        // 创建标签
        const response = await blogApi.createTag({
          name: tagForm.name,
          color: tagForm.color
        })
        if (response.success && response.data) {
          setTags(prev => [...prev, response.data])
          success('标签创建成功')
        }
      }
      handleCloseDialog()
    } catch (err: any) {
      console.error('Failed to save tag:', err)
      if (err.statusCode === 409) {
        showError('标签名称已存在')
      } else {
        showError('保存失败')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTag = async (tag: Tag) => {
    if (!confirm(`确定要删除标签"${tag.name}"吗？`)) {
      return
    }

    try {
      await api.delete(`/admin/tags/${tag.id}`)
      setTags(prev => prev.filter(t => t.id !== tag.id))
      success('标签删除成功')
    } catch (err) {
      console.error('Failed to delete tag:', err)
      showError('删除失败')
    }
  }

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">标签管理</h1>
          <p className="text-muted-foreground mt-1">管理文章标签</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          新建标签
        </Button>
      </div>

      {/* 搜索 */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索标签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 标签列表 */}
      <div className="bg-card rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {filteredTags.map((tag) => (
            <div
              key={tag.id}
              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color || '#3B82F6' }}
                  />
                  <span className="font-medium text-foreground">{tag.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenDialog(tag)}
                    className="p-1 text-muted-foreground hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {tag.postCount || 0} 篇文章
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {filteredTags.length === 0 && (
          <div className="py-12 text-center">
            <TagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ? '没有找到匹配的标签' : '还没有标签'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? '尝试其他搜索词' : '创建第一个标签吧'}
            </p>
            {!searchTerm && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                新建标签
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 编辑/新建对话框 */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {editingTag ? '编辑标签' : '新建标签'}
              </h2>
              <button onClick={handleCloseDialog} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  标签名称
                </label>
                <Input
                  value={tagForm.name}
                  onChange={(e) => setTagForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入标签名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  标签颜色
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setTagForm(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        tagForm.color === color ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              <Button onClick={handleSaveTag} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TagManagementPage
