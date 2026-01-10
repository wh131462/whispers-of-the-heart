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
import { ImageIcon, MathIcon, QuoteIcon } from './assets/icons';
import { type MediaSelectResult } from './MediaPicker';

// 共享工具导入
import {
  DEFAULT_UPLOAD_ENDPOINT,
  applyAllMarkdownFixes,
  getCommentSlashMenuItems,
} from './utils';

export interface CommentEditorProps {
  content?: string;
  onChange?: (markdown: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: number;
  /** 认证令牌，用于上传文件 */
  authToken?: string | null;
  /** 上传端点 URL */
  uploadEndpoint?: string;
  /**
   * 当需要打开媒体选择器时触发
   * @param type - 媒体类型 (image, video, audio, file)
   * @param onSelect - 选择完成后的回调,传入选中的媒体信息
   */
  onOpenMediaPicker?: (
    type: 'image' | 'video' | 'audio' | 'file',
    onSelect: (result: MediaSelectResult) => void
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
      authToken,
      uploadEndpoint = DEFAULT_UPLOAD_ENDPOINT,
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
    // 用于追踪组件挂载状态
    const isMountedRef = useRef(true);
    // 保存最新的 authToken 和 uploadEndpoint
    const authTokenRef = useRef(authToken);
    const uploadEndpointRef = useRef(uploadEndpoint);

    // 更新 refs
    useEffect(() => {
      authTokenRef.current = authToken;
    }, [authToken]);

    useEffect(() => {
      uploadEndpointRef.current = uploadEndpoint;
    }, [uploadEndpoint]);

    // 使用 useCreateBlockNote hook 创建编辑器实例
    const editor = useCreateBlockNote({
      schema: customSchema,
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

    // 获取 slash menu items（使用共享配置）
    const getFilteredSlashMenuItems = useCallback(
      async (query: string) => {
        const defaultItems = getDefaultReactSlashMenuItems(editor);
        const allItems = getCommentSlashMenuItems(editor, defaultItems);

        if (!query) return allItems;
        return filterSuggestionItems(allItems, query);
      },
      [editor]
    );

    // 获取过滤后的 blockTypeSelectItems（移除 toggle 相关项目）
    const getFilteredBlockTypeSelectItems = useCallback(() => {
      const defaultItems = blockTypeSelectItems(editor.dictionary);
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
            // 应用所有 markdown 修复（CommentEditor 不需要清理无效链接）
            markdown = applyAllMarkdownFixes(markdown, blocks, false);
            return markdown;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to get content:', error);
            return '';
          }
        },
      }),
      [editor, onChange]
    );

    // 清理定时器和挂载状态
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    // 初始化内容
    useEffect(() => {
      if (!editor || isInitializedRef.current) return;

      const initContent = () => {
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
          Promise.resolve().then(() => {
            isUpdatingFromPropRef.current = false;
          });
        }
      };

      requestAnimationFrame(initContent);
    }, [editor, content]);

    // 处理内容变化
    const handleChange = useCallback(() => {
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
        if (!isMountedRef.current) return;

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
          // 应用所有 markdown 修复（CommentEditor 不需要清理无效链接）
          markdown = applyAllMarkdownFixes(markdown, blocks, false);
          // eslint-disable-next-line no-console
          console.log('[CommentEditor] Fixed markdown:', markdown);
          onChange(markdown);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to convert comment to markdown:', error);
        }
      }, 200);
    }, [editor, onChange]);

    // 粘贴图片上传功能
    useEffect(() => {
      if (disabled || !editor.uploadFile) return;

      const uploadFn = editor.uploadFile;

      const handlePaste = async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (!file) continue;

            e.preventDefault();

            try {
              const result = await uploadFn(file);
              const url = typeof result === 'string' ? result : null;
              if (url) {
                const currentBlock = editor.getTextCursorPosition().block;
                editor.insertBlocks(
                  [
                    {
                      type: 'customImage' as const,
                      props: { url, caption: '' },
                    },
                  ],
                  currentBlock,
                  'after'
                );
                handleChange();
                // eslint-disable-next-line no-console
                console.log('[CommentEditor] Image pasted and uploaded:', url);
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error(
                '[CommentEditor] Failed to upload pasted image:',
                error
              );
            }
            break;
          }
        }
      };

      document.addEventListener('paste', handlePaste);
      return () => {
        document.removeEventListener('paste', handlePaste);
      };
    }, [editor, disabled, handleChange]);

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
        editor.updateBlock(currentBlock, {
          type: 'quote' as const,
        });
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
          type: 'image' | 'video' | 'audio' | 'file';
          blockId: string;
        }>;
        const { type, blockId } = customEvent.detail;

        customEvent.preventDefault();

        // eslint-disable-next-line no-console
        console.log('[CommentEditor] MediaPicker event received:', {
          type,
          blockId,
        });

        onOpenMediaPicker(type, (result: MediaSelectResult) => {
          // eslint-disable-next-line no-console
          console.log('[CommentEditor] MediaPicker selected:', {
            result,
            blockId,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const block = editor.document.find((b: any) => b.id === blockId);
          if (block) {
            const newProps: Record<string, unknown> = {
              ...block.props,
              url: result.url,
            };
            if (type === 'file' && result.fileName) {
              newProps.fileName = result.fileName;
            }
            if (type === 'file' && result.fileSize) {
              newProps.fileSize = result.fileSize;
            }
            if ((type === 'audio' || type === 'video') && result.fileName) {
              newProps.title = result.fileName;
            }
            editor.updateBlock(block, { props: newProps });
            // eslint-disable-next-line no-console
            console.log('[CommentEditor] Block updated:', blockId);
            handleChange();
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

        {/* 编辑器 */}
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
