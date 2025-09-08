import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../lib/utils'
import Hls from 'hls.js'
import './ui/slider.css'

export interface EnhancedVideoPlayerProps {
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

// 检测是否为HLS视频
const isHlsVideo = (src: string) => {
  return src.includes('.m3u8') || src.includes('hls')
}

export const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
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
  const hlsRef = useRef<Hls | null>(null)
  
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
  const [qualityLevels, setQualityLevels] = useState<{ level: number; height: number; bitrate: number }[]>([])
  const [currentQuality, setCurrentQuality] = useState(-1) // -1 表示自动

  // 控制条自动隐藏
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowControls(true)
    if (mode === 'fullscreen') {
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }, 3000)
    }
  }, [isPlaying, mode])

  // 初始化HLS或普通视频
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }

    if (isHlsVideo(src)) {
      // HLS 视频处理
      if (Hls.isSupported()) {
        cleanup()
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        })
        
        hlsRef.current = hls
        hls.loadSource(src)
        hls.attachMedia(video)
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false)
          onLoadedData?.()
          
          // 获取质量级别
          const levels = hls.levels.map((level, index) => ({
            level: index,
            height: level.height || 0,
            bitrate: level.bitrate || 0
          }))
          setQualityLevels(levels)
          setCurrentQuality(-1) // 默认自动
        })
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data)
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('网络错误，无法加载视频')
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('媒体错误，视频格式不支持')
                break
              default:
                setError('视频播放出现错误')
                break
            }
            onError?.(error || '视频播放出现错误')
          }
        })
        
        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          setCurrentQuality(data.level)
        })
        
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari 原生支持 HLS
        video.src = src
      } else {
        setError('您的浏览器不支持HLS视频播放')
        onError?.('您的浏览器不支持HLS视频播放')
      }
    } else {
      // 普通视频处理
      cleanup()
      video.src = src
    }

    return cleanup
  }, [src, onError, onLoadedData])

  // 视频事件监听
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
      if (!isHlsVideo(src)) {
        setLoading(false)
        onLoadedData?.()
      }
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
    }
  }, [src, onError, onLoadStart, onLoadedData])

  // 全屏状态监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // 播放/暂停控制
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [isPlaying])

  // 进度条控制
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    videoRef.current.currentTime = newTime
  }, [duration])

  // 音量控制
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return
    
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return

    if (isMuted) {
      videoRef.current.volume = volume > 0 ? volume : 0.5
      setIsMuted(false)
    } else {
      videoRef.current.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  // 全屏控制
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [isFullscreen])

  // 画中画控制
  const togglePictureInPicture = useCallback(() => {
    if (!videoRef.current) return

    if (isPictureInPicture) {
      document.exitPictureInPicture()
    } else {
      videoRef.current.requestPictureInPicture()
    }
  }, [isPictureInPicture])

  // 质量控制
  const changeQuality = useCallback((level: number) => {
    if (!hlsRef.current) return
    
    hlsRef.current.currentLevel = level
    setCurrentQuality(level)
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 0.1))
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, toggleFullscreen, toggleMute, duration, volume, handleVolumeChange])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">视频播放失败</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <a
            href={src}
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
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-black group",
        mode === 'fullscreen' ? "cursor-none" : "",
        className
      )}
      onMouseMove={resetControlsTimeout}
      onMouseEnter={resetControlsTimeout}
    >
      {/* 视频元素 */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        playsInline
        onClick={togglePlay}
      />

      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-red-500 border-t-transparent"></div>
            <p className="text-white font-medium">
              {isHlsVideo(src) ? '加载流媒体中...' : '加载视频中...'}
            </p>
          </div>
        </div>
      )}

      {/* 播放按钮覆盖层 */}
      {!isPlaying && !loading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* 控制条 */}
      {mode === 'fullscreen' && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}>
          {/* 进度条 */}
          <div className="mb-4">
            <div 
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-red-500 rounded-full relative"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full -mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* 播放/暂停 */}
              <button onClick={togglePlay} className="text-white hover:text-red-400 transition-colors">
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* 音量控制 */}
              <div className="flex items-center space-x-2">
                <button onClick={toggleMute} className="text-white hover:text-red-400 transition-colors">
                  {isMuted || volume === 0 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* 标题 */}
              <span className="text-white font-medium">{title}</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* 质量选择 (仅HLS) */}
              {isHlsVideo(src) && qualityLevels.length > 1 && (
                <div className="relative group">
                  <button className="text-white hover:text-red-400 transition-colors text-sm">
                    {currentQuality === -1 ? '自动' : `${qualityLevels[currentQuality]?.height}p`}
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="space-y-1 text-sm">
                      <button
                        onClick={() => changeQuality(-1)}
                        className={cn(
                          "block w-full text-left px-3 py-1 rounded transition-colors",
                          currentQuality === -1 ? "bg-red-500 text-white" : "text-white/70 hover:text-white"
                        )}
                      >
                        自动
                      </button>
                      {qualityLevels.map((level) => (
                        <button
                          key={level.level}
                          onClick={() => changeQuality(level.level)}
                          className={cn(
                            "block w-full text-left px-3 py-1 rounded transition-colors",
                            currentQuality === level.level ? "bg-red-500 text-white" : "text-white/70 hover:text-white"
                          )}
                        >
                          {level.height}p
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 画中画 */}
              <button
                onClick={togglePictureInPicture}
                className="text-white hover:text-red-400 transition-colors"
                title="画中画"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v8.5a1 1 0 01-1 1h-8a1 1 0 01-1-1V4a1 1 0 011-1z" />
                </svg>
              </button>

              {/* 全屏 */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-red-400 transition-colors"
                title="全屏"
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 简化控制条 (compact模式) */}
      {mode === 'compact' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center space-x-3">
            <button onClick={togglePlay} className="text-white hover:text-red-400 transition-colors">
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            
            <div 
              className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedVideoPlayer
