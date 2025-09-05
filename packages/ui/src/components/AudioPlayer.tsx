import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'

export interface AudioPlayerProps {
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

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
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

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('error', handleError)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onError, onLoadStart, onLoadedData])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newVolume = Math.max(0, Math.min(1, percent))
    audioRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume || 0.5
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center",
        mode === 'fullscreen' ? "w-full h-full min-h-96" : "w-full h-32",
        className
      )}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-purple-500 border-t-transparent"></div>
          <p className="text-white text-sm font-medium">加载音频中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center",
        mode === 'fullscreen' ? "w-full h-full min-h-96" : "w-full h-32",
        className
      )}>
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">音频加载失败</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              audioRef.current?.load()
            }}
            className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
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
    <div className={cn(
      "flex flex-col items-center justify-center text-white",
      mode === 'fullscreen' ? "w-full h-full min-h-96 p-8" : "w-full p-4",
      className
    )}>
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        preload="metadata"
      />

      {/* 音频可视化区域 */}
      <div className={cn(
        "flex items-center justify-center mb-8",
        mode === 'fullscreen' ? "w-64 h-64" : "w-32 h-32"
      )}>
        <div className={cn(
          "relative rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-2xl flex items-center justify-center",
          mode === 'fullscreen' ? "w-64 h-64" : "w-32 h-32",
          isPlaying && "animate-pulse"
        )}>
          {/* 播放/暂停按钮 */}
          <button
            onClick={togglePlay}
            className={cn(
              "absolute inset-0 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors duration-200",
              mode === 'fullscreen' ? "text-6xl" : "text-3xl"
            )}
          >
            {isPlaying ? (
              <svg className="w-1/3 h-1/3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-1/3 h-1/3 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* 音频波形效果 */}
          {isPlaying && (
            <div className="absolute inset-0 rounded-full">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute inset-0 rounded-full border-2 border-white/30 animate-ping",
                    `animation-delay-${i * 200}`
                  )}
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 音频信息 */}
      <div className="text-center mb-6">
        <h3 className={cn(
          "font-bold text-white mb-2",
          mode === 'fullscreen' ? "text-2xl" : "text-lg"
        )}>
          {title}
        </h3>
        <div className={cn(
          "text-gray-400",
          mode === 'fullscreen' ? "text-lg" : "text-sm"
        )}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* 进度条 */}
      <div className={cn(
        "w-full mb-4",
        mode === 'fullscreen' ? "max-w-2xl" : "max-w-md"
      )}>
        <div
          className="h-2 bg-gray-700 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-100"
            style={{ left: `${(currentTime / duration) * 100}%`, marginLeft: '-8px' }}
          />
        </div>
      </div>

      {/* 音量控制 */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleMute}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          {isMuted || volume === 0 ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
        
        <div className="w-24 h-1 bg-gray-700 rounded-full cursor-pointer" onClick={handleVolumeChange}>
          <div
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer
