import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '../lib/utils'
import './MarkdownRenderer.css'

// 导入代码高亮样式
import 'highlight.js/styles/github.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={cn('markdown-renderer prose prose-lg max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm, // 支持GitHub风格Markdown
          remarkBreaks // 支持换行符
        ]}
        rehypePlugins={[
          rehypeHighlight, // 代码高亮
          rehypeRaw // 支持HTML标签
        ]}
        components={{
          // 自定义代码块样式
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            return isInline ? (
              <code className={cn('bg-gray-100 px-1 py-0.5 rounded text-sm font-mono', className)} {...props}>
                {children}
              </code>
            ) : (
              <code className={cn('hljs block', className)} {...props}>
                {children}
              </code>
            )
          },
          // 自定义代码块容器
          pre: ({ children, className, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : 'text'
            return (
              <div className="code-block-wrapper my-4">
                <div className="code-block-header bg-gray-100 px-3 py-1 text-xs text-gray-600 border-b">
                  {language}
                </div>
                <pre className={cn('hljs overflow-x-auto p-4', className)} {...props}>
                  {children}
                </pre>
              </div>
            )
          },
          // 自定义表格样式
          table: ({ children }: any) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }: any) => (
            <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }: any) => (
            <td className="border border-gray-300 px-4 py-2">
              {children}
            </td>
          ),
          // 自定义引用块样式
          blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic">
              {children}
            </blockquote>
          ),
          // 自定义链接样式
          a: ({ href, children }: any) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),
          // 自定义图片样式
          img: ({ src, alt }: any) => (
            <div className="image-wrapper my-4 text-center">
              <img 
                src={src} 
                alt={alt}
                className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                loading="lazy"
              />
              {alt && (
                <div className="image-caption text-sm text-gray-500 mt-2 italic">
                  {alt}
                </div>
              )}
            </div>
          ),
          // 自定义标题样式，添加锚点链接
          h1: ({ children, ...props }: any) => (
            <h1 className="text-3xl font-bold mb-4 mt-6 pb-2 border-b border-gray-200" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }: any) => (
            <h2 className="text-2xl font-semibold mb-3 mt-5" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }: any) => (
            <h3 className="text-xl font-semibold mb-2 mt-4" {...props}>
              {children}
            </h3>
          ),
          // 自定义段落样式
          p: ({ children, ...props }: any) => (
            <p className="mb-4 leading-relaxed" {...props}>
              {children}
            </p>
          ),
          // 自定义列表样式
          ul: ({ children, ...props }: any) => (
            <ul className="list-disc list-inside mb-4 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }: any) => (
            <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }: any) => (
            <li className="mb-1" {...props}>
              {children}
            </li>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer