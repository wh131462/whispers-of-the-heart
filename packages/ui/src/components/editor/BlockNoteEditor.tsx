import React, { useEffect, useRef, useCallback, useState } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import {
  useCreateBlockNote,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
} from '@blocknote/react';
import '@blocknote/mantine/style.css';
import { customSchema } from './customSchema';

interface MediaPickerRequest {
  type: 'image' | 'video' | 'audio';
  blockId: string;
}

// 修复表格 markdown 输出：移除空表头行
const fixTableMarkdown = (markdown: string): string => {
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

// 从 blocks 中提取代码块内容，用于修复 markdown 中的空代码块
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractCodeBlocks = (
  blocks: any[]
): Array<{ language: string; code: string }> => {
  const codeBlocks: Array<{ language: string; code: string }> = [];

  const traverse = (block: any) => {
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

// 修复 markdown 中的空代码块
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fixCodeBlocksInMarkdown = (markdown: string, blocks: any[]): string => {
  const codeBlocks = extractCodeBlocks(blocks);

  if (codeBlocks.length === 0) return markdown;

  // 匹配 markdown 中的代码块
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let index = 0;

  return markdown.replace(codeBlockRegex, (match, _lang, content) => {
    // 如果内容为空或只有空白，用实际的代码替换
    if (!content.trim() && codeBlocks[index]) {
      const actualCode = codeBlocks[index];
      index++;
      return `\`\`\`${actualCode.language}\n${actualCode.code}\n\`\`\``;
    }
    index++;
    return match;
  });
};

// 从 blocks 中提取思维导图内容
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractMindMapBlocks = (blocks: any[]): Array<{ markdown: string }> => {
  const mindMapBlocks: Array<{ markdown: string }> = [];

  const traverse = (block: any) => {
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

// 修复 markdown 中缺失的思维导图块
// BlockNote 的 blocksToMarkdownLossy 可能不会正确输出自定义块
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fixMindMapBlocksInMarkdown = (
  markdown: string,
  blocks: any[]
): string => {
  const mindMapBlocks = extractMindMapBlocks(blocks);

  if (mindMapBlocks.length === 0) return markdown;

  // 检查 markdown 中是否已有 markmap 代码块
  const existingMarkmap = (markdown.match(/```markmap[\s\S]*?```/g) || [])
    .length;

  // 如果缺少思维导图块，添加它们
  if (existingMarkmap < mindMapBlocks.length) {
    let result = markdown;
    // 添加缺失的思维导图块
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

// 预处理 markdown：将 ```markmap 代码块转换为特殊的 HTML 格式
// 这样 BlockNote 的 parse 函数才能正确识别为 mindMap 块
const preprocessMarkdownForMindMap = (markdown: string): string => {
  // 匹配 ```markmap ... ``` 代码块
  const markmapRegex = /```markmap\n([\s\S]*?)```/g;

  return markdown.replace(markmapRegex, (_match, content) => {
    // 转换为特殊的 HTML 格式，MindMapBlock 的 parse 函数可以识别
    // 使用 data-mindmap 属性标记
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre data-mindmap="true"><code class="language-markmap">${escapedContent}</code></pre>`;
  });
};

// 获取 API 基础 URL (在模块级别计算一次)
const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    try {
      const env = (import.meta as any)?.env || {};
      if (env.VITE_API_URL) {
        return env.VITE_API_URL;
      }
    } catch {
      // ignore
    }
  }
  return 'http://localhost:7777';
})();

const DEFAULT_UPLOAD_ENDPOINT = `${API_BASE_URL}/api/v1/media/upload`;

export interface BlockNoteEditorProps {
  content?: string;
  onChange?: (markdown: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  authToken?: string | null;
  uploadEndpoint?: string;
  onInsertImage?: (url: string) => void;
  /**
   * 当需要打开媒体选择器时触发
   * @param type - 媒体类型 (image, video, audio)
   * @param onSelect - 选择完成后的回调,传入选中的媒体URL
   */
  onOpenMediaPicker?: (
    type: 'image' | 'video' | 'audio',
    onSelect: (url: string) => void
  ) => void;
}

export const BlockNoteEditorComponent: React.FC<BlockNoteEditorProps> = ({
  content = '',
  onChange,
  editable = true,
  className = '',
  authToken,
  uploadEndpoint = DEFAULT_UPLOAD_ENDPOINT,
  onOpenMediaPicker,
}) => {
  const isInitializedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authTokenRef = useRef(authToken);
  const uploadEndpointRef = useRef(uploadEndpoint);
  // 用于防止初始化时触发 onChange
  const isUpdatingFromPropRef = useRef(false);

  // MediaPicker 状态
  const [_mediaPickerRequest, setMediaPickerRequest] =
    useState<MediaPickerRequest | null>(null);

  // Update refs when props change
  useEffect(() => {
    authTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    uploadEndpointRef.current = uploadEndpoint;
  }, [uploadEndpoint]);

  // 使用 useCreateBlockNote hook 创建编辑器实例
  // 这个 hook 内部会处理 memoization，确保编辑器实例只创建一次
  const editor = useCreateBlockNote({
    schema: customSchema,
    uploadFile: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      if (authTokenRef.current) {
        headers['Authorization'] = `Bearer ${authTokenRef.current}`;
      }

      const response = await fetch(uploadEndpointRef.current, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.success && result.data?.url) {
        return result.data.url;
      }

      throw new Error('Invalid response');
    },
  });

  // 自定义 slash menu items - 替换默认的 image/video/audio 为自定义块
  const getCustomSlashMenuItems = useCallback(
    async (query: string) => {
      const defaultItems = getDefaultReactSlashMenuItems(editor);

      // 过滤掉默认的 image, video, audio
      const filteredItems = defaultItems.filter((item: any) => {
        const title = item.title.toLowerCase();
        return !['image', 'video', 'audio', '图片', '视频', '音频'].includes(
          title
        );
      });

      // 添加自定义媒体块和思维导图
      const customMediaItems = [
        {
          title: '图片',
          onItemClick: () => {
            const currentBlock = editor.getTextCursorPosition().block;
            editor.insertBlocks(
              [
                {
                  type: 'customImage' as const,
                  props: { url: '', caption: '' },
                },
              ],
              currentBlock,
              'after'
            );
          },
          aliases: ['image', 'img', 'picture', 'photo', 'tupian'],
          group: 'Media',
          icon: <span>🖼️</span>,
        },
        {
          title: '视频',
          onItemClick: () => {
            const currentBlock = editor.getTextCursorPosition().block;
            editor.insertBlocks(
              [{ type: 'customVideo' as const, props: { url: '', title: '' } }],
              currentBlock,
              'after'
            );
          },
          aliases: ['video', 'movie', 'shipin'],
          group: 'Media',
          icon: <span>🎬</span>,
        },
        {
          title: '音频',
          onItemClick: () => {
            const currentBlock = editor.getTextCursorPosition().block;
            editor.insertBlocks(
              [
                {
                  type: 'customAudio' as const,
                  props: { url: '', title: '', artist: '' },
                },
              ],
              currentBlock,
              'after'
            );
          },
          aliases: ['audio', 'music', 'sound', 'yinpin'],
          group: 'Media',
          icon: <span>🎵</span>,
        },
        {
          title: '思维导图',
          onItemClick: () => {
            const currentBlock = editor.getTextCursorPosition().block;
            editor.insertBlocks(
              [
                {
                  type: 'mindMap' as const,
                  props: {
                    markdown: '# 新建思维导图\n\n## 主题 1\n\n## 主题 2',
                  },
                },
              ],
              currentBlock,
              'after'
            );
          },
          aliases: ['mindmap', 'mind map', 'siwei', 'siweidaotu'],
          group: 'Advanced',
          icon: <span>🧠</span>,
        },
      ];

      const allItems = [...filteredItems, ...customMediaItems];

      // 根据查询过滤
      if (!query) return allItems;
      return allItems.filter(
        (item: any) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.aliases?.some((alias: string) =>
            alias.toLowerCase().includes(query.toLowerCase())
          )
      );
    },
    [editor]
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Initialize content once
  useEffect(() => {
    if (!editor || isInitializedRef.current) return;

    const initContent = async () => {
      // 设置标志，防止 replaceBlocks 触发的 onChange 被处理
      isUpdatingFromPropRef.current = true;

      try {
        if (content) {
          console.log('[BlockNoteEditor] Input markdown:', content);

          // 检查是否包含 markmap 代码块
          const hasMarkmap = /```markmap\n([\s\S]*?)```/.test(content);

          if (hasMarkmap) {
            // 预处理 markdown，将 ```markmap 转换为可识别的 HTML 格式
            const processedContent = preprocessMarkdownForMindMap(content);
            console.log(
              '[BlockNoteEditor] Processed content (HTML):',
              processedContent
            );
            // 使用 tryParseHTMLToBlocks 解析包含自定义块的 HTML
            const blocks = await editor.tryParseHTMLToBlocks(processedContent);
            console.log(
              '[BlockNoteEditor] Parsed blocks from HTML:',
              JSON.stringify(blocks, null, 2)
            );
            if (
              blocks.length > 0 &&
              !(
                blocks.length === 1 &&
                blocks[0].type === 'paragraph' &&
                blocks[0].content?.length === 0
              )
            ) {
              editor.replaceBlocks(editor.document, blocks);
            }
          } else {
            // 普通 markdown，直接解析
            const blocks = await editor.tryParseMarkdownToBlocks(content);
            console.log(
              '[BlockNoteEditor] Parsed blocks from Markdown:',
              JSON.stringify(blocks, null, 2)
            );
            if (blocks.length > 0) {
              editor.replaceBlocks(editor.document, blocks);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize content:', error);
      } finally {
        isInitializedRef.current = true;
        // 使用 Promise.resolve 确保在下一个微任务中重置标志
        Promise.resolve().then(() => {
          isUpdatingFromPropRef.current = false;
        });
      }
    };

    requestAnimationFrame(() => {
      initContent();
    });
  }, [editor, content]);

  // Handle content changes with debounce
  const handleChange = useCallback(() => {
    // 如果正在从 prop 更新内容，跳过 onChange
    if (isUpdatingFromPropRef.current) {
      console.log('[BlockNoteEditor] Skipping onChange during initialization');
      return;
    }

    if (!onChange) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const blocks = editor.document;
        // Debug: 查看 blocks 结构
        console.log(
          '[BlockNoteEditor] Current blocks:',
          JSON.stringify(blocks, null, 2)
        );
        let markdown = editor.blocksToMarkdownLossy(blocks);
        console.log('[BlockNoteEditor] Raw markdown:', markdown);

        // 修复空代码块问题（BlockNote 的 React 渲染时序问题）
        markdown = fixCodeBlocksInMarkdown(markdown, blocks);
        // 修复思维导图块问题
        markdown = fixMindMapBlocksInMarkdown(markdown, blocks);
        // 修复表格问题
        markdown = fixTableMarkdown(markdown);

        console.log('[BlockNoteEditor] Fixed markdown:', markdown);
        onChange(markdown);
      } catch (error) {
        console.error('Failed to convert to markdown:', error);
      }
    }, 300);
  }, [editor, onChange]);

  // 监听 MediaPicker 事件
  useEffect(() => {
    if (!editable || !onOpenMediaPicker) return;

    const handleMediaPickerEvent = (event: Event) => {
      const customEvent = event as CustomEvent<MediaPickerRequest>;
      const { type, blockId } = customEvent.detail;

      console.log('[BlockNoteEditor] MediaPicker event received:', {
        type,
        blockId,
      });

      // 记录请求信息
      setMediaPickerRequest({ type, blockId });

      // 调用父组件的 onOpenMediaPicker,传入选择完成的回调
      onOpenMediaPicker(type, (url: string) => {
        console.log('[BlockNoteEditor] MediaPicker selected:', {
          url,
          blockId,
        });

        // 查找并更新对应的 block
        const block = editor.document.find((b: any) => b.id === blockId);
        if (block) {
          editor.updateBlock(block, {
            props: { ...block.props, url },
          });
          console.log('[BlockNoteEditor] Block updated:', blockId);
        } else {
          console.warn('[BlockNoteEditor] Block not found:', blockId);
        }

        // 清除请求状态
        setMediaPickerRequest(null);
      });
    };

    window.addEventListener(
      'blocknote:openMediaPicker',
      handleMediaPickerEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        'blocknote:openMediaPicker',
        handleMediaPickerEvent as EventListener
      );
    };
  }, [editor, editable, onOpenMediaPicker]);

  return (
    <div className={`blocknote-wrapper ${className}`}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme="light"
        slashMenu={false}
        data-theming-css-variables-demo
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={getCustomSlashMenuItems}
        />
      </BlockNoteView>
      <style>{`
        .blocknote-wrapper {
          min-height: 400px;
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          overflow: visible;
          position: relative;
        }

        .blocknote-wrapper .bn-container {
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .blocknote-wrapper .bn-editor {
          padding: 1rem 1rem 1rem 3rem;
        }

        .blocknote-wrapper .bn-block-group {
          padding: 0;
        }

        .blocknote-wrapper .bn-side-menu {
          left: 0.5rem !important;
        }

        /* 移除代码块默认背景色 */
        .blocknote-wrapper .bn-block-content[data-content-type="codeBlock"] {
          background: transparent !important;
        }

        /* 思维导图块占满宽度 */
        .blocknote-wrapper .bn-block-content[data-content-type="mindMap"] {
          width: 100% !important;
          max-width: 100% !important;
        }

        .blocknote-wrapper .bn-block-content[data-content-type="mindMap"] > div {
          width: 100% !important;
          max-width: 100% !important;
        }

        /* 自定义媒体块占满宽度 */
        .blocknote-wrapper .bn-block-content[data-content-type="customImage"],
        .blocknote-wrapper .bn-block-content[data-content-type="customVideo"],
        .blocknote-wrapper .bn-block-content[data-content-type="customAudio"] {
          width: 100% !important;
          max-width: 100% !important;
        }

        .blocknote-wrapper table {
          border-collapse: collapse;
          width: 100%;
        }

        .blocknote-wrapper table tr:first-child {
          background: hsl(var(--muted) / 0.5);
          font-weight: 600;
        }

        .blocknote-wrapper table tr:first-child td {
          border-bottom: 2px solid hsl(var(--border));
        }

        .blocknote-wrapper table td {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem 0.75rem;
        }

        .blocknote-wrapper [data-theming-css-variables-demo] {
          --bn-colors-editor-background: hsl(var(--background));
          --bn-colors-editor-text: hsl(var(--foreground));
          --bn-colors-menu-background: hsl(var(--popover));
          --bn-colors-menu-text: hsl(var(--popover-foreground));
          --bn-colors-tooltip-background: hsl(var(--secondary));
          --bn-colors-tooltip-text: hsl(var(--secondary-foreground));
          --bn-colors-hovered-background: hsl(var(--accent));
          --bn-colors-hovered-text: hsl(var(--accent-foreground));
          --bn-colors-selected-background: hsl(var(--primary) / 0.1);
          --bn-colors-selected-text: hsl(var(--primary));
          --bn-colors-disabled-background: hsl(var(--muted));
          --bn-colors-disabled-text: hsl(var(--muted-foreground));
          --bn-colors-shadow: hsl(var(--border));
          --bn-colors-border: hsl(var(--border));
          --bn-colors-side-menu: hsl(var(--muted-foreground));
          --bn-colors-highlights-gray-background: hsl(var(--muted));
          --bn-colors-highlights-gray-text: hsl(var(--muted-foreground));
        }

        .dark .blocknote-wrapper [data-theming-css-variables-demo] {
          --bn-colors-editor-background: hsl(var(--background));
          --bn-colors-editor-text: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
};

export default BlockNoteEditorComponent;
