import { cn } from '@/lib/utils';
import type { ChatMessage } from '../types';

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isLocal = message.sender === 'local';
  const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
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
          isLocal
            ? 'bg-amber-500 text-white rounded-br-md'
            : 'bg-zinc-100 text-zinc-800 rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>

      {/* 时间 */}
      <span className="text-[10px] text-zinc-400 px-1">{time}</span>
    </div>
  );
}
