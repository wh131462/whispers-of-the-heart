'use client';

import React from 'react';
import MindMapRenderer from '../../MindMapRenderer';
import type { MindMapRendererProps } from '../../MindMapRenderer';

export interface MindMapRendererWrapperProps {
  markdown: string;
  height?: string;
  className?: string;
}

/**
 * MindMapRendererWrapper - 用于 MarkdownRenderer 中渲染思维导图
 * 基于公共 MindMapRenderer 组件的包装器
 */
export const MindMapRendererWrapper: React.FC<MindMapRendererWrapperProps> = ({
  markdown,
  height = '500px',
  className,
}) => {
  return (
    <div className={className}>
      <MindMapRenderer markdown={markdown} height={height} />
    </div>
  );
};

export default MindMapRendererWrapper;

// 重新导出 MindMapRendererProps 供外部使用
export type { MindMapRendererProps };
