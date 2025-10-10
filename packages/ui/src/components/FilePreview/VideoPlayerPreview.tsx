import React from 'react'
import { VideoPlayer } from '../VideoPlayer'

export interface VideoPlayerPreviewProps {
  src: string
  title: string
  className?: string
  autoPlay?: boolean
  loop?: boolean
  poster?: string
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadedData?: () => void
}

export const VideoPlayerPreview: React.FC<VideoPlayerPreviewProps> = ({
  src,
  title,
  className,
  autoPlay = false,
  loop = false,
  poster,
  onError,
  onLoadStart,
  onLoadedData
}) => {
  return (
    <VideoPlayer
      src={src}
      title={title}
      className={className}
      mode="fullscreen"
      autoPlay={autoPlay}
      loop={loop}
      poster={poster}
      onError={onError}
      onLoadStart={onLoadStart}
      onLoadedData={onLoadedData}
    />
  )
}

export default VideoPlayerPreview
