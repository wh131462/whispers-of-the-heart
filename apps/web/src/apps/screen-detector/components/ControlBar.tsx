import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  description: string;
  isFullscreen: boolean;
  isFakeFullscreen: boolean;
  cycleRunning: boolean;
  cycleIntervalMs: number;
  visible: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleFullscreen: () => void;
  onToggleCycle: () => void;
  onEnd: () => void;
};

export function ControlBar({
  title,
  description,
  isFullscreen,
  isFakeFullscreen,
  cycleRunning,
  cycleIntervalMs,
  visible,
  onPrev,
  onNext,
  onToggleFullscreen,
  onToggleCycle,
  onEnd,
}: Props) {
  const positionClasses = isFullscreen
    ? 'pointer-events-auto absolute left-1/2 top-3 z-30 -translate-x-1/2'
    : 'sticky top-0 z-10';

  return (
    <div
      className={cn(
        positionClasses,
        'flex items-center gap-3 border border-zinc-200 bg-white/95 px-3 py-2 shadow-lg shadow-zinc-200/50 transition-opacity duration-300',
        isFullscreen
          ? 'rounded-xl backdrop-blur'
          : 'rounded-none border-x-0 border-t-0',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-zinc-900">
            {title}
          </span>
          {isFakeFullscreen && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
              兼容模式
            </span>
          )}
        </div>
        <span className="truncate text-xs text-zinc-500">{description}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          title="上一项 ←"
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          title="下一项 →"
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleCycle}
          title={`自动巡检 Space（间隔 ${cycleIntervalMs / 1000}s）`}
          className={cn(
            'rounded-md p-1.5 hover:bg-zinc-100',
            cycleRunning ? 'text-emerald-600' : 'text-zinc-600'
          )}
        >
          {cycleRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          title="全屏 F / Esc"
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onEnd}
          title="结束测试"
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
