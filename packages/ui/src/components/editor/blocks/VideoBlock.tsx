import React, { useRef, useCallback } from 'react';
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
} from '@blocknote/react';
import VideoPlayer from '../../VideoPlayer';
import { getMediaUrl } from '@whispers/utils';
import {
  MediaPlaceholder,
  MediaUrlInput,
  MediaCaption,
  ResizeHandle,
  useMediaBlock,
  type MediaAlign,
} from './shared';

interface VideoBlockComponentProps {
  url: string;
  /** 视频标题/名称 */
  title: string;
  /** 视频说明 */
  caption: string;
  width: number;
  align: MediaAlign;
  editable: boolean;
  onUrlChange: (url: string) => void;
  onTitleChange: (title: string) => void;
  onCaptionChange: (caption: string) => void;
  onWidthChange: (width: number) => void;
  onAlignChange: (align: MediaAlign) => void;
  /** 打开媒体选择器，返回 true 表示事件被处理 */
  onOpenMediaPicker?: () => boolean;
  /** 当通过内置文件选择器选择文件时触发 */
  onFileSelect?: (file: File) => void;
}

const VideoBlockComponent: React.FC<VideoBlockComponentProps> = ({
  url,
  title,
  caption,
  width,
  align,
  editable,
  onUrlChange,
  onTitleChange,
  onCaptionChange,
  onWidthChange,
  onAlignChange: _onAlignChange,
  onOpenMediaPicker,
  onFileSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isUrlInput,
    setIsUrlInput,
    urlInputValue,
    setUrlInputValue,
    handleUrlSubmit,
    handleUrlCancel,
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handlePaste,
    isSelected,
    setIsSelected,
    resizing,
    handleResizeStart,
  } = useMediaBlock({ url, onUrlChange, minWidth: 50 });

  const handleContainerClick = useCallback(() => {
    if (editable) {
      setIsSelected(true);
    }
  }, [editable, setIsSelected]);

  const handleContainerBlur = useCallback(() => {
    setIsSelected(false);
  }, [setIsSelected]);

  // 空状态
  if (!url && !isUrlInput) {
    return (
      <MediaPlaceholder
        type="video"
        isDragging={isDragging}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={e => handleDrop(e)}
        onClick={onOpenMediaPicker}
        onUrlInputClick={() => setIsUrlInput(true)}
        onPaste={handlePaste}
        onFileSelect={onFileSelect}
      />
    );
  }

  // URL 输入状态
  if (isUrlInput) {
    return (
      <MediaUrlInput
        value={urlInputValue}
        onChange={setUrlInputValue}
        onSubmit={handleUrlSubmit}
        onCancel={handleUrlCancel}
        placeholder="输入视频链接 (支持 mp4, webm, m3u8)..."
      />
    );
  }

  // 媒体展示状态
  return (
    <div
      className="media-block-wrapper"
      data-align={align}
      data-selected={isSelected}
      contentEditable={false}
      onClick={handleContainerClick}
      onBlur={handleContainerBlur}
      tabIndex={editable ? 0 : undefined}
    >
      <div
        ref={containerRef}
        className="media-block-container"
        style={{ width: `${width}%` }}
      >
        <div className="media-block-content">
          <VideoPlayer src={getMediaUrl(url)} title={title || '未命名视频'} />
        </div>

        {editable && (
          <>
            <ResizeHandle
              side="left"
              resizing={resizing}
              onMouseDown={e =>
                handleResizeStart(e, 'left', width, containerRef, onWidthChange)
              }
            />
            <ResizeHandle
              side="right"
              resizing={resizing}
              onMouseDown={e =>
                handleResizeStart(
                  e,
                  'right',
                  width,
                  containerRef,
                  onWidthChange
                )
              }
            />
          </>
        )}

        {/* 视频名称输入 */}
        <MediaCaption
          value={title}
          onChange={onTitleChange}
          editable={editable}
          placeholder="添加视频名称..."
        />

        {/* 视频说明输入 */}
        <MediaCaption
          value={caption}
          onChange={onCaptionChange}
          editable={editable}
          placeholder="添加视频说明..."
        />
      </div>
    </div>
  );
};

// 导出 HTML

const VideoBlockExternalHTML: React.FC<
  ReactCustomBlockRenderProps<any, any, any>
> = ({ block }) => {
  const {
    url = '',
    title = '',
    caption = '',
    width = 100,
    align = 'center',
  } = block.props;

  if (!url) return null;

  const alignStyle =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  // 输出格式：title|caption（如果有说明）
  const displayText = caption ? `${title}|${caption}` : title;

  return (
    <figure
      data-video-block="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignStyle,
        width: '100%',
        margin: '1.5rem 0',
      }}
    >
      <div style={{ width: `${width}%` }}>
        <video
          src={url}
          controls
          playsInline
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '0.5rem',
          }}
        >
          {displayText}
        </video>
        {caption && (
          <figcaption
            style={{
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              color: '#666',
              textAlign: 'center',
            }}
          >
            {caption}
          </figcaption>
        )}
      </div>
    </figure>
  );
};

// 创建自定义块规范
const createCustomVideoBlock = createReactBlockSpec(
  {
    type: 'customVideo',
    propSchema: {
      url: { default: '' },
      /** 视频标题/名称 */
      title: { default: '' },
      /** 视频说明 */
      caption: { default: '' },
      width: { default: 100 },
      align: { default: 'center' as MediaAlign },
    },
    content: 'none',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (props: ReactCustomBlockRenderProps<any, any, any>) => {
      const { block, editor } = props;
      const {
        url = '',
        title = '',
        caption = '',
        width = 100,
        align = 'center',
      } = block.props;

      return (
        <VideoBlockComponent
          url={url}
          title={title}
          caption={caption}
          width={width}
          align={align as MediaAlign}
          editable={editor.isEditable}
          onUrlChange={newUrl => {
            editor.updateBlock(block, {
              props: { ...block.props, url: newUrl },
            });
          }}
          onTitleChange={newTitle => {
            editor.updateBlock(block, {
              props: { ...block.props, title: newTitle },
            });
          }}
          onCaptionChange={newCaption => {
            editor.updateBlock(block, {
              props: { ...block.props, caption: newCaption },
            });
          }}
          onWidthChange={newWidth => {
            editor.updateBlock(block, {
              props: { ...block.props, width: newWidth },
            });
          }}
          onAlignChange={newAlign => {
            editor.updateBlock(block, {
              props: { ...block.props, align: newAlign },
            });
          }}
          onOpenMediaPicker={() => {
            const event = new CustomEvent('blocknote:openMediaPicker', {
              cancelable: true,
              detail: { type: 'video', blockId: block.id },
            });
            window.dispatchEvent(event);
            return event.defaultPrevented;
          }}
          onFileSelect={async file => {
            if (editor.uploadFile) {
              try {
                const result = await editor.uploadFile(file);
                const uploadedUrl = typeof result === 'string' ? result : null;
                if (uploadedUrl) {
                  editor.updateBlock(block, {
                    props: {
                      ...block.props,
                      url: uploadedUrl,
                      title: file.name, // 使用文件名作为默认标题
                    },
                  });
                }
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('[VideoBlock] Failed to upload file:', error);
              }
            }
          }}
        />
      );
    },
    toExternalHTML: VideoBlockExternalHTML,
    parse: (element: HTMLElement) => {
      // 视频扩展名
      const videoExtensions = [
        '.mp4',
        '.webm',
        '.mov',
        '.avi',
        '.mkv',
        '.m3u8',
      ];
      const isVideoUrl = (url: string) =>
        videoExtensions.some(ext => url.toLowerCase().includes(ext));

      // 解析 title|caption 格式
      const parseDisplayText = (
        text: string
      ): { title: string; caption: string } => {
        if (text.includes('|')) {
          const parts = text.split('|');
          return {
            title: parts[0].trim(),
            caption: parts.slice(1).join('|').trim(),
          };
        }
        return { title: text, caption: '' };
      };

      if (element.tagName === 'FIGURE') {
        const video = element.querySelector('video');
        const figcaption = element.querySelector('figcaption');
        const container = element.querySelector('div');
        if (video) {
          const widthStr = container?.style.width || '100%';
          const width = parseInt(widthStr, 10) || 100;
          // 从 video 内容中解析 title|caption
          const videoText = video.textContent?.trim() || '';
          const { title, caption: parsedCaption } = parseDisplayText(videoText);
          return {
            url: video.getAttribute('src') || '',
            title: title,
            caption: figcaption?.textContent || parsedCaption || '',
            width,
            align: (element.style.alignItems === 'flex-start'
              ? 'left'
              : element.style.alignItems === 'flex-end'
                ? 'right'
                : 'center') as MediaAlign,
          };
        }
        // 检查 figure 中的 img 是否指向视频文件
        const img = element.querySelector('img');
        if (img) {
          const src = img.getAttribute('src') || '';
          if (isVideoUrl(src)) {
            const widthStr = container?.style.width || '100%';
            const width = parseInt(widthStr, 10) || 100;
            return {
              url: src,
              title: img.getAttribute('alt') || '',
              caption: figcaption?.textContent || '',
              width,
              align: (element.style.alignItems === 'flex-start'
                ? 'left'
                : element.style.alignItems === 'flex-end'
                  ? 'right'
                  : 'center') as MediaAlign,
            };
          }
        }
      }
      if (element.tagName === 'VIDEO') {
        const videoText = element.textContent?.trim() || '';
        const { title, caption } = parseDisplayText(videoText);
        return {
          url: element.getAttribute('src') || '',
          title: title,
          caption: caption,
          width: 100,
          align: 'center' as MediaAlign,
        };
      }
      // 检查 img 标签是否指向视频文件（markdown ![](video.mp4) 会生成 img 标签）
      if (element.tagName === 'IMG') {
        const src = element.getAttribute('src') || '';
        if (isVideoUrl(src)) {
          const altText = element.getAttribute('alt') || '';
          const { title, caption } = parseDisplayText(altText);
          return {
            url: src,
            title: title,
            caption: caption,
            width: 100,
            align: 'center' as MediaAlign,
          };
        }
      }
      return undefined;
    },
  }
);

export const CustomVideoBlock = createCustomVideoBlock();
