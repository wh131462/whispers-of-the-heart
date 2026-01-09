'use client';

import React from 'react';
import VideoPlayer from '../../VideoPlayer';
import type { VideoPlayerProps } from '../../VideoPlayer';

export interface VideoRendererProps {
  src: string;
  title?: string;
  className?: string;
}

/**
 * VideoRenderer - 用于 MarkdownRenderer 中渲染视频
 * 基于公共 VideoPlayer 组件的包装器
 */
export const VideoRenderer: React.FC<VideoRendererProps> = ({
  src,
  title,
  className,
}) => {
  return (
    <div className={className}>
      <VideoPlayer src={src} title={title} />
    </div>
  );
};

export default VideoRenderer;

// 重新导出 VideoPlayerProps 供外部使用
export type { VideoPlayerProps };
