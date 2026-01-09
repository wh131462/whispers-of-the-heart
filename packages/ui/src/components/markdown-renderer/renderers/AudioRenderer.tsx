'use client';

import React from 'react';
import AudioPlayer from '../../AudioPlayer';
import type { AudioPlayerProps } from '../../AudioPlayer';

export interface AudioRendererProps {
  src: string;
  title: string;
  artist?: string;
  className?: string;
}

/**
 * AudioRenderer - 用于 MarkdownRenderer 中渲染音频
 * 基于公共 AudioPlayer 组件的包装器
 */
export const AudioRenderer: React.FC<AudioRendererProps> = ({
  src,
  title,
  artist,
  className,
}) => {
  return (
    <div className={className}>
      <AudioPlayer src={src} title={title} artist={artist} />
    </div>
  );
};

export default AudioRenderer;

// 重新导出 AudioPlayerProps 供外部使用
export type { AudioPlayerProps };
