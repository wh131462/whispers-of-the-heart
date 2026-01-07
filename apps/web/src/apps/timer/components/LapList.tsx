import { cn } from '@/lib/utils';
import { formatTime } from '../utils/formatTime';
import type { LapRecord } from '../types';

interface LapListProps {
  laps: LapRecord[];
}

export function LapList({ laps }: LapListProps) {
  if (laps.length === 0) return null;

  // 找出最快和最慢的圈
  const diffs = laps.map(l => l.diff);
  const minDiff = Math.min(...diffs);
  const maxDiff = Math.max(...diffs);

  return (
    <div className="mt-4 pt-4 border-t border-zinc-200">
      <div className="text-xs text-zinc-500 mb-2">分圈记录</div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {laps.map(lap => {
          const isFastest = lap.diff === minDiff && laps.length > 1;
          const isSlowest = lap.diff === maxDiff && laps.length > 1;

          return (
            <div
              key={lap.id}
              className={cn(
                'flex items-center justify-between py-1.5 px-2 rounded',
                'text-sm font-mono',
                isFastest && 'bg-emerald-100 text-emerald-700',
                isSlowest && 'bg-red-100 text-red-700',
                !isFastest && !isSlowest && 'text-zinc-600'
              )}
            >
              <span className="text-zinc-500">#{lap.id}</span>
              <span>{formatTime(lap.time)}</span>
              <span className="text-xs">+{formatTime(lap.diff)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
