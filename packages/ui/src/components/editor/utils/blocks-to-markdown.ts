/**
 * 自定义 blocks → markdown 转换器
 *
 * 替代 editor.blocksToMarkdownLossy() + applyAllMarkdownFixes() 的后处理模式。
 * 对默认块委托给 blocksToMarkdownLossy()，对自定义块直接从 props 生成 markdown。
 */

import { fixTableMarkdown } from './markdown-utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Editor = any;

/** 需要特殊处理的自定义块类型 */
const CUSTOM_BLOCK_TYPES = new Set([
  'codeBlock',
  'mindMap',
  'customImage',
  'customVideo',
  'customAudio',
  'customFile',
  'image',
  'video',
  'audio',
  'file',
  'mathBlock',
  'inlineMathBlock',
]);

/** 判断是否为自定义块 */
function isCustomBlock(block: Block): boolean {
  return CUSTOM_BLOCK_TYPES.has(block.type);
}

/** 从 URL 提取文件名 */
function getFileNameFromUrl(url: string): string {
  try {
    const pathname = url.split('?')[0];
    const segments = pathname.split('/');
    return decodeURIComponent(segments[segments.length - 1]) || '文件';
  } catch {
    return '文件';
  }
}

/** 将单个自定义块转换为 markdown */
function customBlockToMarkdown(block: Block): string {
  const props = block.props || {};

  switch (block.type) {
    case 'codeBlock':
      return `\`\`\`${props.language || ''}\n${props.code || ''}\n\`\`\``;

    case 'mindMap':
      return `\`\`\`markmap\n${props.markdown || ''}\n\`\`\``;

    case 'customImage':
    case 'image':
      if (!props.url) return '';
      return `![${props.caption || ''}](${props.url})`;

    case 'customVideo':
    case 'video': {
      if (!props.url) return '';
      const videoText = props.caption
        ? `${props.title || ''}|${props.caption}`
        : props.title || '';
      return `<video src="${props.url}" controls>${videoText}</video>`;
    }

    case 'customAudio':
    case 'audio': {
      if (!props.url) return '';
      const audioText = props.caption
        ? `${props.title || ''}|${props.caption}`
        : props.title || '';
      return `<audio src="${props.url}" controls>${audioText}</audio>`;
    }

    case 'customFile':
    case 'file': {
      if (!props.url) return '';
      const fileSize = props.fileSize || 0;
      const fileName = props.fileName || getFileNameFromUrl(props.url);
      const fileText = props.caption
        ? `${fileName}|${props.caption}`
        : fileName;
      return `<figure data-file-block="true" data-file-size="${fileSize}"><a href="${props.url}">${fileText}</a></figure>`;
    }

    case 'mathBlock':
      return `$$\n${props.formula || ''}\n$$`;

    case 'inlineMathBlock':
      return `$${props.formula || ''}$`;

    default:
      return '';
  }
}

/**
 * 将 BlockNote blocks 转换为 markdown。
 *
 * - 默认块（paragraph, heading, list, table 等）委托给 editor.blocksToMarkdownLossy()
 * - 自定义块（code, mindMap, media, math 等）直接从 block props 生成 markdown
 */
export function blocksToMarkdown(editor: Editor, blocks: Block[]): string {
  const parts: string[] = [];
  let defaultBlockBuffer: Block[] = [];

  const flushDefaultBlocks = () => {
    if (defaultBlockBuffer.length === 0) return;

    let md: string = editor.blocksToMarkdownLossy(defaultBlockBuffer);
    md = fixTableMarkdown(md);
    const trimmed = md.trim();
    if (trimmed) {
      parts.push(trimmed);
    }
    defaultBlockBuffer = [];
  };

  for (const block of blocks) {
    if (isCustomBlock(block)) {
      flushDefaultBlocks();
      const md = customBlockToMarkdown(block);
      if (md) {
        parts.push(md);
      }
    } else {
      defaultBlockBuffer.push(block);
    }
  }

  flushDefaultBlocks();

  return parts.join('\n\n');
}
