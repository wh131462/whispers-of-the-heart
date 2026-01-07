import { Bomb, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameStatus } from '../types';

interface GameHeaderProps {
  remainingMines: number;
  timeElapsed: number;
  status: GameStatus;
  onReset: () => void;
}

export function GameHeader({
  remainingMines,
  timeElapsed,
  status,
  onReset,
}: GameHeaderProps) {
  const getEmoji = () => {
    switch (status) {
      case 'won':
        return '😎';
      case 'lost':
        return '😵';
      case 'playing':
        return '🙂';
      default:
        return '😊';
    }
  };

  const formatNumber = (n: number) => {
    return String(Math.max(-99, Math.min(999, n))).padStart(3, '0');
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-2',
        'bg-zinc-50 rounded-lg',
        'border border-zinc-200'
      )}
    >
      {/* 剩余地雷数 */}
      <div className="flex items-center gap-2">
        <Bomb className="w-4 h-4 text-red-500" />
        <span className="font-mono text-lg text-red-600 tabular-nums">
          {formatNumber(remainingMines)}
        </span>
      </div>

      {/* 重置按钮 */}
      <button
        onClick={onReset}
        className={cn(
          'text-2xl w-10 h-10 flex items-center justify-center',
          'bg-zinc-100 rounded-lg',
          'hover:bg-zinc-200 transition-colors',
          'active:scale-95'
        )}
      >
        <span className="select-none">{getEmoji()}</span>
      </button>

      {/* 时间 */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-emerald-500" />
        <span className="font-mono text-lg text-emerald-600 tabular-nums">
          {formatNumber(timeElapsed)}
        </span>
      </div>
    </div>
  );
}
