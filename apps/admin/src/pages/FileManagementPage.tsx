import React, { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Folder,
  FolderPlus,
  FolderOpen,
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
  Move,
  Home,
  Globe,
  Shield
} from 'lucide-react'
import { api, setTokenFromStorage } from '@whispers/utils'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Modal } from '../components/modals/Modal'
import { SimpleTooltip } from '../components/ui/tooltip'
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
import { useAuthStore } from '../stores/useAuthStore'

interface Folder {
  id: string
  name: string
  path: string
  parentId?: string
  description?: string
  isSystem: boolean
  isPublic: boolean
  ownerId?: string
  createdAt: string
  updatedAt: string
  children?: Folder[]
  owner?: {
    id: string
    username: string
  }
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
  const { user } = useAuthStore()
  const [folders, setFolders] = useState<Folder[]>([])  // 所有文件夹（用于选择器）
  const [currentFolders, setCurrentFolders] = useState<Folder[]>([])  //  当前目录下的文件夹
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
    folderId: currentFolder || 'root',
    description: '',
    tags: '',
    isPublic: true
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFolders()
    fetchCurrentFolders()
    fetchFiles()
  }, [currentFolder])

  // 当currentFolder改变时，更新上传表单的默认文件夹
  useEffect(() => {
    console.log('currentFolder changed:', currentFolder)
    console.log('folders:', folders)
    setUploadData(prev => ({
      ...prev,
      folderId: currentFolder || 'root'
    }))
  }, [currentFolder, folders])

  // 判断文件夹类型
  const getFolderType = (folder: Folder) => {
    if (folder.isPublic || folder.path === '/public') {
      return 'public'
    }
    if (user && folder.path === `/${user.id}`) {
      return 'user-root'
    }
    if (folder.path.startsWith(`/${user?.id}/`) || folder.ownerId === user?.id) {
      return 'user-subfolder'
    }
    return 'other'
  }

  // 获取文件夹显示图标
  const getFolderIcon = (folder: Folder) => {
    const type = getFolderType(folder)

    switch (type) {
      case 'public':
        return <Globe className="h-8 w-8 text-green-500" />
      case 'user-root':
        return <Home className="h-8 w-8 text-blue-500" />
      default:
        return <Folder className="h-8 w-8 text-gray-500" />
    }
  }

  // 获取文件夹样式
  const getFolderStyle = (folder: Folder) => {
    const type = getFolderType(folder)

    switch (type) {
      case 'public':
        return 'border-green-200 bg-green-50 hover:bg-green-100'
      case 'user-root':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100'
      default:
        return 'border-gray-200 bg-white hover:bg-gray-50'
    }
  }

  // 检查是否有权限管理公共文件夹
  const canManagePublicFolder = () => {
    return user?.role === 'ADMIN' || user?.role === 'EDITOR'
  }

  // 检查是否有权限访问文件夹
  const canAccessFolder = (folder: Folder) => {
    const type = getFolderType(folder)
    if (type === 'public') {
      return true // 所有人都可以查看公共文件夹，但管理需要权限
    }
    if (type === 'user-root' || type === 'user-subfolder') {
      return user && (folder.path.startsWith(`/${user.id}`) || folder.ownerId === user.id)
    }
    return user?.role === 'ADMIN' // 管理员可以访问所有文件夹
  }

  // 检查是否有权限管理文件夹（修改、删除、上传）
  const canManageFolder = (folder: Folder) => {
    const type = getFolderType(folder)
    if (type === 'public') {
      return canManagePublicFolder()
    }
    if (type === 'user-root' || type === 'user-subfolder') {
      return user && (folder.path.startsWith(`/${user.id}`) || folder.ownerId === user.id)
    }
    return user?.role === 'ADMIN'
  }

  // 检查是否可以在当前文件夹创建内容
  const canCreateInCurrentFolder = () => {
    if (!user) return false
    
    // 如果没有选择文件夹，用户总是可以在自己的根目录创建
    if (!currentFolder) {
      return true
    }
    
    // 查找当前文件夹对象
    const currentFolderObj = [...folders, ...currentFolders].find(f => f.id === currentFolder)
    
    // 如果找不到文件夹对象，但有currentFolder，说明可能是刚导航到的文件夹，允许创建
    if (!currentFolderObj) {
      return true
    }
    
    // 检查是否有权限管理当前文件夹
    return canManageFolder(currentFolderObj)
  }

  //  构建文件夹树结构（显示有权限的文件夹，公共和用户文件夹一起展示）
  const buildFolderTree = (folders: Folder[]): Folder[] => {
    const folderMap = new Map<string, Folder & { children: Folder[] }>()
    const rootFolders: (Folder & { children: Folder[] })[] = []

    // 初始化所有文件夹
    folders.forEach(folder => {
      // 过滤掉无权限访问的文件夹
      if (!canAccessFolder(folder)) {
        return
      }

      folderMap.set(folder.id, { ...folder, children: [] })
    })

    // 构建树结构
    folders.forEach(folder => {
      if (!folderMap.has(folder.id)) return

      const folderWithChildren = folderMap.get(folder.id)!
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId)!.children.push(folderWithChildren)
      } else {
        rootFolders.push(folderWithChildren)
      }
    })

    return rootFolders
  }

  // 渲染文件夹选项（递归）- 树状结构
  const renderFolderTreeOptions = (folders: Folder[], level = 0, parentPrefix = ''): React.ReactElement[] => {
    return folders.map((folder, index) => {
      const type = getFolderType(folder)
      const canManage = canManageFolder(folder)

      // 只显示可以管理的文件夹（可以上传文件）
      if (!canManage) return null

      const isLastItem = index === folders.length - 1
      const hasChildren = folder.children && folder.children.length > 0
      
      let prefix = ''
      if (level > 0) {
        const connector = isLastItem ? '└── ' : '├── '
        prefix = parentPrefix + connector
      }

      const childPrefix = level > 0 ? parentPrefix + (isLastItem ? '    ' : '│   ') : ''

      return (
        <React.Fragment key={folder.id}>
          <SelectItem value={folder.id} className="font-mono text-sm hover:bg-blue-50">
            <div className="flex items-center min-w-0">
              {level > 0 && (
                <span className="text-gray-400 mr-1 shrink-0" style={{ fontFamily: 'monospace' }}>
                  {prefix}
                </span>
              )}
              <div className="flex items-center min-w-0">
                {type === 'public' ? '🌐' : type === 'user-root' ? '🏠' : '📁'}
                <span className="ml-2 truncate">{folder.name}</span>
                {type === 'public' && <span className="text-green-600 ml-2 text-xs shrink-0">(公共)</span>}
                {type === 'user-root' && <span className="text-blue-600 ml-2 text-xs shrink-0">(我的)</span>}
                {folder.owner && folder.owner.id !== user?.id && (
                  <span className="text-purple-600 ml-2 text-xs shrink-0">[{folder.owner.username}]</span>
                )}
                {hasChildren && (
                  <span className="text-gray-400 ml-2 text-xs shrink-0">
                    ({folder.children?.length || 0} 项)
                  </span>
                )}
              </div>
            </div>
          </SelectItem>
          {hasChildren && folder.children && renderFolderTreeOptions(folder.children, level + 1, childPrefix)}
        </React.Fragment>
      )
    }).filter(Boolean) as React.ReactElement[]
  }

  // 获取展开的文件夹树（包含所有子目录）
  const getExpandedFolderTree = (): Folder[] => {
    const expandFolder = (folder: Folder): Folder[] => {
      const result: Folder[] = [folder]
      if (folder.children && folder.children.length > 0) {
        folder.children.forEach(child => {
          result.push(...expandFolder(child))
        })
      }
      return result
    }

    const tree = buildFolderTree(folders)
    const expanded: Folder[] = []
    tree.forEach(rootFolder => {
      expanded.push(...expandFolder(rootFolder))
    })
    
    return expanded
  }

  const fetchFolders = async () => {
    try {
      setTokenFromStorage('admin_token')
      // 获取文件夹树状结构（用于上传表单的选择器）
      const treeResponse = await api.get(`/file-management/folders/tree`)

      if (treeResponse.data?.success && treeResponse.data?.data && Array.isArray(treeResponse.data.data)) {
        // 扁平化树状数据以便使用
        const flattenTree = (folders: Folder[]): Folder[] => {
          const result: Folder[] = []
          folders.forEach(folder => {
            result.push(folder)
            if (folder.children && folder.children.length > 0) {
              result.push(...flattenTree(folder.children))
            }
          })
          return result
        }
        
        const flatFolders = flattenTree(treeResponse.data.data)
        setFolders(flatFolders)
        console.log('Fetched folder tree:', treeResponse.data.data)
        console.log('Flattened folders:', flatFolders)
      } else {
        setFolders([])
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err)
      setFolders([])
    }
  }

  //  获取当前目录下的文件夹（用于文件列表显示）
  const fetchCurrentFolders = async () => {
    try {
      setTokenFromStorage('admin_token')
      // 获取当前目录下的文件夹
      const response = await api.get(`/file-management/folders`, {
        params: { parentId: currentFolder || '' }
      })

      if (response.data?.success && response.data?.data && Array.isArray(response.data.data)) {
        // 过滤出有权限访问的文件夹
        const accessibleFolders = response.data.data.filter(canAccessFolder)
        setCurrentFolders(accessibleFolders)
        console.log('Current folder children:', accessibleFolders)
      } else {
        setCurrentFolders([])
      }
    } catch (err) {
      console.error('Failed to fetch current folders:', err)
      setCurrentFolders([])
    }
  }

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setTokenFromStorage('admin_token')
      
      const params: Record<string, string> = {}
      if (currentFolder) params.folderId = currentFolder
      if (searchTerm) params.search = searchTerm
      
      const response = await api.get('/file-management/files', { params })
      
      if (response.data?.success && response.data?.data?.files) {
        setFiles(response.data.data.files)
      } else {
        setFiles([])
      }
    } catch (err) {
      console.error('Failed to fetch files:', err)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  //  刷新所有数据
  const refreshData = async () => {
    await Promise.all([fetchFolders(), fetchCurrentFolders(), fetchFiles()])
  }

  // 删除文件夹
  const deleteFolder = async (folderId: string) => {
    try {
      setTokenFromStorage('admin_token')
      const response = await api.delete(`/file-management/folders/${folderId}`)
      if (response.data?.success) {
        success('文件夹删除成功')
        await refreshData()
      } else {
        error(response.data?.message || '删除文件夹失败')
      }
    } catch (err) {
      console.error('Delete folder error:', err)
      error('删除文件夹失败')
    }
  }

  // 删除文件
  const deleteFile = async (fileId: string) => {
    try {
      setTokenFromStorage('admin_token')
      const response = await api.delete(`/file-management/files/${fileId}`)
      if (response.data?.success) {
        success('文件删除成功')
        await refreshData()
      } else {
        error(response.data?.message || '删除文件失败')
      }
    } catch (err) {
      console.error('Delete file error:', err)
      error('删除文件失败')
    }
  }

  // 重命名文件夹
  const renameFolder = async (folderId: string, name: string, description: string) => {
    try {
      setTokenFromStorage('admin_token')
      const response = await api.put(`/file-management/folders/${folderId}`, { name, description })
      if (response.data?.success) {
        success('文件夹重命名成功')
        await refreshData()
      } else {
        error(response.data?.message || '重命名文件夹失败')
      }
    } catch (err) {
      console.error('Rename folder error:', err)
      error('重命名文件夹失败')
    }
  }

  // 重命名文件
  const renameFile = async (fileId: string, name: string, description: string) => {
    try {
      setTokenFromStorage('admin_token')
      const response = await api.put(`/file-management/files/${fileId}`, { originalName: name, description })
      if (response.data?.success) {
        success('文件重命名成功')
        await refreshData()
      } else {
        error(response.data?.message || '重命名文件失败')
      }
    } catch (err) {
      console.error('Rename file error:', err)
      error('重命名文件失败')
    }
  }

  // 移动文件
  const moveFile = async (fileId: string, targetFolderId: string) => {
    try {
      setTokenFromStorage('admin_token')
      const response = await api.put(`/file-management/files/${fileId}`, { 
        folderId: targetFolderId === 'root' ? '' : targetFolderId 
      })
      if (response.data?.success) {
        success('文件移动成功')
        await refreshData()
      } else {
        error(response.data?.message || '移动文件失败')
      }
    } catch (err) {
      console.error('Move file error:', err)
      error('移动文件失败')
    }
  }

  const createFolder = async () => {
    try {
      setTokenFromStorage('admin_token')
      const response = await api.post('/file-management/folders', {
        ...newFolder,
        parentId: currentFolder
      })
      if (response.data?.success) {
        success('文件夹创建成功')
        setShowFolderModal(false)
        setNewFolder({ name: '', description: '' })
        await refreshData()
      } else {
        error(response.data?.message || '创建文件夹失败')
      }
    } catch (err) {
      console.error('Create folder error:', err)
      error('创建文件夹失败')
    }
  }

  const uploadFile = async () => {
    if (!selectedFile) {
      error('请选择要上传的文件')
      return
    }

    // folderId可以为空，表示上传到根目录
    if (uploadData.folderId !== 'root' && !uploadData.folderId) {
      error('请选择目标文件夹')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folderId', uploadData.folderId === 'root' ? '' : uploadData.folderId)
      
      // 处理 tags 为数组格式（可选）
      const tagsArray = uploadData.tags && uploadData.tags.trim()
        ? uploadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : []
      formData.append('tags', JSON.stringify(tagsArray))

      // 处理描述（可选）
      if (uploadData.description && uploadData.description.trim()) {
        formData.append('description', uploadData.description.trim())
      }
      
      formData.append('isPublic', uploadData.isPublic.toString())

      setTokenFromStorage('admin_token')
      const response = await api.post('/file-management/files/upload', formData)
      
      if (response.data?.success) {
        success('文件上传成功')
        setShowUploadModal(false)
        setUploadData({
          folderId: currentFolder || 'root',
          description: '',
          tags: '',
          isPublic: true
        })
        setSelectedFile(null)
        await refreshData()
      } else {
        error(response.data?.message || '文件上传失败')
      }
    } catch (err) {
      console.error('Upload file error:', err)
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


  //  导航到文件夹，修复面包屑路径重复问题
  const navigateToFolder = (folder: Folder) => {
    // 检查是否有权限访问该文件夹
    if (!canAccessFolder(folder)) {
      alert('您没有权限访问此文件夹')
      return
    }

    setCurrentFolder(folder.id)
    // 避免重复添加相同的文件夹到路径中
    setFolderPath(prev => {
      const existingIndex = prev.findIndex(f => f.id === folder.id)
      if (existingIndex !== -1) {
        // 如果文件夹已在路径中，截取到该位置（向前导航）
        return prev.slice(0, existingIndex + 1)
      } else {
        // 如果是新文件夹，添加到路径末尾
        return [...prev, folder]
      }
    })
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
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">文件管理</h1>
              <SimpleTooltip
                content={
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span>🌐 <strong>公共目录</strong> - 需编辑权限</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🏠 <strong>个人目录</strong> - 仅本人可管理</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🛡️ <strong>管理员</strong> - 管理所有文件夹</span>
                    </div>
                  </div>
                }
                className="max-w-xs"
              >
                <div className="cursor-help">
                  <Shield className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </div>
              </SimpleTooltip>
            </div>
            <p className="text-gray-600">管理文件和文件夹</p>
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

        {/* 文件资源管理器 - 统一显示文件夹和文件 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FolderOpen className="h-5 w-5 mr-2" />
                文件资源管理器
                {currentFolder && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({currentFolders.length + files.length} 项)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowFolderModal(true)}
                  variant="outline"
                  size="sm"
                  disabled={!canCreateInCurrentFolder()}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  新建文件夹
                </Button>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  size="sm"
                  disabled={!canCreateInCurrentFolder()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上传文件
                </Button>
                <div className="border-l pl-2 ml-2">
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
                    className="ml-1"
                  >
                    网格
                  </Button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : currentFolders.length === 0 && files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FolderOpen className="h-12 w-12 mb-4 text-gray-300" />
                <div className="text-center">
                  <p className="text-lg font-medium">此文件夹为空</p>
                  <p className="text-sm mt-1">您可以上传文件或创建新文件夹</p>
                </div>
              </div>
            ) : (
              <div>
                {/* 统一显示文件夹和文件 */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {/* 文件夹优先显示 */}
                    {currentFolders.map((folder) => (
                      <ContextMenu key={`folder-${folder.id}`}>
                        <ContextMenuTrigger asChild>
                          <div
                            onClick={() => navigateToFolder(folder)}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${getFolderStyle(folder)}`}
                          >
                            <div className="text-center">
                              <div className="flex justify-center mb-2">
                                {getFolderIcon(folder)}
                              </div>
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {folder.name}
                                {getFolderType(folder) === 'public' && (
                                  <Shield className="inline h-3 w-3 ml-1 text-green-600" />
                                )}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {folder._count.files} 个文件
                              </p>
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => navigateToFolder(folder)}>
                            <Eye className="mr-2 h-4 w-4" />
                            打开文件夹
                          </ContextMenuItem>
                          
                          {canManageFolder(folder) && (
                            <>
                              <ContextMenuItem onClick={() => setShowUploadModal(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                上传文件
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => setShowFolderModal(true)}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                新建文件夹
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem onClick={() => handleEdit(folder)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {folder.isSystem ? '编辑描述' : '重命名'}
                              </ContextMenuItem>
                            </>
                          )}
                          
                          {canManageFolder(folder) && !folder.isSystem && (
                            <>
                              <ContextMenuSeparator />
                              <ContextMenuItem 
                                onClick={() => handleDeleteConfirm(folder)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </ContextMenuItem>
                            </>
                          )}
                          
                          {getFolderType(folder) === 'public' && !canManagePublicFolder() && (
                            <>
                              <ContextMenuSeparator />
                              <ContextMenuItem disabled className="text-gray-400">
                                <Shield className="mr-2 h-4 w-4" />
                                需要管理员权限
                              </ContextMenuItem>
                            </>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}

                    {/* 文件网格显示 */}
                    <FilePreviewList
                      files={files.map(file => ({
                        id: file.id,
                        name: file.originalName,
                        url: file.url,
                        type: file.mimeType,
                        size: file.size,
                        originalName: file.originalName
                      }))}
                      columns={1} // 设置为1，让它自适应网格
                      showFileName={true}
                      showFileSize={true}
                      onFileClick={(file) => {
                        const originalFile = files.find(f => f.id === file.id)
                        if (originalFile) {
                          handlePreviewFile(originalFile)
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* 文件夹列表显示 */}
                    {currentFolders.map((folder) => (
                      <ContextMenu key={`folder-${folder.id}`}>
                        <ContextMenuTrigger asChild>
                          <div
                            onClick={() => navigateToFolder(folder)}
                            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${getFolderStyle(folder)}`}
                          >
                            {getFolderIcon(folder)}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {folder.name}
                                {getFolderType(folder) === 'public' && (
                                  <Shield className="inline h-3 w-3 ml-1 text-green-600" />
                                )}
                              </h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{folder._count.files} 个文件</span>
                                <span>•</span>
                                <span>文件夹</span>
                                <span>•</span>
                                <span>{formatDate(folder.updatedAt)}</span>
                                {getFolderType(folder) === 'public' && (
                                  <>
                                    <span>•</span>
                                    <span className="text-green-600">公共</span>
                                  </>
                                )}
                                {folder.owner && folder.owner.id !== user?.id && (
                                  <>
                                    <span>•</span>
                                    <span className="text-purple-600">{folder.owner.username}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => navigateToFolder(folder)}>
                            <Eye className="mr-2 h-4 w-4" />
                            打开文件夹
                          </ContextMenuItem>
                          
                          {canManageFolder(folder) && (
                            <>
                              <ContextMenuItem onClick={() => setShowUploadModal(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                上传文件
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => setShowFolderModal(true)}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                新建文件夹
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem onClick={() => handleEdit(folder)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {folder.isSystem ? '编辑描述' : '重命名'}
                              </ContextMenuItem>
                            </>
                          )}
                          
                          {canManageFolder(folder) && !folder.isSystem && (
                            <>
                              <ContextMenuSeparator />
                              <ContextMenuItem 
                                onClick={() => handleDeleteConfirm(folder)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </ContextMenuItem>
                            </>
                          )}
                          
                          {getFolderType(folder) === 'public' && !canManagePublicFolder() && (
                            <>
                              <ContextMenuSeparator />
                              <ContextMenuItem disabled className="text-gray-400">
                                <Shield className="mr-2 h-4 w-4" />
                                需要管理员权限
                              </ContextMenuItem>
                            </>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}

                    {/* 文件列表显示 */}
                    {files.map((file) => (
                      <ContextMenu key={`file-${file.id}`}>
                        <ContextMenuTrigger asChild>
                          <div className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
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
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>文件</span>
                                <span>•</span>
                                <span>{formatDate(file.createdAt)}</span>
                                <span>•</span>
                                <span>{file.uploader.username}</span>
                                {file.isPublic && (
                                  <>
                                    <span>•</span>
                                    <span className="text-green-600">公开</span>
                                  </>
                                )}
                              </div>
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePreviewFile(file)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteConfirm(file)
                                }}
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
            setUploadData({
              folderId: currentFolder || 'root',
              description: '',
              tags: '',
              isPublic: true
            })
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
                  onValueChange={(value) => {
                    console.log('Select value changed:', value)
                    setUploadData(prev => ({ ...prev, folderId: value }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择文件夹">
                      {(() => {
                        if (uploadData.folderId === 'root') return '📁 根目录'
                        if (uploadData.folderId === 'public') return '🌐 公共目录'
                        
                        const expandedFolders = getExpandedFolderTree()
                        const selectedFolder = expandedFolders.find(f => f.id === uploadData.folderId)
                        if (selectedFolder) {
                          const type = getFolderType(selectedFolder)
                          const icon = type === 'public' ? '🌐' : type === 'user-root' ? '🏠' : '📁'
                          return `${icon} ${selectedFolder.name}`
                        }
                        
                        return uploadData.folderId ? `文件夹 ${uploadData.folderId}` : '选择文件夹'
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto">
                    <div className="text-xs text-gray-500 px-3 py-2 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span>📂 选择目标文件夹</span>
                        <span>{(() => {
                          const managableFolders = getExpandedFolderTree().filter(f => canManageFolder(f))
                          return `${managableFolders.length + (canManagePublicFolder() ? 1 : 0)} 个可选`
                        })()}</span>
                      </div>
                      <div className="mt-1 text-gray-400">
                        树状结构 • 仅显示可管理的文件夹
                      </div>
                    </div>
                    {canManagePublicFolder() && (
                      <SelectItem value="public" className="font-mono text-sm hover:bg-green-50 border-b border-green-100">
                        <div className="flex items-center">
                          🌐<span className="ml-2 font-medium">公共目录</span>
                          <span className="text-green-600 ml-2 text-xs">(共享)</span>
                        </div>
                      </SelectItem>
                    )}
                    {Array.isArray(folders) && renderFolderTreeOptions(buildFolderTree(folders))}
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
                  <SelectValue placeholder="选择目标文件夹">
                    {(() => {
                      if (moveData.targetFolderId === 'root') return '📁 根目录'
                      if (moveData.targetFolderId === 'public') return '🌐 公共目录'
                      
                      const expandedFolders = getExpandedFolderTree()
                      const selectedFolder = expandedFolders.find(f => f.id === moveData.targetFolderId)
                      if (selectedFolder) {
                        const type = getFolderType(selectedFolder)
                        const icon = type === 'public' ? '🌐' : type === 'user-root' ? '🏠' : '📁'
                        return `${icon} ${selectedFolder.name}`
                      }
                      
                      return '选择目标文件夹'
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-80 overflow-y-auto">
                  <div className="text-xs text-gray-500 px-3 py-2 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span>📁 移动到目标文件夹</span>
                      <span>{(() => {
                        const managableFolders = getExpandedFolderTree().filter(f => canManageFolder(f))
                        return `${managableFolders.length + 1 + (canManagePublicFolder() ? 1 : 0)} 个可选`
                      })()}</span>
                    </div>
                    <div className="mt-1 text-gray-400">
                      选择文件的新位置
                    </div>
                  </div>
                  <SelectItem value="root" className="font-mono text-sm hover:bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center">
                      📁<span className="ml-2 font-medium">用户根目录</span>
                      <span className="text-blue-600 ml-2 text-xs">(默认)</span>
                    </div>
                  </SelectItem>
                  {canManagePublicFolder() && (
                    <SelectItem value="public" className="font-mono text-sm hover:bg-green-50 border-b border-green-100">
                      <div className="flex items-center">
                        🌐<span className="ml-2 font-medium">公共目录</span>
                        <span className="text-green-600 ml-2 text-xs">(共享)</span>
                      </div>
                    </SelectItem>
                  )}
                  {Array.isArray(folders) && renderFolderTreeOptions(buildFolderTree(folders))}
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
