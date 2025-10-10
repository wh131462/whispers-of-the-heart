import React, { useState } from 'react'
import { FilePreview, FilePreviewProps } from './FilePreview'
import { FilePreviewModal } from './FilePreviewModal'
import { cn } from '../../lib/utils'

export interface FilePreviewListProps {
  files: FilePreviewProps['file'][]
  className?: string
  itemClassName?: string
  showFileName?: boolean
  showFileSize?: boolean
  showFileInfo?: boolean
  columns?: number
  onFileClick?: (file: FilePreviewProps['file']) => void
  theme?: 'light' | 'dark' | 'auto'
  autoThemeConfig?: {
    dark: {
      start: number
      end: number
    }
  }
}

// 文件类型图标
const getFileIcon = (fileName: string, mimeType: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  // 图片类型
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension || '')) {
    return '🖼️'
  }
  
  // 视频类型
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension || '')) {
    return '🎥'
  }
  
  // 音频类型
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(extension || '')) {
    return '🎵'
  }
  
  // 文档类型
  if (['pdf'].includes(extension || '') || mimeType === 'application/pdf') {
    return '📄'
  }
  
  // Word 文档
  if (['doc', 'docx'].includes(extension || '') || 
      ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType)) {
    return '📝'
  }
  
  // Excel 表格
  if (['xls', 'xlsx'].includes(extension || '') || 
      ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mimeType)) {
    return '📊'
  }
  
  // PowerPoint 演示文稿
  if (['ppt', 'pptx'].includes(extension || '') || 
      ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(mimeType)) {
    return '📊'
  }
  
  // 文本类型
  if (mimeType.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(extension || '')) {
    return '📝'
  }
  
  // 代码类型
  if (['js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'sass', 'less', 'html', 'htm', 'xml', 'json', 'yaml', 'yml', 'sql', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(extension || '')) {
    return '💻'
  }
  
  // 压缩文件
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension || '')) {
    return '📦'
  }
  
  // 默认类型
  return '📁'
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const FilePreviewList: React.FC<FilePreviewListProps> = ({
  files,
  className,
  itemClassName,
  showFileName = true,
  showFileSize = true,
  showFileInfo = false,
  columns = 4,
  onFileClick,
  theme = 'auto',
  autoThemeConfig = { dark: { start: 19, end: 7 } }
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null)
  
  const handleFileClick = (file: FilePreviewProps['file'], index: number) => {
    if (onFileClick) {
      onFileClick(file)
    } else {
      setSelectedFileIndex(index)
    }
  }
  
  const handleCloseModal = () => {
    setSelectedFileIndex(null)
  }

  const handleFileChange = (newIndex: number) => {
    setSelectedFileIndex(newIndex)
  }
  
  return (
    <>
      <div className={cn("grid gap-4", className)} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {files.map((file, index) => (
          <div
            key={file.id}
            className={cn(
              "group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1",
              itemClassName
            )}
            onClick={() => handleFileClick(file, index)}
          >
            {/* 文件预览区域 */}
            <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
              {file.type.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                  {getFileIcon(file.name, file.type)}
                </div>
              )}
              
              {/* 悬停覆盖层 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 文件信息 */}
            {(showFileName || showFileSize) && (
              <div className="p-4 bg-white">
                {showFileName && (
                  <h4 className="text-sm font-semibold text-gray-900 truncate mb-2">
                    {file.originalName || file.name}
                  </h4>
                )}
                {showFileSize && file.size && (
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <p className="text-xs text-gray-500 font-medium">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 文件预览模态框 */}
      {selectedFileIndex !== null && (
        <FilePreviewModal
          file={files[selectedFileIndex]}
          files={files}
          currentIndex={selectedFileIndex}
          onFileChange={handleFileChange}
          isOpen={selectedFileIndex !== null}
          onClose={handleCloseModal}
          showFileName={showFileName}
          showFileSize={showFileSize}
          showFileInfo={showFileInfo}
          showNavigation={files.length > 1}
          theme={theme}
          autoThemeConfig={autoThemeConfig}
        />
      )}
    </>
  )
}

export default FilePreviewList
