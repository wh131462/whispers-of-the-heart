import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../../lib/utils'

interface ImagePreviewProps {
  url: string
  alt: string
  className?: string
  showToolbar?: boolean
  onTransformChange?: (transform: TransformState) => void
  onNaturalSizeChange?: (size: { width: number; height: number }) => void
}

interface TransformState {
  scale: number
  rotate: number
  translateX: number
  translateY: number
}

const SCALE_STEP = 0.2
const MIN_SCALE = 0.1
const MAX_SCALE = 10
const ROTATE_STEP = 90

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  alt,
  className,
  showToolbar = false,
  onTransformChange,
  onNaturalSizeChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  
  // 图片变换状态
  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    rotate: 0,
    translateX: 0,
    translateY: 0
  })
  
  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialTranslate, setInitialTranslate] = useState({ x: 0, y: 0 })

  // 恢复到初始100%缩放比
  const resetTransform = useCallback(() => {
    setTransform({
      scale: 1,
      rotate: 0,
      translateX: 0,
      translateY: 0
    })
  }, [])

  // 缩放功能
  const zoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale + SCALE_STEP, MAX_SCALE)
    }))
  }, [])

  const zoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale - SCALE_STEP, MIN_SCALE)
    }))
  }, [])

  // 旋转功能
  const rotateLeft = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      rotate: prev.rotate - ROTATE_STEP
    }))
  }, [])

  const rotateRight = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      rotate: prev.rotate + ROTATE_STEP
    }))
  }, [])

  // 适应窗口宽高展示
  const autoFit = useCallback(() => {
    if (!naturalSize.width || !naturalSize.height) return
    
    // 获取容器尺寸（假设容器是父元素）
    const container = imageRef.current?.parentElement
    if (!container) return
    
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    // 计算适应容器的缩放比例，允许放大
    const scaleX = containerWidth / naturalSize.width
    const scaleY = containerHeight / naturalSize.height
    const scale = Math.min(scaleX, scaleY) // 适应窗口，可以放大
    
    setTransform(prev => ({
      ...prev,
      scale,
      translateX: 0,
      translateY: 0
    }))
  }, [naturalSize])

  // 按原始尺寸展示
  const actualSize = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: 1,
      translateX: 0,
      translateY: 0
    }))
  }, [])

  // 鼠标拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialTranslate({ x: transform.translateX, y: transform.translateY })
  }, [transform.translateX, transform.translateY])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    setTransform(prev => ({
      ...prev,
      translateX: initialTranslate.x + deltaX,
      translateY: initialTranslate.y + deltaY
    }))
  }, [isDragging, dragStart, initialTranslate])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale + delta))
    
    setTransform(prev => ({
      ...prev,
      scale: newScale
    }))
  }, [transform.scale])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return // 忽略输入框中的按键
      }
      
      switch (e.key) {
        case '=':
        case '+':
          e.preventDefault()
          zoomIn()
          break
        case '-':
          e.preventDefault()
          zoomOut()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          if (e.shiftKey) {
            rotateLeft()
          } else {
            rotateRight()
          }
          break
        case '0':
          e.preventDefault()
          resetTransform()
          break
        case '1':
          e.preventDefault()
          actualSize()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          autoFit()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [zoomIn, zoomOut, rotateLeft, rotateRight, resetTransform, actualSize, autoFit])

  // 鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 图片加载完成后自动调整
  useEffect(() => {
    if (imageLoaded && naturalSize.width && naturalSize.height) {
      resetTransform()
    }
  }, [imageLoaded, naturalSize, resetTransform])

  // 通知父组件变换状态变化
  useEffect(() => {
    onTransformChange?.(transform)
  }, [transform, onTransformChange])

  // 通知父组件图片原始尺寸变化
  useEffect(() => {
    if (naturalSize.width && naturalSize.height) {
      onNaturalSizeChange?.(naturalSize)
    }
  }, [naturalSize, onNaturalSizeChange])

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    setLoading(false)
    setImageLoaded(true)
  }, [])

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoading(false)
    const target = e.currentTarget
    setError(`图片加载失败: ${target.src}`)
  }, [])

  const retryLoad = useCallback(() => {
    if (retryCount >= 3) return
    
    setError(null)
    setLoading(true)
    setRetryCount(prev => prev + 1)
    
    // 强制重新加载图片
    if (imageRef.current) {
      imageRef.current.src = `${url}?t=${Date.now()}`
    }
  }, [url, retryCount])

  const transformStyle = {
    transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale}) rotate(${transform.rotate}deg)`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    cursor: transform.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
  }

  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">图片加载失败</h3>
          <p className="text-gray-600 mb-4">{error || '请检查图片链接是否正确'}</p>
          {retryCount < 3 && (
            <button
              onClick={retryLoad}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重试 ({retryCount + 1}/3)
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100", className)} style={{ margin: 0, padding: 0 }}>
      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
            <p className="text-sm text-gray-600 font-medium">加载中...</p>
          </div>
        </div>
      )}

      {/* 工具栏 - 仅在需要时显示 */}
      {showToolbar && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center space-x-1 bg-white rounded-lg p-2 shadow-2xl border border-gray-300/80"
             style={{ bottom: '16px', zIndex: 50 }}>
          <button
            onClick={zoomOut}
            disabled={transform.scale <= MIN_SCALE}
            className="p-1.5 text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="缩小 (-)"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="text-gray-800 text-xs font-medium w-12 text-center">
            {Math.round(transform.scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            disabled={transform.scale >= MAX_SCALE}
            className="p-1.5 text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="放大 (+)"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
          </button>
          
          <div className="w-px h-4 bg-gray-400" />
          
          <button
            onClick={rotateLeft}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="逆时针旋转 (Shift+R)"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button
            onClick={rotateRight}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="顺时针旋转 (R)"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
          
          <div className="w-px h-4 bg-gray-400" />
          
          <button
            onClick={actualSize}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="按原始尺寸展示 (1)"
          >
            <svg className="w-5 h-5 text-gray-800" viewBox="0 0 1024 1024" fill="currentColor">
              <path d="M224.186822 222.905755h71.739784v577.334445h-71.739784zM735.7598 222.905755h71.739783v577.334445H735.7598zM479.546289 295.499583h71.739783v72.593828H479.546289zM479.546289 584.166806h71.739783v72.593828H479.546289z" />
            </svg>
          </button>
          
          <button
            onClick={autoFit}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="适应窗口宽高展示 (F)"
          >
            <svg className="w-5 h-5 text-gray-800" viewBox="0 0 1024 1024" fill="currentColor">
              <path d="M752 120.96H271.786667A158.506667 158.506667 0 0 0 111.786667 277.333333v469.333334a158.293333 158.293333 0 0 0 160 156.373333h480.213333A158.506667 158.506667 0 0 0 912.213333 746.666667V277.333333a158.506667 158.506667 0 0 0-160.213333-156.373333z m82.346667 622.293333a89.386667 89.386667 0 0 1-85.333334 83.626667H275.626667a89.386667 89.386667 0 0 1-85.333334-83.626667V280.96a88.96 88.96 0 0 1 85.333334-83.413333h472.746666a88.96 88.96 0 0 1 85.333334 83.413333z" />
              <path d="M567.04 542.08h113.92l-22.4 22.4a30.506667 30.506667 0 0 0 42.666667 42.666667L775.466667 533.333333a29.866667 29.866667 0 0 0 0-42.666666l-75.306667-75.52a30.506667 30.506667 0 0 0-42.666667 42.666666l22.4 22.4h-112.853333a30.72 30.72 0 0 0 0 61.226667z m-243.2 66.773333a30.293333 30.293333 0 0 0 42.666667 0 30.72 30.72 0 0 0 0-42.666666l-22.4-22.4h117.333333a30.72 30.72 0 1 0 0-61.226667h-118.4l22.4-22.4a30.506667 30.506667 0 0 0-42.666667-42.666667L248.533333 490.666667a29.866667 29.866667 0 0 0 0 42.666666z" />
            </svg>
          </button>
          
          <button
            onClick={resetTransform}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="恢复到初始100%缩放比 (0)"
          >
            <svg className="w-5 h-5 text-gray-800" viewBox="0 0 1024 1024" fill="currentColor">
              <path d="M524.8 106.666667c-106.666667 0-209.066667 42.666667-285.866667 110.933333l-8.533333-68.266667c0-25.6-21.333333-42.666667-46.933333-38.4-25.6 0-42.666667 21.333333-38.4 46.933334l8.533333 115.2c4.266667 55.466667 51.2 98.133333 106.666667 98.133333h8.533333L384 362.666667c25.6 0 42.666667-21.333333 38.4-46.933334 0-25.6-21.333333-42.666667-46.933333-38.4l-85.333334 4.266667c64-55.466667 145.066667-89.6 230.4-89.6 187.733333 0 341.333333 153.6 341.333334 341.333333s-153.6 341.333333-341.333334 341.333334-341.333333-153.6-341.333333-341.333334c0-25.6-17.066667-42.666667-42.666667-42.666666s-42.666667 17.066667-42.666666 42.666666c0 234.666667 192 426.666667 426.666666 426.666667s426.666667-192 426.666667-426.666667c4.266667-234.666667-187.733333-426.666667-422.4-426.666666z" />
            </svg>
          </button>
          
          <div className="w-px h-4 bg-gray-400" />
          
          <button
            onClick={async () => {
              try {
                // 获取文件名，优先使用原始文件名
                const fileName = alt || 'image'
                const fileExtension = fileName.includes('.') ? '' : '.jpg'
                const downloadName = fileName + fileExtension
                
                // 创建下载链接
                const link = document.createElement('a')
                link.href = url
                link.download = downloadName
                link.target = '_blank'
                
                // 添加到DOM并触发下载
                document.body.appendChild(link)
                link.click()
                
                // 清理DOM
                setTimeout(() => {
                  document.body.removeChild(link)
                }, 100)
                
                // 可选：显示下载提示
                console.log(`正在下载: ${downloadName}`)
              } catch (error) {
                console.error('下载失败:', error)
                // 如果下载失败，尝试在新窗口打开
                window.open(url, '_blank')
              }
            }}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="下载图片"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      )}

      {/* 图片容器 */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <img
          ref={imageRef}
          src={url}
          alt={alt}
          style={transformStyle}
          className={cn(
            "max-w-none max-h-none",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
      </div>

    </div>
  )
}

export default ImagePreview
