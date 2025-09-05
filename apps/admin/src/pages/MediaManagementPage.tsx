import React, { useState, useRef } from 'react'
import { Upload, Image, Video, FileText, Trash2, Edit, Eye, Download, Search, Filter } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import ProtectedPage from '../components/ProtectedPage'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { DataTable } from '../components/tables/DataTable'
import { Modal } from '../components/modals/Modal'


interface Media {
  id: string
  filename: string
  originalName: string
  type: string
  format: string
  size: number
  url: string
  thumbnailUrl?: string
  status: string
  uploadedBy: string
  uploadedAt: string
  tags: string[]
  width?: number
  height?: number
  duration?: number
  pageCount?: number
}

const MediaManagementPage: React.FC = () => {
  const [media, setMedia] = useState<Media[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Media[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 过滤媒体
  const filteredMedia = media.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.ceil(filteredMedia.length / 10)

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 状态标签
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ready: { label: '就绪', className: 'bg-green-100 text-green-800' },
      processing: { label: '处理中', className: 'bg-yellow-100 text-yellow-800' },
      failed: { label: '失败', className: 'bg-red-100 text-red-800' },
      uploading: { label: '上传中', className: 'bg-blue-100 text-blue-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ready
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  // 类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4 text-blue-600" />
      case 'video':
        return <Video className="h-4 w-4 text-purple-600" />
      case 'audio':
        return <div className="h-4 w-4 text-green-600">🎵</div>
      case 'document':
        return <FileText className="h-4 w-4 text-orange-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  // 缩略图渲染
  const getThumbnail = (item: Media) => {
    if (item.thumbnailUrl) {
      return (
        <img
          src={item.thumbnailUrl}
          alt={item.originalName}
          className="w-12 h-12 object-cover rounded"
        />
      )
    }
    return (
      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
        {getTypeIcon(item.type)}
      </div>
    )
  }

  // 操作按钮
  const getActionButtons = (item: Media) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(item.url, '_blank')}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedMedia(item)
          setIsEditModalOpen(true)
        }}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(item.url, '_blank')}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedMedia(item)
          setIsDeleteModalOpen(true)
        }}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file, index) => {
      // 模拟上传进度
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          // 创建新的媒体项
          const newMedia: Media = {
            id: Date.now().toString() + index,
            filename: file.name,
            originalName: file.name,
            type: file.type.startsWith('image/') ? 'image' : 
                  file.type.startsWith('video/') ? 'video' : 
                  file.type.startsWith('audio/') ? 'audio' : 'document',
            format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
            size: file.size,
            url: URL.createObjectURL(file),
            thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            status: 'ready',
            uploadedBy: '当前用户',
            uploadedAt: new Date().toISOString(),
            tags: []
          }
          
          setMedia(prev => [newMedia, ...prev])
        }
        setUploadProgress(progress)
      }, 200)
    })

    // 清理文件输入
    event.target.value = ''
    setIsUploadModalOpen(false)
  }

  // 删除媒体
  const handleDeleteMedia = () => {
    if (!selectedMedia) return
    
    setMedia(prev => prev.filter(item => item.id !== selectedMedia.id))
    setSelectedMedia(null)
    setIsDeleteModalOpen(false)
  }

  // 批量删除
  const handleBatchDelete = () => {
    setMedia(prev => prev.filter(item => 
      !selectedRows.some(selected => selected.id === item.id)
    ))
    setSelectedRows([])
    setIsDeleteModalOpen(false)
  }

  // 表格列配置
  const columns = [
    { key: 'thumbnail', title: '缩略图', render: getThumbnail },
    { key: 'filename', title: '文件名', render: (item: Media) => (
      <div>
        <p className="font-medium">{item.filename}</p>
        <p className="text-sm text-muted-foreground">{item.originalName}</p>
      </div>
    )},
    { key: 'type', title: '类型', render: (item: Media) => (
      <div className="flex items-center space-x-2">
        {getTypeIcon(item.type)}
        <span className="capitalize">{item.type}</span>
      </div>
    )},
    { key: 'size', title: '大小', render: (item: Media) => formatFileSize(item.size) },
    { key: 'status', title: '状态', render: (item: Media) => getStatusBadge(item.status) },
    { key: 'uploadedBy', title: '上传者' },
    { key: 'uploadedAt', title: '上传时间', render: (item: Media) => 
      new Date(item.uploadedAt).toLocaleDateString('zh-CN')
    },
    { key: 'actions', title: '操作', render: getActionButtons }
  ]

  return (
    <ProtectedPage>
      <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">媒体管理</h1>
          <p className="text-muted-foreground">管理所有媒体文件</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          上传媒体
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索文件名、原始名称或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                <SelectItem value="image">图片</SelectItem>
                <SelectItem value="video">视频</SelectItem>
                <SelectItem value="audio">音频</SelectItem>
                <SelectItem value="document">文档</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="ready">就绪</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作 */}
      {selectedRows.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                已选择 {selectedRows.length} 个媒体文件
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRows([])}
                >
                  取消选择
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  批量删除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Image className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">总文件数</p>
                <p className="text-2xl font-bold">{media.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Image className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">图片文件</p>
                <p className="text-2xl font-bold">
                  {media.filter(m => m.type === 'image').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">视频文件</p>
                <p className="text-2xl font-bold">
                  {media.filter(m => m.type === 'video').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">文档文件</p>
                <p className="text-2xl font-bold">
                  {media.filter(m => m.type === 'document').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>媒体列表</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredMedia}
            columns={columns}
            pageSize={10}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onRowSelect={setSelectedRows}
            selectable={true}
          />
        </CardContent>
      </Card>

      {/* 上传媒体模态框 */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="上传媒体文件"
        size="lg"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">拖拽文件到此处或点击选择</p>
            <p className="text-sm text-muted-foreground mb-4">
              支持图片、视频、音频和文档格式
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              选择文件
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>上传进度</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              取消
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑媒体模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑媒体信息"
        size="lg"
      >
        {selectedMedia && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {getThumbnail(selectedMedia)}
              <div>
                <h3 className="font-medium">{selectedMedia.originalName}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedMedia.size)} • {selectedMedia.format}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">原始名称</label>
              <Input defaultValue={selectedMedia.originalName} />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">标签</label>
              <Input
                placeholder="输入标签，用逗号分隔"
                defaultValue={selectedMedia.tags.join(', ')}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                取消
              </Button>
              <Button>保存修改</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="确认删除"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {selectedRows.length > 0 
              ? `确定要删除选中的 ${selectedRows.length} 个媒体文件吗？此操作不可恢复。`
              : selectedMedia 
                ? `确定要删除媒体文件"${selectedMedia.originalName}"吗？此操作不可恢复。`
                : ''
            }
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={selectedRows.length > 0 ? handleBatchDelete : handleDeleteMedia}>
              确认删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </ProtectedPage>
  )
}

export default MediaManagementPage
