/**
 * Markdown 处理工具函数
 * 用于修复 BlockNote 输出的 Markdown 问题
 */

import type { MediaBlockInfo, CodeBlockInfo, MindMapBlockInfo } from './types';
import { VIDEO_EXTENSIONS, AUDIO_EXTENSIONS } from './config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = any;

/**
 * 修复表格 markdown 输出：移除空表头行
 */
export const fixTableMarkdown = (markdown: string): string => {
  const tableRegex = /(\|[^\n]*\|)\n(\|[\s\-:]+\|)\n((?:\|[^\n]*\|\n?)+)/g;

  return markdown.replace(
    tableRegex,
    (match, headerRow, separatorRow, dataRows) => {
      const headerCells = headerRow.split('|').slice(1, -1);
      const isEmptyHeader = headerCells.every(
        (cell: string) => cell.trim() === ''
      );

      if (isEmptyHeader) {
        const dataLines = dataRows.trim().split('\n');
        if (dataLines.length > 0) {
          const newHeader = dataLines[0];
          const remainingData = dataLines.slice(1).join('\n');
          if (remainingData) {
            return `${newHeader}\n${separatorRow}\n${remainingData}\n`;
          } else {
            return `${newHeader}\n${separatorRow}\n`;
          }
        }
      }

      return match;
    }
  );
};

/**
 * 从 blocks 中提取代码块内容
 */
export const extractCodeBlocks = (blocks: Block[]): CodeBlockInfo[] => {
  const codeBlocks: CodeBlockInfo[] = [];

  const traverse = (block: Block) => {
    if (block.type === 'codeBlock' && block.props) {
      codeBlocks.push({
        language: block.props.language || 'javascript',
        code: block.props.code || '',
      });
    }
    if (block.children) {
      block.children.forEach(traverse);
    }
  };

  blocks.forEach(traverse);
  return codeBlocks;
};

/**
 * 修复 markdown 中的空代码块
 */
export const fixCodeBlocksInMarkdown = (
  markdown: string,
  blocks: Block[]
): string => {
  const codeBlocks = extractCodeBlocks(blocks);

  if (codeBlocks.length === 0) return markdown;

  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let index = 0;

  return markdown.replace(codeBlockRegex, (match, _lang, content) => {
    if (!content.trim() && codeBlocks[index]) {
      const actualCode = codeBlocks[index];
      index++;
      return `\`\`\`${actualCode.language}\n${actualCode.code}\n\`\`\``;
    }
    index++;
    return match;
  });
};

/**
 * 从 blocks 中提取思维导图内容
 */
export const extractMindMapBlocks = (blocks: Block[]): MindMapBlockInfo[] => {
  const mindMapBlocks: MindMapBlockInfo[] = [];

  const traverse = (block: Block) => {
    if (block.type === 'mindMap' && block.props) {
      mindMapBlocks.push({
        markdown: block.props.markdown || '',
      });
    }
    if (block.children) {
      block.children.forEach(traverse);
    }
  };

  blocks.forEach(traverse);
  return mindMapBlocks;
};

/**
 * 修复 markdown 中缺失的思维导图块
 */
export const fixMindMapBlocksInMarkdown = (
  markdown: string,
  blocks: Block[]
): string => {
  const mindMapBlocks = extractMindMapBlocks(blocks);

  if (mindMapBlocks.length === 0) return markdown;

  const existingMarkmap = (markdown.match(/```markmap[\s\S]*?```/g) || [])
    .length;

  if (existingMarkmap < mindMapBlocks.length) {
    let result = markdown;
    for (let i = existingMarkmap; i < mindMapBlocks.length; i++) {
      const mindmap = mindMapBlocks[i];
      if (mindmap.markdown) {
        result += `\n\n\`\`\`markmap\n${mindmap.markdown}\n\`\`\``;
      }
    }
    return result;
  }

  return markdown;
};

/**
 * 从 blocks 中提取媒体块内容
 */
export const extractMediaBlocks = (blocks: Block[]): MediaBlockInfo[] => {
  const mediaBlocks: MediaBlockInfo[] = [];

  // 类型映射：将可能的别名映射到标准类型
  const typeMap: Record<string, MediaBlockInfo['type']> = {
    customImage: 'customImage',
    customVideo: 'customVideo',
    customAudio: 'customAudio',
    customFile: 'customFile',
    image: 'customImage',
    video: 'customVideo',
    audio: 'customAudio',
    file: 'customFile',
  };

  const traverse = (block: Block) => {
    const mappedType = typeMap[block.type];
    if (mappedType && block.props?.url) {
      mediaBlocks.push({
        type: mappedType,
        url: block.props.url || '',
        fileName: block.props.fileName || '',
        title: block.props.title || '',
        caption: block.props.caption || '',
        width: block.props.width,
        align: block.props.align,
        fileSize: block.props.fileSize,
      });
    }
    if (block.children) {
      block.children.forEach(traverse);
    }
  };

  blocks.forEach(traverse);
  return mediaBlocks;
};

/**
 * 清理错误的媒体链接格式
 */
const cleanInvalidMediaLinks = (
  markdown: string,
  mediaBlocks: MediaBlockInfo[]
): string => {
  let result = markdown;

  // 清理错误的视频/音频链接格式
  for (const ext of [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS]) {
    const escapedExt = ext.replace('.', '\\.');
    // 匹配 [任意文本](xxx.ext) 格式的链接
    const linkRegex = new RegExp(
      `\\[([^\\]]*)\\]\\(([^)]*${escapedExt})\\)`,
      'gi'
    );
    result = result.replace(linkRegex, '');
    // 匹配 ![任意文本](xxx.ext) 格式的图片
    const imgRegex = new RegExp(
      `!\\[([^\\]]*)\\]\\(([^)]*${escapedExt})\\)`,
      'gi'
    );
    result = result.replace(imgRegex, '');
    // 匹配 !(xxx.ext) 格式
    const bangParenRegex = new RegExp(`!\\(([^)]*${escapedExt})\\)`, 'gi');
    result = result.replace(bangParenRegex, '');
  }

  // 清理文件块中被错误解析的链接格式
  for (const media of mediaBlocks) {
    if (media.type === 'customFile') {
      const urlEscaped = media.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const linkRegex = new RegExp(`\\[([^\\]]*)\\]\\(${urlEscaped}\\)`, 'gi');
      result = result.replace(linkRegex, '');
    }
  }

  // 清理不完整的媒体语法
  result = result.replace(/^!\s*$/gm, '');
  result = result.replace(/!\(\)/g, '');
  result = result.replace(/!\[\](?!\()/g, '');

  return result;
};

/**
 * 清理音视频块的文本被错误输出的情况
 */
const cleanMediaTextOutput = (
  markdown: string,
  mediaBlocks: MediaBlockInfo[]
): string => {
  let result = markdown;

  for (const media of mediaBlocks) {
    if (media.type === 'customVideo' || media.type === 'customAudio') {
      if (media.title && media.title.trim()) {
        const titleEscaped = media.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const titleRegex = new RegExp(`(^|\\n)${titleEscaped}\\s*(\\n|$)`, 'g');
        result = result.replace(titleRegex, '$1');
      }
      if (media.caption && media.caption.trim()) {
        const captionEscaped = media.caption.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );
        const captionRegex = new RegExp(
          `(^|\\n)${captionEscaped}\\s*(\\n|$)`,
          'g'
        );
        result = result.replace(captionRegex, '$1');
      }
      if (media.title && media.caption) {
        const combinedText = `${media.title}|${media.caption}`;
        const combinedEscaped = combinedText.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );
        const combinedRegex = new RegExp(
          `(^|\\n)${combinedEscaped}\\s*(\\n|$)`,
          'g'
        );
        result = result.replace(combinedRegex, '$1');
      }
    }
  }

  return result;
};

/**
 * 生成媒体块的 markdown/HTML
 */
const generateMediaMarkdown = (media: MediaBlockInfo): string => {
  if (media.type === 'customImage') {
    return `\n\n![${media.caption || '图片'}](${media.url})`;
  }

  if (media.type === 'customVideo') {
    const displayText = media.caption
      ? `${media.title || ''}|${media.caption}`
      : media.title || '';
    return `\n\n<video src="${media.url}" controls>${displayText}</video>`;
  }

  if (media.type === 'customAudio') {
    const displayText = media.caption
      ? `${media.title || ''}|${media.caption}`
      : media.title || '';
    return `\n\n<audio src="${media.url}" controls>${displayText}</audio>`;
  }

  if (media.type === 'customFile') {
    const fileSize = media.fileSize || 0;
    let displayFileName = media.fileName || '';
    if (!displayFileName) {
      try {
        const pathname = media.url.split('?')[0];
        const segments = pathname.split('/');
        displayFileName =
          decodeURIComponent(segments[segments.length - 1]) || '文件';
      } catch {
        displayFileName = '文件';
      }
    }
    const displayText = media.caption
      ? `${displayFileName}|${media.caption}`
      : displayFileName;
    return `\n\n<figure data-file-block="true" data-file-size="${fileSize}"><a href="${media.url}">${displayText}</a></figure>`;
  }

  return '';
};

/**
 * 检查媒体 URL 是否已存在于 markdown 中
 */
const isMediaUrlInMarkdown = (markdown: string, url: string): boolean => {
  const urlEscaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    new RegExp(`!\\[.*?\\]\\(${urlEscaped}\\)`).test(markdown) ||
    new RegExp(`<img[^>]*src=["']${urlEscaped}["']`).test(markdown) ||
    new RegExp(`<video[^>]*src=["']${urlEscaped}["']`).test(markdown) ||
    new RegExp(`<audio[^>]*src=["']${urlEscaped}["']`).test(markdown) ||
    new RegExp(
      `<figure[^>]*data-file-block[^>]*>[\\s\\S]*?href=["']${urlEscaped}["']`
    ).test(markdown) ||
    new RegExp(`<a[^>]*href=["']${urlEscaped}["']`).test(markdown)
  );
};

/**
 * 修复 markdown 中缺失的媒体块
 * @param cleanInvalidLinks - 是否清理无效的媒体链接格式（BlockNoteEditor 需要，CommentEditor 不需要）
 */
export const fixMediaBlocksInMarkdown = (
  markdown: string,
  blocks: Block[],
  cleanInvalidLinks = true
): string => {
  const mediaBlocks = extractMediaBlocks(blocks);

  if (mediaBlocks.length === 0) return markdown;

  let result = markdown;

  // 清理错误的链接格式（可选）
  if (cleanInvalidLinks) {
    result = cleanInvalidMediaLinks(result, mediaBlocks);
  } else {
    // CommentEditor 简化版：只清理文件块的链接
    for (const media of mediaBlocks) {
      if (media.type === 'customFile') {
        const urlEscaped = media.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const linkRegex = new RegExp(
          `\\[([^\\]]*)\\]\\(${urlEscaped}\\)`,
          'gi'
        );
        result = result.replace(linkRegex, '');
      }
    }
  }

  // 清理音视频文本输出
  result = cleanMediaTextOutput(result, mediaBlocks);

  // 清理多余空行
  result = result.replace(/\n{3,}/g, '\n\n').trim();

  // 添加缺失的媒体块
  for (const media of mediaBlocks) {
    if (!isMediaUrlInMarkdown(result, media.url)) {
      result += generateMediaMarkdown(media);
    }
  }

  return result;
};

/**
 * 预处理 markdown：将 ```markmap 代码块转换为可识别的 HTML 格式
 */
export const preprocessMarkdownForMindMap = (markdown: string): string => {
  const markmapRegex = /```markmap\n([\s\S]*?)```/g;

  return markdown.replace(markmapRegex, (_match, content) => {
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre data-mindmap="true"><code class="language-markmap">${escapedContent}</code></pre>`;
  });
};

/**
 * 应用所有 markdown 修复
 */
export const applyAllMarkdownFixes = (
  markdown: string,
  blocks: Block[],
  cleanInvalidLinks = true
): string => {
  let result = markdown;
  result = fixCodeBlocksInMarkdown(result, blocks);
  result = fixMindMapBlocksInMarkdown(result, blocks);
  result = fixMediaBlocksInMarkdown(result, blocks, cleanInvalidLinks);
  result = fixTableMarkdown(result);
  return result;
};
