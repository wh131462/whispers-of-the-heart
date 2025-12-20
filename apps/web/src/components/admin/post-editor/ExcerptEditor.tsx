import React, { useState, useEffect } from 'react'
import { Popover, PopoverTrigger, PopoverContent, Button } from '@whispers/ui'
import { Sparkles } from 'lucide-react'

interface ExcerptEditorProps {
  excerpt: string
  onChange: (excerpt: string) => void
  onGenerate: () => void
  canGenerate: boolean
  maxLength?: number
}

const ExcerptEditor: React.FC<ExcerptEditorProps> = ({
  excerpt,
  onChange,
  onGenerate,
  canGenerate,
  maxLength = 200
}) => {
  const [open, setOpen] = useState(false)
  const [localExcerpt, setLocalExcerpt] = useState(excerpt)

  // 同步外部值
  useEffect(() => {
    setLocalExcerpt(excerpt)
  }, [excerpt])

  const handleSave = () => {
    onChange(localExcerpt)
    setOpen(false)
  }

  const handleGenerate = () => {
    onGenerate()
    // 生成后不关闭，让用户可以看到结果并编辑
  }

  // 触发器内容
  const TriggerContent = () => {
    if (!excerpt) {
      return (
        <span className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          添加摘要...
        </span>
      )
    }

    return (
      <span className="text-sm text-foreground line-clamp-2">
        {excerpt}
      </span>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full text-left min-h-[28px] flex items-start">
          <TriggerContent />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-0 bg-popover border-border"
      >
        <div className="p-3 space-y-3">
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">文章摘要</span>
            <span className="text-xs text-muted-foreground">
              {localExcerpt.length}/{maxLength}
            </span>
          </div>

          {/* 文本框 */}
          <textarea
            value={localExcerpt}
            onChange={(e) => setLocalExcerpt(e.target.value.slice(0, maxLength))}
            placeholder="输入文章摘要，用于列表展示和 SEO..."
            rows={4}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              自动生成
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ExcerptEditor
