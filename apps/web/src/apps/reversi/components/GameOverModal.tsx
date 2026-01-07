import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useFireworks } from '@/components/ui/confetti';
import type { Player } from '../types';
import { PLAYER_NAMES } from '../types';

type GameOverModalProps = {
  isOpen: boolean;
  winner: Player | 'draw' | null;
  blackCount: number;
  whiteCount: number;
  onReset: () => void;
};

export function GameOverModal({
  isOpen,
  winner,
  blackCount,
  whiteCount,
  onReset,
}: GameOverModalProps) {
  const { fire } = useFireworks();

  useEffect(() => {
    // 只有胜利时（非平局）才触发烟花
    if (isOpen && winner && winner !== 'draw') {
      fire();
    }
  }, [isOpen, winner, fire]);

  if (!isOpen) return null;

  const getWinnerText = () => {
    if (winner === 'draw') return '平局!';
    if (winner) return `${PLAYER_NAMES[winner]} 获胜!`;
    return '';
  };

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center',
        'bg-black/60 backdrop-blur-sm rounded-lg',
        'animate-fade-in z-20'
      )}
    >
      <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
      <p className="text-lg text-zinc-300 mb-2">{getWinnerText()}</p>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-zinc-800" />
          <span className="text-white font-bold">{blackCount}</span>
        </div>
        <span className="text-zinc-400">vs</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{whiteCount}</span>
          <div className="w-6 h-6 rounded-full bg-white border border-zinc-300" />
        </div>
      </div>
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
