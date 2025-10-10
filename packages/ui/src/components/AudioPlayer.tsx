import React, { useState, useRef, useEffect } from 'react'
import ReactHowler from 'react-howler'
import { cn } from '../lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'

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
  className,
  mode = 'fullscreen',
  autoPlay = false,
  loop = false,
  onError,
  onLoadStart,
  onLoadedData
}) => {
  const playerRef = useRef<ReactHowler>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [seek, setSeek] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [rate, setRate] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  const handleLoad = () => {
    if (playerRef.current) {
      const audioDuration = playerRef.current.duration()
      setDuration(audioDuration)
      setLoading(false)
      onLoadedData?.()
    }
  }

  const handleLoadError = (_id: number, error: any) => {
    setLoading(false)
    const errorMsg = '音频加载失败'
    setError(errorMsg)
    onError?.(errorMsg)
  }

  const handleEnd = () => {
    if (!loop) {
      setIsPlaying(false)
      setSeek(0)
    }
  }

  // 控制函数
  const togglePlay = () => setIsPlaying(!isPlaying)

  const handleSeekChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newSeek = percent * duration

    playerRef.current.seek(newSeek)
    setSeek(newSeek)
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
  }

  const toggleMute = () => {
    setVolume(volume === 0 ? 1 : 0)
  }

  const handleRateChange = (newRate: number) => {
    setRate(newRate)
  }

  const skipTime = (seconds: number) => {
    if (!playerRef.current) return

    const currentSeek = playerRef.current.seek() as number
    const newSeek = Math.max(0, Math.min(duration, currentSeek + seconds))

    playerRef.current.seek(newSeek)
    setSeek(newSeek)
  }

  const progressPercent = duration ? (seek / duration) * 100 : 0

  // 错误状态
  if (error) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900", className)}>
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">音频加载失败</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            在新窗口中打开
          </a>
        </div>
      </div>
    )
  }

  // Compact 模式
  if (mode === 'compact') {
    return (
      <div className={cn("bg-gradient-to-br from-purple-900 to-indigo-900 p-4 rounded-xl shadow-lg", className)}>
        <ReactHowler
          ref={playerRef}
          src={src}
          playing={isPlaying}
          loop={loop}
          volume={volume}
          rate={rate}
          onLoad={handleLoad}
          onLoadError={handleLoadError}
          onEnd={handleEnd}
        />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent" />
            <span className="ml-3 text-white">加载中...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-center truncate">{title}</h3>

            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <div className="flex-1 space-y-2">
                <div
                  className="w-full h-2 bg-white/30 rounded-full cursor-pointer group"
                  onClick={handleSeekChange}
                >
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/80">
                  <span>{formatTime(seek)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Fullscreen 模式
  return (
    <div className={cn("relative w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900", className)}>
      <ReactHowler
        ref={playerRef}
        src={src}
        playing={isPlaying}
        loop={loop}
        volume={volume}
        rate={rate}
        onLoad={handleLoad}
        onLoadError={handleLoadError}
        onEnd={handleEnd}
      />

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-purple-400 border-t-transparent" />
            <p className="text-white font-medium">加载中...</p>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* 头部 */}
          <div className="p-8 text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50 ring-4 ring-purple-400/20">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
            <p className="text-purple-200 text-lg">{formatTime(duration)}</p>
          </div>

          {/* 可视化 */}
          <div className="flex-1 flex items-center justify-center px-8">
            <AudioVisualizer isPlaying={isPlaying} className="w-full max-w-2xl h-20" />
          </div>

          {/* 控制栏 */}
          <div className="p-8 bg-gradient-to-t from-black/50 to-transparent backdrop-blur-sm">
            {/* 进度条 */}
            <div className="mb-8">
              <div
                className="w-full h-3 bg-white/30 rounded-full cursor-pointer group border border-white/10"
                onClick={handleSeekChange}
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 rounded-full relative shadow-lg shadow-purple-500/50"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full -mr-2.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl" />
                </div>
              </div>
              <div className="flex justify-between text-sm text-white mt-3">
                <span>{formatTime(seek)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={() => skipTime(-10)}
                className="text-white hover:text-pink-300 transition-all hover:scale-110 p-2 rounded-full hover:bg-white/10"
                title="后退10秒"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.1 11h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm4.28-1.76c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.10-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.10.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.05-.25-.05-.18.02-.25.05-.14.09-.19.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.02.25-.05.14-.09.19-.17.09-.19.12-.32.04-.29.04-.48v-.97z"/>
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className="w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-2xl shadow-purple-500/50"
              >
                {isPlaying ? (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-10 h-10 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button
                onClick={() => skipTime(10)}
                className="text-white hover:text-pink-300 transition-all hover:scale-110 p-2 rounded-full hover:bg-white/10"
                title="前进10秒"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8zm-.86 11h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm4.28-1.76c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.10-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.50-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.10.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.05-.25-.05-.18.02-.25.05-.14.09-.19.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.02.25-.05.14-.09.19-.17.09-.19.12-.32.04-.29.04-.48v-.97z"/>
                </svg>
              </button>
            </div>

            {/* 音量和速度 */}
            <div className="flex items-center justify-between">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-white hover:text-pink-300 transition-colors px-4 py-2 rounded-lg hover:bg-white/10" title="音量">
                    <div className="flex items-center gap-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        {volume === 0 ? (
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        ) : volume < 0.5 ? (
                          <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                        ) : (
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        )}
                      </svg>
                      <span className="text-sm">{Math.round(volume * 100)}%</span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto bg-black/95 border-purple-400/40 p-4" side="top" sideOffset={8}>
                  <div className="flex items-center gap-3">
                    <button onClick={toggleMute} className="text-white/80 hover:text-white">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        {volume === 0 ? (
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        ) : (
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        )}
                      </svg>
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-32 accent-purple-500"
                    />
                    <span className="text-white text-sm min-w-[3ch]">{Math.round(volume * 100)}%</span>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-white hover:text-pink-300 transition-colors px-4 py-2 rounded-lg hover:bg-white/10" title="播放速度">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm">{rate}x</span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto bg-black/95 border-purple-400/40 p-2" side="top" sideOffset={8}>
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
        </div>
      )}
    </div>
  )
}

export default AudioPlayer
