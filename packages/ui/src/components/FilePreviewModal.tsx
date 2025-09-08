import React, { useEffect, useCallback } from 'react'
import { FilePreview, FilePreviewProps } from './FilePreview'
import { cn } from '../lib/utils'
import './FilePreviewModal.css'

export interface FilePreviewModalProps extends Omit<FilePreviewProps, 'className' | 'showCloseButton'> {
  isOpen: boolean
  onClose: () => void
  files?: FilePreviewProps['file'][]
  currentIndex?: number
  onFileChange?: (index: number) => void
  className?: string
  overlayClassName?: string
  contentClassName?: string
  showNavigation?: boolean
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  files,
  currentIndex = 0,
  onFileChange,
  className,
  overlayClassName,
  contentClassName,
  showNavigation = true,
  ...filePreviewProps
}) => {
  // 键盘事件处理
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        if (files && files.length > 1 && onFileChange && currentIndex > 0) {
          onFileChange(currentIndex - 1)
        }
        break
      case 'ArrowRight':
        if (files && files.length > 1 && onFileChange && currentIndex < files.length - 1) {
          onFileChange(currentIndex + 1)
        }
        break
    }
  }, [isOpen, onClose, files, currentIndex, onFileChange])

  // 注册键盘事件监听
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, handleKeyDown])

  // 阻止滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentFile = files && files.length > 0 ? files[currentIndex] : filePreviewProps.file
  const hasMultipleFiles = files && files.length > 1
  const canGoToPrevious = hasMultipleFiles && currentIndex > 0
  const canGoToNext = hasMultipleFiles && currentIndex < files.length - 1

  return (
    <div 
      className={cn("file-preview-modal fixed inset-0 z-[99999] bg-black !mt-0", className)} 
      style={{ 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        margin: 0,
        padding: 0
      }}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* 导航按钮 - 左 */}
      {showNavigation && canGoToPrevious && (
        <button
          onClick={() => onFileChange?.(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 导航按钮 - 右 */}
      {showNavigation && canGoToNext && (
        <button
          onClick={() => onFileChange?.(currentIndex + 1)}
          className="absolute right-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 文件计数器 */}
      {hasMultipleFiles && showNavigation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium">
          {currentIndex + 1} / {files.length}
        </div>
      )}
      
      {/* 预览内容 - 全屏滚动容器 */}
      <div className={cn(
        "w-full h-full overflow-auto",
        contentClassName
      )}>
        <FilePreview
          file={currentFile || filePreviewProps.file}
          onClose={onClose}
          showCloseButton={false}
          className="min-h-full"
          {...(filePreviewProps as any)}
        />
      </div>
    </div>
  )
}

export default FilePreviewModal
