import React, { useEffect, useRef, useCallback } from 'react'
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import '@blocknote/mantine/style.css'
import { customSchema } from './customSchema'

// 修复表格 markdown 输出：移除空表头行
const fixTableMarkdown = (markdown: string): string => {
  const tableRegex = /(\|[^\n]*\|)\n(\|[\s\-:]+\|)\n((?:\|[^\n]*\|\n?)+)/g

  return markdown.replace(tableRegex, (match, headerRow, separatorRow, dataRows) => {
    const headerCells = headerRow.split('|').slice(1, -1)
    const isEmptyHeader = headerCells.every((cell: string) => cell.trim() === '')

    if (isEmptyHeader) {
      const dataLines = dataRows.trim().split('\n')
      if (dataLines.length > 0) {
        const newHeader = dataLines[0]
        const remainingData = dataLines.slice(1).join('\n')
        if (remainingData) {
          return `${newHeader}\n${separatorRow}\n${remainingData}\n`
        } else {
          return `${newHeader}\n${separatorRow}\n`
        }
      }
    }

    return match
  })
}

// 从 blocks 中提取代码块内容，用于修复 markdown 中的空代码块
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractCodeBlocks = (blocks: any[]): Array<{ language: string; code: string }> => {
  const codeBlocks: Array<{ language: string; code: string }> = []

  const traverse = (block: any) => {
    if (block.type === 'codeBlock' && block.props) {
      codeBlocks.push({
        language: block.props.language || 'javascript',
        code: block.props.code || '',
      })
    }
    if (block.children) {
      block.children.forEach(traverse)
    }
  }

  blocks.forEach(traverse)
  return codeBlocks
}

// 修复 markdown 中的空代码块
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fixCodeBlocksInMarkdown = (markdown: string, blocks: any[]): string => {
  const codeBlocks = extractCodeBlocks(blocks)

  if (codeBlocks.length === 0) return markdown

  // 匹配 markdown 中的代码块
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let index = 0

  return markdown.replace(codeBlockRegex, (match, _lang, content) => {
    // 如果内容为空或只有空白，用实际的代码替换
    if (!content.trim() && codeBlocks[index]) {
      const actualCode = codeBlocks[index]
      index++
      return `\`\`\`${actualCode.language}\n${actualCode.code}\n\`\`\``
    }
    index++
    return match
  })
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
  // 用于防止初始化时触发 onChange
  const isUpdatingFromPropRef = useRef(false)

  // Update refs when props change
  useEffect(() => {
    authTokenRef.current = authToken
  }, [authToken])

  useEffect(() => {
    uploadEndpointRef.current = uploadEndpoint
  }, [uploadEndpoint])

  // 使用 useCreateBlockNote hook 创建编辑器实例
  // 这个 hook 内部会处理 memoization，确保编辑器实例只创建一次
  const editor = useCreateBlockNote({
    schema: customSchema,
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

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Initialize content once
  useEffect(() => {
    if (!editor || isInitializedRef.current) return

    const initContent = () => {
      // 设置标志，防止 replaceBlocks 触发的 onChange 被处理
      isUpdatingFromPropRef.current = true

      try {
        if (content) {
          console.log('[BlockNoteEditor] Input markdown:', content)
          const blocks = editor.tryParseMarkdownToBlocks(content)
          console.log('[BlockNoteEditor] Parsed blocks:', JSON.stringify(blocks, null, 2))
          if (blocks.length > 0) {
            editor.replaceBlocks(editor.document, blocks)
          }
        }
      } catch (error) {
        console.error('Failed to initialize content:', error)
      } finally {
        isInitializedRef.current = true
        // 使用 Promise.resolve 确保在下一个微任务中重置标志
        Promise.resolve().then(() => {
          isUpdatingFromPropRef.current = false
        })
      }
    }

    requestAnimationFrame(() => {
      initContent()
    })
  }, [editor, content])

  // Handle content changes with debounce
  const handleChange = useCallback(() => {
    // 如果正在从 prop 更新内容，跳过 onChange
    if (isUpdatingFromPropRef.current) {
      console.log('[BlockNoteEditor] Skipping onChange during initialization')
      return
    }

    if (!onChange) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const blocks = editor.document
        // Debug: 查看 blocks 结构
        console.log('[BlockNoteEditor] Current blocks:', JSON.stringify(blocks, null, 2))
        let markdown = editor.blocksToMarkdownLossy(blocks)
        console.log('[BlockNoteEditor] Raw markdown:', markdown)

        // 修复空代码块问题（BlockNote 的 React 渲染时序问题）
        markdown = fixCodeBlocksInMarkdown(markdown, blocks)
        // 修复表格问题
        markdown = fixTableMarkdown(markdown)

        console.log('[BlockNoteEditor] Fixed markdown:', markdown)
        onChange(markdown)
      } catch (error) {
        console.error('Failed to convert to markdown:', error)
      }
    }, 300)
  }, [editor, onChange])

  return (
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

        .blocknote-wrapper .bn-side-menu {
          left: 0.5rem !important;
        }

        /* 移除代码块默认背景色 */
        .blocknote-wrapper .bn-block-content[data-content-type="codeBlock"] {
          background: transparent !important;
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
  )
}

export default BlockNoteEditorComponent
