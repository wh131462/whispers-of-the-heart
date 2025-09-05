import * as React from "react"
import { cn } from "../lib/utils"

export interface PlayerProps {
  className?: string
  src?: string
  poster?: string
  title?: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

const Player = React.forwardRef<HTMLVideoElement, PlayerProps>(
  ({ className, src, poster, title, onPlay, onPause, onEnded, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", className)}>
        <video
          ref={ref}
          className="w-full h-auto rounded-lg"
          poster={poster}
          controls
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          {...props}
        >
          {src && <source src={src} type="video/mp4" />}
          {title && <track kind="captions" src="" label={title} />}
          您的浏览器不支持视频播放。
        </video>
        {title && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
            <p className="text-sm font-medium truncate">{title}</p>
          </div>
        )}
      </div>
    )
  }
)
Player.displayName = "Player"

export { Player }
