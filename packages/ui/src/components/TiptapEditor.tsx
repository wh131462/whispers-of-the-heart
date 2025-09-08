import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Emoji } from '@tiptap/extension-emoji'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { Underline } from '@tiptap/extension-underline'
import { Strike } from '@tiptap/extension-strike'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { FontFamily } from '@tiptap/extension-font-family'
import { Typography } from '@tiptap/extension-typography'
import { Mathematics } from '@tiptap/extension-mathematics'
import { Mention } from '@tiptap/extension-mention'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { createLowlight } from 'lowlight'
import { cn } from '../lib/utils'
import './TiptapEditor.css'

// 导入Markdown序列化器
import { defaultMarkdownSerializer, defaultMarkdownParser, MarkdownParser } from 'prosemirror-markdown'
import { marked } from 'marked'

// 导入语法高亮样式
import 'highlight.js/styles/github.css'

// 配置marked选项
marked.setOptions({
  breaks: true, // 支持换行符
  gfm: true,    // 支持GitHub风格Markdown
})

// 创建 lowlight 实例
const lowlight = createLowlight()

// 导入常用语言
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import bash from 'highlight.js/lib/languages/bash'

// 注册语言
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('python', python)
lowlight.register('java', java)
lowlight.register('cpp', cpp)
lowlight.register('css', css)
lowlight.register('html', html)
lowlight.register('json', json)
lowlight.register('markdown', markdown)
lowlight.register('bash', bash)

// 将编辑器内容转换为Markdown格式的函数
const getMarkdownFromEditor = (editor: any): string => {
  if (!editor) return ''
  
  try {
    const doc = editor.state.doc
    return defaultMarkdownSerializer.serialize(doc)
  } catch (error) {
    console.warn('Failed to serialize to markdown, falling back to HTML:', error)
    return editor.getHTML()
  }
}

// 检查内容是否为Markdown格式
const isMarkdownContent = (content: string): boolean => {
  if (!content || content.trim() === '') return false
  
  // 如果包含HTML标签但不包含Markdown语法，可能是HTML
  const hasHtmlTags = /<[^>]+>/.test(content)
  const hasMarkdownSyntax = [
    /^#{1,6}\s/m,           // 标题
    /\*\*.*?\*\*/,          // 粗体
    /\*.*?\*/,              // 斜体
    /~~.*?~~/,              // 删除线
    /`.*?`/,                // 行内代码
    /```[\s\S]*?```/,       // 代码块
    /^\s*[-*+]\s/m,         // 无序列表
    /^\s*\d+\.\s/m,         // 有序列表
    /^\s*>\s/m,             // 引用
    /^\s*\|.*\|/m,          // 表格
    /^\s*-{3,}/m,           // 分割线
    /\[.*?\]\(.*?\)/,       // 链接
    /!\[.*?\]\(.*?\)/,      // 图片
    /^\s*- \[[x ]\]/m,      // 任务列表
    /\^.*?\^/,              // 上标
    /~.*?~/,                // 下标
  ].some(regex => regex.test(content))
  
  // 如果有Markdown语法，认为是Markdown
  if (hasMarkdownSyntax) return true
  
  // 如果只有HTML标签没有Markdown语法，认为是HTML
  if (hasHtmlTags && !hasMarkdownSyntax) return false
  
  // 其他情况，如果不包含HTML标签，认为可能是纯文本Markdown
  return !hasHtmlTags
}

// 将Markdown内容转换为HTML，然后让TipTap处理
const parseMarkdownContent = async (markdown: string): Promise<string> => {
  if (!markdown || !isMarkdownContent(markdown)) return markdown
  
  try {
    // 使用marked库进行更专业的Markdown解析
    const html = await marked.parse(markdown)
    return html
  } catch (error) {
    console.warn('Failed to parse markdown with marked:', error)
    // 降级到简单的转换
    try {
      let html = markdown
        // 代码块 (必须在行内代码之前处理)
        .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // 标题 (从大到小处理)
        .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
        .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // 引用块
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        // 水平分割线
        .replace(/^---+$/gm, '<hr>')
        // 粗体和斜体 (先处理粗体，再处理斜体)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        // 删除线
        .replace(/~~(.*?)~~/g, '<s>$1</s>')
        // 行内代码
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // 链接
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // 图片
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
        // 任务列表
        .replace(/^- \[x\] (.+)$/gm, '<ul><li><input type="checkbox" checked disabled> $1</li></ul>')
        .replace(/^- \[ \] (.+)$/gm, '<ul><li><input type="checkbox" disabled> $1</li></ul>')
        // 无序列表
        .replace(/^[\s]*[-*+] (.+)$/gm, '<ul><li>$1</li></ul>')
        // 有序列表
        .replace(/^[\s]*\d+\. (.+)$/gm, '<ol><li>$1</li></ol>')
        // 合并连续的列表项
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/<\/ol>\s*<ol>/g, '')
        // 段落处理
        .replace(/\n\s*\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
      
      // 包装在段落中
      if (html && !html.startsWith('<')) {
        html = '<p>' + html + '</p>'
      }
      
      return html
    } catch (fallbackError) {
      console.warn('Fallback parsing also failed:', fallbackError)
      return markdown
    }
  }
}

// 创建 lowlight 实例
// const lowlight = createLowlight()

interface TiptapEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  showToolbar?: boolean
  className?: string
  authToken?: string
  autoHeight?: boolean
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content = '',
  onChange,
  placeholder = '开始写作...',
  editable = true,
  showToolbar = true,
  className,
  authToken,
  autoHeight = false
}) => {
  const isUpdatingFromProps = useRef(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 使用CodeBlockLowlight替代
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        // 禁用 StarterKit 中的重复扩展，使用自定义配置
        link: false,
        underline: false,
        strike: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'tiptap-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Emoji.configure({
        enableEmoticons: true,
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
      Subscript,
      Superscript,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Typography,
      Mathematics,
      Gapcursor,
      // Mention.configure({
      //   HTMLAttributes: {
      //     class: 'mention',
      //   },
      // }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (!isUpdatingFromProps.current) {
        const markdown = getMarkdownFromEditor(editor)
        onChange?.(markdown)
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
      },
    },
  }, [editable, placeholder, autoHeight]) // 移除 content 依赖，避免重绘

  // 当 content 变化时更新编辑器内容（避免在用户编辑时重置）
  useEffect(() => {
    if (editor && content !== getMarkdownFromEditor(editor)) {
      isUpdatingFromProps.current = true
      
      // 异步解析Markdown内容
      const updateContent = async () => {
        try {
          const parsedContent = await parseMarkdownContent(content)
          editor.commands.setContent(parsedContent)
        } catch (error) {
          console.warn('Failed to parse content:', error)
          editor.commands.setContent(content)
        }
        
        // 使用 setTimeout 确保 setContent 完成后再重置标志
        setTimeout(() => {
          isUpdatingFromProps.current = false
        }, 0)
      }
      
      updateContent()
    }
  }, [content, editor])

  const handleAddImage = useCallback(() => {
    if (imageUrl.trim()) {
      editor?.chain().focus().setImage({ src: imageUrl.trim() }).run()
      setImageUrl('')
      setImageDialogOpen(false)
    }
  }, [editor, imageUrl])

  const handleAddLink = useCallback(() => {
    if (linkUrl.trim()) {
      editor?.chain().focus().setLink({ href: linkUrl.trim() }).run()
      setLinkUrl('')
      setLinkDialogOpen(false)
    }
  }, [editor, linkUrl])

  if (!editor) {
    return null
  }

  return (
    <div className={cn('tiptap-editor', autoHeight && 'auto-height', className)}>
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

          {/* 标题 */}
          <div className="tiptap-toolbar-group">
            <Select
              value={editor.getAttributes('heading').level?.toString() || 'paragraph'}
              onValueChange={(value: string) => {
                if (value === 'paragraph') {
                  editor.chain().focus().setParagraph().run()
                } else {
                  editor.chain().focus().toggleHeading({ level: parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6 }).run()
                }
              }}
            >
              <SelectTrigger className="tiptap-toolbar-select">
                <SelectValue placeholder="选择格式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraph">正文</SelectItem>
                <SelectItem value="1">标题 1</SelectItem>
                <SelectItem value="2">标题 2</SelectItem>
                <SelectItem value="3">标题 3</SelectItem>
                <SelectItem value="4">标题 4</SelectItem>
                <SelectItem value="5">标题 5</SelectItem>
                <SelectItem value="6">标题 6</SelectItem>
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
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('orderedList') && 'is-active')}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('taskList') && 'is-active')}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="tiptap-toolbar-separator" />

          {/* 对齐 */}
          <div className="tiptap-toolbar-group">
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={cn('tiptap-toolbar-button', editor.isActive({ textAlign: 'left' }) && 'is-active')}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={cn('tiptap-toolbar-button', editor.isActive({ textAlign: 'center' }) && 'is-active')}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h8M4 14h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={cn('tiptap-toolbar-button', editor.isActive({ textAlign: 'right' }) && 'is-active')}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className={cn('tiptap-toolbar-button', editor.isActive({ textAlign: 'justify' }) && 'is-active')}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16" />
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
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn('tiptap-toolbar-button', editor.isActive('blockquote') && 'is-active')}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="tiptap-toolbar-button"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>

          <div className="tiptap-toolbar-separator" />

          {/* 插入 */}
          <div className="tiptap-toolbar-group">
            <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="tiptap-toolbar-button"
                  title="插入图片"
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>插入图片</DialogTitle>
                  <DialogDescription>
                    请输入图片的URL地址
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddImage()
                      }
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddImage} disabled={!imageUrl.trim()}>
                    插入
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="tiptap-toolbar-button"
                  title="插入链接"
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <button
              type="button"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="tiptap-toolbar-button"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}

export default TiptapEditor