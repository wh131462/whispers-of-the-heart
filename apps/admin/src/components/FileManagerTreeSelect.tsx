import React from 'react'
import { TreeSelect, type TreeNode } from '@whispers/ui'
import { Folder, Home, Globe, Users } from 'lucide-react'

interface FileManagerFolder {
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
  children?: FileManagerFolder[]
  owner?: {
    id: string
    username: string
  }
  _count: {
    files: number
  }
}

interface User {
  id: string
  username: string
  role: string
}

interface FileManagerTreeSelectProps {
  folders: FileManagerFolder[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  user?: User | null
  isManagementMode?: boolean
  showPublicOption?: boolean
  showRootOption?: boolean
  canManagePublicFolder?: () => boolean
  canManageFolder?: (folder: FileManagerFolder) => boolean | null
}

export const FileManagerTreeSelect: React.FC<FileManagerTreeSelectProps> = ({
  folders,
  value,
  onValueChange,
  placeholder = "选择文件夹",
  className,
  disabled = false,
  user,
  isManagementMode = false,
  showPublicOption = true,
  showRootOption = true,
  canManagePublicFolder = () => false,
  canManageFolder = () => true
}) => {
  // 判断文件夹类型
  const getFolderType = (folder: FileManagerFolder) => {
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

  // 获取文件夹图标
  const getFolderIcon = (folder: FileManagerFolder) => {
    const type = getFolderType(folder)
    
    switch (type) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-500" />
      case 'user-root':
        if (isManagementMode) {
          return <Users className="h-4 w-4 text-purple-500" />
        }
        return <Home className="h-4 w-4 text-blue-500" />
      case 'user-subfolder':
        return <Folder className="h-4 w-4 text-blue-400" />
      default:
        return <Folder className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取文件夹显示名称
  const getFolderDisplayName = (folder: FileManagerFolder) => {
    const type = getFolderType(folder)
    let name = folder.name
    
    if (type === 'public') {
      name += ' (公共)'
    } else if (type === 'user-root' && isManagementMode) {
      name += ` (${folder.name})`
    }
    
    if (folder._count) {
      name += ` • ${folder._count.files} 个文件`
    }
    
    return name
  }

  // 构建文件夹树结构 - 简化逻辑，直接使用传入的树状数据
  const buildFolderTree = (folders: FileManagerFolder[]): FileManagerFolder[] => {
    // 如果传入的数据已经是树状结构，直接过滤可管理的文件夹
    const filterManageableFolders = (folderList: FileManagerFolder[]): FileManagerFolder[] => {
      return folderList
        .filter(folder => canManageFolder(folder))
        .map(folder => ({
          ...folder,
          children: folder.children ? filterManageableFolders(folder.children) : []
        }))
    }

    return filterManageableFolders(folders)
  }

  // 递归转换文件夹为TreeNode
  const convertFolderToTreeNode = (folder: FileManagerFolder): TreeNode => {
    return {
      id: folder.id,
      name: getFolderDisplayName(folder),
      icon: getFolderIcon(folder),
      disabled: !canManageFolder(folder),
      children: folder.children ? folder.children
        .filter(child => canManageFolder(child))
        .map(convertFolderToTreeNode) : []
    }
  }

  // 构建TreeSelect的数据
  const buildTreeData = (): TreeNode[] => {
    const nodes: TreeNode[] = []
    
    // 构建文件夹树
    const tree = buildFolderTree(folders)
    const folderNodes = tree.map(convertFolderToTreeNode)
    
    // 检查是否已经有公共文件夹在树中
    const hasPublicFolder = tree.some(folder => 
      folder.isPublic || folder.path === '/public'
    )
    
    // 只有在没有实际公共文件夹数据且允许显示公共选项时，才添加硬编码的公共目录选项
    if (showPublicOption && canManagePublicFolder() && !hasPublicFolder) {
      nodes.push({
        id: 'public',
        name: '公共目录',
        icon: <Globe className="h-4 w-4 text-green-500" />,
        children: []
      })
    }
    
    // 添加根目录选项（如果API没有返回用户根目录）
    if (showRootOption && !tree.some(folder => 
      user && folder.path === `/${user.id}` && folder.ownerId === user.id
    )) {
      nodes.push({
        id: 'root',
        name: '用户根目录',
        icon: <Home className="h-4 w-4 text-blue-500" />,
        children: []
      })
    }
    
    nodes.push(...folderNodes)
    return nodes
  }

  const treeData = buildTreeData()


  return (
    <TreeSelect
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      data={treeData}
      className={className}
      disabled={disabled}
    />
  )
}

export default FileManagerTreeSelect
