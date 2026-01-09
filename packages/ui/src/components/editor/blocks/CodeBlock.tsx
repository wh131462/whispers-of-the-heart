import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
  memo,
} from 'react';
import { createPortal } from 'react-dom';
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
} from '@blocknote/react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Copy, Check, ChevronDown } from 'lucide-react';

// Monaco 语言映射
const languageMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'javascript',
  tsx: 'typescript',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  golang: 'go',
  'c++': 'cpp',
  c: 'c',
  yml: 'yaml',
  md: 'markdown',
  sh: 'shell',
  shell: 'shell',
  zsh: 'shell',
  bash: 'shell',
  scss: 'scss',
  less: 'less',
};

const normalizeLanguage = (lang: string): string => {
  const normalized = lang.toLowerCase().trim();
  return languageMap[normalized] || normalized;
};

const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'c',
  'html',
  'css',
  'json',
  'xml',
  'sql',
  'markdown',
  'php',
  'rust',
  'go',
  'yaml',
  'shell',
];

// Monaco 代码块组件
const CodeBlockComponent = memo(function CodeBlockComponent({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  editable = true,
  editor: blockNoteEditor,
  block,
}: {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
  editable?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  block?: Record<string, any>;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState(language);
  const [isDark, setIsDark] = useState(false);
  const [editorHeight, setEditorHeight] = useState(44);
  const [inputWidth, setInputWidth] = useState(60);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const lastCodeRef = useRef(code);
  const lastLanguageRef = useRef(language);
  const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // 计算输入框宽度 - 使用 requestAnimationFrame 确保 CSS 完全应用后再测量
  useLayoutEffect(() => {
    const measureWidth = () => {
      if (measureRef.current) {
        const width = measureRef.current.offsetWidth;
        const minWidth = 55;
        const padding = 30; // 输入框 padding (8px left + 20px right) + 额外余量
        setInputWidth(Math.max(width + padding, minWidth));
      }
    };
    // 使用 requestAnimationFrame 确保在下一帧渲染后测量
    const rafId = requestAnimationFrame(measureWidth);
    return () => cancelAnimationFrame(rafId);
  }, [inputValue]);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          checkDarkMode();
        }
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setInputValue(language);
    lastLanguageRef.current = language;
  }, [language]);

  useEffect(() => {
    lastCodeRef.current = code;
  }, [code]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 检查点击是否在 dropdownRef 或 inputWrapperRef 内
      const isInDropdown = dropdownRef.current?.contains(target);
      const isInInputWrapper = inputWrapperRef.current?.contains(target);
      if (!isInDropdown && !isInInputWrapper) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 计算下拉菜单位置
  useEffect(() => {
    if (isDropdownOpen && inputWrapperRef.current) {
      const updatePosition = () => {
        if (inputWrapperRef.current) {
          const rect = inputWrapperRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
          });
        }
      };
      updatePosition();

      // 滚动时关闭下拉菜单
      const handleScroll = () => {
        setIsDropdownOpen(false);
      };
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isDropdownOpen]);

  // 计算编辑器高度
  const updateEditorHeight = useCallback((codeContent: string) => {
    const lineCount = (codeContent || '').split('\n').length;
    const lineHeight = 20; // Monaco 默认行高
    const verticalPadding = 24; // Monaco padding: top 12 + bottom 12
    const minHeight = 44; // 单行最小高度：20 + 24
    const maxHeight = 500;
    const calculatedHeight = Math.min(
      Math.max(lineCount * lineHeight + verticalPadding, minHeight),
      maxHeight
    );
    setEditorHeight(calculatedHeight);
  }, []);

  useEffect(() => {
    updateEditorHeight(code);
  }, [code, updateEditorHeight]);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newValue = value || '';
      if (newValue !== lastCodeRef.current) {
        lastCodeRef.current = newValue;
        onCodeChange(newValue);
        updateEditorHeight(newValue);
      }
    },
    [onCodeChange, updateEditorHeight]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsDropdownOpen(true);
    if (value !== lastLanguageRef.current) {
      lastLanguageRef.current = value;
      onLanguageChange(value);
    }
  };

  const handleSelectLanguage = (lang: string) => {
    setInputValue(lang);
    setIsDropdownOpen(false);
    if (lang !== lastLanguageRef.current) {
      lastLanguageRef.current = lang;
      onLanguageChange(lang);
    }
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [code]);

  // Monaco Editor 挂载回调
  const handleEditorMount = useCallback(
    (monacoEditor: editor.IStandaloneCodeEditor, _monaco: Monaco) => {
      monacoEditorRef.current = monacoEditor;

      // 设置编辑器选项
      monacoEditor.updateOptions({
        readOnly: !editable,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        glyphMargin: false,
        folding: false,
        lineDecorationsWidth: 8,
        lineNumbersMinChars: 2,
        renderLineHighlight: editable ? 'line' : 'none',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        contextmenu: editable,
        fontSize: 13,
        lineHeight: 20,
        fontFamily:
          '"JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        padding: { top: 12, bottom: 12 },
        automaticLayout: true,
      });

      // 处理空代码块删除 - 只有当代码为空时才删除整个代码块
      if (editable && blockNoteEditor && block) {
        monacoEditor.onKeyDown(e => {
          // 只处理 Backspace 和 Delete 键
          if (e.code !== 'Backspace' && e.code !== 'Delete') {
            return;
          }

          // 获取当前编辑器中的实际内容
          const currentValue = monacoEditor.getValue();

          // 只有当内容为空时才删除代码块
          if (currentValue.trim() !== '') {
            return; // 有内容，让 Monaco 正常处理删除
          }

          // 内容为空，删除整个代码块
          e.preventDefault();
          e.stopPropagation();

          const allBlocks = blockNoteEditor.document;
          const currentIndex = allBlocks.findIndex(
            (b: Record<string, unknown>) => b.id === block.id
          );

          let targetBlock = null;
          if (currentIndex > 0) {
            targetBlock = allBlocks[currentIndex - 1];
          } else if (currentIndex < allBlocks.length - 1) {
            targetBlock = allBlocks[currentIndex + 1];
          }

          blockNoteEditor.removeBlocks([block]);

          if (targetBlock) {
            setTimeout(() => {
              try {
                blockNoteEditor.setTextCursorPosition(targetBlock.id, 'end');
                blockNoteEditor.focus();
              } catch {
                blockNoteEditor.focus();
              }
            }, 0);
          } else {
            setTimeout(() => blockNoteEditor.focus(), 0);
          }
        });
      }
    },
    [editable, blockNoteEditor, block]
  );

  const normalizedLang = normalizeLanguage(inputValue);

  return (
    <div className="bn-custom-code-block" contentEditable={false}>
      <div className="code-block-header">
        <div className="header-left">
          {/* 红绿灯 */}
          <div className="traffic-lights">
            <div className="light red" />
            <div className="light yellow" />
            <div className="light green" />
          </div>
          {/* 语言选择器/标签 */}
          <div className="language-selector">
            {/* 隐藏的测量元素 */}
            <span ref={measureRef} className="language-measure">
              {inputValue || 'language'}
            </span>
            <div
              ref={inputWrapperRef}
              className="language-input-wrapper"
              style={{ width: inputWidth }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => editable && setIsDropdownOpen(true)}
                placeholder="language"
                className="language-input"
                readOnly={!editable}
              />
              {editable && <ChevronDown className="dropdown-icon" size={14} />}
            </div>
          </div>
          {/* 使用 Portal 渲染下拉菜单到 body */}
          {isDropdownOpen &&
            filteredLanguages.length > 0 &&
            createPortal(
              <div
                ref={dropdownRef}
                className="bn-code-language-dropdown"
                style={{
                  position: 'fixed',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  zIndex: 9999,
                }}
              >
                {filteredLanguages.map(lang => (
                  <div
                    key={lang}
                    onClick={() => handleSelectLanguage(lang)}
                    className="language-option"
                  >
                    {lang}
                  </div>
                ))}
              </div>,
              document.body
            )}
        </div>
        <button
          type="button"
          onClick={handleCopyCode}
          className="copy-button"
          title={isCopied ? '已复制' : '复制代码'}
        >
          {isCopied ? (
            <>
              <Check size={14} />
              <span>已复制</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      <div className="code-editor-container">
        <Editor
          height={editorHeight}
          language={normalizedLang}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          theme={isDark ? 'vs-dark' : 'vs'}
          options={{
            readOnly: !editable,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 8,
            lineNumbersMinChars: 2,
            renderLineHighlight: editable ? 'line' : 'none',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            contextmenu: editable,
            fontSize: 13,
            lineHeight: 20,
            fontFamily:
              '"JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            padding: { top: 12, bottom: 12 },
            automaticLayout: true,
          }}
          loading={
            <div className="code-editor-loading">
              <span>加载编辑器...</span>
            </div>
          }
        />
      </div>

      <style>{`
        .bn-custom-code-block {
          width: 100%;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid hsl(var(--border));
          margin: 0.5rem 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .bn-custom-code-block .code-block-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 1rem;
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
        }

        .bn-custom-code-block .header-left {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .bn-custom-code-block .traffic-lights {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .bn-custom-code-block .traffic-lights .light {
          width: 0.625rem;
          height: 0.625rem;
          border-radius: 50%;
        }

        .bn-custom-code-block .traffic-lights .light.red {
          background-color: #ff5f56;
        }

        .bn-custom-code-block .traffic-lights .light.yellow {
          background-color: #ffbd2e;
        }

        .bn-custom-code-block .traffic-lights .light.green {
          background-color: #27c93f;
        }

        .bn-custom-code-block .language-selector {
          position: relative;
        }

        .bn-custom-code-block .language-measure {
          position: absolute;
          visibility: hidden;
          white-space: pre;
          font-size: 0.75rem;
          font-weight: 500;
          font-family: "JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          letter-spacing: 0.02em;
          text-transform: lowercase;
          font-variant-ligatures: none;
          -webkit-font-smoothing: antialiased;
        }

        .bn-custom-code-block .language-input-wrapper {
          display: flex;
          align-items: center;
          position: relative;
        }

        .bn-custom-code-block .language-input {
          box-sizing: border-box;
          width: 100%;
          background: transparent;
          color: hsl(var(--muted-foreground));
          padding: 0.25rem 1.25rem 0.25rem 0.5rem;
          border-radius: 0.25rem;
          border: none;
          font-size: 0.75rem;
          font-weight: 500;
          font-family: "JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          letter-spacing: 0.02em;
          text-transform: lowercase;
          outline: none;
          margin: 0;
          appearance: none;
          font-variant-ligatures: none;
          -webkit-font-smoothing: antialiased;
        }

        .bn-custom-code-block .language-input:focus {
          background: hsl(var(--accent));
        }

        .bn-custom-code-block .dropdown-icon {
          position: absolute;
          right: 0.25rem;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }

        /* Portal 渲染的语言下拉菜单 */
        .bn-code-language-dropdown {
          min-width: 80px;
          width: max-content;
          background: hsl(var(--popover));
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          max-height: 180px;
          overflow-y: auto;
        }

        .bn-code-language-dropdown .language-option {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          color: hsl(var(--foreground));
          cursor: pointer;
          transition: background 0.15s;
          font-family: "JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        }

        .bn-code-language-dropdown .language-option:hover {
          background: hsl(var(--accent));
        }

        .bn-custom-code-block .copy-button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          background: transparent;
          border: none;
          color: hsl(var(--muted-foreground));
          font-size: 0.75rem;
          cursor: pointer;
          border-radius: 0.25rem;
          transition: all 0.15s;
        }

        .bn-custom-code-block .copy-button:hover {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }

        .bn-custom-code-block .code-editor-container {
          width: 100%;
          background: hsl(var(--background));
        }

        .bn-custom-code-block .code-editor-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          color: hsl(var(--muted-foreground));
          font-size: 0.875rem;
        }

        /* Monaco Editor 样式覆盖 */
        .bn-custom-code-block .monaco-editor {
          --vscode-editor-background: transparent !important;
        }

        .bn-custom-code-block .monaco-editor .margin {
          background: transparent !important;
        }

        .bn-custom-code-block .monaco-editor .monaco-editor-background {
          background: transparent !important;
        }

        .dark .bn-custom-code-block .code-block-header {
          background: hsl(24 15% 12%);
        }

        .dark .bn-custom-code-block .code-editor-container {
          background: hsl(24 10% 10%);
        }

        .dark .bn-custom-code-block .language-input {
          color: hsl(var(--muted-foreground));
        }

        .dark .bn-custom-code-block .language-input:focus {
          background: hsl(var(--accent));
        }
      `}</style>
    </div>
  );
});

// 代码块导出 HTML 组件 (用于 markdown 转换)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CodeBlockExternalHTML: React.FC<
  ReactCustomBlockRenderProps<any, any, any>
> = ({ block }) => {
  const { language = 'javascript', code = '' } = block.props;

  if (!code) {
    return (
      <pre data-empty-code="true">
        <code className={`language-${language}`}></code>
      </pre>
    );
  }

  return (
    <pre>
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
};

// Create the custom code block spec factory
const createCustomCodeBlock = createReactBlockSpec(
  {
    type: 'codeBlock',
    propSchema: {
      language: { default: 'javascript' },
      code: { default: '' },
    },
    content: 'none',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (props: ReactCustomBlockRenderProps<any, any, any>) => {
      const { block, editor } = props;
      const { language = 'javascript', code = '' } = block.props;

      return (
        <CodeBlockComponent
          code={code}
          language={language}
          editable={editor.isEditable}
          editor={editor}
          block={block}
          onCodeChange={newCode => {
            editor.updateBlock(block, {
              props: { ...block.props, code: newCode },
            });
          }}
          onLanguageChange={newLanguage => {
            editor.updateBlock(block, {
              props: { ...block.props, language: newLanguage },
            });
          }}
        />
      );
    },
    toExternalHTML: CodeBlockExternalHTML,
    parse: (element: HTMLElement) => {
      if (element.tagName === 'PRE') {
        const codeEl = element.querySelector('code');
        if (codeEl) {
          const className = codeEl.className || '';
          // 排除 markmap 代码块，由 MindMapBlock 处理
          if (className.includes('language-markmap')) {
            return undefined;
          }
          const langMatch = className.match(/language-(\w+)/);
          const language = langMatch ? langMatch[1] : 'javascript';
          const code = codeEl.textContent || '';
          return { language, code };
        }
        return {
          language: 'javascript',
          code: element.textContent || '',
        };
      }
      return undefined;
    },
  }
);

export const CustomCodeBlock = createCustomCodeBlock();
