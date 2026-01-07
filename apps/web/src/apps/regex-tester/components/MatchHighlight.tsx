import { cn } from '@/lib/utils';

interface MatchHighlightProps {
  segments: Array<{ text: string; isMatch: boolean; index?: number }>;
}

export function MatchHighlight({ segments }: MatchHighlightProps) {
  if (segments.length === 0 || (segments.length === 1 && !segments[0].text)) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        输入测试字符串查看匹配结果
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-zinc-600">匹配结果</label>
      <div
        className={cn(
          'p-3 min-h-[100px]',
          'bg-zinc-50 rounded-lg',
          'border border-zinc-200',
          'font-mono text-sm text-zinc-800',
          'whitespace-pre-wrap break-all'
        )}
      >
        {segments.map((segment, i) => (
          <span
            key={i}
            className={cn(
              segment.isMatch &&
                'bg-emerald-100 text-emerald-700 rounded px-0.5'
            )}
          >
            {segment.text}
          </span>
        ))}
      </div>
    </div>
  );
}
