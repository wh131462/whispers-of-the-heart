import React, { useRef, useEffect } from 'react'
import './VideoPlayer.css'
import { cn } from '../lib/utils'

export interface VideoPlayerProps {
  src: string
  title?: string
  className?: string
  autoPlay?: boolean
  loop?: boolean
  poster?: string
  qualities?: Array<{ label: string; src: string }>
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadedData?: () => void
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  className,
  autoPlay = false,
  loop = false,
  poster,
  onError,
  onLoadStart,
  onLoadedData,
  onPlay,
  onPause,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  // 事件处理
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadStart = () => onLoadStart?.()
    const handleLoadedData = () => onLoadedData?.()
    const handlePlay = () => onPlay?.()
    const handlePause = () => onPause?.()
    const handleEnded = () => onEnded?.()
    const handleError = () => {
      const errorMsg = '视频加载失败'
      onError?.(errorMsg)
    }

    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [onError, onLoadStart, onLoadedData, onPlay, onPause, onEnded])

  return (
    <div
      className={cn(
        'relative bg-gray-900 dark:bg-black rounded-lg overflow-hidden border border-gray-700 shadow-xl w-full aspect-video',
        className
      )}
      role="region"
      aria-label="视频播放器"
    >
      {title && (
        <div className="vjs-title-bar">
          {title}
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        playsInline
        controls
        className="w-full h-full"
      />
    </div>
  )
}

export default VideoPlayer
