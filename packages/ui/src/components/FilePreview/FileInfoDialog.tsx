import React from 'react'
import { cn } from '../../lib/utils'

export interface FileInfoDialogProps {
  file: {
    id: string
    name: string
    url: string
    type: string
    size?: number
    originalName?: string
    createdAt?: string
    updatedAt?: string
    dimensions?: {
      width: number
      height: number
    }
    duration?: number
    metadata?: Record<string, any>
  }
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时长
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString('zh-CN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

export const FileInfoDialog: React.FC<FileInfoDialogProps> = ({
  file,
  isOpen,
  onClose,
  isDark = false
}) => {
  // 获取文件扩展名
  const getFileExtension = (filename: string) => {
    const lastDot = filename.lastIndexOf('.')
    return lastDot > 0 ? filename.substring(lastDot + 1).toUpperCase() : '无扩展名'
  }

  // 获取文件路径信息
  const getPathInfo = (url: string) => {
    try {
      const urlObj = new URL(url)
      return {
        domain: urlObj.hostname,
        path: urlObj.pathname,
        protocol: urlObj.protocol.replace(':', '')
      }
    } catch {
      return null
    }
  }

  const pathInfo = getPathInfo(file.url)
  
  const infoItems = [
    // 基本信息
    {
      label: '文件类型',
      value: file.type || '未知',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      label: '文件扩展名',
      value: getFileExtension(file.originalName || file.name),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    ...(file.size ? [{
      label: '文件大小',
      value: formatFileSize(file.size),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16" />
        </svg>
      )
    }] : []),
    
    // 媒体信息
    ...(file.dimensions ? [{
      label: '尺寸',
      value: `${file.dimensions.width} × ${file.dimensions.height}`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
        </svg>
      )
    }] : []),
    ...(file.duration ? [{
      label: '时长',
      value: formatDuration(file.duration),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }] : []),
    
    // 时间信息
    ...(file.createdAt ? [{
      label: '创建时间',
      value: formatDate(file.createdAt),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }] : []),
    ...(file.updatedAt && file.updatedAt !== file.createdAt ? [{
      label: '修改时间',
      value: formatDate(file.updatedAt),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    }] : []),
    
    
    // 文件ID
    {
      label: '文件ID',
      value: file.id,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    }
  ]

  return (
    <div className="space-y-4">
      {/* 文件名 - 更突出的显示 */}
      <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className={cn(
          "text-lg font-semibold mb-2 break-all",
          isDark ? "text-white" : "text-gray-900"
        )}>
          {file.originalName || file.name}
        </h3>
      </div>

      {/* 基本信息 - 网格布局 */}
      <div className="grid grid-cols-2 gap-4 py-4">
        {infoItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className={cn(
              "flex-shrink-0",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-1">
                <span className={cn(
                  "text-xs font-medium block",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  {item.label}
                </span>
                <span className={cn(
                  "text-sm font-semibold",
                  isDark ? "text-gray-200" : "text-gray-800"
                )}>
                  {item.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 额外的元数据 - 丰富显示 */}
      {file.metadata && Object.keys(file.metadata).length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className={cn(
            "text-sm font-semibold mb-3",
            isDark ? "text-gray-300" : "text-gray-700"
          )}>
            技术信息
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(file.metadata).slice(0, 8).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className={cn(
                  "capitalize font-medium flex-shrink-0",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={cn(
                  "font-mono text-xs text-right max-w-32 truncate",
                  isDark ? "text-gray-300" : "text-gray-700"
                )}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
            {Object.keys(file.metadata).length > 8 && (
              <p className={cn(
                "text-xs text-center pt-2",
                isDark ? "text-gray-500" : "text-gray-500"
              )}>
                还有 {Object.keys(file.metadata).length - 8} 个属性...
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* 文件路径信息 */}
      {pathInfo && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className={cn(
            "text-sm font-semibold mb-3",
            isDark ? "text-gray-300" : "text-gray-700"
          )}>
            路径信息
          </h4>
          <div className="space-y-2">
            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
              <span className={cn(
                "text-xs font-medium block mb-1",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                完整路径
              </span>
              <span className={cn(
                "text-xs font-mono break-all",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                {file.url}
              </span>
            </div>
            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
              <span className={cn(
                "text-xs font-medium block mb-1",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                文件路径
              </span>
              <span className={cn(
                "text-xs font-mono break-all",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                {pathInfo.path}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileInfoDialog