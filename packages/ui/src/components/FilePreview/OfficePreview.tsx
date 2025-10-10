import React, { useState, useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

export interface OfficePreviewProps {
  url: string
  name: string
  type: 'word' | 'excel' | 'ppt'
  className?: string
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadedData?: () => void
}

// Word文档预览组件
const WordPreview: React.FC<{ url: string; name: string; onError?: (error: string) => void }> = ({ 
  url, 
  name, 
  onError 
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadDocx = async () => {
      try {
        // 动态导入docx-preview
        const { renderAsync } = await import('docx-preview')
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          await renderAsync(arrayBuffer, containerRef.current, undefined, {
            className: 'docx-wrapper',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            experimental: true,
            trimXmlDeclaration: true,
            useBase64URL: false
          })
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Word preview error:', err)
        setError(true)
        setLoading(false)
        onError?.(err instanceof Error ? err.message : 'Word文档加载失败')
      }
    }

    loadDocx()
  }, [url, onError])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-blue-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-gray-600 font-medium">加载Word文档中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Word文档加载失败</h3>
          <p className="text-gray-600 mb-4">请尝试下载文档或在新窗口中打开</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              在线预览
            </a>
            <a
              href={url}
              download={name}
              className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              下载文档
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto bg-white">
      <div ref={containerRef} className="p-8" />
    </div>
  )
}

// Excel表格预览组件
const ExcelPreview: React.FC<{ url: string; name: string; onError?: (error: string) => void }> = ({ 
  url, 
  name, 
  onError 
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [workbook, setWorkbook] = useState<any>(null)
  const [activeSheet, setActiveSheet] = useState(0)

  useEffect(() => {
    const loadExcel = async () => {
      try {
        // 动态导入xlsx
        const XLSX = await import('xlsx')
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        
        setWorkbook(workbook)
        setLoading(false)
      } catch (err) {
        console.error('Excel preview error:', err)
        setError(true)
        setLoading(false)
        onError?.(err instanceof Error ? err.message : 'Excel表格加载失败')
      }
    }

    loadExcel()
  }, [url, onError])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-green-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-green-500 border-t-transparent"></div>
          <p className="text-sm text-gray-600 font-medium">加载Excel表格中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Excel表格加载失败</h3>
          <p className="text-gray-600 mb-4">请尝试下载表格或在新窗口中打开</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              在线预览
            </a>
            <a
              href={url}
              download={name}
              className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              下载表格
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!workbook) return null

  const sheetNames = workbook.SheetNames
  const currentSheet = workbook.Sheets[sheetNames[activeSheet]]

  // 将工作表转换为HTML表格
  const renderSheet = (sheet: any) => {
    const range = sheet['!ref']
    if (!range) return null

    const [start, end] = range.split(':')
    const startCol = start.match(/[A-Z]+/)[0]
    const startRow = parseInt(start.match(/\d+/)[0])
    const endCol = end.match(/[A-Z]+/)[0]
    const endRow = parseInt(end.match(/\d+/)[0])

    const rows = []
    for (let row = startRow; row <= endRow; row++) {
      const cells = []
      for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
        const cellAddress = String.fromCharCode(col) + row
        const cell = sheet[cellAddress]
        const value = cell ? cell.v : ''
        cells.push(
          <td key={cellAddress} className="border border-gray-300 px-2 py-1 text-sm">
            {value}
          </td>
        )
      }
      rows.push(
        <tr key={row}>
          {cells}
        </tr>
      )
    }

    return (
      <table className="border-collapse border border-gray-300">
        <tbody>{rows}</tbody>
      </table>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* 工作表标签 */}
      {sheetNames.length > 1 && (
        <div className="flex border-b border-gray-200 bg-gray-50 p-2 flex-shrink-0">
          {sheetNames.map((sheetName: string, index: number) => (
            <button
              key={index}
              onClick={() => setActiveSheet(index)}
              className={cn(
                "px-3 py-1 text-sm rounded mr-2 transition-colors",
                activeSheet === index
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              )}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}

      {/* 表格内容 */}
      <div className="flex-1 overflow-auto p-4">
        {renderSheet(currentSheet)}
      </div>
    </div>
  )
}

// PowerPoint演示文稿预览组件
const PPTPreview: React.FC<{ url: string; name: string; onError?: (error: string) => void }> = ({ 
  url, 
  name, 
  onError 
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // 暂时使用在线预览服务
    setLoading(false)
  }, [url, onError])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-orange-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-orange-500 border-t-transparent"></div>
          <p className="text-sm text-gray-600 font-medium">加载PPT演示文稿中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-orange-50">
      <div className="text-center p-8">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v8.5a1 1 0 01-1 1h-8a1 1 0 01-1-1V4a1 1 0 011-1z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">PPT演示文稿预览</h3>
        <p className="text-gray-600 mb-4">请使用在线预览服务或下载文件</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            在线预览
          </a>
          <a
            href={url}
            download={name}
            className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下载演示文稿
          </a>
        </div>
      </div>
    </div>
  )
}

export const OfficePreview: React.FC<OfficePreviewProps> = ({
  url,
  name,
  type,
  className,
  onError,
  onLoadStart,
  onLoadedData
}) => {
  useEffect(() => {
    onLoadStart?.()
    // 模拟加载完成
    setTimeout(() => {
      onLoadedData?.()
    }, 100)
  }, [onLoadStart, onLoadedData])

  const renderPreview = () => {
    switch (type) {
      case 'word':
        return <WordPreview url={url} name={name} onError={onError} />
      case 'excel':
        return <ExcelPreview url={url} name={name} onError={onError} />
      case 'ppt':
        return <PPTPreview url={url} name={name} onError={onError} />
      default:
        return null
    }
  }

  return (
    <div className={cn("w-full h-full", className)}>
      {renderPreview()}
    </div>
  )
}

export default OfficePreview
