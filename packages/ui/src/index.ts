// 工具函数
export { cn } from './lib/utils'

// 基础组件
export { Button, buttonVariants } from './components/ui/button'
export { Input } from './components/ui/input'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
export { Player } from './components/player'
export { default as MarkdownRenderer } from './components/MarkdownRenderer'
export { default as DefaultAvatar } from './components/DefaultAvatar'
export { Avatar, AvatarImage, AvatarFallback } from './components/Avatar'
export { default as TiptapEditor } from './components/TiptapEditor'
export { default as CommentEditor } from './components/CommentEditor'

// 媒体播放器组件
export { default as AudioPlayer } from './components/AudioPlayer'
export { default as VideoPlayer } from './components/VideoPlayer'

// 文件预览组件
export { FilePreview } from './components/FilePreview'
export { FilePreviewModal } from './components/FilePreviewModal'
export { FilePreviewList } from './components/FilePreviewList'

// 类型导出
export type { ButtonProps } from './components/ui/button'
export type { InputProps } from './components/ui/input'
export type { PlayerProps } from './components/player'
export type { AudioPlayerProps } from './components/AudioPlayer'
export type { VideoPlayerProps } from './components/VideoPlayer'
export type { FilePreviewProps } from './components/FilePreview'
export type { FilePreviewModalProps } from './components/FilePreviewModal'
export type { FilePreviewListProps } from './components/FilePreviewList'
