import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input } from '@whispers/ui'
import {
  Upload,
  Image,
  Video,
  FileText,
  Music,
  Trash2,
  Search,
  RefreshCw,
  Copy,
  ExternalLink,
  Grid,
  List,
  Download,
  AlertTriangle,
  X
} from 'lucide-react'
import { api } from '@whispers/utils'
import { useToastContext } from '../../contexts/ToastContext'
import { FilePreviewModal, type PreviewFileLink } from '@eternalheart/react-file-preview'
import '@eternalheart/react-file-preview/style.css'

interface MediaReference {
  postId: string
  postTitle: string
  type: 'cover' | 'content'
}

// 新的媒体使用信息（来自 MediaUsage 关联表）
interface MediaUsageInfo {
  entityType: 'post' | 'user' | 'site_config'
  entityId: string
  entityName: string
  fieldName: 'avatar' | 'coverImage' | 'content' | 'aboutMe'
  fieldLabel: string
}

interface DeleteConfirmState {
  isOpen: boolean
  mediaId?: string
  mediaIds?: string[]
  references: MediaReference[]
  usages: MediaUsageInfo[]
  isBatch: boolean
}

interface Media {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnail?: string
  tags: string[]
  createdAt: string
  uploader: {
    id: string
    username: string
    avatar?: string
  }
}

interface MediaStats {
  total: number
  images: number
  videos: number
  audios: number
  documents: number
  totalSize: number
}

const MediaPage: React.FC = () => {
  const { success, error: showError } = useToastContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [media, setMedia] = useState<Media[]>([])
  const [stats, setStats] = useState<MediaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 删除确认对话框状态
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    references: [],
    usages: [],
    isBatch: false
  })
  const [deleting, setDeleting] = useState(false)
  const [fullscreenPreview, setFullscreenPreview] = useState<Media | null>(null)

  useEffect(() => {
    fetchMedia()
    fetchStats()
  }, [page, typeFilter])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = { page, limit: 24 }
      if (typeFilter !== 'all') {
        params.type = typeFilter
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      const response = await api.get('/media', { params })
      if (response.data?.success) {
        setMedia(response.data.data.items || [])
        setTotalPages(response.data.data.totalPages || 1)
      }
    } catch (err) {
      console.error('Failed to fetch media:', err)
      showError('获取媒体列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/media/stats')
      if (response.data?.success) {
        setStats(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchMedia()
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      success(`成功上传 ${files.length} 个文件`)
      fetchMedia()
      fetchStats()
    } catch (err) {
      console.error('Upload failed:', err)
      showError('上传失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (mediaId: string) => {
    try {
      await api.delete(`/media/${mediaId}`)
      setMedia(prev => prev.filter(m => m.id !== mediaId))
      success('文件已删除')
      fetchStats()
      setDeleteConfirm({ isOpen: false, references: [], usages: [], isBatch: false })
    } catch (err: any) {
      console.error('Delete failed:', err)
      // 检查是否是引用冲突错误
      if (err.response?.status === 409) {
        const errorData = err.response.data
        setDeleteConfirm({
          isOpen: true,
          mediaId,
          references: errorData.references || [],
          usages: errorData.usages || [],
          isBatch: false
        })
      } else {
        showError('删除失败')
      }
    }
  }

  const handleForceDelete = async () => {
    setDeleting(true)
    try {
      if (deleteConfirm.isBatch && deleteConfirm.mediaIds) {
        await api.post('/media/batch/delete', {
          ids: deleteConfirm.mediaIds,
          force: true
        })
        setMedia(prev => prev.filter(m => !deleteConfirm.mediaIds?.includes(m.id)))
        setSelectedIds(new Set())
        success(`成功删除 ${deleteConfirm.mediaIds.length} 个文件`)
      } else if (deleteConfirm.mediaId) {
        await api.delete(`/media/${deleteConfirm.mediaId}?force=true`)
        setMedia(prev => prev.filter(m => m.id !== deleteConfirm.mediaId))
        success('文件已删除')
      }
      fetchStats()
      setDeleteConfirm({ isOpen: false, references: [], usages: [], isBatch: false })
    } catch (err) {
      console.error('Force delete failed:', err)
      showError('删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return

    try {
      await api.post('/media/batch/delete', { ids: Array.from(selectedIds) })
      setMedia(prev => prev.filter(m => !selectedIds.has(m.id)))
      setSelectedIds(new Set())
      success(`成功删除 ${selectedIds.size} 个文件`)
      fetchStats()
    } catch (err: any) {
      console.error('Batch delete failed:', err)
      // 检查是否是引用冲突错误
      if (err.response?.status === 409) {
        const errorData = err.response.data
        // 收集所有引用和使用记录
        const allReferences: MediaReference[] = []
        const allUsages: MediaUsageInfo[] = []
        if (errorData.referencedMedia) {
          for (const item of errorData.referencedMedia) {
            if (item.references) {
              allReferences.push(...item.references)
            }
            if (item.usages) {
              allUsages.push(...item.usages)
            }
          }
        }
        setDeleteConfirm({
          isOpen: true,
          mediaIds: Array.from(selectedIds),
          references: allReferences,
          usages: allUsages,
          isBatch: true
        })
      } else {
        showError('批量删除失败')
      }
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    success('已复制到剪贴板')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-5 w-5 text-green-500" />
    return <FileText className="h-5 w-5 text-orange-500" />
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const openPreview = (item: Media) => {
    setSelectedMedia(item)
  }

  if (loading && media.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">媒体库</h1>
          <p className="text-muted-foreground mt-1">管理上传的图片、视频和文档</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedIds.size > 0 && (
            <Button variant="outline" onClick={handleBatchDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              删除选中 ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? '上传中...' : '上传文件'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">总文件数</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <Image className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">图片</p>
                <p className="text-xl font-bold text-foreground">{stats.images}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">视频</p>
                <p className="text-xl font-bold text-foreground">{stats.videos}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <Music className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">音频</p>
                <p className="text-xl font-bold text-foreground">{stats.audios}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">总大小</p>
                <p className="text-xl font-bold text-foreground">{formatFileSize(stats.totalSize)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文件名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'image/', 'video/', 'audio/'] as const).map((type) => (
              <button
                key={type}
                onClick={() => { setTypeFilter(type); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {type === 'all' ? '全部' :
                 type === 'image/' ? '图片' :
                 type === 'video/' ? '视频' : '音频'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-muted' : ''}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-muted' : ''}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      <div className="bg-card rounded-lg shadow p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className={`relative group rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                  selectedIds.has(item.id) ? 'border-primary' : 'border-transparent hover:border-border'
                }`}
                onClick={() => openPreview(item)}
              >
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {item.mimeType.startsWith('image/') ? (
                    <img
                      src={item.url}
                      alt={item.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      {getTypeIcon(item.mimeType)}
                      <span className="text-xs text-muted-foreground mt-1">
                        {item.mimeType.split('/')[1]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs text-foreground truncate">{item.originalName}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                </div>
                {/* Selection checkbox */}
                <div
                  className="absolute top-2 left-2"
                  onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIds.has(item.id)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-card border-border group-hover:border-muted-foreground'
                  }`}>
                    {selectedIds.has(item.id) && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {media.map((item) => (
              <div
                key={item.id}
                className={`flex items-center p-3 hover:bg-muted cursor-pointer ${
                  selectedIds.has(item.id) ? 'bg-primary/10' : ''
                }`}
                onClick={() => openPreview(item)}
              >
                <div
                  className="mr-3"
                  onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIds.has(item.id)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-card border-border'
                  }`}>
                    {selectedIds.has(item.id) && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center mr-3 flex-shrink-0">
                  {item.mimeType.startsWith('image/') ? (
                    <img src={item.url} alt="" className="w-full h-full object-cover rounded" />
                  ) : (
                    getTypeIcon(item.mimeType)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.originalName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(item.size)} - {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(item.url); }}
                    className="p-2 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="p-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {media.length === 0 && (
          <div className="py-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">暂无媒体文件</h3>
            <p className="text-muted-foreground mb-4">上传图片、视频或文档开始使用</p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              上传文件
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            上一页
          </Button>
          <span className="px-4 py-2 text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirm({ isOpen: false, references: [], usages: [], isBatch: false })} />
          <div className="relative bg-card rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <button
              onClick={() => setDeleteConfirm({ isOpen: false, references: [], usages: [], isBatch: false })}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  文件正在被使用
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {deleteConfirm.isBatch
                    ? '部分选中的文件正在被引用：'
                    : '该文件正在被引用：'
                  }
                </p>

                <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
                  {/* 显示新的 usages（来自 MediaUsage 关联表） */}
                  {deleteConfirm.usages.map((usage, index) => (
                    <div key={`usage-${index}`} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      {usage.entityType === 'post' ? (
                        <Link
                          to={`/admin/posts/edit/${usage.entityId}`}
                          className="text-sm text-primary hover:underline truncate"
                          onClick={() => setDeleteConfirm({ isOpen: false, references: [], usages: [], isBatch: false })}
                        >
                          {usage.entityName}
                        </Link>
                      ) : (
                        <span className="text-sm text-foreground truncate">{usage.entityName}</span>
                      )}
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({usage.entityType === 'post' ? '文章' : usage.entityType === 'user' ? '用户' : '站点配置'} - {usage.fieldLabel})
                      </span>
                    </div>
                  ))}
                  {/* 显示旧的 references（兼容旧数据） */}
                  {deleteConfirm.references.map((ref, index) => (
                    <div key={`ref-${index}`} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Link
                        to={`/admin/posts/edit/${ref.postId}`}
                        className="text-sm text-primary hover:underline truncate"
                        onClick={() => setDeleteConfirm({ isOpen: false, references: [], usages: [], isBatch: false })}
                      >
                        {ref.postTitle}
                      </Link>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        (文章 - {ref.type === 'cover' ? '封面' : '内容'})
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  强制删除后，相关文章中的图片将无法显示。确定要继续吗？
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDeleteConfirm({ isOpen: false, references: [], usages: [], isBatch: false })}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleForceDelete}
                    disabled={deleting}
                  >
                    {deleting ? '删除中...' : '强制删除'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文件详情侧边栏 */}
      {selectedMedia && (
        <div className="fixed inset-y-0 right-0 w-96 bg-card shadow-xl border-l border-border z-40 flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground truncate">文件详情</h2>
            <button
              onClick={() => setSelectedMedia(null)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 预览区域 */}
          <div className="p-4 border-b border-border">
            <div
              className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer"
              onClick={() => setFullscreenPreview(selectedMedia)}
            >
              {selectedMedia.mimeType.startsWith('image/') ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.originalName}
                  className="w-full h-full object-contain"
                />
              ) : selectedMedia.mimeType.startsWith('video/') ? (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Video className="h-12 w-12" />
                  <span className="text-xs mt-2">点击预览视频</span>
                </div>
              ) : selectedMedia.mimeType.startsWith('audio/') ? (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Music className="h-12 w-12" />
                  <span className="text-xs mt-2">点击预览音频</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  {getTypeIcon(selectedMedia.mimeType)}
                  <span className="text-xs mt-2">点击预览文件</span>
                </div>
              )}
              {/* 悬停遮罩 */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">点击预览</span>
              </div>
            </div>
          </div>

          {/* 文件信息 */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">文件名</h3>
              <p className="text-foreground break-all">{selectedMedia.originalName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">类型</h3>
                <p className="text-foreground text-sm">{selectedMedia.mimeType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">大小</h3>
                <p className="text-foreground text-sm">{formatFileSize(selectedMedia.size)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">上传时间</h3>
                <p className="text-foreground text-sm">
                  {new Date(selectedMedia.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">上传者</h3>
                <p className="text-foreground text-sm">{selectedMedia.uploader.username}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">文件链接</h3>
              <div className="flex items-center gap-2">
                <Input
                  value={selectedMedia.url}
                  readOnly
                  className="flex-1 text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(selectedMedia.url)}
                  title="复制链接"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(selectedMedia.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                打开
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = selectedMedia.url
                  a.download = selectedMedia.originalName
                  a.click()
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                下载
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                handleDelete(selectedMedia.id)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除文件
            </Button>
          </div>
        </div>
      )}

      {/* 全屏预览模态框 */}
      <FilePreviewModal
        files={media.map((m): PreviewFileLink => ({
          id: m.id,
          name: m.originalName,
          url: m.url,
          type: m.mimeType,
          size: m.size
        }))}
        currentIndex={fullscreenPreview ? media.findIndex(m => m.id === fullscreenPreview.id) : 0}
        isOpen={!!fullscreenPreview}
        onClose={() => setFullscreenPreview(null)}
        onNavigate={(index) => setFullscreenPreview(media[index])}
      />
    </div>
  )
}

export default MediaPage
