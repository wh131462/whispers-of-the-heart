import React from 'react'
import type { LucideProps } from 'lucide-react'

interface PropertyRowProps {
  icon: React.ComponentType<LucideProps>
  label: string
  children: React.ReactNode
  className?: string
}

const PropertyRow: React.FC<PropertyRowProps> = ({
  icon: Icon,
  label,
  children,
  className = ''
}) => {
  return (
    <div
      className={`
        flex items-start gap-2 py-1.5 px-1 -mx-1
        rounded-md transition-colors duration-150
        hover:bg-muted/50 group
        ${className}
      `}
    >
      {/* 图标和标签 */}
      <div className="flex items-center gap-2 w-24 flex-shrink-0 h-7">
        <Icon className="h-4 w-4 text-muted-foreground/70" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}

export default PropertyRow
