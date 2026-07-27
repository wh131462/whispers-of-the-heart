import {
  useState,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
  type ClipboardEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { Send, Smile, Image as ImageIcon, X } from 'lucide-react';
import { useToastContext } from '@/contexts/ToastContext';
import type { MessageType } from '../types';

// 常用表情列表
const EMOJI_LIST = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '🤣',
  '😂',
  '🙂',
  '😉',
  '😊',
  '😇',
  '🥰',
  '😍',
  '🤩',
  '😘',
  '😋',
  '😛',
  '😜',
  '🤪',
  '😝',
  '🤑',
  '🤗',
  '🤭',
  '🤫',
  '🤔',
  '🤐',
  '🤨',
  '😐',
  '😑',
  '😶',
  '😏',
  '😒',
  '🙄',
  '😬',
  '😮',
  '😯',
  '😲',
  '😳',
  '🥺',
  '😦',
  '😧',
  '😨',
  '😰',
  '😥',
  '😢',
  '😭',
  '😱',
  '😖',
  '😣',
  '😞',
  '😓',
  '😩',
  '😫',
  '🥱',
  '😤',
  '😡',
  '😠',
  '🤬',
  '👍',
  '👎',
  '👏',
  '🙌',
  '🤝',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🖤',
  '🤍',
  '💯',
  '✨',
  '🔥',
  '💪',
  '🎉',
  '🎊',
  '👀',
  '💬',
];

interface MessageInputProps {
  onSend: (content: string, type: MessageType) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToastContext();

  // 自动调整 textarea 高度
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // 最大 120px
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  const handleSend = useCallback(() => {
    if (disabled) return;

    // 发送图片
    if (imagePreview) {
      onSend(imagePreview, 'image');
      setImagePreview(null);
      return;
    }

    // 发送文本
    const trimmed = value.trim();
    if (trimmed) {
      onSend(trimmed, 'text');
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [value, imagePreview, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const handleEmojiClick = (emoji: string) => {
    setValue(prev => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
    setTimeout(adjustHeight, 0);
  };

  // 处理图片文件（分块发送已在 useWebRTC 中实现，无需压缩）
  const processImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;

      // 限制原始文件大小为 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('图片大小不能超过 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        toast.error('图片读取失败');
      };
      reader.readAsDataURL(file);
    },
    [toast]
  );

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // 清空 input 以便重复选择同一文件
    e.target.value = '';
  };

  // 处理粘贴事件
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
          }
          return;
        }
      }
    },
    [processImageFile]
  );

  const canSend = imagePreview || value.trim();

  return (
    <div className="relative border-t border-zinc-200 bg-zinc-50">
      {/* 图片预览 - 浮动在输入框上方 */}
      {imagePreview && (
        <div className="absolute bottom-full left-3 mb-2">
          <div className="relative inline-block shadow-lg rounded-lg">
            <img
              src={imagePreview}
              alt="预览"
              className="max-h-32 rounded-lg border border-zinc-200"
            />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-zinc-700 text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 表情面板 - 气泡弹窗浮动在按钮上方 */}
      {showEmoji && (
        <div className="absolute bottom-full left-3 mb-2">
          <div className="p-2 bg-white rounded-lg border border-zinc-200 shadow-lg">
            <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
              {EMOJI_LIST.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => handleEmojiClick(emoji)}
                  className="p-1.5 text-lg hover:bg-zinc-100 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* 气泡箭头 */}
            <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white border-r border-b border-zinc-200 rotate-45" />
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-3">
        <div className="flex gap-2 items-end">
          {/* 功能按钮 */}
          <div className="flex gap-1 pb-1">
            <button
              onClick={() => setShowEmoji(prev => !prev)}
              disabled={disabled}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                showEmoji
                  ? 'bg-amber-100 text-amber-600'
                  : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="表情"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                'p-1.5 rounded-lg text-zinc-400',
                'hover:text-zinc-600 hover:bg-zinc-100 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="发送图片"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* 文本输入框 */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              disabled
                ? '等待对方的数据通道...'
                : imagePreview
                  ? '点击发送图片'
                  : '输入消息，可粘贴图片'
            }
            disabled={disabled || !!imagePreview}
            rows={1}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm',
              'bg-white border border-zinc-200',
              'resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20',
              'disabled:opacity-50 disabled:bg-zinc-100',
              'min-h-[38px] max-h-[120px] overflow-y-auto'
            )}
          />

          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            disabled={disabled || !canSend}
            className={cn(
              'p-2 rounded-lg mb-0.5',
              'bg-amber-500 text-white',
              'hover:bg-amber-600 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
