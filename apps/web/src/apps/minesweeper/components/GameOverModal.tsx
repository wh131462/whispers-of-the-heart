import { useEffect } from 'react';
import { Trophy, Frown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFireworks } from '@/components/ui/confetti';
import type { GameStatus } from '../types';

interface GameOverModalProps {
  status: GameStatus;
  timeElapsed: number;
  onPlayAgain: () => void;
}

export function GameOverModal({
  status,
  timeElapsed,
  onPlayAgain,
}: GameOverModalProps) {
  const { fire } = useFireworks();

  useEffect(() => {
    if (status === 'won') {
      fire();
    }
  }, [status, fire]);

  if (status !== 'won' && status !== 'lost') {
    return null;
  }

  const isWin = status === 'won';

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        'bg-white/80 backdrop-blur-sm rounded-xl'
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center gap-4 p-6',
          'bg-white rounded-xl shadow-lg',
          'border',
          isWin ? 'border-emerald-300' : 'border-red-300'
        )}
      >
        {isWin ? (
          <Trophy className="w-12 h-12 text-amber-500" />
        ) : (
          <Frown className="w-12 h-12 text-red-500" />
        )}

        <h2
          className={cn(
            'text-xl font-bold',
            isWin ? 'text-emerald-600' : 'text-red-600'
          )}
        >
          {isWin ? '恭喜你赢了！' : '游戏结束'}
        </h2>

        {isWin && (
          <p className="text-zinc-600 text-sm">用时: {timeElapsed} 秒</p>
        )}

        <button
          onClick={onPlayAgain}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-emerald-100 text-emerald-700',
            'hover:bg-emerald-200 transition-colors',
            'text-sm font-medium'
          )}
        >
          <RotateCcw className="w-4 h-4" />
          再玩一次
        </button>
      </div>
    </div>
  );
}
