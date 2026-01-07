import { cn } from '@/lib/utils';
import { formatDisplay } from '../utils/evaluate';

interface DisplayProps {
  expression: string;
  value: string;
  error?: string | null;
}

export function Display({ expression, value, error }: DisplayProps) {
  const formattedValue = formatDisplay(value);

  const getFontSize = () => {
    const len = formattedValue.length;
    if (len <= 8) return 'text-4xl';
    if (len <= 12) return 'text-3xl';
    if (len <= 16) return 'text-2xl';
    return 'text-xl';
  };

  return (
    <div
      className={cn(
        'rounded-lg p-4',
        'bg-neutral-950/80',
        'border border-neutral-800/60'
      )}
    >
      {/* 表达式行 */}
      <div className="min-h-[1.5rem] text-right overflow-x-auto">
        <span className="text-sm font-mono text-neutral-400 whitespace-nowrap">
          {expression || '\u00A0'}
        </span>
      </div>

      {/* 主显示区 */}
      <div className="mt-1 text-right min-h-[2.5rem] overflow-hidden">
        {error ? (
          <span className="text-base text-red-400 font-mono">{error}</span>
        ) : (
          <span
            className={cn(
              'font-bold font-mono tracking-tight',
              'text-emerald-400',
              getFontSize()
            )}
          >
            {formattedValue}
          </span>
        )}
      </div>
    </div>
  );
}
