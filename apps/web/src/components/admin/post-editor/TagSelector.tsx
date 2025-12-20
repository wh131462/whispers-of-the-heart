import React, { useState, useMemo } from 'react'
import { Popover, PopoverTrigger, PopoverContent, Input, Button } from '@whispers/ui'
import { X, Plus, Check, Search } from 'lucide-react'

interface Tag {
  id: string
  name: string
  slug: string
  color?: string
}

interface TagSelectorProps {
  selectedTags: string[]
  availableTags: Tag[]
  onAdd: (tagName: string) => void
  onRemove: (tagName: string) => void
  onCreate?: (tagName: string) => void
}

const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  availableTags,
  onAdd,
  onRemove,
  onCreate
}) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const filteredTags = useMemo(() => {
    if (!searchValue.trim()) return availableTags
    return availableTags.filter(tag =>
      tag.name.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [availableTags, searchValue])

  const canCreateTag = useMemo(() => {
    if (!searchValue.trim()) return false
    const exists = availableTags.some(
      tag => tag.name.toLowerCase() === searchValue.toLowerCase()
    )
    return !exists && onCreate
  }, [searchValue, availableTags, onCreate])

  const handleSelectTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onRemove(tagName)
    } else {
      onAdd(tagName)
    }
  }

  const handleCreateTag = () => {
    if (canCreateTag && onCreate) {
      onCreate(searchValue.trim())
      onAdd(searchValue.trim())
      setSearchValue('')
    }
  }

  // 触发器内容 - 显示已选标签或占位符
  const TriggerContent = () => {
    if (selectedTags.length === 0) {
      return (
        <span className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          添加标签...
        </span>
      )
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary"
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(tag)
              }}
              className="ml-1 hover:text-primary/70 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full text-left min-h-[28px] flex items-center">
          <TriggerContent />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-0 bg-popover border-border"
      >
        {/* 搜索框 */}
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索或创建标签..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canCreateTag) {
                  handleCreateTag()
                }
              }}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* 已选择标签 */}
        {selectedTags.length > 0 && (
          <div className="p-2 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2">已选择</p>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => onRemove(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 标签列表 */}
        <div className="max-h-48 overflow-y-auto p-1">
          {filteredTags.length === 0 && !canCreateTag ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              没有找到标签
            </div>
          ) : (
            <>
              {filteredTags.map(tag => {
                const isSelected = selectedTags.includes(tag.name)
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleSelectTag(tag.name)}
                    className={`
                      w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm
                      transition-colors
                      ${isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <span>{tag.name}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                )
              })}
            </>
          )}
        </div>

        {/* 创建新标签 */}
        {canCreateTag && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateTag}
              className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              创建 "{searchValue.trim()}"
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default TagSelector
