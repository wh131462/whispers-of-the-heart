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
  Palette,
  Eye
} from 'lucide-react'
import { blogApi, type Category, type CreateCategoryDto, type UpdateCategoryDto } from '@whispers/utils'
import { useToastContext } from '../contexts/ToastContext'

interface CategoryFormData {
  name: string
  description: string
  color: string
}

const CategoryManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { success, error } = useToastContext()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#3B82F6'
  })
  const [saving, setSaving] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      if (token) {
        blogApi.setToken(token)
      }
      
      const response = await blogApi.getCategories()
      if (response.success && response.data) {
        setCategories(response.data)
      } else {
        error('获取分类列表失败')
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      error('获取分类列表失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      error('请输入分类名称')
      return
    }

    try {
      setSaving(true)
      const categoryData: CreateCategoryDto = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color
      }

      const response = await blogApi.createCategory(categoryData)
      if (response.success && response.data) {
        setCategories(prev => [...prev, response.data])
        setFormData({ name: '', description: '', color: '#3B82F6' })
        setShowCreateForm(false)
        success('分类创建成功！')
      } else {
        error(response.message || '创建分类失败')
      }
    } catch (err: any) {
      console.error('Failed to create category:', err)
      if (err.statusCode === 409) {
        error('分类名称已存在，请使用其他名称')
      } else {
        error('创建分类失败，请稍后重试')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !formData.name.trim()) {
      error('请输入分类名称')
      return
    }

    try {
      setSaving(true)
      const categoryData: UpdateCategoryDto = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color
      }

      const response = await blogApi.updateCategory(editingCategory.id, categoryData)
      if (response.success && response.data) {
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id ? response.data : cat
        ))
        setFormData({ name: '', description: '', color: '#3B82F6' })
        setEditingCategory(null)
        success('分类更新成功！')
      } else {
        error(response.message || '更新分类失败')
      }
    } catch (err: any) {
      console.error('Failed to update category:', err)
      if (err.statusCode === 409) {
        error('分类名称已存在，请使用其他名称')
      } else {
        error('更新分类失败，请稍后重试')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) return

    if (category.postCount > 0) {
      error(`无法删除分类"${category.name}"，该分类下还有 ${category.postCount} 篇文章`)
      return
    }

    if (!confirm(`确定要删除分类"${category.name}"吗？此操作不可恢复。`)) {
      return
    }

    try {
      const response = await blogApi.deleteCategory(categoryId)
      if (response.success) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId))
        success('分类删除成功！')
      } else {
        error(response.message || '删除分类失败')
      }
    } catch (err) {
      console.error('Failed to delete category:', err)
      error('删除分类失败，请检查网络连接')
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6'
    })
    setShowCreateForm(true)
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '', color: '#3B82F6' })
    setShowCreateForm(false)
  }

  const handleViewPosts = (categoryId: string) => {
    navigate(`/admin/posts?category=${categoryId}`)
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description || '').toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-gray-900">分类管理</h1>
            <p className="text-gray-600">管理文章分类，包括创建、编辑和删除</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建分类
          </Button>
        </div>

        {/* 创建/编辑分类表单 */}
        {showCreateForm && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {editingCategory ? '编辑分类' : '创建新分类'}
                  </h3>
                  <Button variant="ghost" onClick={handleCancelEdit}>
                    取消
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">分类名称 *</label>
                    <Input
                      placeholder="输入分类名称..."
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">分类颜色</label>
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
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">分类描述</label>
                  <Textarea
                    placeholder="输入分类描述..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Button
                    onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                    disabled={saving || !formData.name.trim()}
                  >
                    {saving ? '保存中...' : (editingCategory ? '更新分类' : '创建分类')}
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
                  placeholder="搜索分类名称或描述..."
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

        {/* 分类列表 */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              data={filteredCategories}
              columns={[
                {
                  key: 'name',
                  title: '分类名称',
                  render: (category: Category) => (
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: category.color || '#3B82F6' }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                  )
                },
                {
                  key: 'description',
                  title: '描述',
                  render: (category: Category) => (
                    <div className="max-w-xs text-sm text-gray-600 truncate">
                      {category.description || '无描述'}
                    </div>
                  )
                },
                {
                  key: 'postCount',
                  title: '文章数量',
                  render: (category: Category) => (
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{category.postCount}</span>
                    </div>
                  )
                },
                {
                  key: 'createdAt',
                  title: '创建时间',
                  render: (category: Category) => (
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(category.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'actions',
                  title: '操作',
                  render: (category: Category) => (
                    <div className="flex items-center space-x-2">
                      {category.postCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPosts(category.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看文章
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={category.postCount > 0}
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
        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? '没有找到匹配的分类' : '还没有分类'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? '尝试调整搜索条件' : '开始创建你的第一个分类吧！'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建分类
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedPage>
  )
}

export default CategoryManagementPage
