import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'

export interface VideoPlayerProps {
  src: string
  title: string
  className?: string
  mode?: 'fullscreen' | 'compact'
  autoPlay?: boolean
  loop?: boolean
  poster?: string
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadedData?: () => void
}

// 格式化时间
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  className,
  mode = 'fullscreen',
  autoPlay = false,
  loop = false,
  poster,
  onError,
  onLoadStart,
  onLoadedData
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPictureInPicture, setIsPictureInPicture] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // 控制条自动隐藏
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowControls(true)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isMinimized) {
        setShowControls(false)
      }
    }, 3000)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handleLoadStart = () => {
      setLoading(true)
      onLoadStart?.()
    }
    const handleLoadedData = () => {
      setLoading(false)
      onLoadedData?.()
    }
    const handleError = () => {
      setLoading(false)
      const errorMsg = '视频加载失败'
      setError(errorMsg)
      onError?.(errorMsg)
    }
    const handleEnded = () => setIsPlaying(false)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    // Picture-in-Picture 事件
    const handleEnterpictureinpicture = () => setIsPictureInPicture(true)
    const handleLeavepictureinpicture = () => setIsPictureInPicture(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('enterpictureinpicture', handleEnterpictureinpicture)
    video.addEventListener('leavepictureinpicture', handleLeavepictureinpicture)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('enterpictureinpicture', handleEnterpictureinpicture)
      video.removeEventListener('leavepictureinpicture', handleLeavepictureinpicture)
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [onError, onLoadStart, onLoadedData])

  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newVolume = Math.max(0, Math.min(1, percent))
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (!videoRef.current) return

    if (isMuted) {
      videoRef.current.volume = volume || 0.5
      setIsMuted(false)
    } else {
      videoRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (isFullscreen) {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } else {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (error) {
      console.error('全屏切换失败:', error)
    }
  }

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return

    try {
      if (isPictureInPicture) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (error) {
      console.error('画中画切换失败:', error)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    setShowControls(true)
  }

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-black",
        mode === 'fullscreen' ? "w-full h-full min-h-96" : "w-full h-64",
        className
      )}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-500 border-t-transparent"></div>
          <p className="text-white text-sm font-medium">加载视频中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-black",
        mode === 'fullscreen' ? "w-full h-full min-h-96" : "w-full h-64",
        className
      )}>
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">视频加载失败</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              videoRef.current?.load()
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black overflow-hidden group",
        mode === 'fullscreen' ? "w-full h-full" : "w-full max-w-4xl mx-auto",
        isMinimized && "fixed bottom-4 right-4 w-80 h-48 z-50 rounded-lg shadow-2xl",
        className
      )}
      onMouseMove={resetControlsTimeout}
      onMouseEnter={resetControlsTimeout}
      onMouseLeave={() => {
        if (isPlaying && !isMinimized) {
          setShowControls(false)
        }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      {/* 中央播放按钮 */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-20 h-20 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      )}

      {/* 控制栏 */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-all duration-300",
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
      )}>
        {/* 进度条 */}
        <div className="mb-4">
          <div
            className="h-1 bg-white/30 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* 左侧控制 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* 音量控制 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              
              <div className="w-20 h-1 bg-white/30 rounded-full cursor-pointer" onClick={handleVolumeChange}>
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
              </div>
            </div>

            {/* 时间显示 */}
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* 右侧控制 */}
          <div className="flex items-center space-x-2">
            {/* 画中画按钮 */}
            {document.pictureInPictureEnabled && (
              <button
                onClick={togglePictureInPicture}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="画中画"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v8.5a1 1 0 01-1 1h-8a1 1 0 01-1-1V4a1 1 0 011-1z" />
                </svg>
              </button>
            )}

            {/* 小窗模式按钮 */}
            {mode === 'fullscreen' && (
              <button
                onClick={toggleMinimize}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title={isMinimized ? "恢复" : "小窗"}
              >
                {isMinimized ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-5 5m0 0l-5-5m5 5v-13" />
                  </svg>
                )}
              </button>
            )}

            {/* 全屏按钮 */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="全屏"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 标题显示 */}
      {title && (
        <div className={cn(
          "absolute top-4 left-4 text-white text-lg font-medium transition-all duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}>
          {title}
        </div>
      )}
    </div>
  )
}

export default VideoPlayer
