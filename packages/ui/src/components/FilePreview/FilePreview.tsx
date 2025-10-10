import React, { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'
import MarkdownRenderer from '../MarkdownRenderer'
import VideoPlayerPreview from './VideoPlayerPreview'
import AudioPlayerPreview from './AudioPlayerPreview'
import TextPreview from './TextPreview'
import OfficePreview from './OfficePreview'
import ImagePreview from './ImagePreview'
import FileInfoDialog from './FileInfoDialog'
import InlineSelect from '../ui/inline-select'

export interface FilePreviewProps {
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
    duration?: number // 视频/音频时长（秒）
    metadata?: Record<string, any>
  }
  className?: string
  onClose?: () => void
  showCloseButton?: boolean
  showFileName?: boolean
  showFileSize?: boolean
  showFileInfo?: boolean
  theme?: 'light' | 'dark' | 'auto'
  autoThemeConfig?: {
    dark: {
      start: number // 19 = 7PM
      end: number   // 7 = 7AM
    }
  }
}

// 文件类型检测
const getFileType = (fileName: string, mimeType: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  // 图片类型
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension || '')) {
    return 'image'
  }
  
  // 视频类型
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension || '')) {
    return 'video'
  }
  
  // 音频类型
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(extension || '')) {
    return 'audio'
  }
  
  // 文档类型
  if (['pdf'].includes(extension || '') || mimeType === 'application/pdf') {
    return 'pdf'
  }
  
  // Word 文档
  if (['doc', 'docx'].includes(extension || '') || 
      ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType)) {
    return 'word'
  }
  
  // Excel 表格
  if (['xls', 'xlsx'].includes(extension || '') || 
      ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mimeType)) {
    return 'excel'
  }
  
  // PowerPoint 演示文稿
  if (['ppt', 'pptx'].includes(extension || '') || 
      ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(mimeType)) {
    return 'ppt'
  }
  
  // 代码类型（优先检测，避免与文本类型冲突）
  if (['js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'sass', 'less', 'html', 'htm', 'xml', 'json', 'yaml', 'yml', 'sql', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(extension || '')) {
    return 'code'
  }
  
  // 文本类型
  if (mimeType.startsWith('text/') || ['txt', 'md', 'csv', 'log'].includes(extension || '')) {
    return 'text'
  }
  
  // 压缩文件
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension || '')) {
    return 'archive'
  }
  
  // 默认类型
  return 'unknown'
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

// 主题检测函数
const useTheme = (theme: 'light' | 'dark' | 'auto' = 'auto', autoConfig = { dark: { start: 19, end: 7 } }) => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'light' || theme === 'dark') {
      return theme
    }
    
    // Auto theme detection
    const hour = new Date().getHours()
    const { start, end } = autoConfig.dark
    
    // If start > end, it means the dark period crosses midnight
    const isDark = start > end 
      ? (hour >= start || hour < end)
      : (hour >= start && hour < end)
    
    return isDark ? 'dark' : 'light'
  })

  React.useEffect(() => {
    if (theme !== 'auto') return

    const updateTheme = () => {
      const hour = new Date().getHours()
      const { start, end } = autoConfig.dark
      
      const isDark = start > end 
        ? (hour >= start || hour < end)
        : (hour >= start && hour < end)
      
      setCurrentTheme(isDark ? 'dark' : 'light')
    }

    // Update theme every minute
    const interval = setInterval(updateTheme, 60000)
    return () => clearInterval(interval)
  }, [theme, autoConfig])

  return currentTheme
}

// 获取文件类型的附加信息
const getFileSubtitle = (
  file: FilePreviewProps['file'], 
  fileType: string, 
  textStats?: { characters: number; lines: number } | null,
  imageTransform?: { scale: number; rotate: number; translateX: number; translateY: number } | null,
  imageNaturalSize?: { width: number; height: number } | null
) => {
  const parts = []
  
  // 始终在开头显示文件大小和创建时间
  if (file.size) {
    parts.push(formatFileSize(file.size))
  }
  
  if (file.createdAt) {
    parts.push(formatDate(file.createdAt))
  }
  
  // 根据文件类型添加特定信息
  switch (fileType) {
    case 'text':
    case 'code':
      if (textStats) {
        parts.push(`${textStats.characters} 字符 • ${textStats.lines} 行`)
      }
      break
    case 'image':
      if (imageNaturalSize) {
        parts.push(`${imageNaturalSize.width} × ${imageNaturalSize.height}`)
      } else if (file.dimensions) {
        parts.push(`${file.dimensions.width} × ${file.dimensions.height}`)
      }
      if (imageTransform && imageTransform.scale !== 1) {
        parts.push(`${Math.round(imageTransform.scale * 100)}%`)
      }
      if (imageTransform && imageTransform.rotate !== 0) {
        parts.push(`${imageTransform.rotate}°`)
      }
      break
    case 'video':
      if (file.dimensions) {
        parts.push(`${file.dimensions.width} × ${file.dimensions.height}`)
      }
      if (file.duration) {
        parts.push(formatDuration(file.duration))
      }
      break
    case 'audio':
      if (file.duration) {
        parts.push(formatDuration(file.duration))
      }
      break
    case 'pdf':
      parts.push('PDF 文档')
      break
    case 'word':
      parts.push('Word 文档')
      break
    case 'excel':
      parts.push('Excel 表格')
      break
    case 'ppt':
      parts.push('PowerPoint 演示文稿')
      break
    default:
      // 对于未知类型，显示文件类型
      if (file.type) {
        parts.push(file.type)
      }
      break
  }
  
  return parts.length > 0 ? parts.join(' • ') : '文件'
}

// PDF预览组件
const PDFPreview: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  return (
    <div className="relative w-full h-full bg-gray-100">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-red-500 border-t-transparent"></div>
            <p className="text-sm text-gray-600 font-medium">加载PDF中...</p>
          </div>
        </div>
      )}
      {error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF加载失败</h3>
            <p className="text-gray-600 mb-4">请检查PDF链接是否正确</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              在新窗口中打开
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src={url}
          className="w-full h-full border-0 rounded-lg shadow-lg"
          title={name}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
        />
      )}
    </div>
  )
}

// 未知文件类型预览组件
const UnknownPreview: React.FC<{ file: FilePreviewProps['file'] }> = ({ file }) => {
  const fileType = getFileType(file.name, file.type)
  
  const getFileIconSvg = (type: string) => {
    switch (type) {
      case 'image': 
        return (
          <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'video':
        return (
          <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'audio':
        return (
          <svg className="w-16 h-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )
      case 'pdf':
        return (
          <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'word':
        return (
          <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'excel':
        return (
          <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        )
      case 'ppt':
        return (
          <svg className="w-16 h-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v8.5a1 1 0 01-1 1h-8a1 1 0 01-1-1V4a1 1 0 011-1z" />
          </svg>
        )
      case 'text':
        return (
          <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'code':
        return (
          <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        )
      case 'archive':
        return (
          <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      default:
        return (
          <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
          </svg>
        )
    }
  }
  
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center p-8 max-w-md">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          {getFileIconSvg(fileType)}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">{file.name}</h3>
        {file.size && (
          <p className="text-sm text-gray-600 mb-4">{formatFileSize(file.size)}</p>
        )}
        <p className="text-sm text-gray-500 mb-6">此文件类型不支持预览</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            在新窗口中打开
          </a>
          <a
            href={file.url}
            download={file.originalName || file.name}
            className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下载文件
          </a>
        </div>
      </div>
    </div>
  )
}

// 主文件预览组件
export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  className,
  onClose,
  showCloseButton = true,
  showFileName = true,
  showFileSize = true,
  showFileInfo = false,
  theme = 'auto',
  autoThemeConfig = { dark: { start: 19, end: 7 } }
}) => {
  const fileType = getFileType(file.name, file.type)
  const currentTheme = useTheme(theme, autoThemeConfig)
  const isDark = currentTheme === 'dark'
  const [textStats, setTextStats] = useState<{ characters: number; lines: number } | null>(null)
  const [imageTransform, setImageTransform] = useState<{ scale: number; rotate: number; translateX: number; translateY: number } | null>(null)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const [textWordWrap, setTextWordWrap] = useState(true)
  const [textFontSize, setTextFontSize] = useState(14)
  const [textLineHeight, setTextLineHeight] = useState(1.5)
  const [showInfoPopover, setShowInfoPopover] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
  const [showArrowAbove, setShowArrowAbove] = useState(false)
  const infoButtonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // ESC 键关闭 Popover
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showInfoPopover) {
        setShowInfoPopover(false)
      }
    }

    if (showInfoPopover) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [showInfoPopover])
  
  // 计算 Popover 位置
  useEffect(() => {
    if (showInfoPopover && infoButtonRef.current) {
      const buttonRect = infoButtonRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Popover 尺寸（估算）
      const popoverWidth = 400 // 放大宽度到 400px
      const popoverHeight = 300 // 放大高度到 300px
      
      let top = buttonRect.bottom + 8 // 在按钮下方 8px
      let left = buttonRect.left
      
      // 如果右侧空间不够，向左调整
      if (left + popoverWidth > viewportWidth - 16) {
        left = viewportWidth - popoverWidth - 16
      }
      
      // 如果下方空间不够，显示在上方
      let arrowAbove = false
      if (top + popoverHeight > viewportHeight - 16) {
        top = buttonRect.top - popoverHeight - 8
        arrowAbove = true
      }
      
      // 确保不超出视口边界
      left = Math.max(16, Math.min(left, viewportWidth - popoverWidth - 16))
      top = Math.max(16, Math.min(top, viewportHeight - popoverHeight - 16))
      
      setPopoverPosition({ top, left })
      setShowArrowAbove(arrowAbove)
    }
  }, [showInfoPopover])
  
  // 简单的信息 Popover 组件
  const InfoPopover = () => {
    if (!showInfoPopover) return null

    return (
      <div
        ref={popoverRef}
        className={cn(
          "fixed z-[100000] w-[400px] max-h-[400px] overflow-auto rounded-xl shadow-xl border p-6",
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500",
          isDark 
            ? "bg-gray-900 border-gray-700 text-white backdrop-blur-sm" 
            : "bg-white border-gray-200 text-gray-900 backdrop-blur-sm"
        )}
        style={{
          top: popoverPosition.top,
          left: popoverPosition.left,
          zIndex: 100000
        }}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
          }
        }}
        onMouseLeave={() => {
          hoverTimeoutRef.current = setTimeout(() => {
            setShowInfoPopover(false)
          }, 100)
        }}
      >
        {/* 箭头 */}
        <div
          className={cn(
            "absolute w-0 h-0 border-l-6 border-r-6 border-l-transparent border-r-transparent",
            showArrowAbove
              ? "border-t-6 border-t-gray-200 dark:border-t-gray-700"
              : "border-b-6 border-b-gray-200 dark:border-b-gray-700"
          )}
          style={{
            left: '20px',
            top: showArrowAbove ? '100%' : '-6px',
            transform: showArrowAbove ? 'translateY(-100%)' : 'translateY(0)'
          }}
        />
        
        <FileInfoDialog
          file={file}
          isOpen={showInfoPopover}
          onClose={() => setShowInfoPopover(false)}
          isDark={isDark}
        />
      </div>
    )
  }
  
  const renderPreview = useCallback(() => {
    switch (fileType) {
      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePreview 
              url={file.url} 
              alt={file.name} 
              className="w-full h-full"
              showToolbar={true}
              onTransformChange={setImageTransform}
              onNaturalSizeChange={setImageNaturalSize}
            />
          </div>
        )
      case 'video':
        return (
          <div className="w-full h-full">
            <VideoPlayerPreview src={file.url} title={file.name} />
          </div>
        )
      case 'audio':
        return (
          <div className="w-full h-full">
            <AudioPlayerPreview src={file.url} title={file.name} />
          </div>
        )
      case 'pdf':
        return <PDFPreview url={file.url} name={file.name} />
      case 'word':
        return <OfficePreview url={file.url} name={file.name} type="word" />
      case 'excel':
        return <OfficePreview url={file.url} name={file.name} type="excel" />
      case 'ppt':
        return <OfficePreview url={file.url} name={file.name} type="ppt" />
      case 'text':
      case 'code':
        return (
          <TextPreview 
            url={file.url} 
            name={file.name} 
            className="w-full h-full"
            onStatsChange={setTextStats}
            wordWrap={textWordWrap}
            fontSize={textFontSize}
            lineHeight={textLineHeight}
          />
        )
      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <UnknownPreview file={file} />
          </div>
        )
    }
  }, [file, fileType, textWordWrap, textFontSize, textLineHeight])
  
  return (
    <div className={cn(
      "w-full h-full flex flex-col",
      isDark ? "bg-black text-white" : "bg-white text-gray-900",
      className
    )}>
      {/* 头部信息 */}
      {(showFileName || showCloseButton) && (
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-b flex-shrink-0",
          isDark 
            ? "border-gray-800 bg-gray-900/50 backdrop-blur-sm" 
            : "border-gray-200 bg-white/80 backdrop-blur-sm"
        )}>
          <div className="flex-1 min-w-0">
            {showFileName && (
              <div className="flex items-center space-x-2">
                <h3 className={cn(
                  "text-lg font-semibold truncate",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {file.originalName || file.name}
                </h3>
                {/* 信息按钮 - 放在文件名旁边 */}
                {showFileInfo && (
                  <button
                    ref={infoButtonRef}
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current)
                      }
                      setShowInfoPopover(true)
                    }}
                    onMouseLeave={() => {
                      hoverTimeoutRef.current = setTimeout(() => {
                        setShowInfoPopover(false)
                      }, 100)
                    }}
                    className={cn(
                      "p-1 rounded transition-all duration-200 group flex-shrink-0 relative z-[100001]",
                      isDark 
                        ? "text-gray-400 hover:text-white hover:bg-gray-800" 
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {showFileName && (
              <div className="mt-1">
                <div className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  {getFileSubtitle(file, fileType, textStats, imageTransform, imageNaturalSize)}
                  {/* 文本文件控制 - 与附加信息合并，但排除 Markdown 文件 */}
                  {(fileType === 'text' || fileType === 'code') && 
                   !file.name.toLowerCase().endsWith('.md') && 
                   !file.name.toLowerCase().endsWith('.markdown') && (
                    <>
                      <span className="mx-2"> • </span>
                      
                      {/* 字体大小选择 */}
                      <InlineSelect
                        value={textFontSize.toString()}
                        onValueChange={(value) => setTextFontSize(Number(value))}
                        options={[
                          { value: "12", label: "字号12px" },
                          { value: "14", label: "字号14px" },
                          { value: "16", label: "字号16px" },
                          { value: "18", label: "字号18px" },
                          { value: "20", label: "字号20px" }
                        ]}
                        triggerClassName={cn(
                          isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                        )}
                        minWidth={80}
                        maxWidth={120}
                      />
                      
                      <span className="mx-1"> • </span>
                      
                      {/* 行高选择 */}
                      <InlineSelect
                        value={textLineHeight.toFixed(1)}
                        onValueChange={(value) => setTextLineHeight(Number(value))}
                        options={[
                          { value: "1.2", label: "行高1.2×" },
                          { value: "1.5", label: "行高1.5×" },
                          { value: "1.8", label: "行高1.8×" },
                          { value: "2.0", label: "行高2.0×" }
                        ]}
                        triggerClassName={cn(
                          isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                        )}
                        minWidth={80}
                        maxWidth={120}
                      />
                      
                      <span className="mx-1"> • </span>
                      
                      {/* 自动换行切换 */}
                      <span 
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 px-1 py-0.5 rounded",
                          textWordWrap 
                            ? isDark 
                              ? "text-blue-400 hover:text-blue-300" 
                              : "text-blue-600 hover:text-blue-700"
                            : isDark 
                              ? "text-gray-400 hover:text-gray-300" 
                              : "text-gray-500 hover:text-gray-700"
                        )}
                        onClick={() => setTextWordWrap(!textWordWrap)}
                        title="点击切换换行方式"
                      >
                        {textWordWrap ? "自动换行" : "不换行"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* 关闭按钮 - 保持原位置 */}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className={cn(
                "ml-4 p-2 rounded-lg transition-all duration-200 group flex-shrink-0 relative z-[100001]",
                isDark 
                  ? "text-gray-400 hover:text-white" 
                  : "text-gray-400 hover:text-gray-600"
              )}
              title="关闭"
            >
              <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1528" width="200" height="200"><path d="M0 0h1024v1024H0z" fill="#FF0033" fill-opacity="0" p-id="1529"></path><path d="M240.448 168l2.346667 2.154667 289.92 289.941333 279.253333-279.253333a42.666667 42.666667 0 0 1 62.506667 58.026666l-2.133334 2.346667-279.296 279.210667 279.274667 279.253333a42.666667 42.666667 0 0 1-58.005333 62.528l-2.346667-2.176-279.253333-279.253333-289.92 289.962666a42.666667 42.666667 0 0 1-62.506667-58.005333l2.154667-2.346667 289.941333-289.962666-289.92-289.92a42.666667 42.666667 0 0 1 57.984-62.506667z" fill="#111111" p-id="1530"></path></svg>
            </button>
          )}
        </div>
      )}
      
      {/* 预览内容 */}
      <div className="flex-1 min-h-0 overflow-auto w-full h-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        {renderPreview()}
      </div>
      
      {/* 文件信息对话框 */}
      <InfoPopover />
    </div>
  )
}

export default FilePreview
