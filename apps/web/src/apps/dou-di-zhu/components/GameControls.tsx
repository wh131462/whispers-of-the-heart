import { cn } from '@/lib/utils';
import type { GamePhase } from '../types';

type GameControlsProps = {
  phase: GamePhase;
  isPlayerTurn: boolean;
  canPass: boolean;
  isBidding: boolean;
  isPlayerBidding: boolean;
  onPlay: () => void;
  onPass: () => void;
  onHint: () => void;
  onBid: (bid: boolean) => void;
  onStart: () => void;
};

const btnBase =
  'px-5 py-2 rounded-full font-medium text-sm transition-all duration-200 shadow-md active:scale-95 active:shadow-sm';

export function GameControls({
  phase,
  isPlayerTurn,
  canPass,
  isBidding,
  isPlayerBidding,
  onPlay,
  onPass,
  onHint,
  onBid,
  onStart,
}: GameControlsProps) {
  if (phase === 'idle' || phase === 'finished') {
    return (
      <div className="flex justify-center">
        <button
          onClick={onStart}
          className={cn(
            btnBase,
            'px-8 py-2.5 text-base',
            'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 font-bold',
            'hover:from-yellow-300 hover:to-amber-400',
            'shadow-lg shadow-amber-500/30'
          )}
        >
          {phase === 'idle' ? '开始游戏' : '再来一局'}
        </button>
      </div>
    );
  }

  if (isBidding && isPlayerBidding) {
    return (
      <div className="flex justify-center gap-4">
        <button
          onClick={() => onBid(true)}
          className={cn(
            btnBase,
            'bg-gradient-to-r from-red-500 to-rose-600 text-white',
            'hover:from-red-400 hover:to-rose-500',
            'shadow-red-500/30'
          )}
        >
          叫地主
        </button>
        <button
          onClick={() => onBid(false)}
          className={cn(
            btnBase,
            'bg-white/15 text-white/90 backdrop-blur-sm',
            'hover:bg-white/25',
            'border border-white/20'
          )}
        >
          不叫
        </button>
      </div>
    );
  }

  if (phase === 'playing' && isPlayerTurn) {
    return (
      <div className="flex justify-center gap-3">
        <button
          onClick={onPlay}
          className={cn(
            btnBase,
            'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 font-bold',
            'hover:from-yellow-300 hover:to-amber-400',
            'shadow-amber-500/30'
          )}
        >
          出牌
        </button>
        {canPass && (
          <button
            onClick={onPass}
            className={cn(
              btnBase,
              'bg-white/15 text-white/90 backdrop-blur-sm',
              'hover:bg-white/25',
              'border border-white/20'
            )}
          >
            不出
          </button>
        )}
        <button
          onClick={onHint}
          className={cn(
            btnBase,
            'bg-white/15 text-emerald-300 backdrop-blur-sm',
            'hover:bg-white/25',
            'border border-emerald-400/30'
          )}
        >
          提示
        </button>
      </div>
    );
  }

  return null;
}
