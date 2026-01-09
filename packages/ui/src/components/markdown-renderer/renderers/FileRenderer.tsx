'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  FilePreviewModal,
  type PreviewFileLink,
} from '@eternalheart/react-file-preview';
import '@eternalheart/react-file-preview/style.css';
import { FileTypeIcon } from '../../editor/blocks/shared/FileTypeIcon';

// 获取文件扩展名
const getFileExtension = (url: string): string => {
  const pathname = url.split('?')[0];
  const ext = pathname.split('.').pop()?.toLowerCase() || '';
  return ext;
};

// 从 URL 中提取文件名
const getFileName = (url: string, title?: string): string => {
  if (title) return title;
  try {
    const pathname = url.split('?')[0];
    const segments = pathname.split('/');
    const filename = segments[segments.length - 1];
    return decodeURIComponent(filename) || '未命名文件';
  } catch {
    return '未命名文件';
  }
};

// 格式化文件大小
const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

// 根据 URL 获取 MIME 类型
const getMimeType = (url: string): string => {
  const ext = getFileExtension(url);
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    md: 'text/markdown',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    js: 'text/javascript',
    ts: 'text/typescript',
    jsx: 'text/jsx',
    tsx: 'text/tsx',
    py: 'text/x-python',
    java: 'text/x-java',
    json: 'application/json',
    html: 'text/html',
    css: 'text/css',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

export interface FileRendererProps {
  src: string;
  title?: string;
  /** 文件说明（与文件名分开显示） */
  description?: string;
  fileSize?: number;
  className?: string;
}

/**
 * FileRenderer - 用于 MarkdownRenderer 中渲染文件
 * 点击可以打开预览模态框
 */
export const FileRenderer: React.FC<FileRendererProps> = ({
  src,
  title,
  description,
  fileSize,
  className,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileExtension = getFileExtension(src);
  const fileName = getFileName(src, title);
  const fileSizeText = formatFileSize(fileSize);

  // 构建预览文件列表
  const previewFiles: PreviewFileLink[] = useMemo(() => {
    return [
      {
        id: 'file-preview',
        name: fileName,
        url: src,
        type: getMimeType(src),
      },
    ];
  }, [src, fileName]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPreviewOpen(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsPreviewOpen(true);
    }
  }, []);

  return (
    <>
      <figure
        className={`file-renderer-wrapper ${className || ''}`}
        style={{
          margin: '0.5rem 0',
        }}
      >
        <div
          className="file-renderer"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'hsl(var(--muted) / 0.3)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            border: '1px solid hsl(var(--border))',
            transition: 'all 0.15s',
          }}
        >
          <div
            className="file-renderer-icon"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.5rem',
              height: '2.5rem',
              background: 'hsl(var(--background))',
              borderRadius: '0.375rem',
              flexShrink: 0,
            }}
          >
            <FileTypeIcon extension={fileExtension} size={28} />
          </div>
          <div
            className="file-renderer-info"
            style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <div
              className="file-renderer-name"
              style={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'hsl(var(--foreground))',
              }}
              title={fileName}
            >
              {fileName}
            </div>
            {fileSizeText && (
              <div
                className="file-renderer-meta"
                style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                {fileSizeText}
              </div>
            )}
          </div>
          <div
            className="file-renderer-action"
            style={{
              color: 'hsl(var(--muted-foreground))',
              flexShrink: 0,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
        </div>
        {/* 文件说明显示在卡片下方 */}
        {description && (
          <figcaption
            className="file-renderer-caption"
            style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              color: 'hsl(var(--muted-foreground))',
              textAlign: 'center',
            }}
          >
            {description}
          </figcaption>
        )}
      </figure>

      {/* 文件预览模态框 */}
      <FilePreviewModal
        files={previewFiles}
        currentIndex={0}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onNavigate={() => {}}
      />
    </>
  );
};

export default FileRenderer;
