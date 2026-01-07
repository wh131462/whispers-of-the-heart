import { cn } from '@/lib/utils';
import type { GameStatus } from '../types';

type GameOverModalProps = {
  status: GameStatus;
  score: number;
  onReset: () => void;
};

export function GameOverModal({ status, score, onReset }: GameOverModalProps) {
  if (status !== 'lost') return null;

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center',
        'bg-black/60 backdrop-blur-sm rounded-lg',
        'animate-fade-in'
      )}
    >
      <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
      <p className="text-lg text-zinc-300 mb-4">
        得分: <span className="font-bold text-emerald-400">{score}</span>
      </p>
      <button
        onClick={onReset}
        className={cn(
          'px-6 py-2 rounded-lg',
          'bg-emerald-500 text-white font-medium',
          'hover:bg-emerald-600 transition-colors',
          'shadow-lg shadow-emerald-500/30'
        )}
      >
        再来一局
      </button>
    </div>
  );
}
