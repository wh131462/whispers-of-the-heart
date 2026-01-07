import React, { useState, useCallback } from 'react';
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
} from '@blocknote/react';
import {
  Image,
  Upload,
  X,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { getMediaUrl } from '@whispers/utils';

type ImageWidth = '25%' | '50%' | '75%' | '100%';
type ImageAlign = 'left' | 'center' | 'right';

interface ImageBlockProps {
  url: string;
  caption?: string;
  width?: ImageWidth;
  align?: ImageAlign;
  onUrlChange: (url: string) => void;
  onCaptionChange: (caption: string) => void;
  onWidthChange: (width: ImageWidth) => void;
  onAlignChange: (align: ImageAlign) => void;
  onOpenMediaPicker?: () => void;
  editable: boolean;
}

const ImageBlockComponent: React.FC<ImageBlockProps> = ({
  url,
  caption = '',
  width = '100%',
  align = 'center',
  onUrlChange,
  onCaptionChange,
  onWidthChange,
  onAlignChange,
  onOpenMediaPicker,
  editable,
}) => {
  const [isUrlInput, setIsUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState(url || '');
  const [captionInputValue, setCaptionInputValue] = useState(caption || '');
  const [showControls, setShowControls] = useState(false);

  const handleUrlSubmit = useCallback(() => {
    if (urlInputValue.trim()) {
      onUrlChange(urlInputValue.trim());
      setIsUrlInput(false);
    }
  }, [urlInputValue, onUrlChange]);

  const handleCaptionBlur = useCallback(() => {
    onCaptionChange(captionInputValue);
  }, [captionInputValue, onCaptionChange]);

  const handleRemove = useCallback(() => {
    onUrlChange('');
    setUrlInputValue('');
  }, [onUrlChange]);

  if (!url && !isUrlInput) {
    return (
      <div className="bn-image-block-empty" contentEditable={false}>
        <div className="image-placeholder">
          <Image className="placeholder-icon" size={48} />
          <p className="placeholder-text">添加图片</p>
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
          .bn-image-block-empty {
            padding: 2rem;
            border: 2px dashed hsl(var(--border));
            border-radius: 0.5rem;
            background: hsl(var(--muted) / 0.3);
          }

          .image-placeholder {
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
      <div className="bn-image-url-input" contentEditable={false}>
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
          placeholder="输入图片URL..."
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
          .bn-image-url-input {
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

  const widthOptions: ImageWidth[] = ['25%', '50%', '75%', '100%'];

  return (
    <div
      className="bn-image-block-content"
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
      <div className="image-container" style={{ width }}>
        <div className="image-wrapper">
          <img
            src={getMediaUrl(url)}
            alt={caption || '图片'}
            className="block-image"
          />
          {editable && (
            <>
              <button
                onClick={handleRemove}
                className="remove-btn"
                title="删除图片"
              >
                <X size={16} />
              </button>
              {showControls && (
                <div className="image-controls">
                  {/* 尺寸控制 */}
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
            value={captionInputValue}
            onChange={e => setCaptionInputValue(e.target.value)}
            onBlur={handleCaptionBlur}
            placeholder="添加图片说明..."
            className="caption-input"
          />
        )}
        {!editable && caption && <p className="caption-text">{caption}</p>}
      </div>
      <style>{`
        .bn-image-block-content {
          margin: 1rem 0;
          width: 100%;
        }

        .image-container {
          transition: width 0.2s ease;
        }

        .image-wrapper {
          position: relative;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid hsl(var(--border));
        }

        .block-image {
          width: 100%;
          height: auto;
          display: block;
        }

        .remove-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          padding: 0.375rem;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 0.375rem;
          color: white;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: background 0.15s;
          z-index: 10;
        }

        .remove-btn:hover {
          background: rgba(0, 0, 0, 0.9);
        }

        .image-controls {
          position: absolute;
          bottom: 0.5rem;
          left: 0.5rem;
          right: 0.5rem;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.85);
          border-radius: 0.5rem;
          backdrop-filter: blur(8px);
          display: flex;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
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

        .caption-input {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.5rem;
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          outline: none;
        }

        .caption-input:focus {
          border-color: hsl(var(--primary));
        }

        .caption-text {
          margin-top: 0.5rem;
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
const ImageBlockExternalHTML: React.FC<
  ReactCustomBlockRenderProps<any, any, any>
> = ({ block }) => {
  const {
    url = '',
    caption = '',
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
        margin: '1rem 0',
      }}
    >
      <div style={{ width }}>
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
      width: { default: '100%' as ImageWidth },
      align: { default: 'center' as ImageAlign },
    },
    content: 'none',
  },
  {
    render: (props: ReactCustomBlockRenderProps<any, any, any>) => {
      const { block, editor } = props;
      const {
        url = '',
        caption = '',
        width = '100%',
        align = 'center',
      } = block.props;

      return (
        <ImageBlockComponent
          url={url}
          caption={caption}
          width={width as ImageWidth}
          align={align as ImageAlign}
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
            window.dispatchEvent(
              new CustomEvent('blocknote:openMediaPicker', {
                detail: { type: 'image', blockId: block.id },
              })
            );
          }}
        />
      );
    },
    toExternalHTML: ImageBlockExternalHTML,
    parse: (element: HTMLElement) => {
      if (element.tagName === 'FIGURE') {
        const img = element.querySelector('img');
        const caption = element.querySelector('figcaption');
        const container = element.querySelector('div');
        if (img) {
          return {
            url: img.getAttribute('src') || '',
            caption: caption?.textContent || '',
            width: (container?.style.width || '100%') as ImageWidth,
            align: (element.style.alignItems === 'flex-start'
              ? 'left'
              : element.style.alignItems === 'flex-end'
                ? 'right'
                : 'center') as ImageAlign,
          };
        }
      }
      if (element.tagName === 'IMG') {
        return {
          url: element.getAttribute('src') || '',
          caption: element.getAttribute('alt') || '',
          width: '100%' as ImageWidth,
          align: 'center' as ImageAlign,
        };
      }
      return undefined;
    },
  }
);

export const CustomImageBlock = createCustomImageBlock();
