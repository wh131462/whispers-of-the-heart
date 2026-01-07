import React, { useState, useCallback } from 'react';
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
} from '@blocknote/react';
import {
  Video,
  Upload,
  X,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import VideoPlayer from '../../VideoPlayer';
import { getMediaUrl } from '@whispers/utils';

type VideoWidth = '50%' | '75%' | '100%';
type VideoAlign = 'left' | 'center' | 'right';

interface VideoBlockProps {
  url: string;
  title?: string;
  width?: VideoWidth;
  align?: VideoAlign;
  onUrlChange: (url: string) => void;
  onTitleChange: (title: string) => void;
  onWidthChange: (width: VideoWidth) => void;
  onAlignChange: (align: VideoAlign) => void;
  onOpenMediaPicker?: () => void;
  editable: boolean;
}

const VideoBlockComponent: React.FC<VideoBlockProps> = ({
  url,
  title = '',
  width = '100%',
  align = 'center',
  onUrlChange,
  onTitleChange,
  onWidthChange,
  onAlignChange,
  onOpenMediaPicker,
  editable,
}) => {
  const [isUrlInput, setIsUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState(url || '');
  const [titleInputValue, setTitleInputValue] = useState(title || '');
  const [showControls, setShowControls] = useState(false);

  const handleUrlSubmit = useCallback(() => {
    if (urlInputValue.trim()) {
      onUrlChange(urlInputValue.trim());
      setIsUrlInput(false);
    }
  }, [urlInputValue, onUrlChange]);

  const handleTitleBlur = useCallback(() => {
    onTitleChange(titleInputValue);
  }, [titleInputValue, onTitleChange]);

  const handleRemove = useCallback(() => {
    onUrlChange('');
    setUrlInputValue('');
  }, [onUrlChange]);

  if (!url && !isUrlInput) {
    return (
      <div className="bn-video-block-empty" contentEditable={false}>
        <div className="video-placeholder">
          <Video className="placeholder-icon" size={48} />
          <p className="placeholder-text">添加视频</p>
          {editable && (
            <div className="placeholder-actions">
              {onOpenMediaPicker && (
                <button
                  onClick={onOpenMediaPicker}
                  className="action-btn primary"
                >
                  <Upload size={16} />
                  <span>从媒体库选择</span>
                </button>
              )}
              <button
                onClick={() => setIsUrlInput(true)}
                className="action-btn"
              >
                <LinkIcon size={16} />
                <span>通过URL添加</span>
              </button>
            </div>
          )}
        </div>
        <style>{`
          .bn-video-block-empty {
            padding: 3rem 2rem;
            border: 2px dashed hsl(var(--border));
            border-radius: 0.5rem;
            background: hsl(var(--muted) / 0.3);
          }

          .video-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .placeholder-icon {
            color: hsl(var(--muted-foreground));
          }

          .placeholder-text {
            color: hsl(var(--muted-foreground));
            font-size: 0.875rem;
            margin: 0;
          }

          .placeholder-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 0.5rem;
          }

          .action-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border: 1px solid hsl(var(--border));
            background: hsl(var(--background));
            color: hsl(var(--foreground));
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.15s;
          }

          .action-btn:hover {
            background: hsl(var(--accent));
            border-color: hsl(var(--primary));
          }

          .action-btn.primary {
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            border-color: hsl(var(--primary));
          }

          .action-btn.primary:hover {
            opacity: 0.9;
          }
        `}</style>
      </div>
    );
  }

  if (isUrlInput) {
    return (
      <div className="bn-video-url-input" contentEditable={false}>
        <input
          type="url"
          value={urlInputValue}
          onChange={e => setUrlInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleUrlSubmit();
            } else if (e.key === 'Escape') {
              setIsUrlInput(false);
              setUrlInputValue(url);
            }
          }}
          placeholder="输入视频URL (支持mp4, webm, m3u8等)..."
          autoFocus
          className="url-input"
        />
        <div className="url-actions">
          <button onClick={handleUrlSubmit} className="btn-submit">
            确定
          </button>
          <button onClick={() => setIsUrlInput(false)} className="btn-cancel">
            取消
          </button>
        </div>
        <style>{`
          .bn-video-url-input {
            padding: 1rem;
            border: 1px solid hsl(var(--border));
            border-radius: 0.5rem;
            background: hsl(var(--background));
          }

          .url-input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid hsl(var(--border));
            border-radius: 0.375rem;
            background: hsl(var(--background));
            color: hsl(var(--foreground));
            font-size: 0.875rem;
            outline: none;
          }

          .url-input:focus {
            border-color: hsl(var(--primary));
          }

          .url-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.75rem;
          }

          .btn-submit,
          .btn-cancel {
            padding: 0.375rem 0.75rem;
            border: 1px solid hsl(var(--border));
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.15s;
          }

          .btn-submit {
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            border-color: hsl(var(--primary));
          }

          .btn-cancel {
            background: hsl(var(--background));
            color: hsl(var(--foreground));
          }

          .btn-submit:hover,
          .btn-cancel:hover {
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  const widthOptions: VideoWidth[] = ['50%', '75%', '100%'];

  return (
    <div
      className="bn-video-block-content"
      contentEditable={false}
      onMouseEnter={() => editable && setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems:
          align === 'left'
            ? 'flex-start'
            : align === 'right'
              ? 'flex-end'
              : 'center',
      }}
    >
      <div className="video-container" style={{ width }}>
        <div className="video-wrapper">
          <VideoPlayer src={getMediaUrl(url)} title={title} />
          {editable && (
            <>
              <button
                onClick={handleRemove}
                className="remove-btn"
                title="删除视频"
              >
                <X size={16} />
              </button>
              {showControls && (
                <div className="video-controls">
                  {/* 宽度控制 */}
                  <div className="control-group">
                    <span className="control-label">宽度</span>
                    <div className="width-buttons">
                      {widthOptions.map(w => (
                        <button
                          key={w}
                          onClick={() => onWidthChange(w)}
                          className={`width-btn ${width === w ? 'active' : ''}`}
                          title={`宽度 ${w}`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 对齐控制 */}
                  <div className="control-group">
                    <span className="control-label">对齐</span>
                    <div className="align-buttons">
                      <button
                        onClick={() => onAlignChange('left')}
                        className={`align-btn ${align === 'left' ? 'active' : ''}`}
                        title="左对齐"
                      >
                        <AlignLeft size={14} />
                      </button>
                      <button
                        onClick={() => onAlignChange('center')}
                        className={`align-btn ${align === 'center' ? 'active' : ''}`}
                        title="居中"
                      >
                        <AlignCenter size={14} />
                      </button>
                      <button
                        onClick={() => onAlignChange('right')}
                        className={`align-btn ${align === 'right' ? 'active' : ''}`}
                        title="右对齐"
                      >
                        <AlignRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {editable && (
          <input
            type="text"
            value={titleInputValue}
            onChange={e => setTitleInputValue(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="添加视频标题..."
            className="title-input"
          />
        )}
        {!editable && title && <p className="title-text">{title}</p>}
      </div>
      <style>{`
        .bn-video-block-content {
          margin: 1.5rem 0;
          width: 100%;
        }

        .video-container {
          transition: width 0.2s ease;
        }

        .video-wrapper {
          position: relative;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .remove-btn {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 30;
          padding: 0.375rem;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 0.375rem;
          color: white;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: background 0.15s;
        }

        .remove-btn:hover {
          background: rgba(0, 0, 0, 0.9);
        }

        .video-controls {
          position: absolute;
          bottom: 0.75rem;
          left: 0.75rem;
          right: 0.75rem;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.85);
          border-radius: 0.5rem;
          backdrop-filter: blur(8px);
          display: flex;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          z-index: 20;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .control-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .width-buttons,
        .align-buttons {
          display: flex;
          gap: 0.25rem;
        }

        .width-btn,
        .align-btn {
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.25rem;
          color: white;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .width-btn:hover,
        .align-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .width-btn.active,
        .align-btn.active {
          background: hsl(var(--primary));
          border-color: hsl(var(--primary));
        }

        .title-input {
          width: 100%;
          margin-top: 0.75rem;
          padding: 0.5rem;
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          outline: none;
        }

        .title-input:focus {
          border-color: hsl(var(--primary));
        }

        .title-text {
          margin-top: 0.75rem;
          padding: 0.5rem;
          color: hsl(var(--muted-foreground));
          font-size: 0.875rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

// 导出HTML组件
const VideoBlockExternalHTML: React.FC<
  ReactCustomBlockRenderProps<any, any, any>
> = ({ block }) => {
  const {
    url = '',
    title = '',
    width = '100%',
    align = 'center',
  } = block.props;

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
        margin: '1.5rem 0',
      }}
    >
      <div style={{ width }}>
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
          您的浏览器不支持视频播放
        </video>
        {title && (
          <figcaption
            style={{
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              color: '#666',
              textAlign: 'center',
            }}
          >
            {title}
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
      title: { default: '' },
      width: { default: '100%' as VideoWidth },
      align: { default: 'center' as VideoAlign },
    },
    content: 'none',
  },
  {
    render: (props: ReactCustomBlockRenderProps<any, any, any>) => {
      const { block, editor } = props;
      const {
        url = '',
        title = '',
        width = '100%',
        align = 'center',
      } = block.props;

      return (
        <VideoBlockComponent
          url={url}
          title={title}
          width={width as VideoWidth}
          align={align as VideoAlign}
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
            window.dispatchEvent(
              new CustomEvent('blocknote:openMediaPicker', {
                detail: { type: 'video', blockId: block.id },
              })
            );
          }}
        />
      );
    },
    toExternalHTML: VideoBlockExternalHTML,
    parse: (element: HTMLElement) => {
      if (element.tagName === 'FIGURE') {
        const video = element.querySelector('video');
        const caption = element.querySelector('figcaption');
        const container = element.querySelector('div');
        if (video) {
          return {
            url: video.getAttribute('src') || '',
            title: caption?.textContent || '',
            width: (container?.style.width || '100%') as VideoWidth,
            align: (element.style.alignItems === 'flex-start'
              ? 'left'
              : element.style.alignItems === 'flex-end'
                ? 'right'
                : 'center') as VideoAlign,
          };
        }
      }
      if (element.tagName === 'VIDEO') {
        return {
          url: element.getAttribute('src') || '',
          title: '',
          width: '100%' as VideoWidth,
          align: 'center' as VideoAlign,
        };
      }
      return undefined;
    },
  }
);

export const CustomVideoBlock = createCustomVideoBlock();
