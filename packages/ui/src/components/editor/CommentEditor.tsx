import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { createPortal } from 'react-dom';
import { BlockNoteView } from '@blocknote/mantine';
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from '@blocknote/react';
import '@blocknote/mantine/style.css';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { customSchema } from './customSchema';

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

// 修复 markdown 中的空代码块（BlockNote React 渲染时序问题）
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

// 允许的斜杠菜单项类型 (排除默认的 image/video/audio,使用自定义块)
const ALLOWED_SLASH_ITEMS = [
  'Heading 1',
  'Heading 2',
  'Heading 3',
  'Heading 4',
  'Heading 5',
  'Heading 6',
  'Table',
  'Code Block',
  'Bullet List',
  'Numbered List',
  'Check List',
  '一级标题',
  '二级标题',
  '三级标题',
  '四级标题',
  '五级标题',
  '六级标题',
  '表格',
  '代码块',
  '无序列表',
  '有序列表',
  '待办列表',
];

export interface CommentEditorProps {
  content?: string;
  onChange?: (markdown: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: number;
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

export interface CommentEditorRef {
  clearContent: () => void;
  getContent: () => string;
}

export const CommentEditor = forwardRef<CommentEditorRef, CommentEditorProps>(
  (
    {
      content = '',
      onChange,
      onSubmit,
      className = '',
      disabled = false,
      minHeight = 120,
      onOpenMediaPicker,
    },
    ref
  ) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const isInitializedRef = useRef(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 用于防止初始化时触发 onChange
    const isUpdatingFromPropRef = useRef(false);

    // 使用 useCreateBlockNote hook 创建编辑器实例
    // 这个 hook 内部会处理 memoization，确保编辑器实例只创建一次
    const editor = useCreateBlockNote({
      schema: customSchema,
    });

    // 过滤斜杠菜单项并添加自定义媒体块
    const getFilteredSlashMenuItems = useCallback(
      async (query: string) => {
        const items = getDefaultReactSlashMenuItems(editor);

        // 过滤默认项:保留允许的,排除toggle和默认媒体块
        const filtered = items.filter((item: any) => {
          const title = item.title.toLowerCase();
          if (title.includes('toggle')) return false;
          if (
            ['image', 'video', 'audio', '图片', '视频', '音频'].includes(title)
          )
            return false;
          return ALLOWED_SLASH_ITEMS.some(
            allowed => title === allowed.toLowerCase()
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
                [
                  {
                    type: 'customVideo' as const,
                    props: { url: '', title: '' },
                  },
                ],
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

        const allItems = [...filtered, ...customMediaItems];

        // 根据查询过滤
        return query
          ? allItems.filter(
              (item: any) =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.aliases?.some((alias: string) =>
                  alias.toLowerCase().includes(query.toLowerCase())
                )
            )
          : allItems;
      },
      [editor]
    );

    // 暴露给父组件的方法
    useImperativeHandle(
      ref,
      () => ({
        clearContent: () => {
          try {
            const emptyBlock = [{ type: 'paragraph' as const }];
            editor.replaceBlocks(editor.document, emptyBlock);
            onChange?.('');
          } catch (error) {
            console.error('Failed to clear content:', error);
          }
        },
        getContent: () => {
          try {
            const blocks = editor.document;
            let markdown = editor.blocksToMarkdownLossy(blocks);
            // 修复空代码块问题
            markdown = fixCodeBlocksInMarkdown(markdown, blocks);
            // 修复思维导图块问题
            markdown = fixMindMapBlocksInMarkdown(markdown, blocks);
            // 修复表格问题
            return fixTableMarkdown(markdown);
          } catch (error) {
            console.error('Failed to get content:', error);
            return '';
          }
        },
      }),
      [editor, onChange]
    );

    // 清理定时器
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    // 初始化内容
    useEffect(() => {
      if (!editor || isInitializedRef.current) return;

      const initContent = () => {
        // 设置标志，防止 replaceBlocks 触发的 onChange 被处理
        isUpdatingFromPropRef.current = true;

        try {
          if (content) {
            console.log('[CommentEditor] Initializing content:', content);
            const blocks = editor.tryParseMarkdownToBlocks(content);
            console.log(
              '[CommentEditor] Parsed blocks:',
              JSON.stringify(blocks, null, 2)
            );
            if (blocks.length > 0) {
              editor.replaceBlocks(editor.document, blocks);
            }
          }
        } catch (error) {
          console.error('Failed to initialize comment content:', error);
        } finally {
          isInitializedRef.current = true;
          // 使用 Promise.resolve 确保在下一个微任务中重置标志
          Promise.resolve().then(() => {
            isUpdatingFromPropRef.current = false;
          });
        }
      };

      requestAnimationFrame(initContent);
    }, [editor, content]);

    // 处理内容变化
    const handleChange = useCallback(() => {
      // 如果正在从 prop 更新内容，跳过 onChange
      if (isUpdatingFromPropRef.current) {
        console.log('[CommentEditor] Skipping onChange during initialization');
        return;
      }

      if (!onChange) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        try {
          const blocks = editor.document;
          console.log(
            '[CommentEditor] Current blocks:',
            JSON.stringify(blocks, null, 2)
          );
          let markdown = editor.blocksToMarkdownLossy(blocks);
          console.log('[CommentEditor] Raw markdown:', markdown);
          // 修复空代码块问题（BlockNote React 渲染时序问题）
          markdown = fixCodeBlocksInMarkdown(markdown, blocks);
          // 修复思维导图块问题
          markdown = fixMindMapBlocksInMarkdown(markdown, blocks);
          // 修复表格问题
          markdown = fixTableMarkdown(markdown);
          console.log('[CommentEditor] Fixed markdown:', markdown);
          onChange(markdown);
        } catch (error) {
          console.error('Failed to convert comment to markdown:', error);
        }
      }, 200);
    }, [editor, onChange]);

    // 点击外部关闭表情选择器
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          emojiPickerRef.current &&
          !emojiPickerRef.current.contains(event.target as Node) &&
          emojiButtonRef.current &&
          !emojiButtonRef.current.contains(event.target as Node)
        ) {
          setShowEmojiPicker(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 处理表情选择
    const handleEmojiSelect = (emoji: { native: string }) => {
      if (!editor) return;

      try {
        editor.insertInlineContent([
          { type: 'text' as const, text: emoji.native, styles: {} },
        ]);
        handleChange();
      } catch (error) {
        console.error('Failed to insert emoji:', error);
      }

      setShowEmojiPicker(false);
    };

    // 插入代码块
    const insertCodeBlock = () => {
      if (!editor) return;

      try {
        const currentBlock = editor.getTextCursorPosition().block;
        editor.insertBlocks([{ type: 'codeBlock' }], currentBlock, 'after');
        handleChange();
      } catch (error) {
        console.error('Failed to insert code block:', error);
      }
    };

    // 处理键盘快捷键
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        onSubmit?.();
      }
    };

    // 监听 MediaPicker 事件
    useEffect(() => {
      if (disabled || !onOpenMediaPicker) return;

      const handleMediaPickerEvent = (event: Event) => {
        const customEvent = event as CustomEvent<{
          type: 'image' | 'video' | 'audio';
          blockId: string;
        }>;
        const { type, blockId } = customEvent.detail;

        console.log('[CommentEditor] MediaPicker event received:', {
          type,
          blockId,
        });

        // 调用父组件的 onOpenMediaPicker,传入选择完成的回调
        onOpenMediaPicker(type, (url: string) => {
          console.log('[CommentEditor] MediaPicker selected:', {
            url,
            blockId,
          });

          // 查找并更新对应的 block
          const block = editor.document.find((b: any) => b.id === blockId);
          if (block) {
            editor.updateBlock(block, {
              props: { ...block.props, url },
            });
            console.log('[CommentEditor] Block updated:', blockId);
            handleChange(); // 触发内容变化
          } else {
            console.warn('[CommentEditor] Block not found:', blockId);
          }
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
    }, [editor, disabled, onOpenMediaPicker, handleChange]);

    return (
      <div
        className={`comment-editor-wrapper ${className}`}
        onKeyDown={handleKeyDown}
      >
        {/* 工具栏 */}
        <div className="comment-editor-toolbar">
          <div className="toolbar-left">
            {/* 表情按钮 */}
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={() => {
                if (!showEmojiPicker && emojiButtonRef.current) {
                  const rect = emojiButtonRef.current.getBoundingClientRect();
                  setPickerPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX,
                  });
                }
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="toolbar-btn"
              title="插入表情"
              disabled={disabled}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>

            {/* 代码块按钮 */}
            <button
              type="button"
              onClick={insertCodeBlock}
              className="toolbar-btn"
              title="插入代码块"
              disabled={disabled}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
          </div>

          <div className="toolbar-right">
            <span className="toolbar-hint">Ctrl + Enter 发送</span>
          </div>
        </div>

        {/* 表情选择器 - 使用 Portal 渲染到 body */}
        {showEmojiPicker &&
          createPortal(
            <div
              ref={emojiPickerRef}
              className="emoji-picker-portal"
              style={{
                position: 'absolute',
                top: pickerPosition.top,
                left: pickerPosition.left,
                zIndex: 9999,
              }}
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                locale="zh"
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
                perLine={8}
              />
            </div>,
            document.body
          )}

        {/* 编辑器 - 不包裹 ErrorBoundary，让错误向上冒泡 */}
        <div className="comment-editor-content">
          <BlockNoteView
            editor={editor}
            editable={!disabled}
            theme="light"
            sideMenu={false}
            slashMenu={false}
            onChange={handleChange}
            data-theming-css-variables-demo
          >
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={getFilteredSlashMenuItems}
            />
          </BlockNoteView>
        </div>

        <style>{`
        .comment-editor-wrapper {
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          overflow: visible;
          background: hsl(var(--background));
          transition: border-color 0.2s;
          position: relative;
        }

        .comment-editor-wrapper .comment-editor-toolbar {
          border-radius: 0.5rem 0.5rem 0 0;
        }

        .comment-editor-wrapper .comment-editor-content {
          border-radius: 0 0 0.5rem 0.5rem;
          overflow: hidden;
        }

        .comment-editor-wrapper:focus-within {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.1);
        }

        .comment-editor-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.3);
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
        }

        .toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 0.375rem;
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          transition: all 0.15s;
        }

        .toolbar-btn:hover:not(:disabled) {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }

        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toolbar-hint {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
        }

        .comment-editor-content {
          min-height: ${minHeight}px;
        }

        .comment-editor-content .bn-container {
          border: none !important;
          border-radius: 0;
        }

        .comment-editor-content .bn-editor {
          padding: 0.75rem 1rem;
          min-height: ${minHeight - 20}px;
        }

        .comment-editor-content .bn-block-group {
          padding: 0;
        }

        .comment-editor-content [data-theming-css-variables-demo] {
          --bn-colors-editor-background: transparent;
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
        }

        .comment-editor-content .bn-side-menu {
          display: none;
        }

        /* 移除代码块默认背景色 */
        .comment-editor-content .bn-block-content[data-content-type="codeBlock"] {
          background: transparent !important;
        }

        .comment-editor-wrapper .bn-suggestion-menu {
          z-index: 9999 !important;
        }

        .comment-editor-content pre {
          background: hsl(var(--muted)) !important;
          border-radius: 0.375rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          overflow-x: auto;
        }

        .comment-editor-content table {
          border-collapse: collapse;
          width: 100%;
        }

        .comment-editor-content table tr:first-child {
          background: hsl(var(--muted) / 0.5);
          font-weight: 600;
        }

        .comment-editor-content table tr:first-child td {
          border-bottom: 2px solid hsl(var(--border));
        }

        .comment-editor-content table td {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem 0.75rem;
        }

        .dark .comment-editor-wrapper {
          background: hsl(var(--background));
        }

        .dark .comment-editor-toolbar {
          background: hsl(var(--muted) / 0.5);
        }
      `}</style>
        <style>{`
        .dark .emoji-picker-portal em-emoji-picker {
          --em-rgb-background: 30, 30, 30;
        }
      `}</style>
      </div>
    );
  }
);

CommentEditor.displayName = 'CommentEditor';

export default CommentEditor;
