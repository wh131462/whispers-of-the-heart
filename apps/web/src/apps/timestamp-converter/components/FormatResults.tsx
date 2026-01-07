import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormatResultsProps {
  formats: Array<{
    id: string;
    label: string;
    value: string;
  }>;
}

export function FormatResults({ formats }: FormatResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyValue = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // 复制失败时静默处理
    }
  };

  if (formats.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-500 text-sm">
        输入时间戳或选择日期时间查看转换结果
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-zinc-600">转换结果</label>
      <div
        className={cn(
          'divide-y divide-zinc-200',
          'bg-zinc-50 rounded-lg',
          'border border-zinc-200'
        )}
      >
        {formats.map(format => (
          <div
            key={format.id}
            className="flex items-center justify-between px-3 py-2.5"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-zinc-500">{format.label}</span>
              <span className="text-sm text-zinc-800 font-mono truncate">
                {format.value}
              </span>
            </div>
            <button
              onClick={() => copyValue(format.id, format.value)}
              className={cn(
                'p-1.5 rounded hover:bg-zinc-200 transition-colors',
                'text-zinc-500 hover:text-zinc-700'
              )}
            >
              {copiedId === format.id ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
