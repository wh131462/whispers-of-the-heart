import React, { useRef, useCallback } from 'react';
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
} from '@blocknote/react';
import { getMediaUrl } from '@whispers/utils';
import {
  MediaPlaceholder,
  MediaUrlInput,
  MediaToolbar,
  MediaCaption,
  ResizeHandle,
  useMediaBlock,
  type MediaAlign,
} from './shared';

interface ImageBlockComponentProps {
  url: string;
  caption: string;
  width: number;
  align: MediaAlign;
  editable: boolean;
  onUrlChange: (url: string) => void;
  onCaptionChange: (caption: string) => void;
  onWidthChange: (width: number) => void;
  onAlignChange: (align: MediaAlign) => void;
  /** 打开媒体选择器，返回 true 表示事件被处理 */
  onOpenMediaPicker?: () => boolean;
  /** 当通过内置文件选择器选择文件时触发 */
  onFileSelect?: (file: File) => void;
}

const ImageBlockComponent: React.FC<ImageBlockComponentProps> = ({
  url,
  caption,
  width,
  align,
  editable,
  onUrlChange,
  onCaptionChange,
  onWidthChange,
  onAlignChange,
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
  } = useMediaBlock({ url, onUrlChange });

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
        type="image"
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
        placeholder="输入图片链接..."
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
        {editable && (
          <MediaToolbar
            align={align}
            onAlignChange={onAlignChange}
            onReplace={onOpenMediaPicker}
          />
        )}

        <div className="media-block-content">
          <img src={getMediaUrl(url)} alt={caption || '图片'} />
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

        <MediaCaption
          value={caption}
          onChange={onCaptionChange}
          editable={editable}
          placeholder="添加图片说明..."
        />
      </div>
    </div>
  );
};

// 导出 HTML

const ImageBlockExternalHTML: React.FC<
  ReactCustomBlockRenderProps<any, any, any>
> = ({ block }) => {
  const { url = '', caption = '', width = 100, align = 'center' } = block.props;

  if (!url) return null;

  const alignStyle =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  return (
    <figure
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignStyle,
        width: '100%',
        margin: '1rem 0',
      }}
    >
      <div style={{ width: `${width}%` }}>
        <img
          src={url}
          alt={caption || '图片'}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '0.5rem',
          }}
        />
        {caption && (
          <figcaption
            style={{
              marginTop: '0.5rem',
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
const createCustomImageBlock = createReactBlockSpec(
  {
    type: 'customImage',
    propSchema: {
      url: { default: '' },
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
        caption = '',
        width = 100,
        align = 'center',
      } = block.props;

      return (
        <ImageBlockComponent
          url={url}
          caption={caption}
          width={width}
          align={align as MediaAlign}
          editable={editor.isEditable}
          onUrlChange={newUrl => {
            editor.updateBlock(block, {
              props: { ...block.props, url: newUrl },
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
              detail: { type: 'image', blockId: block.id },
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
                    props: { ...block.props, url: uploadedUrl },
                  });
                }
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('[ImageBlock] Failed to upload file:', error);
              }
            }
          }}
        />
      );
    },
    toExternalHTML: ImageBlockExternalHTML,
    parse: (element: HTMLElement) => {
      // 视频和音频扩展名，这些应该由对应的块处理
      const videoExtensions = [
        '.mp4',
        '.webm',
        '.mov',
        '.avi',
        '.mkv',
        '.m3u8',
      ];
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];

      const isVideoUrl = (url: string) =>
        videoExtensions.some(ext => url.toLowerCase().includes(ext));
      const isAudioUrl = (url: string) =>
        audioExtensions.some(ext => url.toLowerCase().includes(ext));

      if (element.tagName === 'FIGURE') {
        const img = element.querySelector('img');
        const caption = element.querySelector('figcaption');
        const container = element.querySelector('div');
        if (img) {
          const src = img.getAttribute('src') || '';
          // 如果是视频或音频 URL，不作为图片处理
          if (isVideoUrl(src) || isAudioUrl(src)) {
            return undefined;
          }
          const widthStr = container?.style.width || '100%';
          const width = parseInt(widthStr, 10) || 100;
          return {
            url: src,
            caption: caption?.textContent || '',
            width,
            align: (element.style.alignItems === 'flex-start'
              ? 'left'
              : element.style.alignItems === 'flex-end'
                ? 'right'
                : 'center') as MediaAlign,
          };
        }
      }
      if (element.tagName === 'IMG') {
        const src = element.getAttribute('src') || '';
        // 如果是视频或音频 URL，不作为图片处理
        if (isVideoUrl(src) || isAudioUrl(src)) {
          return undefined;
        }
        return {
          url: src,
          caption: element.getAttribute('alt') || '',
          width: 100,
          align: 'center' as MediaAlign,
        };
      }
      return undefined;
    },
  }
);

export const CustomImageBlock = createCustomImageBlock();
