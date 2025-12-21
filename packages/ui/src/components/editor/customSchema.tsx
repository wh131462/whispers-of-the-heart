import React, { useState, useCallback, useRef, useEffect, memo } from 'react'
import { createReactBlockSpec, ReactCustomBlockRenderProps } from '@blocknote/react'
import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { sql } from '@codemirror/lang-sql'
import { markdown } from '@codemirror/lang-markdown'
import { php } from '@codemirror/lang-php'
import { rust } from '@codemirror/lang-rust'
import { go } from '@codemirror/lang-go'
import { Copy, Check, ChevronDown } from 'lucide-react'

// Language extensions map
const languageExtensions: Record<string, ReturnType<typeof javascript>> = {
  javascript: javascript({ jsx: true }),
  js: javascript({ jsx: true }),
  jsx: javascript({ jsx: true }),
  typescript: javascript({ jsx: true, typescript: true }),
  ts: javascript({ jsx: true, typescript: true }),
  tsx: javascript({ jsx: true, typescript: true }),
  python: python(),
  py: python(),
  java: java(),
  cpp: cpp(),
  c: cpp(),
  'c++': cpp(),
  html: html(),
  css: css(),
  scss: css(),
  less: css(),
  json: json(),
  xml: xml(),
  sql: sql(),
  markdown: markdown(),
  md: markdown(),
  php: php(),
  rust: rust(),
  rs: rust(),
  go: go(),
  golang: go(),
}

const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
  'html', 'css', 'json', 'xml', 'sql', 'markdown', 'php', 'rust', 'go'
]

// Inline CodeMirror code block component
const CodeBlockComponent = memo(function CodeBlockComponent({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  editable = true,
}: {
  code: string
  language: string
  onCodeChange: (code: string) => void
  onLanguageChange: (language: string) => void
  editable?: boolean
}) {
  const [isCopied, setIsCopied] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [inputValue, setInputValue] = useState(language)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const lastCodeRef = useRef(code)
  const lastLanguageRef = useRef(language)

  useEffect(() => {
    setInputValue(language)
    lastLanguageRef.current = language
  }, [language])

  useEffect(() => {
    lastCodeRef.current = code
  }, [code])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCodeChange = useCallback(
    (value: string) => {
      if (value !== lastCodeRef.current) {
        lastCodeRef.current = value
        onCodeChange(value)
      }
    },
    [onCodeChange]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setIsDropdownOpen(true)
    if (value !== lastLanguageRef.current) {
      lastLanguageRef.current = value
      onLanguageChange(value)
    }
  }

  const handleSelectLanguage = (lang: string) => {
    setInputValue(lang)
    setIsDropdownOpen(false)
    if (lang !== lastLanguageRef.current) {
      lastLanguageRef.current = lang
      onLanguageChange(lang)
    }
  }

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) =>
    lang.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }, [code])

  const getLanguageExtension = (lang: string) => {
    return languageExtensions[lang.toLowerCase()] || javascript({ jsx: true })
  }

  return (
    <div className="bn-custom-code-block" contentEditable={false}>
      <div className="code-block-header">
        <div className="language-selector" ref={dropdownRef}>
          <div className="language-input-wrapper">
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
          {isDropdownOpen && filteredLanguages.length > 0 && (
            <div className="language-dropdown">
              {filteredLanguages.map((lang) => (
                <div
                  key={lang}
                  onClick={() => handleSelectLanguage(lang)}
                  className="language-option"
                >
                  {lang}
                </div>
              ))}
            </div>
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
        <CodeMirror
          value={code}
          extensions={[getLanguageExtension(inputValue)]}
          onChange={handleCodeChange}
          theme="light"
          editable={editable}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: editable,
          }}
          height="auto"
          minHeight="80px"
        />
      </div>

      <style>{`
        .bn-custom-code-block {
          width: 100%;
          background: hsl(var(--muted));
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid hsl(var(--border));
          margin: 0.5rem 0;
        }

        .bn-custom-code-block .code-block-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: hsl(var(--muted) / 0.8);
          border-bottom: 1px solid hsl(var(--border));
        }

        .bn-custom-code-block .language-selector {
          position: relative;
        }

        .bn-custom-code-block .language-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .bn-custom-code-block .language-input {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid hsl(var(--border));
          font-size: 0.75rem;
          width: 100px;
          outline: none;
        }

        .bn-custom-code-block .language-input:focus {
          border-color: hsl(var(--primary));
        }

        .bn-custom-code-block .dropdown-icon {
          color: hsl(var(--muted-foreground));
          margin-left: -1.25rem;
          pointer-events: none;
        }

        .bn-custom-code-block .language-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 0.25rem;
          width: 120px;
          background: hsl(var(--popover));
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          max-height: 200px;
          overflow-y: auto;
          z-index: 50;
        }

        .bn-custom-code-block .language-option {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          color: hsl(var(--foreground));
          cursor: pointer;
          transition: background 0.15s;
        }

        .bn-custom-code-block .language-option:hover {
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
        }

        .bn-custom-code-block .code-editor-container .cm-editor {
          font-size: 0.875rem;
          background: transparent !important;
        }

        .bn-custom-code-block .code-editor-container .cm-scroller {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
        }

        .bn-custom-code-block .code-editor-container .cm-gutters {
          background: hsl(var(--muted) / 0.5) !important;
          border-right: 1px solid hsl(var(--border)) !important;
        }

        .bn-custom-code-block .code-editor-container .cm-lineNumbers .cm-gutterElement {
          color: hsl(var(--muted-foreground));
          padding: 0 0.5rem 0 0.25rem;
          min-width: 2.5rem;
        }

        .dark .bn-custom-code-block {
          background: hsl(222 47% 11%);
        }

        .dark .bn-custom-code-block .code-block-header {
          background: hsl(222 47% 8%);
        }

        .dark .bn-custom-code-block .language-input {
          background: hsl(222 47% 15%);
          border-color: hsl(222 47% 20%);
        }

        .dark .bn-custom-code-block .code-editor-container .cm-gutters {
          background: hsl(222 47% 8%) !important;
        }
      `}</style>
    </div>
  )
})

// 代码块导出 HTML 组件 (用于 markdown 转换)
// 注意：这个组件在单独的 React root 中渲染，需要确保同步获取最新 props
const CodeBlockExternalHTML: React.FC<ReactCustomBlockRenderProps<any, any, any>> = ({ block }) => {
  const { language = 'javascript', code = '' } = block.props
  // Debug: 查看导出时的 block 结构
  console.log('[CodeBlock toExternalHTML] block:', JSON.stringify(block, null, 2))
  console.log('[CodeBlock toExternalHTML] code:', code)

  // 如果 code 为空，返回一个带有特殊标记的元素，这样可以在后处理中识别
  if (!code) {
    return (
      <pre data-empty-code="true">
        <code className={`language-${language}`}></code>
      </pre>
    )
  }

  return (
    <pre>
      <code className={`language-${language}`}>{code}</code>
    </pre>
  )
}

// Create the custom code block spec factory - ONLY ONCE at module level
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
    render: (props: ReactCustomBlockRenderProps<any, any, any>) => {
      const { block, editor } = props
      const { language = 'javascript', code = '' } = block.props

      return (
        <CodeBlockComponent
          code={code}
          language={language}
          editable={editor.isEditable}
          onCodeChange={(newCode) => {
            editor.updateBlock(block, {
              props: { ...block.props, code: newCode },
            })
          }}
          onLanguageChange={(newLanguage) => {
            editor.updateBlock(block, {
              props: { ...block.props, language: newLanguage },
            })
          }}
        />
      )
    },
    // 导出为 HTML (用于 markdown 转换) - 使用 React 组件
    toExternalHTML: CodeBlockExternalHTML,
    // 从 HTML 解析 (用于 markdown 导入)
    parse: (element: HTMLElement) => {
      // 解析 <pre><code> 结构
      if (element.tagName === 'PRE') {
        const codeEl = element.querySelector('code')
        if (codeEl) {
          const className = codeEl.className || ''
          const langMatch = className.match(/language-(\w+)/)
          const language = langMatch ? langMatch[1] : 'javascript'
          const code = codeEl.textContent || ''
          return { language, code }
        }
        // 直接是 <pre> 没有 <code>
        return {
          language: 'javascript',
          code: element.textContent || ''
        }
      }
      return undefined
    },
  }
)

// Invoke the factory ONCE to create the block spec
const CustomCodeBlock = createCustomCodeBlock()

// Create schema ONLY ONCE at module level - this is the key to avoiding plugin conflicts
export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeBlock: CustomCodeBlock,
  },
})

export type CustomSchemaType = typeof customSchema
