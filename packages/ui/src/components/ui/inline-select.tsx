import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../../lib/utils'

export interface InlineSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
  triggerClassName?: string
  contentClassName?: string
  placeholder?: string
  disabled?: boolean
  maxWidth?: number
  minWidth?: number
}

export const InlineSelect: React.FC<InlineSelectProps> = ({
  value,
  onValueChange,
  options,
  className,
  triggerClassName,
  contentClassName,
  placeholder = "选择...",
  disabled = false,
  maxWidth = 300,
  minWidth = 80
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const selectRef = useRef<HTMLSpanElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // 计算下拉框位置和宽度
  const calculatePosition = useCallback(() => {
    if (!selectRef.current) return

    const triggerRect = selectRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // 计算内容宽度
    let contentWidth = minWidth
    
    // 根据选项内容计算最佳宽度
    if (contentRef.current) {
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.visibility = 'hidden'
      tempDiv.style.whiteSpace = 'nowrap'
      tempDiv.style.fontSize = '14px' // 匹配 text-sm
      tempDiv.style.fontFamily = 'inherit'
      
      // 找到最长的选项文本
      let maxTextWidth = 0
      options.forEach(option => {
        tempDiv.textContent = option.label
        document.body.appendChild(tempDiv)
        const textWidth = tempDiv.getBoundingClientRect().width
        maxTextWidth = Math.max(maxTextWidth, textWidth)
        document.body.removeChild(tempDiv)
      })
      
      // 加上 padding 和 border 的宽度
      contentWidth = Math.max(minWidth, Math.min(maxWidth, maxTextWidth + 32))
    }

    let top = triggerRect.bottom + 4
    let left = triggerRect.left

    // 边界检测
    if (left < 8) left = 8
    if (left + contentWidth > viewportWidth - 8) left = viewportWidth - contentWidth - 8
    if (top + 200 > viewportHeight) top = triggerRect.top - 200 - 4
    if (top < 8) top = 8

    setPosition({ top, left, width: contentWidth })
  }, [options, minWidth, maxWidth])

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        selectRef.current &&
        contentRef.current &&
        !selectRef.current.contains(target) &&
        !contentRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ESC 键关闭下拉框
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // 监听滚动和resize
  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => calculatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, calculatePosition])

  // 计算初始位置
  useEffect(() => {
    if (isOpen) {
      calculatePosition()
    } else {
      setPosition(null)
    }
  }, [isOpen, calculatePosition])

  const selectedOption = options.find(option => option.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setIsOpen(false)
  }

  return (
    <span ref={selectRef} className={cn("relative inline-block", className)}>
      {/* 触发按钮 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 px-1 py-0.5 rounded text-sm",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName
        )}
      >
        {displayValue}
      </button>

      {/* 下拉框 */}
      {isOpen && position && (
        <div
          ref={contentRef}
          className={cn(
            "fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50",
            "transition-all duration-200 ease-in-out",
            contentClassName
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            zIndex: 10000000,
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm",
                value === option.value && "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
              )}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </span>
  )
}

export default InlineSelect
