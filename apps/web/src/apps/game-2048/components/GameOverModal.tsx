import { cn } from '@/lib/utils';
import type { GameStatus } from '../types';
import { RotateCcw, Play } from 'lucide-react';

interface GameOverModalProps {
  status: GameStatus;
  score: number;
  onReset: () => void;
  onContinue?: () => void;
}

export function GameOverModal({
  status,
  score,
  onReset,
  onContinue,
}: GameOverModalProps) {
  if (status !== 'won' && status !== 'lost') return null;

  const isWon = status === 'won';

  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex flex-col items-center justify-center',
        'bg-white/80 backdrop-blur-sm rounded-lg',
        'animate-fade-in'
      )}
    >
      <div className="text-center">
        <h2
          className={cn(
            'text-3xl font-bold mb-2',
            isWon ? 'text-amber-600' : 'text-zinc-700'
          )}
        >
          {isWon ? '恭喜你赢了！' : '游戏结束'}
        </h2>
        <p className="text-zinc-600 mb-4">得分: {score}</p>

        <div className="flex gap-3 justify-center">
          {isWon && onContinue && (
            <button
              onClick={onContinue}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-emerald-500 text-white',
                'hover:bg-emerald-600 transition-colors',
                'font-medium'
              )}
            >
              <Play className="w-4 h-4" />
              继续游戏
            </button>
          )}
          <button
            onClick={onReset}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-amber-500 text-white',
              'hover:bg-amber-600 transition-colors',
              'font-medium'
            )}
          >
            <RotateCcw className="w-4 h-4" />
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
}
