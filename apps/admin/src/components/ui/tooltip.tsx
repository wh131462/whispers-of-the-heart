import React, { useState } from 'react'
import type { ReactNode } from 'react'

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  className?: string
}

export const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export const Tooltip: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export const TooltipTrigger: React.FC<{ 
  asChild?: boolean
  children: ReactNode 
}> = ({ children }) => {
  return <>{children}</>
}

export const TooltipContent: React.FC<{ 
  children: ReactNode
  className?: string
}> = ({ children }) => {
  return <>{children}</>
}

// 简单的Tooltip实现
export const SimpleTooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div 
          className={`absolute z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-md shadow-lg 
                     bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap
                     before:content-[''] before:absolute before:top-full before:left-1/2 
                     before:transform before:-translate-x-1/2 before:border-4 
                     before:border-transparent before:border-t-gray-900 ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
