import React from 'react'
import { AudioPlayer } from '../AudioPlayer'

export interface AudioPlayerPreviewProps {
  src: string
  title: string
  className?: string
  autoPlay?: boolean
  loop?: boolean
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadedData?: () => void
}

export const AudioPlayerPreview: React.FC<AudioPlayerPreviewProps> = ({
  src,
  title,
  className,
  autoPlay = false,
  loop = false,
  onError,
  onLoadStart,
  onLoadedData
}) => {
  return (
    <AudioPlayer
      src={src}
      title={title}
      className={className}
      mode="fullscreen"
      autoPlay={autoPlay}
      loop={loop}
      onError={onError}
      onLoadStart={onLoadStart}
      onLoadedData={onLoadedData}
    />
  )
}

export default AudioPlayerPreview

