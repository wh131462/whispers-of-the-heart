import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useFireworks } from '@/components/ui/confetti';
import type { Player, GameStatus } from '../types';
import { PLAYER_NAMES } from '../types';

type GameOverModalProps = {
  status: GameStatus;
  winner: Player | null;
  onReset: () => void;
};

export function GameOverModal({ status, winner, onReset }: GameOverModalProps) {
  const { fire } = useFireworks();

  useEffect(() => {
    if (status === 'won' && winner) {
      fire();
    }
  }, [status, winner, fire]);

  if (status !== 'won' || !winner) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center',
        'bg-black/60 backdrop-blur-sm rounded-lg',
        'animate-fade-in z-20'
      )}
    >
      <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
      <p className="text-lg text-zinc-300 mb-4">
        <span
          className={cn(
            'font-bold',
            winner === 'black' ? 'text-zinc-300' : 'text-amber-300'
          )}
        >
          {PLAYER_NAMES[winner]}
        </span>{' '}
        获胜!
      </p>
      <button
        onClick={onReset}
        className={cn(
          'px-6 py-2 rounded-lg',
          'bg-amber-500 text-white font-medium',
          'hover:bg-amber-600 transition-colors',
          'shadow-lg shadow-amber-500/30'
        )}
      >
        再来一局
      </button>
    </div>
  );
}
