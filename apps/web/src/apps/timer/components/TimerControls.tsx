import { cn } from '@/lib/utils';
import { Play, Pause, RotateCcw, Flag, SkipForward } from 'lucide-react';

interface TimerControlsProps {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  onLap?: () => void;
  onSkip?: () => void;
  showLap?: boolean;
  showSkip?: boolean;
}

export function TimerControls({
  isRunning,
  onToggle,
  onReset,
  onLap,
  onSkip,
  showLap = false,
  showSkip = false,
}: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* 重置按钮 */}
      <button
        type="button"
        onClick={onReset}
        className={cn(
          'p-3 rounded-full',
          'bg-zinc-100 border border-zinc-200',
          'text-zinc-600',
          'transition-all duration-150',
          'hover:bg-zinc-200 hover:text-zinc-800',
          'active:scale-95'
        )}
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      {/* 开始/暂停按钮 */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'p-4 rounded-full',
          'transition-all duration-150',
          'active:scale-95',
          isRunning
            ? 'bg-amber-500 border border-amber-400 text-white hover:bg-amber-600'
            : 'bg-emerald-500 border border-emerald-400 text-white hover:bg-emerald-600',
          'shadow-lg',
          isRunning ? 'shadow-amber-200' : 'shadow-emerald-200'
        )}
      >
        {isRunning ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Play className="w-6 h-6 ml-0.5" />
        )}
      </button>

      {/* 分圈按钮 */}
      {showLap && onLap && (
        <button
          type="button"
          onClick={onLap}
          className={cn(
            'p-3 rounded-full',
            'bg-zinc-100 border border-zinc-200',
            'text-zinc-600',
            'transition-all duration-150',
            'hover:bg-zinc-200 hover:text-zinc-800',
            'active:scale-95'
          )}
        >
          <Flag className="w-5 h-5" />
        </button>
      )}

      {/* 跳过按钮 */}
      {showSkip && onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className={cn(
            'p-3 rounded-full',
            'bg-zinc-100 border border-zinc-200',
            'text-zinc-600',
            'transition-all duration-150',
            'hover:bg-zinc-200 hover:text-zinc-800',
            'active:scale-95'
          )}
        >
          <SkipForward className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
