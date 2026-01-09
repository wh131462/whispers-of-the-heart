import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Video,
  Upload,
  Link2,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
} from 'lucide-react';

const formatTime = (seconds: number = 0) => {
  if (!isFinite(seconds)) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const CustomSlider = ({
  value,
  onChange,
  className,
  dark = false,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  dark?: boolean;
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateValue = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return value;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      return Math.min(Math.max(percentage, 0), 100);
    },
    [value]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      onChange(calculateValue(e.clientX));

      const handleMouseMove = (moveEvent: MouseEvent) => {
        onChange(calculateValue(moveEvent.clientX));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [calculateValue, onChange]
  );

  return (
    <div
      ref={sliderRef}
      className={cn(
        'relative w-full h-1 rounded-full cursor-pointer group',
        dark ? 'bg-white/20' : 'bg-zinc-200',
        className
      )}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          'absolute top-0 left-0 h-full rounded-full',
          isDragging ? '' : 'transition-all',
          dark ? 'bg-white' : 'bg-emerald-500'
        )}
        style={{ width: `${value}%` }}
      />
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow',
          isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          'transition-opacity',
          dark ? 'bg-white' : 'bg-emerald-500'
        )}
        style={{ left: `calc(${value}% - 6px)` }}
      />
    </div>
  );
};

export default function VideoPlayerApp() {
  const [src, setSrc] = useState('');
  const [fileName, setFileName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsTimeoutRef = useRef<number>();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('请选择视频文件');
      return;
    }
    setError('');
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setSrc(url);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('video/')) {
          const file = item.getAsFile();
          if (file) handleFile(file);
          return;
        }
      }
      const text = e.clipboardData.getData('text');
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setUrlInput(text);
        handleUrlSubmit(text);
      }
    },
    [handleFile]
  );

  const handleUrlSubmit = (url?: string) => {
    const finalUrl = url || urlInput.trim();
    if (!finalUrl) return;
    setError('');
    setSrc(finalUrl);
    setFileName(finalUrl.split('/').pop() || '网络视频');
    setShowUrlInput(false);
    setUrlInput('');
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progressValue =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isFinite(progressValue) ? progressValue : 0);
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number) => {
    if (videoRef.current && videoRef.current.duration) {
      const time = (value / 100) * videoRef.current.duration;
      if (isFinite(time)) {
        videoRef.current.currentTime = time;
        setProgress(value);
      }
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(
        0,
        Math.min(
          videoRef.current.duration || 0,
          videoRef.current.currentTime + seconds
        )
      );
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value / 100;
    }
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume / 100;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const setSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // 忽略
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        // 忽略
      }
    }
  };

  const clearVideo = () => {
    if (src.startsWith('blob:')) {
      URL.revokeObjectURL(src);
    }
    setSrc('');
    setFileName('');
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setError('');
  };

  const handleError = () => {
    setError('视频加载失败，请检查链接是否有效');
    setIsPlaying(false);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume > 50 ? Volume2 : Volume1;

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div
        className={cn(
          'flex flex-col',
          'bg-white/95',
          'rounded-xl overflow-hidden',
          'border border-zinc-200',
          'shadow-lg shadow-zinc-200/50',
          isFullscreen && 'rounded-none border-0 bg-black'
        )}
        onPaste={handlePaste}
        tabIndex={0}
      >
        {/* 标题栏 */}
        {!isFullscreen && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Video className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-base font-semibold text-zinc-800">
                视频播放器
              </h2>
            </div>
            {src && (
              <button
                onClick={clearVideo}
                className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && !isFullscreen && (
          <div className="mx-4 mt-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 拖拽区域 / 播放器 */}
        {!src ? (
          <div className="p-4 flex flex-col gap-4">
            <div
              className={cn(
                'relative flex flex-col items-center justify-center',
                'h-56 rounded-xl border-2 border-dashed',
                'transition-all cursor-pointer',
                isDragging
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload
                className={cn(
                  'w-12 h-12 mb-3 transition-colors',
                  isDragging ? 'text-emerald-500' : 'text-zinc-400'
                )}
              />
              <p className="text-zinc-600 text-sm font-medium">
                拖拽视频文件到此处
              </p>
              <p className="text-zinc-400 text-xs mt-1">
                或点击选择文件 / 粘贴链接
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            {/* URL 输入 */}
            <div className="flex gap-2">
              {showUrlInput ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="输入视频链接..."
                    className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                    autoFocus
                  />
                  <button
                    onClick={() => handleUrlSubmit()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    确定
                  </button>
                  <button
                    onClick={() => {
                      setShowUrlInput(false);
                      setUrlInput('');
                    }}
                    className="px-3 py-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowUrlInput(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-600 text-sm font-medium transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  输入链接
                </button>
              )}
            </div>

            {/* 提示 */}
            <p className="text-center text-zinc-400 text-xs">
              支持拖拽文件、粘贴链接或 Ctrl+V 粘贴
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative bg-black"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            <video
              ref={videoRef}
              src={src}
              className="w-full aspect-video"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onError={handleError}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration);
                  videoRef.current.volume = volume / 100;
                }
              }}
              onClick={togglePlay}
            />

            {/* 播放按钮覆盖层 */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                onClick={togglePlay}
              >
                <div className="p-5 rounded-full bg-white/20 backdrop-blur-sm">
                  <Play className="w-12 h-12 text-white ml-1" />
                </div>
              </div>
            )}

            {/* 控制栏 */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                {/* 文件名 */}
                {fileName && (
                  <div className="text-white text-sm mb-2 truncate">
                    {fileName}
                  </div>
                )}

                {/* 进度条 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white/70 text-xs min-w-[40px]">
                    {formatTime(currentTime)}
                  </span>
                  <CustomSlider
                    value={progress}
                    onChange={handleSeek}
                    className="flex-1"
                    dark
                  />
                  <span className="text-white/70 text-xs min-w-[40px] text-right">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* 控制按钮 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => skipTime(-10)}
                      className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>

                    <button
                      onClick={togglePlay}
                      className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => skipTime(10)}
                      className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>

                    {/* 音量 */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={toggleMute}
                        className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                      >
                        <VolumeIcon className="w-5 h-5" />
                      </button>
                      <div className="w-20">
                        <CustomSlider
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          dark
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 播放速度 */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="px-2 py-1 rounded hover:bg-white/10 text-white text-sm transition-colors flex items-center gap-1"
                      >
                        <Settings className="w-4 h-4" />
                        {playbackSpeed}x
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute bottom-full right-0 mb-2 py-1 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 min-w-[80px]">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                            <button
                              key={speed}
                              onClick={() => setSpeed(speed)}
                              className={cn(
                                'w-full px-3 py-1.5 text-left text-sm transition-colors',
                                playbackSpeed === speed
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'text-zinc-300 hover:bg-white/5'
                              )}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 全屏 */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                    >
                      {isFullscreen ? (
                        <Minimize className="w-5 h-5" />
                      ) : (
                        <Maximize className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
