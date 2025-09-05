import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, RotateCcw, Move, X } from 'lucide-react'
import { cn } from '../lib/utils'

type DisplayMode = 'inline' | 'floating' | 'fullscreen'

interface FloatingPosition {
  x: number
  y: number
}

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  className?: string
  autoPlay?: boolean
  displayMode?: DisplayMode
  floatingPosition?: FloatingPosition
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number) => void
  onDisplayModeChange?: (mode: DisplayMode) => void
  onFloatingPositionChange?: (position: FloatingPosition) => void
  onClose?: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  className,
  autoPlay = false,
  displayMode = 'inline',
  floatingPosition = { x: window.innerWidth - 400, y: 50 },
  onEnded,
  onTimeUpdate,
  onDisplayModeChange,
  onFloatingPositionChange,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [internalDisplayMode, setInternalDisplayMode] = useState<DisplayMode>(displayMode)
  const [internalPosition, setInternalPosition] = useState<FloatingPosition>(floatingPosition)

  // 使用内部状态或外部控制
  const currentDisplayMode = onDisplayModeChange ? displayMode : internalDisplayMode
  const currentPosition = onFloatingPositionChange ? floatingPosition : internalPosition

  // 控制条自动隐藏
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (isPlaying && showControls) {
      timeout = setTimeout(() => setShowControls(false), 7777)
    }
    return () => clearTimeout(timeout)
  }, [isPlaying, showControls])

  // 鼠标移动显示控制条
  const handleMouseMove = () => {
    setShowControls(true)
  }

  // 播放/暂停
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // 音量控制
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  // 进度控制
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  // 快进/快退
  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  // 全屏控制 (现在通过 displayMode 管理)
  const toggleFullscreen = () => {
    if (currentDisplayMode !== 'fullscreen') {
      if (onDisplayModeChange) {
        onDisplayModeChange('fullscreen')
      } else {
        setInternalDisplayMode('fullscreen')
      }
    } else {
      if (onDisplayModeChange) {
        onDisplayModeChange('inline')
      } else {
        setInternalDisplayMode('inline')
      }
    }
  }

  // 重新播放
  const replay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  // 切换显示模式
  const toggleDisplayMode = () => {
    const modes: DisplayMode[] = ['inline', 'floating', 'fullscreen']
    const currentIndex = modes.indexOf(currentDisplayMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    
    if (onDisplayModeChange) {
      onDisplayModeChange(nextMode)
    } else {
      setInternalDisplayMode(nextMode)
    }
  }

  // 开始拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentDisplayMode !== 'floating') return
    
    setIsDragging(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  // 拖拽过程
  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || currentDisplayMode !== 'floating') return

    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    }

    // 限制在窗口范围内
    const maxX = window.innerWidth - 400
    const maxY = window.innerHeight - 300
    
    newPosition.x = Math.max(0, Math.min(maxX, newPosition.x))
    newPosition.y = Math.max(0, Math.min(maxY, newPosition.y))

    if (onFloatingPositionChange) {
      onFloatingPositionChange(newPosition)
    } else {
      setInternalPosition(newPosition)
    }
  }

  // 结束拖拽
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 处理拖拽事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // 全屏模式键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentDisplayMode === 'fullscreen' && e.key === 'Escape') {
        if (onDisplayModeChange) {
          onDisplayModeChange('inline')
        } else {
          setInternalDisplayMode('inline')
        }
      }
    }

    if (currentDisplayMode === 'fullscreen') {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentDisplayMode, onDisplayModeChange])

  // 格式化时间
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 视频事件处理
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      onTimeUpdate?.(videoRef.current.currentTime)
    }
  }

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      setBuffered(bufferedEnd)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    onEnded?.()
  }

  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => setIsPlaying(false)

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          if (volume < 1) {
            const newVolume = Math.min(1, volume + 0.1)
            setVolume(newVolume)
            videoRef.current.volume = newVolume
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (volume > 0) {
            const newVolume = Math.max(0, volume - 0.1)
            setVolume(newVolume)
            videoRef.current.volume = newVolume
          }
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, volume])

  // 渲染播放器内容
  const renderPlayerContent = () => (
    <>
      {/* 头部控制栏 - 仅在浮动和全屏模式显示 */}
      {(currentDisplayMode === 'floating' || currentDisplayMode === 'fullscreen') && (
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          {currentDisplayMode === 'floating' && (
            <div 
              className="flex items-center cursor-move bg-black/50 rounded px-2 py-1"
              onMouseDown={handleMouseDown}
            >
              <Move className="w-4 h-4 text-white mr-2" />
              <span className="text-xs text-white">拖拽移动</span>
            </div>
          )}
          <div className="flex items-center space-x-2 ml-auto">
            {/* 显示模式切换 */}
            <button
              onClick={toggleDisplayMode}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              title="切换显示模式"
            >
              {currentDisplayMode === 'floating' ? (
                <Maximize className="w-4 h-4" />
              ) : currentDisplayMode === 'fullscreen' ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
            {/* 关闭按钮 */}
            {(currentDisplayMode === 'floating' || currentDisplayMode === 'fullscreen') && (
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                title="关闭播放器"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
      {/* 视频元素 */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
      />

      {/* 标题 */}
      {title && (
        <div className={cn(
          "absolute text-white font-semibold drop-shadow-lg",
          (currentDisplayMode === 'floating' || currentDisplayMode === 'fullscreen') ? 
            "top-16 left-4" : "top-4 left-4",
          currentDisplayMode === 'fullscreen' ? "text-2xl" : 
          currentDisplayMode === 'floating' ? "text-sm" : "text-lg",
          currentDisplayMode === 'floating' && "hidden"
        )}>
          {title}
        </div>
      )}

      {/* 内嵌模式下的显示模式切换按钮 */}
      {currentDisplayMode === 'inline' && (
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleDisplayMode}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            title="切换显示模式"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 播放按钮覆盖层 */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className={cn(
              "bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors",
              currentDisplayMode === 'floating' ? "w-12 h-12" :
              currentDisplayMode === 'fullscreen' ? "w-24 h-24" : "w-20 h-20"
            )}
          >
            <Play className={cn(
              "ml-1",
              currentDisplayMode === 'floating' ? "w-4 h-4" :
              currentDisplayMode === 'fullscreen' ? "w-10 h-10" : "w-8 h-8"
            )} />
          </button>
        </div>
      )}

      {/* 控制条 */}
      {showControls && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent",
          currentDisplayMode === 'floating' ? "p-2" :
          currentDisplayMode === 'fullscreen' ? "p-6" : "p-4"
        )}>
          {/* 进度条 - 浮动模式下隐藏 */}
          {currentDisplayMode !== 'floating' && (
            <div className="relative mb-3">
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={handleProgressChange}
                className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer slider"
              />
              {/* 缓冲进度 */}
              <div 
                className="absolute top-0 left-0 h-1 bg-white/50 rounded-full pointer-events-none"
                style={{ width: `${(buffered / duration) * 100}%` }}
              />
            </div>
          )}

          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center",
              currentDisplayMode === 'floating' ? "space-x-2" : "space-x-4"
            )}>
              {/* 播放/暂停 */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? (
                  <Pause className={cn(
                    currentDisplayMode === 'floating' ? "w-4 h-4" :
                    currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                  )} />
                ) : (
                  <Play className={cn(
                    currentDisplayMode === 'floating' ? "w-4 h-4" :
                    currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                  )} />
                )}
              </button>

              {/* 快退/快进 - 浮动模式下隐藏 */}
              {currentDisplayMode !== 'floating' && (
                <>
                  <button
                    onClick={() => skip(-10)}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    <SkipBack className={cn(
                      currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                    )} />
                  </button>
                  <button
                    onClick={() => skip(10)}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    <SkipForward className={cn(
                      currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                    )} />
                  </button>

                  {/* 重新播放 */}
                  <button
                    onClick={replay}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    <RotateCcw className={cn(
                      currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                    )} />
                  </button>
                </>
              )}

              {/* 音量控制 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className={cn(
                      currentDisplayMode === 'floating' ? "w-4 h-4" :
                      currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                    )} />
                  ) : (
                    <Volume2 className={cn(
                      currentDisplayMode === 'floating' ? "w-4 h-4" :
                      currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                    )} />
                  )}
                </button>
                {/* 音量滑块 - 浮动模式下隐藏 */}
                {currentDisplayMode !== 'floating' && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={volume}
                    onChange={handleVolumeChange}
                    className={cn(
                      "h-1 bg-white/30 rounded-full appearance-none cursor-pointer slider",
                      currentDisplayMode === 'fullscreen' ? "w-20" : "w-16"
                    )}
                  />
                )}
              </div>

              {/* 时间显示 - 浮动模式下隐藏 */}
              {currentDisplayMode !== 'floating' && (
                <span className={cn(
                  "text-white",
                  currentDisplayMode === 'fullscreen' ? "text-base" : "text-sm"
                )}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
            </div>

            {/* 全屏按钮 - 浮动模式下移到头部 */}
            {currentDisplayMode === 'inline' && (
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}


    </>
  )

  // 根据显示模式返回不同的容器
  if (currentDisplayMode === 'floating') {
    return (
      <div
        ref={containerRef}
        className={cn(
          'fixed bg-black rounded-lg shadow-2xl border border-gray-700 overflow-hidden z-50 select-none',
          isDragging && 'cursor-grabbing',
          className
        )}
        style={{
          left: currentPosition.x,
          top: currentPosition.y,
          width: '360px',
          height: '240px'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {renderPlayerContent()}
      </div>
    )
  }

  if (currentDisplayMode === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div
          ref={containerRef}
          className={cn(
            'relative w-full h-full bg-black overflow-hidden',
            className
          )}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {renderPlayerContent()}
        </div>
      </div>
    )
  }

  // 默认内嵌模式
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-lg overflow-hidden group',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {renderPlayerContent()}
    </div>
  )
}

export default VideoPlayer
