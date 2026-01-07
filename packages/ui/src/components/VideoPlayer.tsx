import React, { useRef, useEffect, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './VideoPlayer.css';
import { cn } from '@/lib/utils';

export interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  poster?: string;
  qualities?: Array<{ label: string; src: string }>;
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
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 确保videojs只初始化一次
    if (!playerRef.current && videoRef.current) {
      const videoElement = videoRef.current;

      // 初始化video.js
      const player = videojs(videoElement, {
        controls: true,
        autoplay: autoPlay,
        loop: loop,
        poster: poster,
        fluid: true,
        responsive: true,
        preload: 'auto',
        html5: {
          vhs: {
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
          },
        },
      });

      playerRef.current = player;

      // 设置视频源
      player.src({
        src,
        type: getVideoType(src),
      });

      // 事件监听
      player.on('loadstart', () => {
        onLoadStart?.();
      });

      player.on('loadeddata', () => {
        setIsReady(true);
        onLoadedData?.();
      });

      player.on('play', () => {
        onPlay?.();
      });

      player.on('pause', () => {
        onPause?.();
      });

      player.on('ended', () => {
        onEnded?.();
      });

      player.on('error', () => {
        const errorMsg = '视频加载失败';
        onError?.(errorMsg);
      });

      // 监听准备就绪
      player.ready(() => {
        // player is ready
      });
    }

    // 清理
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
        setIsReady(false);
      }
    };
  }, []);

  // 当src改变时更新源
  useEffect(() => {
    if (playerRef.current && isReady) {
      playerRef.current.src({
        src,
        type: getVideoType(src),
      });
    }
  }, [src, isReady]);

  // 获取视频MIME类型
  const getVideoType = (url: string): string => {
    const ext = url.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
      ogv: 'video/ogg',
      m3u8: 'application/x-mpegURL',
      mpd: 'application/dash+xml',
    };
    return typeMap[ext || ''] || 'video/mp4';
  };

  return (
    <div
      className={cn(
        'relative bg-gray-900 dark:bg-black rounded-lg overflow-hidden border border-gray-700 shadow-xl w-full',
        className
      )}
      role="region"
      aria-label="视频播放器"
      data-vjs-player
    >
      {title && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 py-3 text-white text-sm font-medium">
          {title}
        </div>
      )}
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-theme-whispers"
        playsInline
      />
    </div>
  );
};

export default VideoPlayer;
