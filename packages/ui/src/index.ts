// 工具函数
export { cn } from './lib/utils'

// 样式
import './styles/scrollbar.css'
import './styles/markdown.css'
import '@eternalheart/react-file-preview/style.css'

// 动画常量
export * from './styles/animation'

// 基础组件
export { Button, buttonVariants } from './components/ui/button'
export { Input } from './components/ui/input'
export { Skeleton, SkeletonCard, SkeletonList, SkeletonTable, SkeletonArticle } from './components/ui/skeleton'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
export { InlineSelect } from './components/ui/inline-select'
export { TreeSelect } from './components/ui/tree-select'
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
export { Popover, PopoverTrigger, PopoverContent } from './components/ui/popover'
export { default as MarkdownRenderer } from './components/MarkdownRenderer'
export { default as DefaultAvatar } from './components/DefaultAvatar'
export { Avatar, AvatarImage, AvatarFallback } from './components/Avatar'
export { default as BlockNoteEditor } from './components/BlockNoteEditor'
export type { BlockNoteEditorProps } from './components/BlockNoteEditor'

// 媒体播放器组件
export { default as AudioPlayer } from './components/AudioPlayer'
export { default as VideoPlayer } from './components/VideoPlayer'

// 文件预览组件 (从 @eternalheart/react-file-preview 重新导出)
export * from '@eternalheart/react-file-preview'

// 类型导出
export type { ButtonProps } from './components/ui/button'
export type { InputProps } from './components/ui/input'
export type { SkeletonProps, SkeletonCardProps, SkeletonListProps, SkeletonTableProps } from './components/ui/skeleton'
export type { TreeNode } from './components/ui/tree-select'
export type { AudioPlayerProps } from './components/AudioPlayer'
export type { VideoPlayerProps } from './components/VideoPlayer'
