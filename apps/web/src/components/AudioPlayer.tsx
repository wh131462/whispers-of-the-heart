import React, { useState, useRef, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle,
  Heart,
  Share2,
  List,
  Download,
  Maximize,
  Minimize,
  Move,
  X
} from 'lucide-react'
import { cn } from '../lib/utils'

interface AudioTrack {
  id: string
  title: string
  artist: string
  album?: string
  cover?: string
  src: string
  duration: number
  plays?: number
  likes?: number
  uploadTime?: string
  genre?: string
}

type DisplayMode = 'inline' | 'floating' | 'fullscreen'

interface FloatingPosition {
  x: number
  y: number
}

interface AudioPlayerProps {
  tracks: AudioTrack[]
  currentTrackIndex?: number
  autoPlay?: boolean
  showPlaylist?: boolean
  className?: string
  displayMode?: DisplayMode
  floatingPosition?: FloatingPosition
  onTrackChange?: (track: AudioTrack, index: number) => void
  onEnded?: () => void
  onDisplayModeChange?: (mode: DisplayMode) => void
  onFloatingPositionChange?: (position: FloatingPosition) => void
  onClose?: () => void
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  tracks,
  currentTrackIndex = 0,
  autoPlay = false,
  showPlaylist = false,
  className,
  displayMode = 'inline',
  floatingPosition = { x: window.innerWidth - 320, y: 50 },
  onTrackChange,
  onEnded,
  onDisplayModeChange,
  onFloatingPositionChange,
  onClose
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentIndex, setCurrentIndex] = useState(currentTrackIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [playMode, setPlayMode] = useState<'list' | 'single' | 'shuffle'>('list')
  const [isLiked, setIsLiked] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showPlaylistPanel, setShowPlaylistPanel] = useState(showPlaylist)
  const [volumeHideTimeout, setVolumeHideTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [internalDisplayMode, setInternalDisplayMode] = useState<DisplayMode>(displayMode)
  const [internalPosition, setInternalPosition] = useState<FloatingPosition>(floatingPosition)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentTrack = tracks[currentIndex]

  // 使用内部状态或外部控制
  const currentDisplayMode = onDisplayModeChange ? displayMode : internalDisplayMode
  const currentPosition = onFloatingPositionChange ? floatingPosition : internalPosition

  // 显示音量条
  const showVolumeSliderWithDelay = () => {
    if (volumeHideTimeout) {
      clearTimeout(volumeHideTimeout)
      setVolumeHideTimeout(null)
    }
    setShowVolumeSlider(true)
  }

  // 隐藏音量条（带延时）
  const hideVolumeSliderWithDelay = () => {
    if (volumeHideTimeout) {
      clearTimeout(volumeHideTimeout)
    }
    const timeout = setTimeout(() => {
      setShowVolumeSlider(false)
    }, 1000) // 1秒延时
    setVolumeHideTimeout(timeout)
  }

  // 清除音量条隐藏延时
  const clearVolumeHideTimeout = () => {
    if (volumeHideTimeout) {
      clearTimeout(volumeHideTimeout)
      setVolumeHideTimeout(null)
    }
  }

  // 播放/暂停
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // 上一首
  const playPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1
    setCurrentIndex(newIndex)
    onTrackChange?.(tracks[newIndex], newIndex)
  }

  // 下一首
  const playNext = () => {
    const newIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(newIndex)
    onTrackChange?.(tracks[newIndex], newIndex)
  }

  // 随机播放
  const playRandom = () => {
    const randomIndex = Math.floor(Math.random() * tracks.length)
    setCurrentIndex(randomIndex)
    onTrackChange?.(tracks[randomIndex], randomIndex)
  }

  // 进度控制 - 参考AlgerMusicPlayer的实现
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  // 音量控制
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        // 取消静音，恢复之前的音量
        audioRef.current.muted = false
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        // 静音
        audioRef.current.muted = true
        setIsMuted(true)
      }
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
      audioRef.current.muted = false // 调整音量时自动取消静音
      setVolume(newVolume)
      setIsMuted(false)
    }
  }

  // 切换播放模式
  const togglePlayMode = () => {
    switch (playMode) {
      case 'list':
        setPlayMode('single')
        break
      case 'single':
        setPlayMode('shuffle')
        break
      case 'shuffle':
        setPlayMode('list')
        break
    }
  }

  // 获取播放模式图标和提示
  const getPlayModeInfo = () => {
    switch (playMode) {
      case 'list':
        return { icon: Repeat, tooltip: '列表循环' }
      case 'single':
        return { icon: Repeat, tooltip: '单曲循环' }
      case 'shuffle':
        return { icon: Shuffle, tooltip: '随机播放' }
    }
  }

  // 切换喜欢状态
  const toggleLike = () => {
    setIsLiked(!isLiked)
  }

  // 格式化时间
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 音频事件处理
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleEnded = () => {
    if (playMode === 'single') {
      // 单曲循环
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
    } else if (playMode === 'shuffle') {
      // 随机播放下一首
      playRandom()
    } else {
      // 列表循环 - 播放下一首
      playNext()
    }
    onEnded?.()
  }

  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => setIsPlaying(false)

  // 切换播放列表显示
  const togglePlaylist = () => {
    setShowPlaylistPanel(!showPlaylistPanel)
  }

  // 切换显示模式
  const toggleDisplayMode = () => {
    const modes: DisplayMode[] = ['inline', 'floating', 'fullscreen']
    const currentIndex = modes.indexOf(currentDisplayMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    
    if (onDisplayModeChange) {
      onDisplayModeChange(nextMode)
    } else {
      setInternalDisplayMode(nextMode)
    }
  }

  // 开始拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentDisplayMode !== 'floating') return
    
    setIsDragging(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  // 拖拽过程
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || currentDisplayMode !== 'floating') return

    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    }

    // 限制在窗口范围内
    const maxX = window.innerWidth - 320
    const maxY = window.innerHeight - 200
    
    newPosition.x = Math.max(0, Math.min(maxX, newPosition.x))
    newPosition.y = Math.max(0, Math.min(maxY, newPosition.y))

    if (onFloatingPositionChange) {
      onFloatingPositionChange(newPosition)
    } else {
      setInternalPosition(newPosition)
    }
  }

  // 结束拖拽
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 处理拖拽事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // 全屏模式键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentDisplayMode === 'fullscreen' && e.key === 'Escape') {
        if (onDisplayModeChange) {
          onDisplayModeChange('inline')
        } else {
          setInternalDisplayMode('inline')
        }
      }
    }

    if (currentDisplayMode === 'fullscreen') {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentDisplayMode, onDisplayModeChange])

  // 播放指定歌曲
  const playTrack = (index: number) => {
    setCurrentIndex(index)
    onTrackChange?.(tracks[index], index)
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!audioRef.current) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          playPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          playNext()
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'KeyR':
          e.preventDefault()
          togglePlayMode()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, isPlaying, playMode])

  // 自动播放
  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [autoPlay, currentIndex])

  // 清理延时
  useEffect(() => {
    return () => {
      if (volumeHideTimeout) {
        clearTimeout(volumeHideTimeout)
      }
    }
  }, [volumeHideTimeout])

  // 渲染播放器内容
  const renderPlayerContent = () => (
    <>
      {/* 音频元素 */}
      <audio
        ref={audioRef}
        src={currentTrack?.src}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
      />

      {/* 主播放器界面 */}
      <div className={cn(
        "p-6",
        currentDisplayMode === 'floating' && "p-4",
        currentDisplayMode === 'fullscreen' && "p-8"
      )}>
        {/* 头部控制栏 - 仅在浮动和全屏模式显示 */}
        {(currentDisplayMode === 'floating' || currentDisplayMode === 'fullscreen') && (
          <div className="flex items-center justify-between mb-4">
            {currentDisplayMode === 'floating' && (
              <div 
                className="flex items-center cursor-move"
                onMouseDown={handleMouseDown}
              >
                <Move className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">拖拽移动</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              {/* 显示模式切换 */}
              <button
                onClick={toggleDisplayMode}
                className="p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                title="切换显示模式"
              >
                {currentDisplayMode === 'floating' ? (
                  <Maximize className="w-4 h-4" />
                ) : currentDisplayMode === 'fullscreen' ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
              {/* 关闭按钮 */}
              {(currentDisplayMode === 'floating' || currentDisplayMode === 'fullscreen') && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                  title="关闭播放器"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 封面和歌曲信息 */}
        <div className={cn(
          "flex items-center space-x-4 mb-6",
          currentDisplayMode === 'floating' && "mb-4",
          currentDisplayMode === 'fullscreen' && "mb-8"
        )}>
          <div className="relative">
            <img
              src={currentTrack?.cover || '/default-album-cover.jpg'}
              alt={currentTrack?.title}
              className={cn(
                "rounded-lg object-cover",
                currentDisplayMode === 'floating' ? "w-12 h-12" :
                currentDisplayMode === 'fullscreen' ? "w-24 h-24" : "w-16 h-16"
              )}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                <div className="flex space-x-1">
                  <div className="w-1 h-3 bg-white rounded-full animate-pulse"></div>
                  <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-gray-900 truncate",
              currentDisplayMode === 'floating' ? "text-sm" :
              currentDisplayMode === 'fullscreen' ? "text-2xl" : "text-lg"
            )}>
              {currentTrack?.title}
            </h3>
            <p className={cn(
              "text-gray-600 truncate",
              currentDisplayMode === 'floating' ? "text-xs" :
              currentDisplayMode === 'fullscreen' ? "text-lg" : "text-sm"
            )}>
              {currentTrack?.artist}
            </p>
            {currentTrack?.album && (
              <p className={cn(
                "text-gray-500 truncate",
                currentDisplayMode === 'floating' ? "text-xs" :
                currentDisplayMode === 'fullscreen' ? "text-sm" : "text-xs"
              )}>
                {currentTrack.album}
              </p>
            )}
          </div>
          {/* 内嵌模式下的显示模式切换按钮 */}
          {currentDisplayMode === 'inline' && (
            <button
              onClick={toggleDisplayMode}
              className="p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
              title="切换显示模式"
            >
              <Maximize className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 进度条 */}
        <div className={cn(
          "mb-4",
          currentDisplayMode === 'floating' && "mb-3"
        )}>
          <div className="relative group">
            {/* 背景轨道 */}
            <div className="w-full h-2 bg-gray-200 rounded-full">
              {/* 进度填充 */}
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-100 ease-out"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            {/* 可拖拽的滑块 - 使用原生input */}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleProgressChange}
              className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer z-10"
            />
            {/* 自定义滑块 - 只在hover时显示 */}
            <div 
              className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary pointer-events-none transition-all duration-75 opacity-0 group-hover:opacity-100"
              style={{ 
                left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, 
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
          <div className={cn(
            "flex justify-between text-gray-500 mt-2",
            currentDisplayMode === 'floating' ? "text-xs" : 
            currentDisplayMode === 'fullscreen' ? "text-sm" : "text-xs"
          )}>
            <span className="font-medium">{formatTime(currentTime)}</span>
            <span className="font-medium">{formatTime(duration)}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex items-center",
            currentDisplayMode === 'floating' ? "space-x-2" : "space-x-4"
          )}>
            {/* 播放模式 - 浮动模式下隐藏 */}
            {currentDisplayMode !== 'floating' && (
              <button
                onClick={togglePlayMode}
                className={cn(
                  'p-2 rounded-full transition-colors relative group',
                  playMode !== 'list' ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-gray-900'
                )}
                title={getPlayModeInfo().tooltip}
              >
                {playMode === 'single' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
                )}
                {(() => {
                  const { icon: Icon } = getPlayModeInfo()
                  return <Icon className={cn(
                    currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                  )} />
                })()}
              </button>
            )}

            {/* 上一首 */}
            <button
              onClick={playPrevious}
              className="p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <SkipBack className={cn(
                currentDisplayMode === 'floating' ? "w-4 h-4" :
                currentDisplayMode === 'fullscreen' ? "w-8 h-8" : "w-6 h-6"
              )} />
            </button>

            {/* 播放/暂停 */}
            <button
              onClick={togglePlay}
              className={cn(
                "bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors",
                currentDisplayMode === 'floating' ? "w-8 h-8" :
                currentDisplayMode === 'fullscreen' ? "w-16 h-16" : "w-12 h-12"
              )}
            >
              {isPlaying ? (
                <Pause className={cn(
                  currentDisplayMode === 'floating' ? "w-4 h-4" :
                  currentDisplayMode === 'fullscreen' ? "w-8 h-8" : "w-6 h-6"
                )} />
              ) : (
                <Play className={cn(
                  "ml-1",
                  currentDisplayMode === 'floating' ? "w-4 h-4" :
                  currentDisplayMode === 'fullscreen' ? "w-8 h-8" : "w-6 h-6"
                )} />
              )}
            </button>

            {/* 下一首 */}
            <button
              onClick={playNext}
              className="p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <SkipForward className={cn(
                currentDisplayMode === 'floating' ? "w-4 h-4" :
                currentDisplayMode === 'fullscreen' ? "w-8 h-8" : "w-6 h-6"
              )} />
            </button>
          </div>

          <div className={cn(
            "flex items-center",
            currentDisplayMode === 'floating' ? "space-x-1" : "space-x-2"
          )}>
            {/* 音量控制 */}
            <div 
              className="relative"
              onMouseEnter={showVolumeSliderWithDelay}
              onMouseLeave={hideVolumeSliderWithDelay}
            >
              <button
                onClick={toggleMute}
                className="p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className={cn(
                    currentDisplayMode === 'floating' ? "w-4 h-4" :
                    currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                  )} />
                ) : (
                  <Volume2 className={cn(
                    currentDisplayMode === 'floating' ? "w-4 h-4" :
                    currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                  )} />
                )}
              </button>
              {showVolumeSlider && currentDisplayMode !== 'floating' && (
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg p-3 z-50"
                  onMouseEnter={clearVolumeHideTimeout}
                  onMouseLeave={hideVolumeSliderWithDelay}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative w-3 h-20 group">
                        {/* 音量背景轨道 */}
                        <div className="w-full h-full bg-gray-200 rounded-full relative">
                          {/* 音量填充 - 从底部开始 */}
                          <div 
                            className="w-full bg-gradient-to-b from-primary to-primary/80 rounded-full transition-all duration-100 ease-out absolute bottom-0"
                            style={{ height: `${volume * 100}%` }}
                          />
                        </div>
                        {/* 可拖拽的音量滑块 - 使用原生input，垂直方向 */}
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={volume}
                          onChange={handleVolumeChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          style={{
                            writingMode: 'bt-lr' as any,
                            WebkitAppearance: 'slider-vertical'
                          }}
                        />
                        {/* 自定义音量滑块 - 从底部开始向上，只在hover时显示 */}
                        <div 
                          className="absolute left-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-primary pointer-events-none transition-all duration-75 opacity-0 group-hover:opacity-100"
                          style={{ 
                            bottom: `${volume * 100}%`,
                            transform: 'translate(-50%, 50%)'
                          }}
                        />
                      </div>
                    </div>
                </div>
              )}
            </div>

            {/* 喜欢 - 浮动模式下隐藏 */}
            {currentDisplayMode !== 'floating' && (
              <button
                onClick={toggleLike}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  isLiked ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Heart className={cn(
                  isLiked && 'fill-current',
                  currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                )} />
              </button>
            )}

            {/* 分享 - 浮动模式下隐藏 */}
            {currentDisplayMode !== 'floating' && (
              <button className="p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors">
                <Share2 className={cn(
                  currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                )} />
              </button>
            )}

            {/* 下载 - 浮动模式下隐藏 */}
            {currentDisplayMode !== 'floating' && (
              <button className="p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors">
                <Download className={cn(
                  currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                )} />
              </button>
            )}

            {/* 播放列表 - 浮动模式下隐藏 */}
            {currentDisplayMode !== 'floating' && (
              <button
                onClick={togglePlaylist}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  showPlaylistPanel ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <List className={cn(
                  currentDisplayMode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"
                )} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 播放列表面板 - 浮动模式下隐藏 */}
      {showPlaylistPanel && currentDisplayMode !== 'floating' && (
        <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
          <div className={cn(
            "p-4",
            currentDisplayMode === 'fullscreen' && "p-6"
          )}>
            <h4 className={cn(
              "font-semibold text-gray-900 mb-3",
              currentDisplayMode === 'fullscreen' ? "text-lg" : "text-sm"
            )}>
              播放列表 ({tracks.length})
            </h4>
            <div className="space-y-2">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => playTrack(index)}
                  className={cn(
                    'flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors',
                    index === currentIndex
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-gray-100'
                  )}
                >
                  <div className={cn(
                    "rounded bg-gray-200 flex items-center justify-center text-xs text-gray-600",
                    currentDisplayMode === 'fullscreen' ? "w-10 h-10" : "w-8 h-8"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'truncate',
                      index === currentIndex ? 'font-medium' : 'text-gray-900',
                      currentDisplayMode === 'fullscreen' ? "text-base" : "text-sm"
                    )}>
                      {track.title}
                    </p>
                    <p className={cn(
                      "text-gray-500 truncate",
                      currentDisplayMode === 'fullscreen' ? "text-sm" : "text-xs"
                    )}>
                      {track.artist}
                    </p>
                  </div>
                  <span className={cn(
                    "text-gray-500",
                    currentDisplayMode === 'fullscreen' ? "text-sm" : "text-xs"
                  )}>
                    {formatTime(track.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )

  // 根据显示模式返回不同的容器
  if (currentDisplayMode === 'floating') {
    return (
      <div
        ref={containerRef}
        className={cn(
          'fixed bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50 select-none',
          isDragging && 'cursor-grabbing',
          className
        )}
        style={{
          left: currentPosition.x,
          top: currentPosition.y,
          width: '280px'
        }}
      >
        {renderPlayerContent()}
      </div>
    )
  }

  if (currentDisplayMode === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div
          ref={containerRef}
          className={cn(
            'bg-white rounded-lg shadow-2xl overflow-hidden mx-4 my-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto',
            className
          )}
        >
          {renderPlayerContent()}
        </div>
      </div>
    )
  }

  // 默认内嵌模式
  return (
    <div
      ref={containerRef}
      className={cn('bg-white rounded-lg shadow-lg overflow-hidden', className)}
    >
      {renderPlayerContent()}
    </div>
  )
}

export default AudioPlayer
