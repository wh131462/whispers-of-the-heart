# Tiptap 编辑器组件

基于 Tiptap Simple template 的现代化富文本编辑器组件，支持评论和文章编辑。

## 组件列表

### TiptapEditor - 文章编辑器

功能完整的富文本编辑器，适用于文章编写。

```tsx
import TiptapEditor from '@whispers/ui/TiptapEditor'

<TiptapEditor
  content={content}
  onChange={setContent}
  placeholder="开始写作..."
  editable={true}
  showToolbar={true}
  autoHeight={false} // 可选，默认 false
/>
```

**Props:**
- `content?: string` - 编辑器内容（HTML 格式）
- `onChange?: (content: string) => void` - 内容变化回调
- `placeholder?: string` - 占位符文本
- `editable?: boolean` - 是否可编辑，默认 true
- `showToolbar?: boolean` - 是否显示工具栏，默认 true
- `autoHeight?: boolean` - 是否启用自适应高度，默认 false
- `className?: string` - 自定义 CSS 类名
- `authToken?: string` - 认证令牌（用于图片上传等）

### CommentEditor - 评论编辑器

精简的富文本编辑器，适用于评论编写，默认启用自适应高度。

```tsx
import CommentEditor from '@whispers/ui/CommentEditor'

<CommentEditor
  content={commentContent}
  onChange={setCommentContent}
  placeholder="写下你的评论..."
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  submitting={isSubmitting}
  autoHeight={true} // 可选，默认 true
/>
```

**Props:**
- `content?: string` - 编辑器内容（HTML 格式）
- `onChange?: (content: string) => void` - 内容变化回调
- `placeholder?: string` - 占位符文本
- `editable?: boolean` - 是否可编辑，默认 true
- `showToolbar?: boolean` - 是否显示工具栏，默认 true
- `autoHeight?: boolean` - 是否启用自适应高度，默认 true
- `onSubmit?: () => void` - 提交回调
- `onCancel?: () => void` - 取消回调
- `submitting?: boolean` - 是否正在提交
- `clearOnSubmit?: boolean` - 提交后是否自动清空编辑器，默认 true
- `className?: string` - 自定义 CSS 类名

### MarkdownRenderer - Markdown 渲染器

用于渲染 HTML 内容的组件，样式与编辑器保持一致。

```tsx
import MarkdownRenderer from '@whispers/ui/MarkdownRenderer'

<MarkdownRenderer content={htmlContent} />
```

**Props:**
- `content: string` - 要渲染的 HTML 内容
- `className?: string` - 自定义 CSS 类名

## 自适应高度功能

### 文章编辑器

- 默认固定高度（200px-600px）
- 可通过 `autoHeight={true}` 启用自适应高度
- 自适应模式下最小高度 120px，无最大高度限制
- 支持手动调整高度（resize: vertical）

### 评论编辑器

- 默认启用自适应高度
- 最小高度 60px，最大高度 300px
- 可通过 `autoHeight={false}` 禁用自适应高度
- 支持手动调整高度（resize: vertical）

## 样式特性

- **现代化设计**: 参考 Tiptap Simple template 官方设计
- **响应式**: 支持移动端和桌面端
- **暗色模式**: 自动适配系统暗色模式
- **一致性**: 编辑器和渲染器样式完全一致
- **可定制**: 支持自定义 CSS 类名

## 功能特性

### 文章编辑器功能
- 支持粗体、斜体、下划线、删除线、高亮
- 多级标题（H1-H6）
- 有序列表、无序列表、任务列表
- 文本对齐（左、中、右、两端对齐）
- 代码块和行内代码
- 引用块
- 链接和图片插入
- 表格支持
- 撤销/重做功能
- 可选自适应高度

### 评论编辑器功能
- 精简的工具栏
- 较小的标题（H3-H6）
- 基础文本格式
- 列表和引用
- 代码块支持
- 提交/取消按钮
- 默认自适应高度
- 提交后自动清空
- 响应式设计
- 暗色模式支持

## 使用示例

### 基础使用

```tsx
import React, { useState } from 'react'
import TiptapEditor from '@whispers/ui/TiptapEditor'
import CommentEditor from '@whispers/ui/CommentEditor'

function MyComponent() {
  const [content, setContent] = useState('')
  const [comment, setComment] = useState('')

  return (
    <div>
      {/* 文章编辑器 */}
      <TiptapEditor
        content={content}
        onChange={setContent}
        placeholder="开始写作..."
        autoHeight={true}
      />
      
      {/* 评论编辑器 */}
      <CommentEditor
        content={comment}
        onChange={setComment}
        placeholder="写下你的评论..."
        onSubmit={() => console.log('提交评论')}
      />
    </div>
  )
}
```

### 带预览的使用

```tsx
import React, { useState } from 'react'
import TiptapEditor from '@whispers/ui/TiptapEditor'
import MarkdownRenderer from '@whispers/ui/MarkdownRenderer'

function EditorWithPreview() {
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState('')

  const handlePreview = () => {
    setPreview(content)
  }

  return (
    <div>
      <TiptapEditor
        content={content}
        onChange={setContent}
        autoHeight={true}
      />
      
      <button onClick={handlePreview}>
        预览
      </button>
      
      <MarkdownRenderer content={preview} />
    </div>
  )
}
```

### 评论编辑器自动清空功能

```tsx
import React, { useState } from 'react'
import CommentEditor from '@whispers/ui/CommentEditor'

function CommentSection() {
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('评论已提交:', comment)
    setSubmitting(false)
    // 编辑器会自动清空，无需手动处理
  }

  return (
    <CommentEditor
      content={comment}
      onChange={setComment}
      onSubmit={handleSubmit}
      submitting={submitting}
      clearOnSubmit={true} // 默认启用自动清空
    />
  )
}
```

### 禁用自动清空功能

```tsx
import React, { useState } from 'react'
import CommentEditor from '@whispers/ui/CommentEditor'

function CommentSection() {
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('评论已提交:', comment)
    setSubmitting(false)
    // 手动清空编辑器
    setComment('')
  }

  return (
    <CommentEditor
      content={comment}
      onChange={setComment}
      onSubmit={handleSubmit}
      submitting={submitting}
      clearOnSubmit={false} // 禁用自动清空
    />
  )
}
```
