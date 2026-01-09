import React from 'react';

interface FileTypeIconProps {
  extension: string;
  size?: number;
  className?: string;
}

// 文件类型颜色配置
const FILE_TYPE_COLORS: Record<string, { primary: string; secondary: string }> =
  {
    // 文档类
    pdf: { primary: '#e53935', secondary: '#ffcdd2' },
    doc: { primary: '#1976d2', secondary: '#bbdefb' },
    docx: { primary: '#1976d2', secondary: '#bbdefb' },
    xls: { primary: '#388e3c', secondary: '#c8e6c9' },
    xlsx: { primary: '#388e3c', secondary: '#c8e6c9' },
    ppt: { primary: '#f57c00', secondary: '#ffe0b2' },
    pptx: { primary: '#f57c00', secondary: '#ffe0b2' },
    txt: { primary: '#757575', secondary: '#e0e0e0' },
    md: { primary: '#424242', secondary: '#bdbdbd' },
    // 压缩包
    zip: { primary: '#ffc107', secondary: '#fff8e1' },
    rar: { primary: '#ffc107', secondary: '#fff8e1' },
    '7z': { primary: '#ffc107', secondary: '#fff8e1' },
    tar: { primary: '#ffc107', secondary: '#fff8e1' },
    gz: { primary: '#ffc107', secondary: '#fff8e1' },
    // 代码
    js: { primary: '#f7df1e', secondary: '#fffde7' },
    ts: { primary: '#3178c6', secondary: '#e3f2fd' },
    jsx: { primary: '#61dafb', secondary: '#e0f7fa' },
    tsx: { primary: '#61dafb', secondary: '#e0f7fa' },
    py: { primary: '#3776ab', secondary: '#e3f2fd' },
    java: { primary: '#b07219', secondary: '#fff3e0' },
    json: { primary: '#292929', secondary: '#f5f5f5' },
    html: { primary: '#e34f26', secondary: '#ffccbc' },
    css: { primary: '#1572b6', secondary: '#e1f5fe' },
    // 图片
    jpg: { primary: '#26a69a', secondary: '#e0f2f1' },
    jpeg: { primary: '#26a69a', secondary: '#e0f2f1' },
    png: { primary: '#26a69a', secondary: '#e0f2f1' },
    gif: { primary: '#26a69a', secondary: '#e0f2f1' },
    webp: { primary: '#26a69a', secondary: '#e0f2f1' },
    svg: { primary: '#ff9800', secondary: '#fff3e0' },
    // 默认
    default: { primary: '#9e9e9e', secondary: '#f5f5f5' },
  };

// 获取文件类型颜色
const getColors = (ext: string) =>
  FILE_TYPE_COLORS[ext] || FILE_TYPE_COLORS.default;

// PDF 图标
const PdfIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
}> = ({ size, colors }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="6"
      fontWeight="bold"
      fill={colors.primary}
      fontFamily="system-ui, sans-serif"
    >
      PDF
    </text>
  </svg>
);

// Word 文档图标
const WordIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
}> = ({ size, colors }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="5"
      fontWeight="bold"
      fill={colors.primary}
      fontFamily="system-ui, sans-serif"
    >
      DOC
    </text>
  </svg>
);

// Excel 图标
const ExcelIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
}> = ({ size, colors }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
    {/* 表格网格 */}
    <rect
      x="7"
      y="12"
      width="10"
      height="7"
      rx="0.5"
      stroke={colors.primary}
      strokeWidth="1"
      fill="none"
    />
    <line
      x1="7"
      y1="15"
      x2="17"
      y2="15"
      stroke={colors.primary}
      strokeWidth="0.8"
    />
    <line
      x1="11"
      y1="12"
      x2="11"
      y2="19"
      stroke={colors.primary}
      strokeWidth="0.8"
    />
  </svg>
);

// PPT 图标
const PptIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
}> = ({ size, colors }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="5"
      fontWeight="bold"
      fill={colors.primary}
      fontFamily="system-ui, sans-serif"
    >
      PPT
    </text>
  </svg>
);

// 文本文件图标
const TextIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
}> = ({ size, colors }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
    {/* 文本行 */}
    <line
      x1="7"
      y1="12"
      x2="17"
      y2="12"
      stroke={colors.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="7"
      y1="15"
      x2="14"
      y2="15"
      stroke={colors.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="7"
      y1="18"
      x2="12"
      y2="18"
      stroke={colors.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// 压缩包图标
const ArchiveIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
}> = ({ size, colors }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
    {/* 拉链效果 */}
    <rect x="10" y="10" width="4" height="2" fill={colors.primary} rx="0.5" />
    <rect x="10" y="13" width="4" height="2" fill={colors.primary} rx="0.5" />
    <rect x="10" y="16" width="4" height="3" fill={colors.primary} rx="0.5" />
    <circle cx="12" cy="17.5" r="0.8" fill={colors.secondary} />
  </svg>
);

// 代码文件图标
const CodeIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
  label?: string;
}> = ({ size, colors, label }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
    {/* 代码符号 */}
    <path
      d="M9 13l-2 2 2 2"
      stroke={colors.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M15 13l2 2-2 2"
      stroke={colors.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {label && (
      <text
        x="12"
        y="12"
        textAnchor="middle"
        fontSize="4"
        fontWeight="bold"
        fill={colors.primary}
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    )}
  </svg>
);

// JSON 图标
const JsonIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
}> = ({ size, colors }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="5"
      fontWeight="bold"
      fill={colors.primary}
      fontFamily="system-ui, sans-serif"
    >
      {'{ }'}
    </text>
  </svg>
);

// 图片文件图标
const ImageIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
}> = ({ size, colors }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
    {/* 图片符号 */}
    <rect
      x="7"
      y="11"
      width="10"
      height="8"
      rx="1"
      stroke={colors.primary}
      strokeWidth="1.2"
      fill="none"
    />
    <circle cx="10" cy="13.5" r="1.5" fill={colors.primary} />
    <path
      d="M7 17l3-2.5 2 1.5 3-3 2 2"
      stroke={colors.primary}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 默认文件图标
const DefaultFileIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
}> = ({ size, colors }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

// Markdown 图标
const MarkdownIcon: React.FC<{
  size: number;
  colors: { primary: string; secondary: string };
}> = ({ size, colors }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      fill={colors.secondary}
    />
    <path d="M14 2v6h6" fill={colors.secondary} />
    <path d="M14 2l6 6h-6V2z" fill={colors.primary} opacity="0.3" />
    <path
      d="M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z"
      stroke={colors.primary}
      strokeWidth="1.5"
      fill="none"
    />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="5"
      fontWeight="bold"
      fill={colors.primary}
      fontFamily="system-ui, sans-serif"
    >
      MD
    </text>
  </svg>
);

// 主组件
export const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  extension,
  size = 24,
  className,
}) => {
  const ext = extension.toLowerCase();
  const colors = getColors(ext);

  const iconProps = { size, colors };

  const renderIcon = () => {
    switch (ext) {
      case 'pdf':
        return <PdfIcon {...iconProps} />;
      case 'doc':
      case 'docx':
        return <WordIcon {...iconProps} />;
      case 'xls':
      case 'xlsx':
        return <ExcelIcon {...iconProps} />;
      case 'ppt':
      case 'pptx':
        return <PptIcon {...iconProps} />;
      case 'txt':
        return <TextIcon {...iconProps} />;
      case 'md':
        return <MarkdownIcon {...iconProps} />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <ArchiveIcon {...iconProps} />;
      case 'js':
        return <CodeIcon {...iconProps} label="JS" />;
      case 'ts':
        return <CodeIcon {...iconProps} label="TS" />;
      case 'jsx':
      case 'tsx':
        return <CodeIcon {...iconProps} label="⚛" />;
      case 'py':
        return <CodeIcon {...iconProps} label="PY" />;
      case 'java':
        return <CodeIcon {...iconProps} label="☕" />;
      case 'html':
        return <CodeIcon {...iconProps} label="&lt;/&gt;" />;
      case 'css':
        return <CodeIcon {...iconProps} label="#" />;
      case 'json':
        return <JsonIcon {...iconProps} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        return <ImageIcon {...iconProps} />;
      default:
        return <DefaultFileIcon {...iconProps} />;
    }
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {renderIcon()}
    </span>
  );
};

export default FileTypeIcon;
