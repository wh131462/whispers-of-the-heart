import { cn } from '@/lib/utils';
import type { TimestampUnit } from '../types';

interface TimestampInputProps {
  value: string;
  unit: TimestampUnit;
  error: string | null;
  onChange: (value: string) => void;
  onUnitChange: (unit: TimestampUnit) => void;
  onNow: () => void;
}

export function TimestampInput({
  value,
  unit,
  error,
  onChange,
  onUnitChange,
  onNow,
}: TimestampInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-600">时间戳</label>
        <div className="flex items-center gap-1 p-0.5 bg-zinc-100 rounded">
          <button
            onClick={() => onUnitChange('seconds')}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium transition-colors',
              unit === 'seconds'
                ? 'bg-white text-zinc-800 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            )}
          >
            秒
          </button>
          <button
            onClick={() => onUnitChange('milliseconds')}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium transition-colors',
              unit === 'milliseconds'
                ? 'bg-white text-zinc-800 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            )}
          >
            毫秒
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={
            unit === 'seconds' ? '例如: 1704067200' : '例如: 1704067200000'
          }
          className={cn(
            'flex-1 px-3 py-2.5',
            'bg-zinc-50 rounded-lg',
            'border transition-colors',
            error
              ? 'border-red-400'
              : 'border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
            'text-zinc-800 text-sm font-mono',
            'placeholder:text-zinc-400',
            'focus:outline-none'
          )}
        />
        <button
          onClick={onNow}
          className={cn(
            'px-4 py-2.5 rounded-lg',
            'bg-zinc-800 text-white',
            'hover:bg-zinc-700 transition-colors',
            'text-sm font-medium'
          )}
        >
          当前
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
