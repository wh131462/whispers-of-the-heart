import React, { useState, useEffect } from 'react'
import { Button, Input } from '@whispers/ui'
import { Search, Image, Video, Music, FileText, X, Check, Upload, RefreshCw } from 'lucide-react'
import { api } from '@whispers/utils'

interface Media {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnail?: string
  createdAt: string
}

interface MediaPickerDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string, media?: Media) => void
  filterType?: 'image' | 'video' | 'audio' | 'all'
  multiple?: boolean
  title?: string
}

const MediaPickerDialog: React.FC<MediaPickerDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  filterType = 'all',
  multiple: _multiple = false,
  title = '选择媒体文件'
}) => {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  // 当 filterType 不是 'all' 时，锁定为指定类型
  const [activeFilter, setActiveFilter] = useState(filterType)
  const isFilterLocked = filterType !== 'all'

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
    }
  }, [isOpen, page, activeFilter])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 24 }

      if (activeFilter !== 'all') {
        params.type = `${activeFilter}/`
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
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchMedia()
  }

  // 验证媒体类型是否符合 filterType 要求
  const isMediaTypeAllowed = (media: Media) => {
    if (filterType === 'all') return true
    return media.mimeType.startsWith(`${filterType}/`)
  }

  const handleMediaClick = (media: Media) => {
    // 如果 filterType 锁定，验证类型是否匹配
    if (isFilterLocked && !isMediaTypeAllowed(media)) {
      return // 不允许选择不匹配的类型
    }
    setSelectedMedia(media)
  }

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia.url, selectedMedia)
      onClose()
      setSelectedMedia(null)
    }
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
      fetchMedia()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-6 w-6 text-blue-500" />
    if (mimeType.startsWith('video/')) return <Video className="h-6 w-6 text-purple-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-6 w-6 text-green-500" />
    return <FileText className="h-6 w-6 text-orange-500" />
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-background">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
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

            {/* Filters - 只在 filterType 为 'all' 时显示 */}
            {!isFilterLocked && (
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {(['all', 'image', 'video', 'audio'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setActiveFilter(type); setPage(1); }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeFilter === type
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type === 'all' ? '全部' :
                     type === 'image' ? '图片' :
                     type === 'video' ? '视频' : '音频'}
                  </button>
                ))}
              </div>
            )}

            {/* Upload */}
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept={
                  filterType === 'image' ? 'image/*' :
                  filterType === 'video' ? 'video/*' :
                  filterType === 'audio' ? 'audio/*' :
                  'image/*,video/*,audio/*,.pdf,.doc,.docx'
                }
                onChange={handleUpload}
                className="hidden"
              />
              <Button variant="outline" disabled={uploading} asChild>
                <span>
                  {uploading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  上传
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-auto p-4 bg-muted/20">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Image className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">暂无媒体文件</p>
              <p className="text-sm mt-1">上传文件开始使用</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {media.map((item) => {
                const isAllowed = isMediaTypeAllowed(item)
                return (
                <div
                  key={item.id}
                  onClick={() => handleMediaClick(item)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                    !isAllowed
                      ? 'opacity-40 cursor-not-allowed'
                      : selectedMedia?.id === item.id
                        ? 'border-primary ring-2 ring-primary/30 scale-[1.02] cursor-pointer'
                        : 'border-transparent hover:border-border hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    {item.mimeType.startsWith('image/') ? (
                      <img
                        src={item.thumbnail || item.url}
                        alt={item.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        {getTypeIcon(item.mimeType)}
                        <span className="text-xs text-muted-foreground mt-2 px-2 truncate max-w-full">
                          {item.mimeType.split('/')[1]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {selectedMedia?.id === item.id && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-lg">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}

                  {/* Hover overlay with filename */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">{item.originalName}</p>
                  </div>
                </div>
              )
              })}
            </div>
          )}
        </div>

        {/* Selected File Info */}
        {selectedMedia && (
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {selectedMedia.mimeType.startsWith('image/') ? (
                  <img
                    src={selectedMedia.thumbnail || selectedMedia.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getTypeIcon(selectedMedia.mimeType)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{selectedMedia.originalName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedMedia.size)} · {selectedMedia.mimeType}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-background">
          {/* Pagination */}
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  下一页
                </Button>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSelect} disabled={!selectedMedia}>
              <Check className="h-4 w-4 mr-2" />
              选择
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaPickerDialog
