import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../lib/utils'
import './ui/slider.css'

export interface EnhancedAudioPlayerProps {
  src: string
  title: string
  className?: string
  mode?: 'fullscreen' | 'compact'
  autoPlay?: boolean
  loop?: boolean
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

// 音频可视化组件
const AudioVisualizer: React.FC<{ isPlaying: boolean; className?: string }> = ({ 
  isPlaying, 
  className 
}) => {
  return (
    <div className={cn("flex items-center justify-center space-x-1", className)}>
      {Array.from({ length: 40 }, (_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full transition-all duration-150",
            isPlaying ? "animate-pulse" : ""
          )}
          style={{
            height: isPlaying 
              ? `${Math.random() * 60 + 10}px` 
              : '4px',
            animationDelay: `${i * 50}ms`,
            animationDuration: `${Math.random() * 500 + 500}ms`
          }}
        />
      ))}
    </div>
  )
}

export const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({
  src,
  title,
  className,
  mode = 'fullscreen',
  autoPlay = false,
  loop = false,
  onError,
  onLoadStart,
  onLoadedData
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
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
      const errorMsg = '音频加载失败'
      setError(errorMsg)
      onError?.(errorMsg)
    }
    const handleEnded = () => setIsPlaying(false)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('error', handleError)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [onError, onLoadStart, onLoadedData])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }, [isPlaying])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    audioRef.current.currentTime = newTime
  }, [duration])

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!audioRef.current) return
    
    audioRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume > 0 ? volume : 0.5
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const changePlaybackRate = useCallback((rate: number) => {
    if (!audioRef.current) return
    
    audioRef.current.playbackRate = rate
    setPlaybackRate(rate)
  }, [])

  const skipTime = useCallback((seconds: number) => {
    if (!audioRef.current) return
    
    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds))
    audioRef.current.currentTime = newTime
  }, [duration])

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
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skipTime(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          skipTime(10)
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
  }, [togglePlay, toggleMute, skipTime, volume, handleVolumeChange])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">音频播放失败</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
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

  const progressPercent = duration ? (currentTime / duration) * 100 : 0

  if (mode === 'compact') {
    return (
      <div className={cn("bg-gradient-to-br from-purple-900 to-indigo-900 p-4 rounded-lg", className)}>
        <audio ref={audioRef} src={src} autoPlay={autoPlay} loop={loop} />
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
            <span className="ml-3 text-white">加载音频中...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-white font-semibold truncate">{title}</h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="flex-shrink-0 w-12 h-12 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
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
              
              <div className="flex-1 space-y-2">
                <div 
                  className="w-full h-2 bg-white/20 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-100"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/70">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900", className)}>
      <audio ref={audioRef} src={src} autoPlay={autoPlay} loop={loop} />
      
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-purple-500 border-t-transparent"></div>
            <p className="text-white font-medium">加载音频中...</p>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* 头部信息 */}
          <div className="p-8 text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-purple-200">{formatTime(duration)} • 音频文件</p>
          </div>

          {/* 音频可视化 */}
          <div className="flex-1 flex items-center justify-center px-8">
            <AudioVisualizer isPlaying={isPlaying} className="w-full max-w-2xl h-20" />
          </div>

          {/* 控制区域 */}
          <div className="p-8 bg-black/20 backdrop-blur-sm">
            {/* 进度条 */}
            <div className="mb-6">
              <div 
                className="w-full h-3 bg-white/20 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full -mr-2.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                </div>
              </div>
              <div className="flex justify-between text-sm text-white/70 mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 主控制按钮 */}
            <div className="flex items-center justify-center space-x-6 mb-6">
              <button
                onClick={() => skipTime(-10)}
                className="text-white/70 hover:text-white transition-colors"
                title="后退10秒"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.333 4z" />
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105 shadow-xl"
              >
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button
                onClick={() => skipTime(10)}
                className="text-white/70 hover:text-white transition-colors"
                title="前进10秒"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>
            </div>

            {/* 音量和播放速度控制 */}
            <div className="flex items-center justify-between">
              {/* 音量控制 */}
              <div className="flex items-center space-x-3">
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
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
                  className="w-24 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-white/50 text-sm min-w-[3ch]">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>

              {/* 播放速度控制 */}
              <div className="flex items-center space-x-3">
                <span className="text-white/50 text-sm">速度</span>
                <div className="flex space-x-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={cn(
                        "px-2 py-1 rounded text-sm transition-colors",
                        playbackRate === rate
                          ? "bg-purple-500 text-white"
                          : "text-white/70 hover:text-white"
                      )}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedAudioPlayer
