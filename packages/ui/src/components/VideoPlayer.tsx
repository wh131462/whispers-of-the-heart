import React, { useRef, useState, useEffect } from 'react'
import ReactPlayer from 'react-player'
import { Slider,DropdownMenu } from 'radix-ui';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'
import clsx from 'clsx'

export interface VideoPlayerProps {
  src: string
  title?: string
  className?: string
  mode?: 'fullscreen' | 'compact'
  autoPlay?: boolean
  loop?: boolean
  poster?: string
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadedData?: () => void
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
  const playerRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(autoPlay)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)

  // 进入 / 退出全屏
  const toggleFullScreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen()
    else document.exitFullscreen()
  }

  const handleProgress = (state: any) => setProgress(state.played)
  const handleSeek = (v: number[]) => playerRef.current?.fastSeek(v[0])

  const formatTime = (sec: number) => {
    if (!sec) return '00:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative bg-black rounded-2xl overflow-hidden flex flex-col justify-center items-center',
        mode === 'compact' ? 'w-full max-w-lg' : 'w-full h-[70vh]',
        className
      )}
    >
      <ReactPlayer
        ref={playerRef}
        src={src}
        playing={playing}
        volume={volume}
        muted={muted}
        loop={loop}
        playbackRate={speed}
        onProgress={handleProgress}
        onDurationChange={ref=>setDuration(ref.currentTarget.duration)}
        onError={(e) => onError?.(String(e))}
        onStart={onLoadStart}
        onReady={onLoadedData}
        width="100%"
        height="100%"
        light={poster}
      />

      {/* 控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 flex flex-col gap-2">
        {/* 进度条 */}
        <Slider.Root
          className="relative flex items-center select-none touch-none h-3"
          value={[progress]}
          max={1}
          step={0.001}
          onValueChange={handleSeek}
        >
          <Slider.Track className="bg-gray-600 h-[2px] grow rounded-full relative">
            <Slider.Range className="absolute bg-white h-full rounded-full" />
          </Slider.Track>
          <Slider.Thumb className="block w-3 h-3 bg-white rounded-full shadow" />
        </Slider.Root>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between text-white text-sm">
          <div className="flex items-center gap-3">
            {/* 播放 / 暂停 */}
            <button onClick={() => setPlaying((p) => !p)} className="p-1 hover:opacity-80">
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>

            {/* 音量控制 */}
            <button onClick={() => setMuted((m) => !m)} className="p-1 hover:opacity-80">
              {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <Slider.Root
              className="relative w-24 flex items-center select-none touch-none h-3"
              value={[muted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={(v) => setVolume(v[0])}
            >
              <Slider.Track className="bg-gray-600 h-[2px] grow rounded-full relative">
                <Slider.Range className="absolute bg-white h-full rounded-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-3 h-3 bg-white rounded-full shadow" />
            </Slider.Root>

            {/* 时间 */}
            <span className="text-xs text-gray-300">
              {formatTime(progress * duration)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 播放速度 */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-1 hover:opacity-80">
                  <Settings size={20} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                sideOffset={5}
                className="bg-gray-800 text-white rounded-lg shadow-md p-2"
              >
                {[0.5, 1, 1.25, 1.5, 2].map((v) => (
                  <DropdownMenu.Item
                    key={v}
                    onClick={() => setSpeed(v)}
                    className={clsx(
                      'px-3 py-1 rounded-md cursor-pointer hover:bg-gray-700',
                      v === speed && 'bg-gray-700'
                    )}
                  >
                    {v}x
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            {/* 全屏 */}
            <button onClick={toggleFullScreen} className="p-1 hover:opacity-80">
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 标题 */}
      {title && (
        <div className="absolute top-3 left-4 text-white text-lg font-medium drop-shadow-md">
          {title}
        </div>
      )}
    </div>
  )
}

export default VideoPlayer
