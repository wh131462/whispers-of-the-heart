import React, { useRef, useCallback } from 'react';
import { Image, Video, Music, File } from 'lucide-react';

export type MediaType = 'image' | 'video' | 'audio' | 'file';

interface MediaPlaceholderProps {
  type: MediaType;
  isDragging?: boolean;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  /** 点击时打开媒体选择器，返回 true 表示事件被处理 */
  onClick?: () => boolean;
  onUrlInputClick?: () => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  /** 当通过内置文件选择器选择文件时触发 */
  onFileSelect?: (file: File) => void;
  /** 自定义 accept 类型 */
  acceptTypes?: string;
}

// 媒体类型配置
const MEDIA_CONFIG: Record<
  MediaType,
  { icon: typeof Image; text: string; hint: string; accept: string }
> = {
  image: {
    icon: Image,
    text: '添加图片',
    hint: '点击选择、拖拽文件或',
    accept: 'image/*',
  },
  video: {
    icon: Video,
    text: '添加视频',
    hint: '点击选择、拖拽文件或',
    accept: 'video/*,.m3u8',
  },
  audio: {
    icon: Music,
    text: '添加音频',
    hint: '点击选择、拖拽文件或',
    accept: 'audio/*',
  },
  file: {
    icon: File,
    text: '添加文件',
    hint: '点击选择、拖拽文件或',
    accept: '', // 空字符串允许所有文件类型
  },
};

export const MediaPlaceholder: React.FC<MediaPlaceholderProps> = ({
  type,
  isDragging = false,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onClick,
  onUrlInputClick,
  onPaste,
  onFileSelect,
  acceptTypes,
}) => {
  const config = MEDIA_CONFIG[type];
  const accept = acceptTypes || config.accept;
  const Icon = config.icon;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onFileSelect) {
        onFileSelect(file);
      }
      // 重置 input 以便可以再次选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFileSelect]
  );

  // 点击处理：尝试打开媒体选择器，如果没有处理则使用内置文件选择器或 URL 输入
  const handleClick = useCallback(() => {
    const handled = onClick?.();
    if (!handled) {
      // 如果提供了 onFileSelect，使用内置文件选择器
      if (onFileSelect && fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        // 否则切换到 URL 输入
        onUrlInputClick?.();
      }
    }
  }, [onClick, onFileSelect, onUrlInputClick]);

  return (
    <div
      className={`media-placeholder ${isDragging ? 'dragging' : ''}`}
      contentEditable={false}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handleClick}
      onPaste={onPaste}
      tabIndex={0}
    >
      {/* 隐藏的文件输入框，带有类型限制 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept || undefined}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div className="media-placeholder-content">
        <Icon className="media-placeholder-icon" size={48} />
        <p className="media-placeholder-text">{config.text}</p>
        <p className="media-placeholder-hint">
          {config.hint}
          <button
            onClick={e => {
              e.stopPropagation();
              onUrlInputClick?.();
            }}
          >
            粘贴链接
          </button>
        </p>
      </div>
    </div>
  );
};
