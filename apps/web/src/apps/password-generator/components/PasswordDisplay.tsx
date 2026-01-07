import { cn } from '@/lib/utils';
import { Copy, Check, RefreshCw } from 'lucide-react';

interface PasswordDisplayProps {
  password: string;
  copied: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
}

export function PasswordDisplay({
  password,
  copied,
  onCopy,
  onRegenerate,
}: PasswordDisplayProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-3',
        'bg-zinc-50',
        'border border-zinc-300',
        'rounded-lg'
      )}
    >
      <div
        className={cn(
          'flex-1 font-mono text-sm',
          'text-zinc-800',
          'break-all select-all',
          'py-1'
        )}
      >
        {password}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onRegenerate}
          className={cn(
            'p-2 rounded-lg',
            'text-zinc-500',
            'transition-all duration-150',
            'hover:bg-zinc-200 hover:text-zinc-700',
            'active:scale-95'
          )}
          title="重新生成"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onCopy}
          className={cn(
            'p-2 rounded-lg',
            'transition-all duration-150',
            'active:scale-95',
            copied
              ? 'text-zinc-800 bg-zinc-200'
              : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'
          )}
          title={copied ? '已复制' : '复制'}
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
