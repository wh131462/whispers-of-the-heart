/**
 * InlineImageBlock - 内联图片组件
 * 用于在表格单元格等内联内容区域显示图片
 */
import React, { useState, useEffect } from 'react';
import { createReactInlineContentSpec } from '@blocknote/react';

interface InlineImageProps {
  url: string;
  alt?: string;
  width?: number;
}

/**
 * 内联图片渲染组件
 */
const InlineImageRenderer: React.FC<{
  inlineContent: {
    type: 'inlineImage';
    props: InlineImageProps;
  };
}> = ({ inlineContent }) => {
  const { url, alt, width } = inlineContent.props;
  const [displayUrl, setDisplayUrl] = useState<string>(url);
  const [imageError, setImageError] = useState(false);

  // 处理图片加载错误
  const handleImageError = () => {
    // eslint-disable-next-line no-console
    console.warn('内联图片加载失败:', url);
    setImageError(true);
  };

  // 当URL变化时，重置displayUrl
  useEffect(() => {
    setDisplayUrl(url);
    setImageError(false);
  }, [url]);

  // 处理双击预览
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 在新窗口中打开图片
    window.open(displayUrl, '_blank');
  };

  if (imageError) {
    return (
      <span
        className="inline-flex items-center justify-center bg-gray-100 rounded px-2 py-1 text-gray-500 text-xs"
        style={{ verticalAlign: 'middle' }}
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        图片加载失败
      </span>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={alt || ''}
      className="inline-block rounded cursor-pointer hover:opacity-90 transition-opacity"
      style={{
        maxWidth: width ? `${width}px` : '200px',
        maxHeight: '150px',
        verticalAlign: 'middle',
        objectFit: 'contain',
      }}
      draggable={false}
      onError={handleImageError}
      onDoubleClick={handleDoubleClick}
      title="双击预览图片"
    />
  );
};

/**
 * 创建内联图片的 InlineContentSpec
 * 可以在表格单元格等支持内联内容的地方使用
 */
export const InlineImage = createReactInlineContentSpec(
  {
    type: 'inlineImage',
    propSchema: {
      url: {
        default: '',
      },
      alt: {
        default: '',
      },
      width: {
        default: 0,
        type: 'number',
      },
    },
    content: 'none',
  } as const,
  {
    render: props => (
      <InlineImageRenderer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inlineContent={props.inlineContent as any}
      />
    ),
  }
);

export default InlineImage;
