import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactHowler from 'react-howler'
import { cn } from '../lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Loader2
} from 'lucide-react'

export interface AudioPlayerProps {
  src: string
  title: string
  artist?: string
  album?: string
  cover?: string
  className?: string
  autoPlay?: boolean
  loop?: boolean
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadedData?: () => void
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

// 格式化时间
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00'

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
  const [bars] = useState(() =>
    Array.from({ length: 40 }, () => Math.random() * 60 + 10)
  )

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {bars.map((height, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-gradient-to-t from-purple-500 via-pink-500 to-purple-400 rounded-full transition-all duration-300",
            isPlaying ? "animate-pulse" : ""
          )}
          style={{
            height: isPlaying ? `${height}px` : '4px',
            animationDelay: `${i * 50}ms`,
            animationDuration: `${Math.random() * 500 + 500}ms`
          }}
        />
      ))}
    </div>
  )
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  artist,
  album,
  cover,
  className,
  autoPlay = false,
  loop = false,
  onError,
  onLoadStart,
  onLoadedData,
  onPlay,
  onPause,
  onEnded
}) => {
  const playerRef = useRef<ReactHowler>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [seek, setSeek] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [rate, setRate] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLooping, setIsLooping] = useState(loop)

  // 更新进度
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      if (playerRef.current) {
        const currentSeek = playerRef.current.seek() as number
        setSeek(currentSeek)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying])

  // Howler 事件处理
  const handleLoad = useCallback(() => {
    if (playerRef.current) {
      const audioDuration = playerRef.current.duration()
      setDuration(audioDuration)
      setLoading(false)
      onLoadedData?.()
    }
  }, [onLoadedData])

  const handleLoadError = useCallback((_id: number, error: any) => {
    setLoading(false)
    const errorMsg = '音频加载失败'
    setError(errorMsg)
    onError?.(errorMsg)
  }, [onError])

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    onPlay?.()
  }, [onPlay])

  const handlePauseCallback = useCallback(() => {
    setIsPlaying(false)
    onPause?.()
  }, [onPause])

  const handleEnd = useCallback(() => {
    if (!isLooping) {
      setIsPlaying(false)
      setSeek(0)
    }
    onEnded?.()
  }, [isLooping, onEnded])

  // 控制函数
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev)
  }, [])

  const handleSeekChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newSeek = percent * duration

    playerRef.current.seek(newSeek)
    setSeek(newSeek)
  }, [duration])

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
  }, [])

  const toggleMute = useCallback(() => {
    setVolume(prev => prev === 0 ? 0.8 : 0)
  }, [])

  const handleRateChange = useCallback((newRate: number) => {
    setRate(newRate)
  }, [])

  const skipTime = useCallback((seconds: number) => {
    if (!playerRef.current) return

    const currentSeek = playerRef.current.seek() as number
    const newSeek = Math.max(0, Math.min(duration, currentSeek + seconds))

    playerRef.current.seek(newSeek)
    setSeek(newSeek)
  }, [duration])

  const progressPercent = duration ? (seek / duration) * 100 : 0

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skipTime(-5)
          break
        case 'ArrowRight':
          e.preventDefault()
          skipTime(5)
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(prev => Math.min(1, prev + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(prev => Math.max(0, prev - 0.1))
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'l':
          e.preventDefault()
          toggleLoop()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, skipTime, toggleMute, toggleLoop])

  // 错误状态
  if (error) {
    return (
      <div className={cn("w-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg border border-purple-700 shadow-xl", className)}>
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">音频加载失败</h3>
          <p className="text-gray-200 mb-4">{error}</p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg"
          >
            在新窗口中打开
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-5 rounded-xl shadow-2xl border border-purple-700/50", className)}>
        <ReactHowler
          ref={playerRef}
          src={src}
          playing={isPlaying}
          loop={isLooping}
          volume={volume}
          rate={rate}
          onLoad={handleLoad}
          onLoadError={handleLoadError}
          onPlay={handlePlay}
          onPause={handlePauseCallback}
          onEnd={handleEnd}
        />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="ml-3 text-white font-medium">加载中...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 封面和标题 */}
            <div className="flex items-center gap-4">
              {cover ? (
                <img
                  src={cover}
                  alt={title}
                  className="w-16 h-16 rounded-lg object-cover shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">{title}</h3>
                {artist && <p className="text-purple-200 text-sm truncate">{artist}</p>}
              </div>
            </div>

            {/* 进度条 */}
            <div className="space-y-2">
              <div
                className="w-full h-2 bg-white/20 rounded-full cursor-pointer group relative overflow-hidden"
                onClick={handleSeekChange}
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 rounded-full transition-all shadow-lg shadow-purple-500/30"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full -mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl" />
                </div>
              </div>
              <div className="flex justify-between text-xs text-white/70">
                <span>{formatTime(seek)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* 音量 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                      aria-label="音量"
                    >
                      {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto bg-black/95 border-purple-400/40 p-3" side="top">
                    <div className="flex items-center gap-2">
                      <button onClick={toggleMute} className="text-white/80 hover:text-white">
                        {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-24 accent-purple-500"
                      />
                      <span className="text-white text-xs min-w-[3ch]">{Math.round(volume * 100)}%</span>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* 循环 */}
                <button
                  onClick={toggleLoop}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    isLooping ? 'bg-purple-500/30 text-purple-300' : 'hover:bg-white/10 text-white'
                  )}
                  aria-label="循环播放"
                >
                  <Repeat className="w-5 h-5" />
                </button>
              </div>

              {/* 播放控制 */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => skipTime(-10)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                  aria-label="后退10秒"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-purple-500/50"
                  aria-label={isPlaying ? '暂停' : '播放'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" fill="white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                  )}
                </button>

                <button
                  onClick={() => skipTime(10)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                  aria-label="前进10秒"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* 播放速度 */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-white text-sm font-medium"
                    aria-label="播放速度"
                  >
                    {rate}x
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto bg-black/95 border-purple-400/40 p-2" side="top">
                  <div className="space-y-1 min-w-[100px]">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRateChange(r)}
                        className={cn(
                          "block w-full text-left px-3 py-2 rounded text-sm transition-colors",
                          rate === r
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>
    )
}

export default AudioPlayer
