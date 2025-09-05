import React, { useCallback, useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { Underline } from '@tiptap/extension-underline'
import { Strike } from '@tiptap/extension-strike'
import { Typography } from '@tiptap/extension-typography'
import { cn } from '../lib/utils'

interface CommentEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  showToolbar?: boolean
  className?: string
  onSubmit?: () => void
  onCancel?: () => void
  submitting?: boolean
  autoHeight?: boolean
  clearOnSubmit?: boolean
}

const CommentEditor: React.FC<CommentEditorProps> = ({
  content = '',
  onChange,
  placeholder = '写下你的评论...',
  editable = true,
  showToolbar = true,
  className,
  onSubmit,
  onCancel,
  submitting = false,
  autoHeight = true,
  clearOnSubmit = true
}) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [3, 4, 5, 6], // 评论中只允许较小的标题
        },
        // 禁用 StarterKit 中的重复扩展，使用自定义配置
        link: false,
        underline: false,
        strike: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Strike,
      Typography,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
      },
    },
  }, [editable, placeholder, autoHeight]) // 移除 content 依赖，避免重绘

  const handleAddLink = useCallback(() => {
    if (linkUrl.trim()) {
      editor?.chain().focus().setLink({ href: linkUrl.trim() }).run()
      setLinkUrl('')
      setLinkDialogOpen(false)
    }
  }, [editor, linkUrl])

  // 监听提交状态，提交完成后清空编辑器
  useEffect(() => {
    if (clearOnSubmit && !submitting && editor) {
      const currentContent = editor.getHTML()
      // 只有在有内容且不是空段落时才清空
      if (currentContent && currentContent !== '<p></p>' && currentContent.trim() !== '') {
        console.log('自动清空编辑器内容:', currentContent)
        // 延迟清空，确保提交动画完成
        const timer = setTimeout(() => {
          editor.commands.clearContent()
          // 通知父组件内容已清空
          onChange?.('')
        }, 200)
        return () => clearTimeout(timer)
      }
    }
  }, [submitting, editor, clearOnSubmit, onChange])

  if (!editor) {
    return null
  }

  return (
    <div className={cn('tiptap-editor comment-editor', autoHeight && 'auto-height', className)}>
      {showToolbar && (
        <div className="tiptap-toolbar">
          {/* 撤销/重做 */}
          <div className="tiptap-toolbar-group">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className="tiptap-toolbar-button"
              title="撤销"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className="tiptap-toolbar-button"
              title="重做"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>

          <div className="tiptap-toolbar-separator" />

          {/* 文本格式 */}
          <div className="tiptap-toolbar-group">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('bold') && 'is-active')}
              title="粗体"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('italic') && 'is-active')}
              title="斜体"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4L6 20M14 4l-4 16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={!editor.can().chain().focus().toggleUnderline().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('underline') && 'is-active')}
              title="下划线"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-3-3m3 3l3-3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('strike') && 'is-active')}
              title="删除线"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l6 0" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l18 0" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              disabled={!editor.can().chain().focus().toggleHighlight().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('highlight') && 'is-active')}
              title="高亮"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </button>
          </div>

          <div className="tiptap-toolbar-separator" />

          {/* 标题 - 只显示较小的标题 */}
          <div className="tiptap-toolbar-group">
            <Select
              value={editor.getAttributes('heading').level?.toString() || 'paragraph'}
              onValueChange={(value: string) => {
                if (value === 'paragraph') {
                  editor.chain().focus().setParagraph().run()
                } else {
                  editor.chain().focus().toggleHeading({ level: parseInt(value) as 3 | 4 | 5 | 6 }).run()
                }
              }}
            >
              <SelectTrigger className="tiptap-toolbar-select">
                <SelectValue placeholder="选择格式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraph">正文</SelectItem>
                <SelectItem value="3">小标题</SelectItem>
                <SelectItem value="4">更小标题</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="tiptap-toolbar-separator" />

          {/* 列表 */}
          <div className="tiptap-toolbar-group">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('bulletList') && 'is-active')}
              title="无序列表"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('orderedList') && 'is-active')}
              title="有序列表"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('taskList') && 'is-active')}
              title="任务列表"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="tiptap-toolbar-separator" />

          {/* 其他功能 */}
          <div className="tiptap-toolbar-group">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('codeBlock') && 'is-active')}
              title="代码块"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('blockquote') && 'is-active')}
              title="引用"
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="tiptap-toolbar-button"
                  title="添加链接"
                >
                  <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>插入链接</DialogTitle>
                  <DialogDescription>
                    请输入链接的URL地址
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddLink()
                      }
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddLink} disabled={!linkUrl.trim()}>
                    插入
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
      <EditorContent editor={editor} />
      
      {/* 操作按钮 */}
      {(onSubmit || onCancel) && (
        <div className="flex justify-end gap-2 p-3 bg-gray-50 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
          )}
          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || !editor?.getText().trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '提交评论'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default CommentEditor
