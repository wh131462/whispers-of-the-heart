import React, { useMemo } from 'react'
import { marked } from 'marked'
import { cn } from '../lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * MarkdownRenderer 组件
 * 
 * 使用说明：
 * - 该组件已内置完整的 Markdown 样式，无需额外的 prose 类名
 * - 如需自定义样式，请通过 className 添加额外类名
 * - 避免同时使用 Tailwind 的 prose 类名，可能会产生样式冲突
 * 
 * 示例：
 * <MarkdownRenderer content={markdownText} className="max-w-none" />
 */

// 配置 marked 选项
marked.setOptions({
  breaks: true,        // 支持换行符
  gfm: true,          // 支持GitHub风格Markdown
})

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  // Generate HTML from markdown content
  const htmlContent = useMemo(() => {
    if (!content || content.trim() === '') return ''
    
    try {
      // 使用 marked 库将 Markdown 转换为 HTML
      const html = marked.parse(content)
      return html
    } catch (error) {
      console.error('Failed to parse markdown:', error)
      // 如果解析失败，返回原始内容并用 <pre> 包装
      return `<pre>${content}</pre>`
    }
  }, [content])

  return (
    <div 
      className={cn('markdown-content', className)}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

export default MarkdownRenderer