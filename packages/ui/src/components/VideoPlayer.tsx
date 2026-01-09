'use client';

import React, { useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  SkipBack,
  SkipForward,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
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
        'relative w-full h-1 bg-white/20 rounded-full cursor-pointer group',
        className
      )}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          'absolute top-0 left-0 h-full bg-white rounded-full',
          isDragging ? '' : 'transition-all'
        )}
        style={{ width: `${value}%` }}
      />
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow',
          isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          'transition-opacity'
        )}
        style={{ left: `calc(${value}% - 6px)` }}
      />
    </div>
  );
};

export interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  poster?: string;
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
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
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        onPause?.();
      } else {
        videoRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value / 100;
    }
    setIsMuted(value === 0);
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

  const handleLoadStart = () => {
    onLoadStart?.();
  };

  const handleLoadedData = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = volume / 100;
    }
    onLoadedData?.();
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  const handleError = () => {
    onError?.('视频加载失败');
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
    <div
      className={cn(
        'relative w-full rounded-xl overflow-hidden bg-black',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onEnded={handleEnded}
        onError={handleError}
        onClick={togglePlay}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        poster={poster}
        playsInline
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
          {/* 标题 */}
          {title && (
            <div className="text-white/80 text-sm mb-2 truncate">{title}</div>
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
                  />
                </div>
              </div>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
