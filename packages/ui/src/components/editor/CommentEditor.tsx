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
  FormattingToolbarController,
  FormattingToolbar,
  blockTypeSelectItems,
} from '@blocknote/react';
import { filterSuggestionItems } from '@blocknote/core/extensions';
import { zh } from '@blocknote/core/locales';
import '@blocknote/mantine/style.css';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { customSchema } from './customSchema';
import {
  ImageIcon,
  VideoIcon,
  AudioIcon,
  MindMapIcon,
  MathIcon,
  QuoteIcon,
} from './assets/icons';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks: any[]
): Array<{ language: string; code: string }> => {
  const codeBlocks: Array<{ language: string; code: string }> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // 中文本地化配置
      dictionary: {
        ...zh,
        placeholders: {
          ...zh.placeholders,
          default: "输入文字或按 '/' 唤出命令菜单",
          heading: '标题',
          bulletListItem: '列表项',
          numberedListItem: '列表项',
          checkListItem: '待办事项',
        },
      },
    });

    // 过滤斜杠菜单项并添加自定义媒体块
    const getFilteredSlashMenuItems = useCallback(
      async (query: string) => {
        const items = getDefaultReactSlashMenuItems(editor);

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

        // 过滤默认项:保留允许的,排除toggle和默认媒体块
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered = items.filter((item: any) => {
          const title = item.title.toLowerCase();
          if (excludedItems.some(excluded => title.includes(excluded)))
            return false;
          return ALLOWED_SLASH_ITEMS.some(
            allowed => title === allowed.toLowerCase()
          );
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const remappedItems = filtered.map((item: any) => ({
          ...item,
          group:
            groupMapping[item.group?.toLowerCase()] || item.group || '其他',
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
          {
            title: '数学公式',
            subtext: '插入 LaTeX 数学公式',
            onItemClick: () => {
              const currentBlock = editor.getTextCursorPosition().block;
              editor.insertBlocks(
                [
                  {
                    type: 'mathBlock' as const,
                    props: { formula: '' },
                  },
                ],
                currentBlock,
                'after'
              );
            },
            aliases: [
              'math',
              'formula',
              'equation',
              'latex',
              'shuxue',
              'gongshi',
            ],
            group: '高级',
            icon: <MathIcon size={18} />,
          },
          {
            title: '引用',
            subtext: '插入引用块',
            onItemClick: () => {
              const currentBlock = editor.getTextCursorPosition().block;
              editor.insertBlocks(
                [
                  {
                    type: 'quote' as const,
                  },
                ],
                currentBlock,
                'after'
              );
            },
            aliases: ['quote', 'blockquote', 'yinyong', 'cite'],
            group: '基础块',
            icon: <QuoteIcon size={18} />,
          },
        ];

        const allItems = [...remappedItems, ...customMediaItems];

        // 按分组顺序排序
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sortedItems = allItems.sort((a: any, b: any) => {
          const aIndex = groupOrder.indexOf(a.group);
          const bIndex = groupOrder.indexOf(b.group);
          const aOrder = aIndex === -1 ? groupOrder.length : aIndex;
          const bOrder = bIndex === -1 ? groupOrder.length : bIndex;
          return aOrder - bOrder;
        });

        // 根据查询过滤
        if (!query) return sortedItems;
        return filterSuggestionItems(sortedItems, query);
      },
      [editor]
    );

    // 获取过滤后的 blockTypeSelectItems（移除 toggle 相关项目）
    const getFilteredBlockTypeSelectItems = useCallback(() => {
      const defaultItems = blockTypeSelectItems(editor.dictionary);
      // 过滤掉 toggle/collapsible 相关的项目
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line no-console
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
            // eslint-disable-next-line no-console
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
            // eslint-disable-next-line no-console
            console.log('[CommentEditor] Initializing content:', content);
            const blocks = editor.tryParseMarkdownToBlocks(content);
            // eslint-disable-next-line no-console
            console.log(
              '[CommentEditor] Parsed blocks:',
              JSON.stringify(blocks, null, 2)
            );
            if (blocks.length > 0) {
              editor.replaceBlocks(editor.document, blocks);
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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
          // eslint-disable-next-line no-console
          console.log(
            '[CommentEditor] Current blocks:',
            JSON.stringify(blocks, null, 2)
          );
          let markdown = editor.blocksToMarkdownLossy(blocks);
          // eslint-disable-next-line no-console
          console.log('[CommentEditor] Raw markdown:', markdown);
          // 修复空代码块问题（BlockNote React 渲染时序问题）
          markdown = fixCodeBlocksInMarkdown(markdown, blocks);
          // 修复思维导图块问题
          markdown = fixMindMapBlocksInMarkdown(markdown, blocks);
          // 修复表格问题
          markdown = fixTableMarkdown(markdown);
          // eslint-disable-next-line no-console
          console.log('[CommentEditor] Fixed markdown:', markdown);
          onChange(markdown);
        } catch (error) {
          // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.error('Failed to insert emoji:', error);
      }

      setShowEmojiPicker(false);
    };

    // 插入代码块
    const insertCodeBlock = () => {
      if (!editor) return;

      try {
        const currentBlock = editor.getTextCursorPosition().block;
        const insertedBlocks = editor.insertBlocks(
          [{ type: 'codeBlock' }],
          currentBlock,
          'after'
        );
        if (insertedBlocks && insertedBlocks.length > 0) {
          editor.setTextCursorPosition(insertedBlocks[0], 'start');
        }
        editor.focus();
        handleChange();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to insert code block:', error);
      }
    };

    // 切换粗体
    const toggleBold = () => {
      if (!editor) return;
      editor.toggleStyles({ bold: true });
    };

    // 切换斜体
    const toggleItalic = () => {
      if (!editor) return;
      editor.toggleStyles({ italic: true });
    };

    // 切换删除线
    const toggleStrike = () => {
      if (!editor) return;
      editor.toggleStyles({ strike: true });
    };

    // 插入图片块
    const insertImage = () => {
      if (!editor) return;
      try {
        const currentBlock = editor.getTextCursorPosition().block;
        const insertedBlocks = editor.insertBlocks(
          [{ type: 'customImage' as const, props: { url: '', caption: '' } }],
          currentBlock,
          'after'
        );
        if (insertedBlocks && insertedBlocks.length > 0) {
          editor.setTextCursorPosition(insertedBlocks[0], 'start');
        }
        editor.focus();
        handleChange();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to insert image:', error);
      }
    };

    // 插入引用块或将当前块转换为引用块
    const insertQuote = () => {
      if (!editor) return;
      try {
        const currentBlock = editor.getTextCursorPosition().block;
        // 直接将当前块转换为引用块（无论是否有内容）
        editor.updateBlock(currentBlock, {
          type: 'quote' as const,
        });
        // 聚焦到块
        editor.setTextCursorPosition(currentBlock, 'end');
        editor.focus();
        handleChange();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to insert quote:', error);
      }
    };

    // 插入无序列表
    const insertBulletList = () => {
      if (!editor) return;
      try {
        const currentBlock = editor.getTextCursorPosition().block;
        const insertedBlocks = editor.insertBlocks(
          [{ type: 'bulletListItem' }],
          currentBlock,
          'after'
        );
        if (insertedBlocks && insertedBlocks.length > 0) {
          editor.setTextCursorPosition(insertedBlocks[0], 'start');
        }
        editor.focus();
        handleChange();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to insert bullet list:', error);
      }
    };

    // 插入有序列表
    const insertNumberedList = () => {
      if (!editor) return;
      try {
        const currentBlock = editor.getTextCursorPosition().block;
        const insertedBlocks = editor.insertBlocks(
          [{ type: 'numberedListItem' }],
          currentBlock,
          'after'
        );
        if (insertedBlocks && insertedBlocks.length > 0) {
          editor.setTextCursorPosition(insertedBlocks[0], 'start');
        }
        editor.focus();
        handleChange();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to insert numbered list:', error);
      }
    };

    // 插入待办列表
    const insertCheckList = () => {
      if (!editor) return;
      try {
        const currentBlock = editor.getTextCursorPosition().block;
        const insertedBlocks = editor.insertBlocks(
          [{ type: 'checkListItem' }],
          currentBlock,
          'after'
        );
        if (insertedBlocks && insertedBlocks.length > 0) {
          editor.setTextCursorPosition(insertedBlocks[0], 'start');
        }
        editor.focus();
        handleChange();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to insert check list:', error);
      }
    };

    // 插入数学公式
    const insertMath = () => {
      if (!editor) return;
      try {
        const currentBlock = editor.getTextCursorPosition().block;
        const insertedBlocks = editor.insertBlocks(
          [{ type: 'mathBlock' as const, props: { formula: '' } }],
          currentBlock,
          'after'
        );
        if (insertedBlocks && insertedBlocks.length > 0) {
          editor.setTextCursorPosition(insertedBlocks[0], 'start');
        }
        editor.focus();
        handleChange();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to insert math:', error);
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

        // eslint-disable-next-line no-console
        console.log('[CommentEditor] MediaPicker event received:', {
          type,
          blockId,
        });

        // 调用父组件的 onOpenMediaPicker,传入选择完成的回调
        onOpenMediaPicker(type, (url: string) => {
          // eslint-disable-next-line no-console
          console.log('[CommentEditor] MediaPicker selected:', {
            url,
            blockId,
          });

          // 查找并更新对应的 block
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const block = editor.document.find((b: any) => b.id === blockId);
          if (block) {
            editor.updateBlock(block, {
              props: { ...block.props, url },
            });
            // eslint-disable-next-line no-console
            console.log('[CommentEditor] Block updated:', blockId);
            handleChange(); // 触发内容变化
          } else {
            // eslint-disable-next-line no-console
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

            <span className="toolbar-divider" />

            {/* 粗体按钮 */}
            <button
              type="button"
              onClick={toggleBold}
              className="toolbar-btn"
              title="粗体 (Ctrl+B)"
              disabled={disabled}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              </svg>
            </button>

            {/* 斜体按钮 */}
            <button
              type="button"
              onClick={toggleItalic}
              className="toolbar-btn"
              title="斜体 (Ctrl+I)"
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
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>

            {/* 删除线按钮 */}
            <button
              type="button"
              onClick={toggleStrike}
              className="toolbar-btn"
              title="删除线"
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
                <path d="M16 4H9a3 3 0 0 0-2.83 4" />
                <path d="M14 12a4 4 0 0 1 0 8H6" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            </button>

            <span className="toolbar-divider" />

            {/* 图片按钮 */}
            <button
              type="button"
              onClick={insertImage}
              className="toolbar-btn"
              title="插入图片"
              disabled={disabled}
            >
              <ImageIcon size={18} />
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

            {/* 引用按钮 */}
            <button
              type="button"
              onClick={insertQuote}
              className="toolbar-btn"
              title="插入引用（选中文字时转换为引用）"
              disabled={disabled}
            >
              <QuoteIcon size={18} />
            </button>

            <span className="toolbar-divider" />

            {/* 无序列表按钮 */}
            <button
              type="button"
              onClick={insertBulletList}
              className="toolbar-btn"
              title="无序列表"
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
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            </button>

            {/* 有序列表按钮 */}
            <button
              type="button"
              onClick={insertNumberedList}
              className="toolbar-btn"
              title="有序列表"
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
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
                <text
                  x="3"
                  y="7"
                  fontSize="6"
                  fill="currentColor"
                  stroke="none"
                >
                  1
                </text>
                <text
                  x="3"
                  y="13"
                  fontSize="6"
                  fill="currentColor"
                  stroke="none"
                >
                  2
                </text>
                <text
                  x="3"
                  y="19"
                  fontSize="6"
                  fill="currentColor"
                  stroke="none"
                >
                  3
                </text>
              </svg>
            </button>

            {/* 待办列表按钮 */}
            <button
              type="button"
              onClick={insertCheckList}
              className="toolbar-btn"
              title="待办列表"
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
                <rect x="3" y="5" width="4" height="4" rx="1" />
                <line x1="10" y1="7" x2="21" y2="7" />
                <path d="M3 15l1.5 1.5L7 14" />
                <line x1="10" y1="15" x2="21" y2="15" />
              </svg>
            </button>

            <span className="toolbar-divider" />

            {/* 数学公式按钮 */}
            <button
              type="button"
              onClick={insertMath}
              className="toolbar-btn"
              title="插入数学公式"
              disabled={disabled}
            >
              <MathIcon size={18} />
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
            formattingToolbar={false}
            onChange={handleChange}
            data-theming-css-variables-demo
          >
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={getFilteredSlashMenuItems}
            />
            {/* 自定义 FormattingToolbar，过滤 toggle 相关项目 */}
            <FormattingToolbarController
              formattingToolbar={() => (
                <FormattingToolbar
                  blockTypeSelectItems={getFilteredBlockTypeSelectItems()}
                />
              )}
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

        .toolbar-divider {
          width: 1px;
          height: 20px;
          background: hsl(var(--border));
          margin: 0 0.25rem;
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
