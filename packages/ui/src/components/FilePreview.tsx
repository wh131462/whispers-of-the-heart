import React, { useState, useCallback } from 'react'
import { cn } from '../lib/utils'
import MarkdownRenderer from './MarkdownRenderer'
import AudioPlayer from './AudioPlayer'
import VideoPlayer from './VideoPlayer'
import AdvancedImagePreview from './AdvancedImagePreview'
import EnhancedVideoPlayer from './EnhancedVideoPlayer'
import EnhancedAudioPlayer from './EnhancedAudioPlayer'

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

// 文件信息组件
const FileInfo: React.FC<{ file: FilePreviewProps['file']; isDark: boolean }> = ({ file, isDark }) => {
  const fileType = getFileType(file.name, file.type)
  
  const infoItems = [
    {
      label: '文件类型',
      value: file.type || '未知',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
    }] : [])
  ]

  return (
    <div className={cn(
      "p-4 border-t",
      isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
    )}>
      <h4 className={cn(
        "text-sm font-semibold mb-3",
        isDark ? "text-gray-200" : "text-gray-800"
      )}>
        文件信息
      </h4>
      <div className="space-y-2">
        {infoItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className={cn(
              "flex-shrink-0",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xs font-medium",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  {item.label}
                </span>
                <span className={cn(
                  "text-xs font-mono",
                  isDark ? "text-gray-300" : "text-gray-700"
                )}>
                  {item.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 额外的元数据 */}
      {file.metadata && Object.keys(file.metadata).length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
          <h5 className={cn(
            "text-xs font-semibold mb-2",
            isDark ? "text-gray-300" : "text-gray-700"
          )}>
            元数据
          </h5>
          <div className="space-y-1">
            {Object.entries(file.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className={cn(
                  "capitalize",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={cn(
                  "font-mono truncate max-w-32",
                  isDark ? "text-gray-300" : "text-gray-700"
                )}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 图片预览组件 - 使用高级图片预览器
const ImagePreview: React.FC<{ url: string; alt: string }> = ({ url, alt }) => {
  return <AdvancedImagePreview url={url} alt={alt} className="w-full h-full" />
}

// 视频预览组件 - 使用增强视频播放器
const VideoPreview: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  return (
    <EnhancedVideoPlayer
      src={url}
      title={name}
      mode="fullscreen"
      className="w-full h-full"
    />
  )
}

// 音频预览组件 - 使用增强音频播放器
const AudioPreview: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  return (
    <EnhancedAudioPlayer
      src={url}
      title={name}
      mode="fullscreen"
      className="w-full h-full"
    />
  )
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

// 文本预览组件
const TextPreview: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const isMarkdown = name.toLowerCase().endsWith('.md') || name.toLowerCase().endsWith('.markdown')
  
  React.useEffect(() => {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.text()
      })
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch((error) => {
        console.error('TextPreview fetch error:', error)
        setError(true)
        setLoading(false)
      })
  }, [url])
  
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-gray-600 font-medium">加载文本中...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">文本加载失败</h3>
          <p className="text-gray-600 mb-2">请检查文本链接是否正确</p>
          <p className="text-sm text-gray-500">URL: {url}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full h-full flex flex-col">
      {isMarkdown ? (
        <div className="flex-1 overflow-auto bg-white">
          <div className="max-w-4xl mx-auto p-8">
            <MarkdownRenderer 
              content={content}
              className="prose prose-lg max-w-none"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-gray-900">
          <div className="max-w-6xl mx-auto p-8">
            <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap leading-relaxed">
              {content}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// Word文档预览组件
const WordPreview: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  return (
    <div className="relative w-full h-full bg-blue-50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
            <p className="text-sm text-gray-600 font-medium">加载Word文档中...</p>
          </div>
        </div>
      )}
      {error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Word文档加载失败</h3>
            <p className="text-gray-600 mb-4">Word文档需要使用在线预览服务</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                在线预览
              </a>
              <a
                href={url}
                download={name}
                className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载文档
              </a>
            </div>
          </div>
        </div>
      ) : (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
          className="w-full h-full border-0 rounded-lg"
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

// Excel表格预览组件
const ExcelPreview: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  return (
    <div className="relative w-full h-full bg-green-50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-green-500 border-t-transparent"></div>
            <p className="text-sm text-gray-600 font-medium">加载Excel表格中...</p>
          </div>
        </div>
      )}
      {error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Excel表格加载失败</h3>
            <p className="text-gray-600 mb-4">Excel表格需要使用在线预览服务</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                在线预览
              </a>
              <a
                href={url}
                download={name}
                className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载表格
              </a>
            </div>
          </div>
        </div>
      ) : (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
          className="w-full h-full border-0 rounded-lg"
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

// PowerPoint演示文稿预览组件
const PPTPreview: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  return (
    <div className="relative w-full h-full bg-orange-50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-orange-500 border-t-transparent"></div>
            <p className="text-sm text-gray-600 font-medium">加载PPT演示文稿中...</p>
          </div>
        </div>
      )}
      {error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v8.5a1 1 0 01-1 1h-8a1 1 0 01-1-1V4a1 1 0 011-1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">PPT演示文稿加载失败</h3>
            <p className="text-gray-600 mb-4">PPT演示文稿需要使用在线预览服务</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                在线预览
              </a>
              <a
                href={url}
                download={name}
                className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载演示文稿
              </a>
            </div>
          </div>
        </div>
      ) : (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
          className="w-full h-full border-0 rounded-lg"
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

// 代码预览组件
const CodePreview: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  React.useEffect(() => {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.text()
      })
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch((error) => {
        console.error('CodePreview fetch error:', error)
        setError(true)
        setLoading(false)
      })
  }, [url])
  
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-green-500 border-t-transparent"></div>
          <p className="text-sm text-gray-300 font-medium">加载代码中...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">代码加载失败</h3>
          <p className="text-gray-400 mb-2">请检查代码链接是否正确</p>
          <p className="text-sm text-gray-500">URL: {url}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <span className="text-sm text-gray-400 font-mono">{name}</span>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap leading-relaxed">
            {content}
          </pre>
        </div>
      </div>
    </div>
  )
}

// 未知文件类型预览组件
const UnknownPreview: React.FC<{ file: FilePreviewProps['file'] }> = ({ file }) => {
  const fileType = getFileType(file.name, file.type)
  
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️'
      case 'video': return '🎥'
      case 'audio': return '🎵'
      case 'pdf': return '📄'
      case 'word': return '📝'
      case 'excel': return '📊'
      case 'ppt': return '📊'
      case 'text': return '📝'
      case 'code': return '💻'
      case 'archive': return '📦'
      default: return '📁'
    }
  }
  
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
  
  
  const renderPreview = useCallback(() => {
    switch (fileType) {
      case 'image':
        return <ImagePreview url={file.url} alt={file.name} />
      case 'video':
        return <VideoPreview url={file.url} name={file.name} />
      case 'audio':
        return <AudioPreview url={file.url} name={file.name} />
      case 'pdf':
        return <PDFPreview url={file.url} name={file.name} />
      case 'word':
        return <WordPreview url={file.url} name={file.name} />
      case 'excel':
        return <ExcelPreview url={file.url} name={file.name} />
      case 'ppt':
        return <PPTPreview url={file.url} name={file.name} />
      case 'text':
        return <TextPreview url={file.url} name={file.name} />
      case 'code':
        return <CodePreview url={file.url} name={file.name} />
      default:
        return <UnknownPreview file={file} />
    }
  }, [file, fileType])
  
  return (
    <div className={cn(
      "w-full min-h-full flex flex-col",
      isDark ? "bg-black text-white" : "bg-white text-gray-900",
      className
    )}>
      {/* 头部信息 */}
      {(showFileName || showFileSize || showCloseButton) && (
        <div className={cn(
          "flex items-center justify-between p-6 border-b flex-shrink-0",
          isDark 
            ? "border-gray-800 bg-gradient-to-r from-gray-900 to-black" 
            : "border-gray-200 bg-gradient-to-r from-gray-50 to-white"
        )}>
          <div className="flex-1 min-w-0">
            {showFileName && (
              <h3 className={cn(
                "text-xl font-bold truncate mb-1",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {file.originalName || file.name}
              </h3>
            )}
            {showFileSize && file.size && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className={cn(
                  "text-sm font-medium",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  {formatFileSize(file.size)}
                </p>
              </div>
            )}
          </div>
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className={cn(
                "ml-4 p-3 rounded-full transition-all duration-200 group flex-shrink-0",
                isDark 
                  ? "text-gray-400 hover:text-white hover:bg-gray-800" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      {/* 预览内容 */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {renderPreview()}
      </div>
      
      {/* 文件信息 */}
      {showFileInfo && (
        <FileInfo file={file} isDark={isDark} />
      )}
    </div>
  )
}

export default FilePreview
