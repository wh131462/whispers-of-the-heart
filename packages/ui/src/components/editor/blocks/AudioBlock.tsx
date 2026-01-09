import React, { useCallback } from 'react';
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
} from '@blocknote/react';
import AudioPlayer from '../../AudioPlayer';
import { getMediaUrl } from '@whispers/utils';
import {
  MediaPlaceholder,
  MediaUrlInput,
  MediaCaption,
  useMediaBlock,
} from './shared';

interface AudioBlockComponentProps {
  url: string;
  /** 音频标题/名称 */
  title: string;
  /** 音频说明 */
  caption: string;
  editable: boolean;
  onUrlChange: (url: string) => void;
  onTitleChange: (title: string) => void;
  onCaptionChange: (caption: string) => void;
  /** 打开媒体选择器，返回 true 表示事件被处理 */
  onOpenMediaPicker?: () => boolean;
  /** 当通过内置文件选择器选择文件时触发 */
  onFileSelect?: (file: File) => void;
}

const AudioBlockComponent: React.FC<AudioBlockComponentProps> = ({
  url,
  title,
  caption,
  editable,
  onUrlChange,
  onTitleChange,
  onCaptionChange,
  onOpenMediaPicker,
  onFileSelect,
}) => {
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
        type="audio"
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
        placeholder="输入音频链接 (支持 mp3, wav, ogg)..."
      />
    );
  }

  // 音频展示状态
  return (
    <div
      className="media-block-wrapper"
      data-align="center"
      data-selected={isSelected}
      contentEditable={false}
      onClick={handleContainerClick}
      onBlur={handleContainerBlur}
      tabIndex={editable ? 0 : undefined}
    >
      <div className="media-block-container" style={{ width: '100%' }}>
        <div className="media-block-content media-audio-wrapper">
          <AudioPlayer src={getMediaUrl(url)} title={title || '未命名音频'} />
        </div>

        {/* 音频名称输入 */}
        <MediaCaption
          value={title}
          onChange={onTitleChange}
          editable={editable}
          placeholder="添加音频名称..."
        />

        {/* 音频说明输入 */}
        <MediaCaption
          value={caption}
          onChange={onCaptionChange}
          editable={editable}
          placeholder="添加音频说明..."
        />
      </div>
    </div>
  );
};

// 导出 HTML

const AudioBlockExternalHTML: React.FC<
  ReactCustomBlockRenderProps<any, any, any>
> = ({ block }) => {
  const { url = '', title = '', caption = '' } = block.props;

  if (!url) return null;

  // 输出格式：title|caption（如果有说明）
  const displayText = caption ? `${title}|${caption}` : title;

  return (
    <figure
      data-audio-block="true"
      style={{
        margin: '1.5rem 0',
      }}
    >
      <audio
        src={url}
        controls
        style={{
          width: '100%',
          display: 'block',
          borderRadius: '0.5rem',
        }}
      >
        {displayText}
      </audio>
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
    </figure>
  );
};

// 创建自定义块规范
const createCustomAudioBlock = createReactBlockSpec(
  {
    type: 'customAudio',
    propSchema: {
      url: { default: '' },
      /** 音频标题/名称 */
      title: { default: '' },
      /** 音频说明 */
      caption: { default: '' },
    },
    content: 'none',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (props: ReactCustomBlockRenderProps<any, any, any>) => {
      const { block, editor } = props;
      const { url = '', title = '', caption = '' } = block.props;

      return (
        <AudioBlockComponent
          url={url}
          title={title}
          caption={caption}
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
          onOpenMediaPicker={() => {
            const event = new CustomEvent('blocknote:openMediaPicker', {
              cancelable: true,
              detail: { type: 'audio', blockId: block.id },
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
                console.error('[AudioBlock] Failed to upload file:', error);
              }
            }
          }}
        />
      );
    },
    toExternalHTML: AudioBlockExternalHTML,
    parse: (element: HTMLElement) => {
      // 音频扩展名
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
      const isAudioUrl = (url: string) =>
        audioExtensions.some(ext => url.toLowerCase().includes(ext));

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
        const audio = element.querySelector('audio');
        const figcaption = element.querySelector('figcaption');
        if (audio) {
          // 从 audio 内容中解析 title|caption
          const audioText = audio.textContent?.trim() || '';
          const { title, caption: parsedCaption } = parseDisplayText(audioText);
          return {
            url: audio.getAttribute('src') || '',
            title: title,
            caption: figcaption?.textContent || parsedCaption || '',
          };
        }
      }
      if (element.tagName === 'AUDIO') {
        const audioText = element.textContent?.trim() || '';
        const { title, caption } = parseDisplayText(audioText);
        return {
          url: element.getAttribute('src') || '',
          title: title,
          caption: caption,
        };
      }
      // 检查 a 标签是否指向音频文件（markdown [text](audio.mp3) 会生成 a 标签）
      if (element.tagName === 'A') {
        const href = element.getAttribute('href') || '';
        if (isAudioUrl(href)) {
          const linkText = element.textContent?.trim() || '';
          const { title, caption } = parseDisplayText(linkText);
          return {
            url: href,
            title: title,
            caption: caption,
          };
        }
      }
      return undefined;
    },
  }
);

export const CustomAudioBlock = createCustomAudioBlock();
