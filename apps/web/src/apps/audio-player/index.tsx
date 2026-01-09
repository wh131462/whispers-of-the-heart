import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Music,
  Upload,
  Link2,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react';

const formatTime = (seconds: number = 0) => {
  if (!isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const CustomSlider = ({
  value,
  onChange,
  className,
  accent = false,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  accent?: boolean;
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
        'relative w-full h-1.5 bg-zinc-200 rounded-full cursor-pointer group',
        className
      )}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          'absolute top-0 left-0 h-full rounded-full',
          isDragging ? '' : 'transition-all',
          accent ? 'bg-emerald-500' : 'bg-zinc-400'
        )}
        style={{ width: `${value}%` }}
      />
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow',
          isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          'transition-opacity',
          accent ? 'bg-emerald-500' : 'bg-zinc-500'
        )}
        style={{ left: `calc(${value}% - 6px)` }}
      />
    </div>
  );
};

export default function AudioPlayerApp() {
  const [src, setSrc] = useState('');
  const [fileName, setFileName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError('请选择音频文件');
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
        if (item.type.startsWith('audio/')) {
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
    setFileName(finalUrl.split('/').pop() || '网络音频');
    setShowUrlInput(false);
    setUrlInput('');
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progressValue =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isFinite(progressValue) ? progressValue : 0);
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const time = (value / 100) * audioRef.current.duration;
      if (isFinite(time)) {
        audioRef.current.currentTime = time;
        setProgress(value);
      }
    }
  };

  const handleEnded = () => {
    if (isRepeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(
        0,
        Math.min(
          audioRef.current.duration || 0,
          audioRef.current.currentTime + seconds
        )
      );
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume / 100;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const clearAudio = () => {
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
    setError('音频加载失败，请检查链接是否有效');
    setIsPlaying(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div
        className={cn(
          'flex flex-col gap-4 p-6',
          'bg-white/95',
          'rounded-xl',
          'border border-zinc-200',
          'shadow-lg shadow-zinc-200/50'
        )}
        onPaste={handlePaste}
        tabIndex={0}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Music className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-800">音频播放器</h2>
          </div>
          {src && (
            <button
              onClick={clearAudio}
              className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 拖拽区域 / 播放器 */}
        {!src ? (
          <>
            <div
              className={cn(
                'relative flex flex-col items-center justify-center',
                'h-40 rounded-xl border-2 border-dashed',
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
                  'w-10 h-10 mb-3 transition-colors',
                  isDragging ? 'text-emerald-500' : 'text-zinc-400'
                )}
              />
              <p className="text-zinc-600 text-sm font-medium">
                拖拽音频文件到此处
              </p>
              <p className="text-zinc-400 text-xs mt-1">
                或点击选择文件 / 粘贴链接
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
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
                    placeholder="输入音频链接..."
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
          </>
        ) : (
          <>
            <audio
              ref={audioRef}
              src={src}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onError={handleError}
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  setDuration(audioRef.current.duration);
                  audioRef.current.volume = volume / 100;
                }
              }}
              className="hidden"
            />

            {/* 文件名 */}
            <div className="text-center py-2">
              <p className="text-zinc-800 font-medium truncate">{fileName}</p>
            </div>

            {/* 进度条 */}
            <div className="flex flex-col gap-2">
              <CustomSlider value={progress} onChange={handleSeek} accent />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => skipTime(-10)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors mx-2"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => skipTime(10)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={cn(
                  'p-2 rounded-full transition-colors ml-2',
                  isRepeat
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'
                )}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            {/* 音量控制 */}
            <div className="flex items-center gap-3 px-2 pt-2 border-t border-zinc-100">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <CustomSlider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1"
              />
              <span className="text-xs text-zinc-400 w-8 text-right">
                {isMuted ? 0 : Math.round(volume)}%
              </span>
            </div>
          </>
        )}

        {/* 提示 */}
        <p className="text-center text-zinc-400 text-xs">
          支持拖拽文件、粘贴链接或 Ctrl+V 粘贴
        </p>
      </div>
    </div>
  );
}
