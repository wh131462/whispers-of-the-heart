import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import {
  FilePreviewModal,
  type PreviewFileLink,
} from '@eternalheart/react-file-preview';
import '@eternalheart/react-file-preview/style.css';
import type { ChatMessage } from '../types';

interface MessageItemProps {
  message: ChatMessage;
  onRetry?: (messageId: string) => void;
}

export function MessageItem({ message, onRetry }: MessageItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isLocal = message.sender === 'local';
  const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 构建预览文件列表
  const previewFiles: PreviewFileLink[] = useMemo(() => {
    if (message.type !== 'image') return [];
    return [
      {
        id: message.id,
        name: `图片-${time}`,
        url: message.content,
        type: 'image/png',
      },
    ];
  }, [message.id, message.type, message.content, time]);

  const renderContent = () => {
    if (message.type === 'image') {
      if (imageError) {
        return <div className="text-sm text-zinc-500 italic">图片加载失败</div>;
      }
      return (
        <div className="relative">
          {!imageLoaded && (
            <div className="w-40 h-32 bg-zinc-200 rounded animate-pulse" />
          )}
          <img
            src={message.content}
            alt="图片消息"
            className={cn(
              'max-w-[200px] max-h-[200px] rounded cursor-pointer',
              !imageLoaded && 'hidden'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            onClick={() => setIsPreviewOpen(true)}
          />
        </div>
      );
    }

    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {message.content}
      </p>
    );
  };

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-1',
          isLocal ? 'items-end' : 'items-start'
        )}
      >
        {/* 发送者名称 */}
        <span
          className={cn(
            'text-[11px] font-medium px-1',
            isLocal ? 'text-amber-600' : 'text-zinc-500'
          )}
        >
          {message.senderName}
        </span>

        {/* 消息气泡 */}
        <div
          className={cn(
            'max-w-[80%] px-3 py-2 rounded-2xl',
            message.type === 'image' && 'p-1.5',
            isLocal
              ? 'bg-amber-500 text-white rounded-br-md'
              : 'bg-zinc-100 text-zinc-800 rounded-bl-md'
          )}
        >
          {renderContent()}
        </div>

        {/* 时间和送达状态 */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] text-zinc-400">{time}</span>
          {isLocal && message.deliveryStatus && (
            <span
              className={cn(
                'text-[10px]',
                message.deliveryStatus === 'delivered' && 'text-emerald-600',
                message.deliveryStatus === 'sending' && 'text-amber-600',
                message.deliveryStatus === 'partial' && 'text-orange-600',
                message.deliveryStatus === 'failed' && 'text-red-600'
              )}
            >
              {message.deliveryStatus === 'delivered'
                ? '已送达'
                : message.deliveryStatus === 'sending'
                  ? message.totalPeers && message.totalPeers > 1
                    ? `发送中 ${message.deliveredPeers || 0}/${message.totalPeers}`
                    : '发送中'
                  : message.deliveryStatus === 'partial'
                    ? `部分送达 ${message.deliveredPeers || 0}/${message.totalPeers || 0}`
                    : '发送失败'}
            </span>
          )}
          {isLocal &&
            (message.deliveryStatus === 'failed' ||
              message.deliveryStatus === 'partial') &&
            onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.id)}
                className="inline-flex items-center gap-1 text-[10px] text-red-600 hover:text-red-700"
              >
                <RefreshCw className="w-3 h-3" />
                重试
              </button>
            )}
        </div>
        {isLocal &&
          message.deliveryError &&
          message.deliveryStatus === 'failed' && (
            <span className="text-[10px] text-red-500 px-1 max-w-[80%] text-right">
              {message.deliveryError}
            </span>
          )}
      </div>

      {/* 图片预览模态框 */}
      {message.type === 'image' && (
        <FilePreviewModal
          files={previewFiles}
          currentIndex={0}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onNavigate={() => {}}
        />
      )}
    </>
  );
}
