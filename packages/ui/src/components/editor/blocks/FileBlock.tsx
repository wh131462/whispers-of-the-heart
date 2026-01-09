import React, { useCallback, useState, useMemo } from 'react';
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
} from '@blocknote/react';
import { getMediaUrl } from '@whispers/utils';
import {
  FilePreviewModal,
  type PreviewFileLink,
} from '@eternalheart/react-file-preview';
import '@eternalheart/react-file-preview/style.css';
import {
  MediaPlaceholder,
  MediaUrlInput,
  MediaCaption,
  useMediaBlock,
  FileTypeIcon,
} from './shared';

// 获取文件扩展名
const getFileExtension = (url: string): string => {
  const pathname = url.split('?')[0];
  const ext = pathname.split('.').pop()?.toLowerCase() || '';
  return ext;
};

// 从 URL 中提取文件名
const getFileName = (url: string, caption?: string): string => {
  if (caption) return caption;
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

interface FileBlockComponentProps {
  url: string;
  /** 原始文件名（上传时从 file.name 获取） */
  fileName: string;
  /** 用户添加的说明 */
  caption: string;
  fileSize?: number;
  editable: boolean;
  onUrlChange: (url: string) => void;
  onFileNameChange: (fileName: string) => void;
  onCaptionChange: (caption: string) => void;
  onFileSizeChange?: (size: number) => void;
  /** 打开媒体选择器，返回 true 表示事件被处理 */
  onOpenMediaPicker?: () => boolean;
  /** 当通过内置文件选择器选择文件时触发 */
  onFileSelect?: (file: File) => void;
}

const FileBlockComponent: React.FC<FileBlockComponentProps> = ({
  url,
  fileName,
  caption,
  fileSize,
  editable,
  onUrlChange,
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

  // 预览状态
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleContainerClick = useCallback(() => {
    if (editable) {
      setIsSelected(true);
    }
  }, [editable, setIsSelected]);

  const handleContainerBlur = useCallback(() => {
    setIsSelected(false);
  }, [setIsSelected]);

  // 点击打开预览
  const handleOpenPreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (url) {
        setIsPreviewOpen(true);
      }
    },
    [url]
  );

  // 构建预览文件列表
  const previewFiles: PreviewFileLink[] = useMemo(() => {
    if (!url) return [];
    return [
      {
        id: 'file-preview',
        name: fileName || getFileName(url),
        url: getMediaUrl(url),
        type: getMimeType(url),
      },
    ];
  }, [url, fileName]);

  const fileExtension = getFileExtension(url);
  // 优先使用 fileName 属性，其次从 URL 提取
  const displayFileName = fileName || getFileName(url);
  const fileSizeText = formatFileSize(fileSize);

  // 空状态
  if (!url && !isUrlInput) {
    return (
      <MediaPlaceholder
        type="file"
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
        placeholder="输入文件链接..."
      />
    );
  }

  // 文件展示状态
  return (
    <>
      <div
        className="media-block-wrapper"
        data-align="left"
        data-selected={isSelected}
        contentEditable={false}
        onClick={handleContainerClick}
        onBlur={handleContainerBlur}
        tabIndex={editable ? 0 : undefined}
      >
        <div className="media-block-container" style={{ width: '100%' }}>
          <div
            className="media-block-content media-file-wrapper"
            onClick={handleOpenPreview}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenPreview(e as unknown as React.MouseEvent);
              }
            }}
          >
            <div className="media-file-icon">
              <FileTypeIcon extension={fileExtension} size={28} />
            </div>
            <div className="media-file-info">
              <div className="media-file-name" title={displayFileName}>
                {displayFileName}
              </div>
              {fileSizeText && (
                <div className="media-file-size">{fileSizeText}</div>
              )}
            </div>
            <div className="media-file-action">
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

          <MediaCaption
            value={caption}
            onChange={onCaptionChange}
            editable={editable}
            placeholder="添加文件说明..."
          />
        </div>
      </div>

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

// 导出 HTML

const FileBlockExternalHTML: React.FC<
  ReactCustomBlockRenderProps<any, any, any>
> = ({ block }) => {
  const { url = '', fileName = '', caption = '', fileSize = 0 } = block.props;

  if (!url) return null;

  const fileExtension = getFileExtension(url);
  // 优先使用 fileName 属性，其次从 URL 提取
  const displayFileName = fileName || getFileName(url);
  // 格式：文件名|说明（如果有说明）
  const displayText = caption
    ? `${displayFileName}|${caption}`
    : displayFileName;

  return (
    <figure
      data-file-block="true"
      data-file-size={fileSize || ''}
      style={{
        margin: '1rem 0',
      }}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-file-ext={fileExtension}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: '#f5f5f5',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          color: 'inherit',
          border: '1px solid #e0e0e0',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            background: '#fff',
            borderRadius: '0.375rem',
            fontSize: '0.625rem',
            fontWeight: 600,
            color: '#666',
            textTransform: 'uppercase',
          }}
        >
          {fileExtension.slice(0, 4) || 'FILE'}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayText}
          </span>
          {formatFileSize(fileSize) && (
            <span style={{ fontSize: '0.75rem', color: '#666' }}>
              {formatFileSize(fileSize)}
            </span>
          )}
        </span>
      </a>
    </figure>
  );
};

// 创建自定义块规范
const createCustomFileBlock = createReactBlockSpec(
  {
    type: 'customFile',
    propSchema: {
      url: { default: '' },
      /** 原始文件名（上传时从 file.name 获取） */
      fileName: { default: '' },
      /** 用户添加的说明 */
      caption: { default: '' },
      fileSize: { default: 0 },
    },
    content: 'none',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (props: ReactCustomBlockRenderProps<any, any, any>) => {
      const { block, editor } = props;
      const {
        url = '',
        fileName = '',
        caption = '',
        fileSize = 0,
      } = block.props;

      return (
        <FileBlockComponent
          url={url}
          fileName={fileName}
          caption={caption}
          fileSize={fileSize}
          editable={editor.isEditable}
          onUrlChange={newUrl => {
            editor.updateBlock(block, {
              props: { ...block.props, url: newUrl },
            });
          }}
          onFileNameChange={newFileName => {
            editor.updateBlock(block, {
              props: { ...block.props, fileName: newFileName },
            });
          }}
          onCaptionChange={newCaption => {
            editor.updateBlock(block, {
              props: { ...block.props, caption: newCaption },
            });
          }}
          onFileSizeChange={newSize => {
            editor.updateBlock(block, {
              props: { ...block.props, fileSize: newSize },
            });
          }}
          onOpenMediaPicker={() => {
            const event = new CustomEvent('blocknote:openMediaPicker', {
              cancelable: true,
              detail: { type: 'file', blockId: block.id },
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
                      fileName: file.name, // 使用 fileName 存储原始文件名
                      fileSize: file.size,
                    },
                  });
                }
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('[FileBlock] Failed to upload file:', error);
              }
            }
          }}
        />
      );
    },
    toExternalHTML: FileBlockExternalHTML,
    parse: (element: HTMLElement) => {
      // 文档扩展名（不包括图片、音频、视频）
      const documentExtensions = [
        '.pdf',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.ppt',
        '.pptx',
        '.txt',
        '.md',
        '.zip',
        '.rar',
        '.7z',
        '.tar',
        '.gz',
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
        '.py',
        '.java',
        '.json',
        '.html',
        '.css',
      ];
      const isDocumentUrl = (url: string) =>
        documentExtensions.some(ext => url.toLowerCase().includes(ext));

      // 解析 文件名|说明 格式的内容
      const parseDisplayText = (
        text: string
      ): { fileName: string; caption: string } => {
        if (text.includes('|')) {
          const parts = text.split('|');
          return {
            fileName: parts[0].trim(),
            caption: parts.slice(1).join('|').trim(), // 说明中可能也有 |
          };
        }
        return { fileName: text, caption: '' };
      };

      // 解析带有 data-file-block 属性的链接
      if (element.tagName === 'A' && element.hasAttribute('data-file-block')) {
        const href = element.getAttribute('href') || '';
        const fileSize = parseInt(
          element.getAttribute('data-file-size') || '0',
          10
        );
        const textContent = element.textContent || '';
        const { fileName, caption } = parseDisplayText(textContent);
        return {
          url: href,
          fileName: fileName,
          caption: caption,
          fileSize: fileSize,
        };
      }

      // 解析 figure 包裹的文件链接
      if (element.tagName === 'FIGURE') {
        // 优先检查 figure 上的 data-file-block 属性（新格式）
        if (element.hasAttribute('data-file-block')) {
          const link = element.querySelector('a');
          const href = link?.getAttribute('href') || '';
          const fileSize = parseInt(
            element.getAttribute('data-file-size') || '0',
            10
          );
          const textContent = link?.textContent || '';
          const { fileName, caption } = parseDisplayText(textContent);
          return {
            url: href,
            fileName: fileName,
            caption: caption,
            fileSize: fileSize,
          };
        }
        // 兼容旧格式：a 标签上有 data-file-block 属性
        const link = element.querySelector('a[data-file-block]');
        const figcaption = element.querySelector('figcaption');
        if (link) {
          const href = link.getAttribute('href') || '';
          const fileSize = parseInt(
            link.getAttribute('data-file-size') || '0',
            10
          );
          // 旧格式：caption 在 figcaption 中，fileName 从 link 文本获取
          const linkText = link.textContent || '';
          return {
            url: href,
            fileName: linkText,
            caption: figcaption?.textContent || '',
            fileSize: fileSize,
          };
        }
      }

      // 检查普通 a 标签是否指向文档文件（markdown [text](file.pdf) 会生成 a 标签）
      if (element.tagName === 'A') {
        const href = element.getAttribute('href') || '';
        if (isDocumentUrl(href)) {
          const textContent = element.textContent || '';
          const { fileName, caption } = parseDisplayText(textContent);
          return {
            url: href,
            fileName: fileName,
            caption: caption,
            fileSize: 0,
          };
        }
      }

      return undefined;
    },
  }
);

export const CustomFileBlock = createCustomFileBlock();
