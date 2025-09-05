import React, { useState, useEffect, useRef } from 'react'
import { 
  Upload, 
  Folder, 
  FolderPlus, 
  File, 
  Image, 
  Video, 
  FileText, 
  Music, 
  Archive,
  Trash2, 
  Eye, 
  Download, 
  Search, 
  ChevronRight,
  RefreshCw,
  Edit,
  Move
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Modal } from '../components/modals/Modal'
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator, 
  ContextMenuTrigger
} from '../components/ui/context-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { FilePreviewModal, FilePreviewList } from '@whispers/ui'
import ProtectedPage from '../components/ProtectedPage'
import { useToastContext } from '../contexts/ToastContext'

interface Folder {
  id: string
  name: string
  path: string
  parentId?: string
  description?: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
  children?: Folder[]
  _count: {
    files: number
  }
}

interface FileItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnail?: string
  alt?: string
  description?: string
  tags: string[]
  isPublic: boolean
  downloadCount: number
  createdAt: string
  updatedAt: string
  folder: {
    id: string
    name: string
    path: string
  }
  uploader: {
    id: string
    username: string
    avatar?: string
  }
}

const FileManagementPage: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [folderPath, setFolderPath] = useState<Folder[]>([])
  const [selectedItem, setSelectedItem] = useState<Folder | FileItem | null>(null)
  const [editData, setEditData] = useState({ name: '', description: '' })
  const [moveData, setMoveData] = useState({ targetFolderId: 'root' })
  const [deleteType, setDeleteType] = useState<'folder' | 'file' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { success, error } = useToastContext()

  // 新文件夹表单
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: ''
  })

  // 上传文件表单
  const [uploadData, setUploadData] = useState({
    folderId: 'root',
    description: '',
    tags: '',
    isPublic: true
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFolders()
    fetchFiles()
  }, [currentFolder])

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`http://localhost:7777/api/v1/file-management/folders?parentId=${currentFolder || ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setFolders(result.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err)
    }
  }

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const params = new URLSearchParams()
      if (currentFolder) params.append('folderId', currentFolder)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`http://localhost:7777/api/v1/file-management/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setFiles(result.data.files)
        }
      }
    } catch (err) {
      console.error('Failed to fetch files:', err)
    } finally {
      setLoading(false)
    }
  }

  // 刷新所有数据
  const refreshData = async () => {
    await Promise.all([fetchFolders(), fetchFiles()])
  }

  // 删除文件夹
  const deleteFolder = async (folderId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`http://localhost:7777/api/v1/file-management/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          success('文件夹删除成功')
          await refreshData()
        } else {
          error(result.message)
        }
      } else {
        error('删除文件夹失败')
      }
    } catch (err) {
      error('删除文件夹失败')
    }
  }

  // 删除文件
  const deleteFile = async (fileId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`http://localhost:7777/api/v1/file-management/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          success('文件删除成功')
          await refreshData()
        } else {
          error(result.message)
        }
      } else {
        error('删除文件失败')
      }
    } catch (err) {
      error('删除文件失败')
    }
  }

  // 重命名文件夹
  const renameFolder = async (folderId: string, name: string, description: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`http://localhost:7777/api/v1/file-management/folders/${folderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          success('文件夹重命名成功')
          await refreshData()
        } else {
          error(result.message)
        }
      } else {
        error('重命名文件夹失败')
      }
    } catch (err) {
      error('重命名文件夹失败')
    }
  }

  // 重命名文件
  const renameFile = async (fileId: string, name: string, description: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`http://localhost:7777/api/v1/file-management/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ originalName: name, description })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          success('文件重命名成功')
          await refreshData()
        } else {
          error(result.message)
        }
      } else {
        error('重命名文件失败')
      }
    } catch (err) {
      error('重命名文件失败')
    }
  }

  // 移动文件
  const moveFile = async (fileId: string, targetFolderId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`http://localhost:7777/api/v1/file-management/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folderId: targetFolderId === 'root' ? '' : targetFolderId })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          success('文件移动成功')
          await refreshData()
        } else {
          error(result.message)
        }
      } else {
        error('移动文件失败')
      }
    } catch (err) {
      error('移动文件失败')
    }
  }

  const createFolder = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('http://localhost:7777/api/v1/file-management/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newFolder,
          parentId: currentFolder
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          success('文件夹创建成功')
          setShowFolderModal(false)
          setNewFolder({ name: '', description: '' })
          await refreshData()
        } else {
          error(result.message)
        }
      }
    } catch (err) {
      error('创建文件夹失败')
    }
  }

  const uploadFile = async () => {
    if (!selectedFile) {
      error('请选择要上传的文件')
      return
    }

    if (!uploadData.folderId) {
      error('请选择目标文件夹')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folderId', uploadData.folderId === 'root' ? '' : uploadData.folderId)
      formData.append('description', uploadData.description)
      
      // 处理 tags 为数组格式
      const tagsArray = uploadData.tags 
        ? uploadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : []
      formData.append('tags', JSON.stringify(tagsArray))
      
      formData.append('isPublic', uploadData.isPublic.toString())

      const token = localStorage.getItem('admin_token')
      const response = await fetch('http://localhost:7777/api/v1/file-management/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          success('文件上传成功')
          setShowUploadModal(false)
          setUploadData({ folderId: 'root', description: '', tags: '', isPublic: true })
          setSelectedFile(null)
          await refreshData()
        } else {
          error(result.message)
        }
      } else {
        error('文件上传失败')
      }
    } catch (err) {
      error('文件上传失败')
    } finally {
      setUploading(false)
    }
  }

  // 处理编辑操作
  const handleEdit = (item: Folder | FileItem) => {
    setSelectedItem(item)
    setEditData({
      name: 'name' in item ? item.name : item.originalName,
      description: item.description || ''
    })
    setShowEditModal(true)
  }

  // 处理移动操作
  const handleMove = (item: FileItem) => {
    setSelectedItem(item)
    setMoveData({ targetFolderId: 'root' })
    setShowMoveModal(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!selectedItem) return

    if ('name' in selectedItem) {
      // 文件夹
      await renameFolder(selectedItem.id, editData.name, editData.description)
    } else {
      // 文件
      await renameFile(selectedItem.id, editData.name, editData.description)
    }
    
    setShowEditModal(false)
    setSelectedItem(null)
  }

  // 保存移动
  const handleSaveMove = async () => {
    if (!selectedItem || 'name' in selectedItem) return

    await moveFile(selectedItem.id, moveData.targetFolderId)
    setShowMoveModal(false)
    setSelectedItem(null)
  }

  // 处理删除确认
  const handleDeleteConfirm = (item: Folder | FileItem) => {
    setSelectedItem(item)
    setDeleteType('name' in item ? 'folder' : 'file')
    setShowDeleteDialog(true)
  }

  // 执行删除
  const handleDeleteExecute = async () => {
    if (!selectedItem) return

    if (deleteType === 'folder') {
      await deleteFolder(selectedItem.id)
    } else {
      await deleteFile(selectedItem.id)
    }
    
    setShowDeleteDialog(false)
    setSelectedItem(null)
    setDeleteType(null)
  }

  // 预览文件
  const handlePreviewFile = (file: FileItem) => {
    setPreviewFile(file)
    setShowPreviewModal(true)
  }


  const navigateToFolder = (folder: Folder) => {
    setCurrentFolder(folder.id)
    setFolderPath(prev => [...prev, folder])
  }


  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5 text-red-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-5 w-5 text-green-500" />
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-5 w-5 text-orange-500" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-5 w-5 text-purple-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedPage>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">文件管理</h1>
            <p className="text-gray-600">管理文件和文件夹</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowFolderModal(true)}
              variant="outline"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              新建文件夹
            </Button>
            <Button
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              上传文件
            </Button>
          </div>
        </div>

        {/* 面包屑导航 */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => {
              setCurrentFolder(null)
              setFolderPath([])
            }}
            className="hover:text-gray-900"
          >
            根目录
          </button>
          {folderPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() => {
                  const newPath = folderPath.slice(0, index + 1)
                  setFolderPath(newPath)
                  setCurrentFolder(folder.id)
                }}
                className="hover:text-gray-900"
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* 搜索栏 */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索文件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={refreshData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>

        {/* 文件夹列表 */}
        {folders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Folder className="h-5 w-5 mr-2" />
                文件夹
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <ContextMenu key={folder.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        onClick={() => navigateToFolder(folder)}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Folder className="h-8 w-8 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {folder.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {folder._count.files} 个文件
                            </p>
                            {folder.description && (
                              <p className="text-xs text-gray-400 mt-1">
                                {folder.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => navigateToFolder(folder)}>
                        <Eye className="mr-2 h-4 w-4" />
                        打开
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleEdit(folder)}>
                        <Edit className="mr-2 h-4 w-4" />
                        重命名
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem 
                        onClick={() => handleDeleteConfirm(folder)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 文件列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <File className="h-5 w-5 mr-2" />
                文件
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  列表
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  网格
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : files.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">暂无文件</div>
              </div>
            ) : viewMode === 'grid' ? (
              <FilePreviewList
                files={files.map(file => ({
                  id: file.id,
                  name: file.originalName,
                  url: file.url,
                  type: file.mimeType,
                  size: file.size,
                  originalName: file.originalName
                }))}
                columns={4}
                showFileName={true}
                showFileSize={true}
                onFileClick={(file) => {
                  const originalFile = files.find(f => f.id === file.id)
                  if (originalFile) {
                    handlePreviewFile(originalFile)
                  }
                }}
              />
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <ContextMenu key={file.id}>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-shrink-0">
                          {file.thumbnail ? (
                            <img
                              src={file.thumbnail}
                              alt={file.alt}
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            getFileIcon(file.mimeType)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {file.originalName}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                          </p>
                          {file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {file.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewFile(file)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = file.url
                              link.download = file.originalName
                              link.click()
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConfirm(file)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handlePreviewFile(file)}>
                        <Eye className="mr-2 h-4 w-4" />
                        预览
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => {
                        const link = document.createElement('a')
                        link.href = file.url
                        link.download = file.originalName
                        link.click()
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        下载
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => handleEdit(file)}>
                        <Edit className="mr-2 h-4 w-4" />
                        重命名
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleMove(file)}>
                        <Move className="mr-2 h-4 w-4" />
                        移动
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem 
                        onClick={() => handleDeleteConfirm(file)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 新建文件夹模态框 */}
        <Modal
          isOpen={showFolderModal}
          onClose={() => setShowFolderModal(false)}
          title="新建文件夹"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文件夹名称
              </label>
              <Input
                value={newFolder.name}
                onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入文件夹名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述（可选）
              </label>
              <Input
                value={newFolder.description}
                onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入文件夹描述"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFolderModal(false)}
              >
                取消
              </Button>
              <Button
                onClick={createFolder}
                disabled={!newFolder.name.trim()}
              >
                创建
              </Button>
            </div>
          </div>
        </Modal>

        {/* 上传文件模态框 */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false)
            setSelectedFile(null)
            setUploadData({ folderId: 'root', description: '', tags: '', isPublic: true })
          }}
          title="上传文件"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择文件
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setSelectedFile(file || null)
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">已选择文件：</span>
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    大小：{formatFileSize(selectedFile.size)}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标文件夹
              </label>
              <Select
                value={uploadData.folderId}
                onValueChange={(value) => setUploadData(prev => ({ ...prev, folderId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择文件夹" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">选择文件夹</SelectItem>
                  {folders
                    .filter(folder => folder.id && folder.id.trim() !== '')
                    .map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述（可选）
              </label>
              <Input
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入文件描述"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签（可选，用逗号分隔）
              </label>
              <Input
                value={uploadData.tags}
                onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="输入标签，用逗号分隔"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={uploadData.isPublic}
                onChange={(e) => setUploadData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                公开文件
              </label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                  setUploadData({ folderId: 'root', description: '', tags: '', isPublic: true })
                }}
                disabled={uploading}
              >
                取消
              </Button>
              <Button
                onClick={uploadFile}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    确认上传
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* 编辑模态框 */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedItem(null)
            setEditData({ name: '', description: '' })
          }}
          title={selectedItem && 'name' in selectedItem ? '重命名文件夹' : '重命名文件'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称
              </label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述（可选）
              </label>
              <Input
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入描述"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedItem(null)
                  setEditData({ name: '', description: '' })
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editData.name.trim()}
              >
                保存
              </Button>
            </div>
          </div>
        </Modal>

        {/* 移动模态框 */}
        <Modal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false)
            setSelectedItem(null)
            setMoveData({ targetFolderId: 'root' })
          }}
          title="移动文件"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标文件夹
              </label>
              <Select
                value={moveData.targetFolderId}
                onValueChange={(value) => setMoveData(prev => ({ ...prev, targetFolderId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择目标文件夹" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">根目录</SelectItem>
                  {folders
                    .filter(folder => folder.id && folder.id.trim() !== '')
                    .map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMoveModal(false)
                  setSelectedItem(null)
                  setMoveData({ targetFolderId: 'root' })
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveMove}
                disabled={false}
              >
                移动
              </Button>
            </div>
          </div>
        </Modal>

        {/* 删除确认对话框 */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                确认删除{deleteType === 'folder' ? '文件夹' : '文件'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                您确定要删除 "{selectedItem && ('name' in selectedItem ? selectedItem.name : selectedItem.originalName)}" 吗？
                {deleteType === 'folder' && (
                  <span className="block mt-2 text-red-600 font-medium">
                    注意：删除文件夹将同时删除其中的所有文件，此操作不可撤销！
                  </span>
                )}
                {deleteType === 'file' && (
                  <span className="block mt-2 text-red-600 font-medium">
                    此操作不可撤销！
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteDialog(false)
                setSelectedItem(null)
                setDeleteType(null)
              }}>
                取消
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteExecute}>
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 文件预览模态框 */}
        {previewFile && (
          <FilePreviewModal
            file={{
              id: previewFile.id,
              name: previewFile.originalName,
              url: previewFile.url,
              type: previewFile.mimeType,
              size: previewFile.size,
              originalName: previewFile.originalName
            }}
            isOpen={showPreviewModal}
            onClose={() => {
              setShowPreviewModal(false)
              setPreviewFile(null)
            }}
            showFileName={true}
            showFileSize={true}
          />
        )}
      </div>
    </ProtectedPage>
  )
}

export default FileManagementPage
