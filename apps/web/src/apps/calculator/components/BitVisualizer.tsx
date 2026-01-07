import { cn } from '@/lib/utils';
import type { BitWidth } from '../types';
import { getBits } from '../utils/programmer';

interface BitVisualizerProps {
  value: bigint;
  bitWidth: BitWidth;
  onToggleBit: (index: number) => void;
}

export function BitVisualizer({
  value,
  bitWidth,
  onToggleBit,
}: BitVisualizerProps) {
  const bits = getBits(value, bitWidth);

  // 每8位一组
  const groups: boolean[][] = [];
  for (let i = 0; i < bits.length; i += 8) {
    groups.push(bits.slice(i, i + 8));
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-col gap-1 min-w-fit">
        {/* 位索引 */}
        <div className="flex gap-2 justify-end">
          {groups.map((_, groupIndex) => (
            <div
              key={groupIndex}
              className="flex gap-px text-[8px] text-neutral-600 font-mono"
            >
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} className="w-4 text-center">
                  {bitWidth - 1 - groupIndex * 8 - i}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* 位显示 */}
        <div className="flex gap-2 justify-end">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex gap-0.5">
              {group.map((bit, bitIndex) => {
                const globalIndex = groupIndex * 8 + bitIndex;
                return (
                  <button
                    key={bitIndex}
                    type="button"
                    onClick={() => onToggleBit(globalIndex)}
                    className={cn(
                      'w-4 h-5 text-[10px] font-mono rounded transition-all duration-100',
                      'focus:outline-none',
                      bit
                        ? 'bg-emerald-500/80 text-neutral-950 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                        : 'bg-neutral-800/60 text-neutral-500 hover:bg-neutral-700/60'
                    )}
                  >
                    {bit ? '1' : '0'}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
