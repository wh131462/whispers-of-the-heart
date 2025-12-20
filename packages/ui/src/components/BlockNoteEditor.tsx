import React, { useEffect, useRef, useCallback, useState, Component, ErrorInfo, ReactNode } from 'react'
import { BlockNoteEditor } from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'

// 错误边界：捕获 ProseMirror 插件冲突错误并自动刷新
class EditorErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 检测是否是 ProseMirror 插件冲突错误
    if (error.message?.includes('keyed plugin')) {
      console.warn('BlockNote: Detected plugin conflict, reloading page...')
      window.location.reload()
    } else {
      console.error('BlockNote Error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-center text-muted-foreground">编辑器加载中...</div>
    }
    return this.props.children
  }
}

// 获取 API 基础 URL (在模块级别计算一次)
const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    try {
      const env = (import.meta as any)?.env || {}
      if (env.VITE_API_URL) {
        return env.VITE_API_URL
      }
    } catch {
      // ignore
    }
  }
  return 'http://localhost:7777'
})()

const DEFAULT_UPLOAD_ENDPOINT = `${API_BASE_URL}/api/v1/media/upload`

// 模块级别的编辑器缓存，避免 HMR 时创建多个实例
const editorCache = new Map<string, BlockNoteEditor>()

// 生成唯一 ID
let editorIdCounter = 0
const generateEditorId = () => `blocknote-${++editorIdCounter}`

export interface BlockNoteEditorProps {
  content?: string
  onChange?: (markdown: string) => void
  editable?: boolean
  placeholder?: string
  className?: string
  authToken?: string | null
  uploadEndpoint?: string
  onInsertImage?: (url: string) => void
}

export const BlockNoteEditorComponent: React.FC<BlockNoteEditorProps> = ({
  content = '',
  onChange,
  editable = true,
  className = '',
  authToken,
  uploadEndpoint = DEFAULT_UPLOAD_ENDPOINT,
}) => {
  const isInitializedRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const authTokenRef = useRef(authToken)
  const uploadEndpointRef = useRef(uploadEndpoint)
  const editorIdRef = useRef<string>(generateEditorId())

  // Update refs when props change
  useEffect(() => {
    authTokenRef.current = authToken
  }, [authToken])

  useEffect(() => {
    uploadEndpointRef.current = uploadEndpoint
  }, [uploadEndpoint])

  // 使用 useState 的懒初始化来创建编辑器
  const [editor] = useState(() => {
    const cachedEditor = editorCache.get(editorIdRef.current)
    if (cachedEditor) {
      return cachedEditor
    }

    const newEditor = BlockNoteEditor.create({
      uploadFile: async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('file', file)

        const headers: Record<string, string> = {}
        if (authTokenRef.current) {
          headers['Authorization'] = `Bearer ${authTokenRef.current}`
        }

        const response = await fetch(uploadEndpointRef.current, {
          method: 'POST',
          headers,
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const result = await response.json()
        if (result.success && result.data?.url) {
          return result.data.url
        }

        throw new Error('Invalid response')
      },
    })

    editorCache.set(editorIdRef.current, newEditor)
    return newEditor
  })

  // Cleanup on unmount
  useEffect(() => {
    const editorId = editorIdRef.current

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      // 从缓存中移除
      editorCache.delete(editorId)
    }
  }, [])

  // Initialize content once
  useEffect(() => {
    if (!editor || isInitializedRef.current) return

    const initContent = () => {
      try {
        if (content) {
          const blocks = editor.tryParseMarkdownToBlocks(content)
          if (blocks.length > 0) {
            editor.replaceBlocks(editor.document, blocks)
          }
        }
      } catch (error) {
        console.error('Failed to initialize content:', error)
      } finally {
        isInitializedRef.current = true
      }
    }

    requestAnimationFrame(() => {
      initContent()
    })
  }, [editor, content])

  // Handle content changes with debounce
  const handleChange = useCallback(() => {
    if (!onChange) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const markdown = editor.blocksToMarkdownLossy(editor.document)
        onChange(markdown)
      } catch (error) {
        console.error('Failed to convert to markdown:', error)
      }
    }, 300)
  }, [editor, onChange])

  return (
    <EditorErrorBoundary>
      <div className={`blocknote-wrapper ${className}`}>
        <BlockNoteView
          editor={editor}
          editable={editable}
          onChange={handleChange}
          theme="light"
          data-theming-css-variables-demo
        />
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

        /* 侧边菜单定位调整 */
        .blocknote-wrapper .bn-side-menu {
          left: 0.5rem !important;
        }

        /* 自定义主题色 */
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

        /* 深色模式 */
        .dark .blocknote-wrapper [data-theming-css-variables-demo] {
          --bn-colors-editor-background: hsl(var(--background));
          --bn-colors-editor-text: hsl(var(--foreground));
        }
      `}</style>
      </div>
    </EditorErrorBoundary>
  )
}

export default BlockNoteEditorComponent
