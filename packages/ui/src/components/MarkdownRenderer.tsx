import React from 'react'
import TiptapEditor from './TiptapEditor'
import { cn } from '../lib/utils'
import './MarkdownRenderer.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={cn('markdown-renderer', className)}>
      <TiptapEditor
        content={content}
        editable={false}
        showToolbar={false}
        className="readonly"
      />
    </div>
  )
}

export default MarkdownRenderer