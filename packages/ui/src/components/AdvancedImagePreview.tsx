import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../lib/utils'

interface AdvancedImagePreviewProps {
  url: string
  alt: string
  className?: string
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

export const AdvancedImagePreview: React.FC<AdvancedImagePreviewProps> = ({
  url,
  alt,
  className
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

  // 重置图片到适合容器的状态
  const resetTransform = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return
    
    const img = imageRef.current
    const container = containerRef.current
    
    const containerRect = container.getBoundingClientRect()
    const imgNaturalWidth = naturalSize.width || img.naturalWidth
    const imgNaturalHeight = naturalSize.height || img.naturalHeight
    
    if (imgNaturalWidth && imgNaturalHeight) {
      // 计算适合容器的缩放比例
      const scaleX = (containerRect.width - 40) / imgNaturalWidth
      const scaleY = (containerRect.height - 40) / imgNaturalHeight
      const autoScale = Math.min(scaleX, scaleY, 1) // 不放大，只缩小
      
      setTransform({
        scale: autoScale,
        rotate: 0,
        translateX: 0,
        translateY: 0
      })
    }
  }, [naturalSize])

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

  // 1:1 显示
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
    if (transform.scale <= 1) return // 只有放大时才能拖拽
    
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialTranslate({ x: transform.translateX, y: transform.translateY })
  }, [transform.scale, transform.translateX, transform.translateY])

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
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [zoomIn, zoomOut, rotateLeft, rotateRight, resetTransform, actualSize])

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
    <div className={cn("relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 !m-0", className)} style={{ margin: 0, padding: 0 }}>
      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
            <p className="text-sm text-gray-600 font-medium">加载中...</p>
          </div>
        </div>
      )}

      {/* 工具栏 */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
        <button
          onClick={zoomOut}
          disabled={transform.scale <= MIN_SCALE}
          className="p-2 text-white hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="缩小 (-)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <span className="text-white text-sm font-medium min-w-[60px] text-center">
          {Math.round(transform.scale * 100)}%
        </span>
        
        <button
          onClick={zoomIn}
          disabled={transform.scale >= MAX_SCALE}
          className="p-2 text-white hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="放大 (+)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
        
        <div className="w-px h-6 bg-white/30" />
        
        <button
          onClick={rotateLeft}
          className="p-2 text-white hover:bg-white/20 rounded transition-colors"
          title="逆时针旋转 (Shift+R)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        
        <button
          onClick={rotateRight}
          className="p-2 text-white hover:bg-white/20 rounded transition-colors"
          title="顺时针旋转 (R)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>
        
        <div className="w-px h-6 bg-white/30" />
        
        <button
          onClick={actualSize}
          className="p-2 text-white hover:bg-white/20 rounded transition-colors"
          title="实际大小 (1)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </button>
        
        <button
          onClick={resetTransform}
          className="p-2 text-white hover:bg-white/20 rounded transition-colors"
          title="适合窗口 (0)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16V8a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>

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

      {/* 快捷键提示 */}
      <div className="absolute bottom-4 left-4 z-20 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
        <div className="space-y-1">
          <div>+/- 缩放 • R 旋转 • 1 实际大小 • 0 适合窗口</div>
          <div>鼠标滚轮缩放 • 拖拽移动（放大时）</div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedImagePreview
