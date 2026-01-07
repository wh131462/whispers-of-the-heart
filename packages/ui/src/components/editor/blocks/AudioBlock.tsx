import React, { useState, useCallback } from 'react';
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
} from '@blocknote/react';
import { Music, Upload, X, Link as LinkIcon } from 'lucide-react';
import AudioPlayer from '../../AudioPlayer';
import { getMediaUrl } from '@whispers/utils';

interface AudioBlockProps {
  url: string;
  title?: string;
  artist?: string;
  cover?: string;
  onUrlChange: (url: string) => void;
  onTitleChange: (title: string) => void;
  onArtistChange: (artist: string) => void;
  onOpenMediaPicker?: () => void;
  editable: boolean;
}

const AudioBlockComponent: React.FC<AudioBlockProps> = ({
  url,
  title = '',
  artist = '',
  onUrlChange,
  onTitleChange,
  onArtistChange,
  onOpenMediaPicker,
  editable,
}) => {
  const [isUrlInput, setIsUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState(url || '');
  const [titleInputValue, setTitleInputValue] = useState(title || '');
  const [artistInputValue, setArtistInputValue] = useState(artist || '');

  const handleUrlSubmit = useCallback(() => {
    if (urlInputValue.trim()) {
      onUrlChange(urlInputValue.trim());
      setIsUrlInput(false);
    }
  }, [urlInputValue, onUrlChange]);

  const handleTitleBlur = useCallback(() => {
    onTitleChange(titleInputValue);
  }, [titleInputValue, onTitleChange]);

  const handleArtistBlur = useCallback(() => {
    onArtistChange(artistInputValue);
  }, [artistInputValue, onArtistChange]);

  const handleRemove = useCallback(() => {
    onUrlChange('');
    setUrlInputValue('');
  }, [onUrlChange]);

  if (!url && !isUrlInput) {
    return (
      <div className="bn-audio-block-empty" contentEditable={false}>
        <div className="audio-placeholder">
          <Music className="placeholder-icon" size={48} />
          <p className="placeholder-text">添加音频</p>
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
          .bn-audio-block-empty {
            padding: 2.5rem 2rem;
            border: 2px dashed hsl(var(--border));
            border-radius: 0.5rem;
            background: hsl(var(--muted) / 0.3);
          }

          .audio-placeholder {
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
      <div className="bn-audio-url-input" contentEditable={false}>
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
          placeholder="输入音频URL (支持mp3, wav, ogg等)..."
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
          .bn-audio-url-input {
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

  return (
    <div className="bn-audio-block-content" contentEditable={false}>
      <div className="audio-wrapper">
        <AudioPlayer
          src={getMediaUrl(url)}
          title={title || '未命名音频'}
          artist={artist}
        />
        {editable && (
          <button
            onClick={handleRemove}
            className="remove-btn"
            title="删除音频"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {editable ? (
        <div className="metadata-inputs">
          <input
            type="text"
            value={titleInputValue}
            onChange={e => setTitleInputValue(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="音频标题..."
            className="meta-input"
          />
          <input
            type="text"
            value={artistInputValue}
            onChange={e => setArtistInputValue(e.target.value)}
            onBlur={handleArtistBlur}
            placeholder="艺术家/作者..."
            className="meta-input"
          />
        </div>
      ) : (
        (title || artist) && (
          <div className="metadata-display">
            {title && <p className="meta-title">{title}</p>}
            {artist && <p className="meta-artist">{artist}</p>}
          </div>
        )
      )}
      <style>{`
        .bn-audio-block-content {
          margin: 1.5rem 0;
        }

        .audio-wrapper {
          position: relative;
        }

        .remove-btn {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 20;
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

        .metadata-inputs {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        .meta-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          outline: none;
        }

        .meta-input:focus {
          border-color: hsl(var(--primary));
        }

        .metadata-display {
          margin-top: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.375rem;
          background: hsl(var(--muted) / 0.3);
          text-align: center;
        }

        .meta-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        .meta-artist {
          margin: 0.25rem 0 0 0;
          font-size: 0.8rem;
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
};

// 导出HTML组件
const AudioBlockExternalHTML: React.FC<
  ReactCustomBlockRenderProps<any, any, any>
> = ({ block }) => {
  const { url = '', title = '', artist = '' } = block.props;

  if (!url) return null;

  return (
    <figure
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
        您的浏览器不支持音频播放
      </audio>
      {(title || artist) && (
        <figcaption
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            background: '#f5f5f5',
            textAlign: 'center',
          }}
        >
          {title && (
            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#333' }}>
              {title}
            </div>
          )}
          {artist && (
            <div
              style={{
                marginTop: '0.25rem',
                fontSize: '0.8rem',
                color: '#666',
              }}
            >
              {artist}
            </div>
          )}
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
      title: { default: '' },
      artist: { default: '' },
      cover: { default: '' },
    },
    content: 'none',
  },
  {
    render: (props: ReactCustomBlockRenderProps<any, any, any>) => {
      const { block, editor } = props;
      const { url = '', title = '', artist = '' } = block.props;

      return (
        <AudioBlockComponent
          url={url}
          title={title}
          artist={artist}
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
          onArtistChange={newArtist => {
            editor.updateBlock(block, {
              props: { ...block.props, artist: newArtist },
            });
          }}
          onOpenMediaPicker={() => {
            window.dispatchEvent(
              new CustomEvent('blocknote:openMediaPicker', {
                detail: { type: 'audio', blockId: block.id },
              })
            );
          }}
        />
      );
    },
    toExternalHTML: AudioBlockExternalHTML,
    parse: (element: HTMLElement) => {
      if (element.tagName === 'FIGURE') {
        const audio = element.querySelector('audio');
        const caption = element.querySelector('figcaption');
        if (audio) {
          let title = '';
          let artist = '';

          // Try parsing new format (div elements)
          const titleDiv = caption?.querySelector('div:first-child');
          const artistDiv = caption?.querySelector('div:nth-child(2)');
          if (titleDiv) {
            title = titleDiv.textContent?.trim() || '';
          }
          if (artistDiv) {
            artist = artistDiv.textContent?.trim() || '';
          }

          // Fallback to old format (text with " - " separator)
          if (!title && !artist && caption?.textContent) {
            const parts = caption.textContent.split(' - ');
            title = parts[0]?.trim() || '';
            artist = parts[1]?.trim() || '';
          }

          return {
            url: audio.getAttribute('src') || '',
            title,
            artist,
          };
        }
      }
      if (element.tagName === 'AUDIO') {
        return {
          url: element.getAttribute('src') || '',
          title: '',
          artist: '',
        };
      }
      return undefined;
    },
  }
);

export const CustomAudioBlock = createCustomAudioBlock();
