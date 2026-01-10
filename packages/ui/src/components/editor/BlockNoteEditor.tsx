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
  useSelectedBlocks,
  useBlockNoteEditor,
  useComponentsContext,
  useEditorState,
  BlockTypeSelect,
  BasicTextStyleButton,
  TextAlignButton,
  ColorStyleButton,
  NestBlockButton,
  UnnestBlockButton,
  CreateLinkButton,
} from '@blocknote/react';
import { filterSuggestionItems } from '@blocknote/core/extensions';
import { RefreshCw, Trash2 } from 'lucide-react';
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
import { AIConfig, createLanguageModel, validateAIConfig } from './ai';
import { type MediaSelectResult } from './MediaPicker';

// 共享工具导入
import {
  type MediaPickerRequest,
  DEFAULT_UPLOAD_ENDPOINT,
  MEDIA_BLOCK_TYPES,
  MEDIA_TYPE_NAMES,
  MEDIA_TYPE_MAP,
  applyAllMarkdownFixes,
  preprocessMarkdownForMindMap,
  getFullCustomSlashMenuItems,
} from './utils';

// 媒体替换按钮
const MediaReplaceButton: React.FC = () => {
  const Components = useComponentsContext();
  const editor = useBlockNoteEditor();

  const block = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable) return undefined;
      const selectedBlocks = editor.getSelection()?.blocks || [
        editor.getTextCursorPosition().block,
      ];
      if (selectedBlocks.length !== 1) return undefined;
      const block = selectedBlocks[0];
      if (!MEDIA_BLOCK_TYPES.includes(block.type)) return undefined;
      return block;
    },
  });

  if (!block || !Components) return null;

  const typeName = MEDIA_TYPE_NAMES[block.type] || '媒体';

  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      mainTooltip={`替换${typeName}`}
      onClick={() => {
        const mediaType = MEDIA_TYPE_MAP[block.type] || 'file';
        const event = new CustomEvent('blocknote:openMediaPicker', {
          cancelable: true,
          detail: { type: mediaType, blockId: block.id },
        });
        window.dispatchEvent(event);
      }}
    >
      <RefreshCw size={16} />
    </Components.FormattingToolbar.Button>
  );
};

// 媒体删除按钮
const MediaDeleteButton: React.FC = () => {
  const Components = useComponentsContext();
  const editor = useBlockNoteEditor();

  const block = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable) return undefined;
      const selectedBlocks = editor.getSelection()?.blocks || [
        editor.getTextCursorPosition().block,
      ];
      if (selectedBlocks.length !== 1) return undefined;
      const block = selectedBlocks[0];
      if (!MEDIA_BLOCK_TYPES.includes(block.type)) return undefined;
      return block;
    },
  });

  const onClick = useCallback(() => {
    if (block) {
      editor.focus();
      editor.removeBlocks([block.id]);
    }
  }, [block, editor]);

  if (!block || !Components) return null;

  const typeName = MEDIA_TYPE_NAMES[block.type] || '媒体';

  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      mainTooltip={`删除${typeName}`}
      onClick={onClick}
    >
      <Trash2 size={16} />
    </Components.FormattingToolbar.Button>
  );
};

// 自定义 FormattingToolbar
const CustomFormattingToolbar: React.FC<{
  blockTypeSelectItems: ReturnType<typeof blockTypeSelectItems>;
  showAIButton: boolean;
}> = ({ blockTypeSelectItems: items, showAIButton }) => {
  const selectedBlocks = useSelectedBlocks();
  const isMediaBlockSelected = selectedBlocks.some(block =>
    MEDIA_BLOCK_TYPES.includes(block.type)
  );
  const shouldShowAIButton = showAIButton && !isMediaBlockSelected;

  return (
    <FormattingToolbar>
      {shouldShowAIButton && <AIToolbarButton />}
      <BlockTypeSelect items={items} />
      <BasicTextStyleButton basicTextStyle="bold" />
      <BasicTextStyleButton basicTextStyle="italic" />
      <BasicTextStyleButton basicTextStyle="underline" />
      <BasicTextStyleButton basicTextStyle="strike" />
      <TextAlignButton textAlignment="left" />
      <TextAlignButton textAlignment="center" />
      <TextAlignButton textAlignment="right" />
      <ColorStyleButton />
      <NestBlockButton />
      <UnnestBlockButton />
      <CreateLinkButton />
      {isMediaBlockSelected && (
        <>
          <MediaReplaceButton />
          <MediaDeleteButton />
        </>
      )}
    </FormattingToolbar>
  );
};

export interface BlockNoteEditorProps {
  content?: string;
  onChange?: (markdown: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  authToken?: string | null;
  uploadEndpoint?: string;
  onInsertImage?: (url: string) => void;
  onOpenMediaPicker?: (
    type: 'image' | 'video' | 'audio' | 'file',
    onSelect: (result: MediaSelectResult) => void
  ) => void;
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
  const isUpdatingFromPropRef = useRef(false);

  const [_mediaPickerRequest, setMediaPickerRequest] =
    useState<MediaPickerRequest | null>(null);

  // AI 是否启用
  const isAIEnabled = useMemo(() => {
    if (!aiConfig) return false;
    const validation = validateAIConfig(aiConfig);
    return validation.valid && aiConfig.enabled !== false;
  }, [aiConfig]);

  // 创建 AI Transport
  const aiTransport = useMemo(() => {
    if (!isAIEnabled || !aiConfig) return null;
    try {
      const model = createLanguageModel(aiConfig);
      return new ClientSideTransport({ model });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[BlockNoteEditor] Failed to create AI transport:', error);
      return null;
    }
  }, [isAIEnabled, aiConfig]);

  useEffect(() => {
    authTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    uploadEndpointRef.current = uploadEndpoint;
  }, [uploadEndpoint]);

  // 创建编辑器实例
  const editor = useCreateBlockNote({
    schema: customSchema,
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
    extensions: aiTransport ? [AIExtension({ transport: aiTransport })] : [],
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

  // 获取自定义 slash menu items
  const getCustomSlashMenuItems = useCallback(
    async (query: string) => {
      const defaultItems = getDefaultReactSlashMenuItems(editor);
      let allItems = getFullCustomSlashMenuItems(editor, defaultItems);

      // 如果启用了 AI，添加 AI 菜单项
      if (isAIEnabled) {
        const aiItems = getAISlashMenuItems(editor);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const remappedAIItems = aiItems.map((item: any) => ({
          ...item,
          group: 'AI',
        }));
        allItems = [...allItems, ...remappedAIItems];
      }

      if (!query) return allItems;
      return filterSuggestionItems(allItems, query);
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

  // 粘贴图片上传
  useEffect(() => {
    if (!editable || !editor.uploadFile) return;

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
                [{ type: 'customImage' as const, props: { url, caption: '' } }],
                currentBlock,
                'after'
              );
              // eslint-disable-next-line no-console
              console.log('[BlockNoteEditor] Image pasted and uploaded:', url);
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(
              '[BlockNoteEditor] Failed to upload pasted image:',
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
  }, [editor, editable]);

  // 修复 AI 输入框中文输入法问题
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

  // 初始化内容
  useEffect(() => {
    if (!editor || isInitializedRef.current) return;

    const initContent = async () => {
      isUpdatingFromPropRef.current = true;

      try {
        if (content) {
          // eslint-disable-next-line no-console
          console.log('[BlockNoteEditor] Input markdown:', content);

          const hasMarkmap = /```markmap\n([\s\S]*?)```/.test(content);
          const hasMediaTags =
            /<video[^>]*src=/i.test(content) ||
            /<audio[^>]*src=/i.test(content) ||
            /<figure[^>]*data-file-block/i.test(content);

          if (hasMarkmap || hasMediaTags) {
            let processedContent = content;
            if (hasMarkmap) {
              processedContent = preprocessMarkdownForMindMap(processedContent);
            }
            // eslint-disable-next-line no-console
            console.log(
              '[BlockNoteEditor] Processed content (HTML):',
              processedContent
            );
            const blocks = await editor.tryParseHTMLToBlocks(processedContent);
            // eslint-disable-next-line no-console
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
            const blocks = await editor.tryParseMarkdownToBlocks(content);
            // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.error('Failed to initialize content:', error);
      } finally {
        isInitializedRef.current = true;
        Promise.resolve().then(() => {
          isUpdatingFromPropRef.current = false;
        });
      }
    };

    requestAnimationFrame(() => {
      initContent();
    });
  }, [editor, content]);

  // 处理内容变化
  const handleChange = useCallback(() => {
    if (isUpdatingFromPropRef.current) {
      // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.log(
          '[BlockNoteEditor] Current blocks:',
          JSON.stringify(blocks, null, 2)
        );
        let markdown = editor.blocksToMarkdownLossy(blocks);
        // eslint-disable-next-line no-console
        console.log('[BlockNoteEditor] Raw markdown:', markdown);

        // 应用所有 markdown 修复
        markdown = applyAllMarkdownFixes(markdown, blocks, true);

        // eslint-disable-next-line no-console
        console.log('[BlockNoteEditor] Fixed markdown:', markdown);
        onChange(markdown);
      } catch (error) {
        // eslint-disable-next-line no-console
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

      customEvent.preventDefault();

      // eslint-disable-next-line no-console
      console.log('[BlockNoteEditor] MediaPicker event received:', {
        type,
        blockId,
      });

      setMediaPickerRequest({ type, blockId });

      onOpenMediaPicker(type, (result: MediaSelectResult) => {
        // eslint-disable-next-line no-console
        console.log('[BlockNoteEditor] MediaPicker selected:', {
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
          console.log('[BlockNoteEditor] Block updated:', blockId);
        } else {
          // eslint-disable-next-line no-console
          console.warn('[BlockNoteEditor] Block not found:', blockId);
        }

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

  // 获取过滤后的 blockTypeSelectItems
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
        {isAIEnabled && <AIMenuController />}
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={getCustomSlashMenuItems}
        />
        <FormattingToolbarController
          formattingToolbar={() => (
            <CustomFormattingToolbar
              blockTypeSelectItems={getFilteredBlockTypeSelectItems()}
              showAIButton={isAIEnabled}
            />
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
          overflow: visible;
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

        .blocknote-wrapper .bn-block-content[data-content-type="codeBlock"] {
          background: transparent !important;
        }

        .blocknote-wrapper .bn-block-content[data-content-type="mindMap"] {
          width: 100% !important;
          max-width: 100% !important;
        }

        .blocknote-wrapper .bn-block-content[data-content-type="mindMap"] > div {
          width: 100% !important;
          max-width: 100% !important;
        }

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
