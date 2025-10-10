import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronRight, ChevronUp } from "lucide-react"
import { cn } from "../../lib/utils"

export interface TreeNode {
  id: string
  name: string
  children?: TreeNode[]
  disabled?: boolean
  icon?: React.ReactNode
  level?: number
}

interface TreeSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  data: TreeNode[]
  className?: string
  disabled?: boolean
}

interface TreeItemProps {
  node: TreeNode
  level: number
  selectedValue?: string
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, selectedValue }) => {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const hasChildren = node.children && node.children.length > 0
  
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <>
      <div className="relative flex w-full items-center" style={{ paddingLeft: `${8 + level * 16}px` }}>
        {hasChildren && (
          <button
            type="button"
            onClick={handleToggle}
            className="flex items-center justify-center w-4 h-4 mr-1 hover:bg-accent rounded-sm z-10"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        
        <SelectPrimitive.Item
          value={node.id}
          disabled={node.disabled}
          className={cn(
            "flex-1 cursor-pointer select-none items-center rounded-sm py-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            "hover:bg-accent/50 flex"
          )}
        >
          <div className="flex items-center w-full">
            {node.icon && (
              <span className="mr-2 flex items-center">
                {node.icon}
              </span>
            )}
            
            <span className="flex-1 truncate">{node.name}</span>
            
            {selectedValue === node.id && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </div>
        </SelectPrimitive.Item>
      </div>
      
      {hasChildren && isExpanded && node.children?.map((child) => (
        <TreeItem
          key={child.id}
          node={child}
          level={level + 1}
          selectedValue={selectedValue}
        />
      ))}
    </>
  )
}

export const TreeSelect: React.FC<TreeSelectProps> = ({
  value,
  onValueChange,
  placeholder = "选择选项",
  data,
  className,
  disabled = false,
}) => {
  const [selectedValue, setSelectedValue] = React.useState<string | undefined>(value)

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
  }

  const findNodeById = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findNodeById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  const selectedNode = selectedValue ? findNodeById(data, selectedValue) : null

  React.useEffect(() => {
    setSelectedValue(value)
  }, [value])

  return (
    <SelectPrimitive.Root value={selectedValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <div className="flex items-center">
          {selectedNode?.icon && (
            <span className="mr-2 flex items-center">
              {selectedNode.icon}
            </span>
          )}
          <SelectPrimitive.Value placeholder={placeholder}>
            {selectedNode?.name || placeholder}
          </SelectPrimitive.Value>
        </div>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-900 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
          )}
          position="popper"
        >
          <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
            <ChevronUp className="h-4 w-4" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className={cn(
            "p-1",
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}>
            {data.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                level={0}
                selectedValue={selectedValue}
              />
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
            <ChevronDown className="h-4 w-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export default TreeSelect
