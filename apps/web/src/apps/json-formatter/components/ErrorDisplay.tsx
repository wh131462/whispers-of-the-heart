import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JsonStats } from '../types';

interface ErrorDisplayProps {
  error: string | null;
  isValid: boolean;
  stats: JsonStats | null;
  hasInput: boolean;
}

export function ErrorDisplay({
  error,
  isValid,
  stats,
  hasInput,
}: ErrorDisplayProps) {
  if (!hasInput) {
    return null;
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex items-start gap-2 p-3',
          'bg-red-50 rounded-lg',
          'border border-red-200'
        )}
      >
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-600">JSON 格式错误</p>
          <p className="text-xs text-red-500 mt-1 break-all">{error}</p>
        </div>
      </div>
    );
  }

  if (isValid && stats) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-3',
          'bg-emerald-50 rounded-lg',
          'border border-emerald-200'
        )}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <p className="text-sm text-emerald-600">有效的 JSON</p>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs text-zinc-600">
          {stats.keys > 0 && <span>{stats.keys} 个键</span>}
          {stats.arrays > 0 && <span>{stats.arrays} 个数组</span>}
          {stats.objects > 0 && <span>{stats.objects} 个对象</span>}
          <span>深度 {stats.depth}</span>
        </div>
      </div>
    );
  }

  return null;
}
