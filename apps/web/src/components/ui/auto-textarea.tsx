import React, { useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number
  maxRows?: number
}

const AutoTextarea = React.forwardRef<HTMLTextAreaElement, AutoTextareaProps>(
  ({ className, minRows = 1, maxRows = 10, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      const adjustHeight = () => {
        // 重置高度以获取正确的scrollHeight
        textarea.style.height = 'auto'
        
        // 计算行高
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
        const minHeight = lineHeight * minRows
        const maxHeight = lineHeight * maxRows
        
        // 设置高度
        const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
        textarea.style.height = `${newHeight}px`
      }

      // 初始调整
      adjustHeight()

      // 监听输入变化
      textarea.addEventListener('input', adjustHeight)
      
      // 监听窗口大小变化
      window.addEventListener('resize', adjustHeight)

      return () => {
        textarea.removeEventListener('input', adjustHeight)
        window.removeEventListener('resize', adjustHeight)
      }
    }, [minRows, maxRows])

    return (
      <textarea
        ref={ref || textareaRef}
        className={cn(
          'flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          className
        )}
        {...props}
      />
    )
  }
)

AutoTextarea.displayName = 'AutoTextarea'

export { AutoTextarea }
