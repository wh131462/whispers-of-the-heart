import React, { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import MarkdownRenderer from '../MarkdownRenderer'

export interface TextPreviewProps {
  url: string
  name: string
  className?: string
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadedData?: () => void
  onStatsChange?: (stats: { characters: number; lines: number }) => void
  wordWrap?: boolean
  fontSize?: number
  lineHeight?: number
}

export const TextPreview: React.FC<TextPreviewProps> = ({
  url,
  name,
  className,
  onError,
  onLoadStart,
  onLoadedData,
  onStatsChange,
  wordWrap = true,
  fontSize = 14,
  lineHeight = 1.5
}) => {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  const isMarkdown = name.toLowerCase().endsWith('.md') || name.toLowerCase().endsWith('.markdown')
  const isCodeFile = /\.(js|ts|jsx|tsx|css|scss|sass|less|html|htm|xml|json|yaml|yml|sql|py|java|cpp|c|php|rb|go|rs|swift|kt|vue|svelte)$/i.test(name)
  const isConfigFile = /\.(conf|config|ini|cfg|env|properties|toml|yaml|yml|json)$/i.test(name)
  
  useEffect(() => {
    onLoadStart?.()
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.text()
      })
      .then(text => {
        setContent(text)
        setLoading(false)
        onLoadedData?.()
        onStatsChange?.({ characters: text.length, lines: text.split('\n').length })
      })
      .catch((error) => {
        console.error('TextPreview fetch error:', error)
        setError(true)
        setLoading(false)
        onError?.(error.message || '文本加载失败')
      })
  }, [url, onError, onLoadStart, onLoadedData])
  
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-gray-600 font-medium">加载文本中...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">文本加载失败</h3>
          <p className="text-gray-600 mb-2">请检查文本链接是否正确</p>
          <p className="text-sm text-gray-500">URL: {url}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("w-full h-full flex flex-col bg-white", className)}>
      {/* 内容区域 */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isMarkdown ? (
          <div className="bg-white h-full overflow-auto">
            <div className="h-full p-4">
              <MarkdownRenderer 
                content={content}
                className="max-w-none"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white h-full overflow-auto">
            <div className="h-full">
              <pre 
                className={cn(
                  "font-mono text-gray-800 bg-gray-50 p-4 h-full overflow-auto",
                  wordWrap ? "overflow-x-hidden" : "overflow-x-auto"
                )}
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                  whiteSpace: wordWrap ? 'pre-wrap' : 'pre'
                }}
              >
                {content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TextPreview
