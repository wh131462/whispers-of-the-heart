import { cn } from '@/lib/utils';
import { minutesToMs } from '../utils/formatTime';

interface TimeInputProps {
  onSetTime: (ms: number) => void;
  disabled?: boolean;
}

const presets = [
  { label: '1分钟', minutes: 1 },
  { label: '5分钟', minutes: 5 },
  { label: '10分钟', minutes: 10 },
  { label: '15分钟', minutes: 15 },
  { label: '30分钟', minutes: 30 },
  { label: '60分钟', minutes: 60 },
];

export function TimeInput({ onSetTime, disabled }: TimeInputProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {presets.map(preset => (
        <button
          key={preset.minutes}
          type="button"
          onClick={() => onSetTime(minutesToMs(preset.minutes))}
          disabled={disabled}
          className={cn(
            'px-3 py-1.5',
            'rounded-lg',
            'text-xs font-medium',
            'transition-all duration-150',
            'border',
            'bg-zinc-100 border-zinc-200 text-zinc-600',
            'hover:bg-zinc-200 hover:text-zinc-800',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
