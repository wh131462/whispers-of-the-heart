'use client';

import React, { useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      e.stopPropagation();
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
          'absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow',
          isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          'transition-opacity'
        )}
        style={{ left: `calc(${value}% - 5px)` }}
      />
    </div>
  );
};

export interface AudioPlayerProps {
  src: string;
  cover?: string;
  title?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  cover,
  title,
  className,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

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

  const handleRepeat = () => {
    setIsRepeat(!isRepeat);
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

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = volume / 100;
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

  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume > 50 ? Volume2 : Volume1;

  if (!src) return null;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl overflow-hidden bg-zinc-900 p-3',
        className
      )}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        src={src}
        className="hidden"
      />

      <div className="flex flex-col gap-3">
        {/* 封面和标题 */}
        {(cover || title) && (
          <div className="flex items-center gap-3">
            {cover && (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                <img
                  src={cover}
                  alt="cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {title && (
              <div className="text-white font-medium text-sm truncate flex-1">
                {title}
              </div>
            )}
          </div>
        )}

        {/* 进度条 */}
        <div className="flex flex-col gap-1">
          <CustomSlider
            value={progress}
            onChange={handleSeek}
            className="w-full"
          />
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs">
              {formatTime(currentTime)}
            </span>
            <span className="text-white/60 text-xs">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* 快退 */}
            <button
              onClick={e => {
                e.stopPropagation();
                skipTime(-10);
              }}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* 播放/暂停 */}
            <button
              onClick={e => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* 快进 */}
            <button
              onClick={e => {
                e.stopPropagation();
                skipTime(10);
              }}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* 音量 */}
            <button
              onClick={e => {
                e.stopPropagation();
                toggleMute();
              }}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <VolumeIcon className="w-4 h-4" />
            </button>
            <div className="w-16">
              <CustomSlider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
              />
            </div>

            {/* 循环播放 */}
            <button
              onClick={e => {
                e.stopPropagation();
                handleRepeat();
              }}
              className={cn(
                'p-2 rounded-full hover:bg-white/10 text-white transition-colors',
                isRepeat && 'bg-white/10 text-emerald-400'
              )}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
