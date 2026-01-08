import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import {
  useCreateBlockNote,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  FormattingToolbarController,
  FormattingToolbar,
  blockTypeSelectItems,
} from '@blocknote/react';
import { filterSuggestionItems } from '@blocknote/core/extensions';
import { zh } from '@blocknote/core/locales';
import '@blocknote/mantine/style.css';

// AI 相关导入
import {
  AIExtension,
  AIMenuController,
  AIToolbarButton,
  getAISlashMenuItems,
  ClientSideTransport,
} from '@blocknote/xl-ai';
import { zh as aiZh } from '@blocknote/xl-ai/locales';
import '@blocknote/xl-ai/style.css';

import { customSchema } from './customSchema';
import { ImageIcon, VideoIcon, AudioIcon, MindMapIcon } from './assets/icons';
import { AIConfig, createLanguageModel, validateAIConfig } from './ai';

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
  /**
   * AI 配置
   * 支持 OpenAI、DeepSeek、Claude 等提供商
   */
  aiConfig?: AIConfig;
}

export const BlockNoteEditorComponent: React.FC<BlockNoteEditorProps> = ({
  content = '',
  onChange,
  editable = true,
  className = '',
  authToken,
  uploadEndpoint = DEFAULT_UPLOAD_ENDPOINT,
  onOpenMediaPicker,
  aiConfig,
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

  // AI 是否启用
  const isAIEnabled = useMemo(() => {
    if (!aiConfig) return false;
    const validation = validateAIConfig(aiConfig);
    return validation.valid && aiConfig.enabled !== false;
  }, [aiConfig]);

  // 创建 AI Transport（使用 useMemo 缓存）
  const aiTransport = useMemo(() => {
    if (!isAIEnabled || !aiConfig) return null;
    try {
      const model = createLanguageModel(aiConfig);
      return new ClientSideTransport({ model });
    } catch (error) {
      console.error('[BlockNoteEditor] Failed to create AI transport:', error);
      return null;
    }
  }, [isAIEnabled, aiConfig]);

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
    // 中文本地化配置
    dictionary: {
      ...zh,
      ...(isAIEnabled ? { ai: aiZh } : {}),
      placeholders: {
        ...zh.placeholders,
        default: "输入文字或按 '/' 唤出命令菜单",
        heading: '标题',
        bulletListItem: '列表项',
        numberedListItem: '列表项',
        checkListItem: '待办事项',
      },
    },
    // AI 扩展配置
    extensions: aiTransport
      ? [
          AIExtension({
            transport: aiTransport,
          }),
        ]
      : [],
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

      // 需要排除的项目：默认媒体块和可折叠列表
      const excludedItems = [
        'image',
        'video',
        'audio',
        '图片',
        '视频',
        '音频',
        'toggle',
        'collapsible',
        '折叠',
        '可折叠',
        '折叠列表',
      ];

      // 过滤掉默认的媒体块和可折叠列表
      const filteredItems = defaultItems.filter((item: any) => {
        const title = item.title.toLowerCase();
        return !excludedItems.some(excluded => title.includes(excluded));
      });

      // 定义分组顺序
      const groupOrder = ['基础块', '标题', '列表', '媒体', '高级'];

      // 重新映射默认项目的分组名称为中文
      const groupMapping: Record<string, string> = {
        'basic blocks': '基础块',
        headings: '标题',
        lists: '列表',
        media: '媒体',
        advanced: '高级',
        other: '其他',
      };

      const remappedItems = filteredItems.map((item: any) => ({
        ...item,
        group: groupMapping[item.group?.toLowerCase()] || item.group || '其他',
      }));

      // 添加自定义媒体块和思维导图
      const customMediaItems = [
        {
          title: '图片',
          subtext: '插入图片',
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
          group: '媒体',
          icon: <ImageIcon size={18} />,
        },
        {
          title: '视频',
          subtext: '插入视频',
          onItemClick: () => {
            const currentBlock = editor.getTextCursorPosition().block;
            editor.insertBlocks(
              [{ type: 'customVideo' as const, props: { url: '', title: '' } }],
              currentBlock,
              'after'
            );
          },
          aliases: ['video', 'movie', 'shipin'],
          group: '媒体',
          icon: <VideoIcon size={18} />,
        },
        {
          title: '音频',
          subtext: '插入音频',
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
          group: '媒体',
          icon: <AudioIcon size={18} />,
        },
        {
          title: '思维导图',
          subtext: '插入思维导图',
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
          group: '高级',
          icon: <MindMapIcon size={18} />,
        },
      ];

      const allItems = [...remappedItems, ...customMediaItems];

      // 按分组顺序排序
      const sortedItems = allItems.sort((a: any, b: any) => {
        const aIndex = groupOrder.indexOf(a.group);
        const bIndex = groupOrder.indexOf(b.group);
        const aOrder = aIndex === -1 ? groupOrder.length : aIndex;
        const bOrder = bIndex === -1 ? groupOrder.length : bIndex;
        return aOrder - bOrder;
      });

      // 如果启用了 AI，添加 AI 菜单项
      if (isAIEnabled) {
        const aiItems = getAISlashMenuItems(editor);
        // 重新映射 AI 项目的分组名称
        const remappedAIItems = aiItems.map((item: any) => ({
          ...item,
          group: 'AI',
        }));
        allItems.push(...remappedAIItems);
      }

      // 根据查询过滤
      if (!query) return sortedItems;
      return filterSuggestionItems(sortedItems, query);
    },
    [editor, isAIEnabled]
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 修复 AI 输入框中文输入法 composing 状态下回车直接发送的问题
  useEffect(() => {
    if (!isAIEnabled) return;

    let isComposing = false;

    const handleCompositionStart = () => {
      isComposing = true;
    };

    const handleCompositionEnd = () => {
      isComposing = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 只处理 AI 输入框中的回车事件
      const target = e.target as HTMLElement;
      const isAIInput =
        target.closest('.bn-ai-menu') ||
        target.closest('[data-ai-menu]') ||
        target.closest('.mantine-TextInput-input');

      if (isAIInput && e.key === 'Enter' && isComposing) {
        e.stopPropagation();
      }
    };

    document.addEventListener('compositionstart', handleCompositionStart, true);
    document.addEventListener('compositionend', handleCompositionEnd, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener(
        'compositionstart',
        handleCompositionStart,
        true
      );
      document.removeEventListener(
        'compositionend',
        handleCompositionEnd,
        true
      );
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isAIEnabled]);

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

  // 获取过滤后的 blockTypeSelectItems（移除 toggle 相关项目）
  const getFilteredBlockTypeSelectItems = useCallback(() => {
    const defaultItems = blockTypeSelectItems(editor.dictionary);
    // 过滤掉 toggle/collapsible 相关的项目
    return defaultItems.filter((item: any) => {
      const name = (item.name || '').toLowerCase();
      const type = (item.type || '').toLowerCase();
      return (
        !name.includes('toggle') &&
        !name.includes('collapsible') &&
        !name.includes('折叠') &&
        !type.includes('toggle') &&
        !type.includes('collapsible')
      );
    });
  }, [editor]);

  return (
    <div className={`blocknote-wrapper ${className}`}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme="light"
        slashMenu={false}
        formattingToolbar={false}
        data-theming-css-variables-demo
      >
        {/* AI 命令菜单（启用 AI 时显示） */}
        {isAIEnabled && <AIMenuController />}

        {/* 自定义 SlashMenu */}
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={getCustomSlashMenuItems}
        />

        {/* 自定义 FormattingToolbar，启用 AI 时添加 AI 按钮 */}
        <FormattingToolbarController
          formattingToolbar={() => (
            <FormattingToolbar
              blockTypeSelectItems={getFilteredBlockTypeSelectItems()}
            >
              {isAIEnabled && <AIToolbarButton />}
            </FormattingToolbar>
          )}
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
