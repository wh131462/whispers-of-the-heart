// 工具函数
export { cn } from './lib/utils';

// 样式
import './styles/scrollbar.css';
import './styles/markdown.css';
import '@eternalheart/react-file-preview/style.css';

// 动画常量
export * from './styles/animation';

// 基础组件
export { Button, buttonVariants } from './components/ui/button';
export { Input } from './components/ui/input';
export {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonArticle,
} from './components/ui/skeleton';
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
export { InlineSelect } from './components/ui/inline-select';
export { TreeSelect } from './components/ui/tree-select';
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from './components/ui/popover';
export { FileTree } from './components/ui/file-tree';
export { default as MarkdownRenderer } from './components/markdown-renderer';
export { default as DefaultAvatar } from './components/DefaultAvatar';
export { Avatar, AvatarImage, AvatarFallback } from './components/Avatar';
export { default as BlockNoteEditor } from './components/editor/BlockNoteEditor';
export type { BlockNoteEditorProps } from './components/editor/BlockNoteEditor';
export { default as CommentEditor } from './components/editor/CommentEditor';
export type {
  CommentEditorProps,
  CommentEditorRef,
} from './components/editor/CommentEditor';
export { MediaPicker } from './components/editor/MediaPicker';
export type {
  MediaPickerProps,
  MediaItem,
  MediaType,
  MediaSelectResult,
} from './components/editor/MediaPicker';

// 媒体播放器组件
export { default as AudioPlayer } from './components/AudioPlayer';
export { default as VideoPlayer } from './components/VideoPlayer';

// 动画背景组件
export { default as AnimatedShaderBackground } from './components/background/AnimatedShaderBackground';
export { FallingPattern } from './components/background/FallingPattern';

// 思维导图组件
export { default as MindMapRenderer } from './components/MindMapRenderer';

// BlockNote 自定义块
export {
  CustomImageBlock,
  CustomVideoBlock,
  CustomAudioBlock,
  CustomFileBlock,
  MindMapBlock,
} from './components/editor/blocks';

// 文件类型图标
export { FileTypeIcon } from './components/editor/blocks/shared/FileTypeIcon';

// AI 配置
export type { AIConfig, AIProvider } from './components/editor/ai';
export {
  PROVIDER_DEFAULTS,
  getFullAIConfig,
  validateAIConfig,
} from './components/editor/ai';

// 文件预览组件 (从 @eternalheart/react-file-preview 重新导出)
export * from '@eternalheart/react-file-preview';

// 类型导出
export type { ButtonProps } from './components/ui/button';
export type { InputProps } from './components/ui/input';
export type {
  SkeletonProps,
  SkeletonCardProps,
  SkeletonListProps,
  SkeletonTableProps,
} from './components/ui/skeleton';
export type { TreeNode } from './components/ui/tree-select';
export type { FileNode, FileTreeProps } from './components/ui/file-tree';
export type { AudioPlayerProps } from './components/AudioPlayer';
export type { VideoPlayerProps } from './components/VideoPlayer';
export type { MindMapRendererProps } from './components/MindMapRenderer';
export type { AnimatedShaderBackgroundProps } from './components/background/AnimatedShaderBackground';
export type { FallingPatternProps } from './components/background/FallingPattern';
