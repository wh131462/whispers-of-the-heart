import { useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 border-t border-zinc-200 bg-zinc-50">
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? '等待连接...' : '输入消息，Enter 发送'}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 px-3 py-2 rounded-lg text-sm',
            'bg-white border border-zinc-200',
            'resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20',
            'disabled:opacity-50 disabled:bg-zinc-100'
          )}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={cn(
            'p-2 rounded-lg',
            'bg-amber-500 text-white',
            'hover:bg-amber-600 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
