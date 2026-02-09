import { cn } from '@/lib/utils';
import type { Player } from '../types';

type PlayerInfoProps = {
  player: Player;
  isCurrentTurn: boolean;
  compact?: boolean;
  disconnected?: boolean;
};

export function PlayerInfo({
  player,
  isCurrentTurn,
  compact,
  disconnected,
}: PlayerInfoProps) {
  const isLandlord = player.role === 'landlord';

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        compact && 'flex-col gap-1',
        disconnected && 'opacity-50'
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          'border-2 font-bold',
          'transition-all duration-300',
          compact ? 'w-10 h-10 text-sm' : 'w-11 h-11 text-base',
          isCurrentTurn
            ? 'border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.5)]'
            : 'border-white/30',
          isLandlord
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
            : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'
        )}
      >
        {player.isAI ? 'AI' : player.name.slice(0, 1)}
        {/* 地主标记 */}
        {isLandlord && (
          <div
            className={cn(
              'absolute -top-1.5 -right-1.5',
              'w-5 h-5 rounded-full',
              'bg-red-500 border-2 border-white',
              'flex items-center justify-center',
              'text-[10px] text-white font-bold'
            )}
          >
            地
          </div>
        )}
        {/* 断线标记 */}
        {disconnected && (
          <div
            className={cn(
              'absolute -bottom-1 -right-1',
              'w-4 h-4 rounded-full',
              'bg-red-600 border border-white',
              'flex items-center justify-center',
              'text-[8px] text-white font-bold'
            )}
          >
            !
          </div>
        )}
      </div>

      {/* 信息 */}
      <div
        className={cn(
          'flex flex-col',
          compact ? 'items-center' : 'items-start'
        )}
      >
        <span
          className={cn(
            'font-medium text-white leading-tight',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {player.name}
        </span>
        <span
          className={cn(
            'leading-tight font-mono',
            compact ? 'text-[10px]' : 'text-xs',
            player.cards.length <= 3
              ? 'text-red-300 font-bold animate-pulse'
              : 'text-white/60'
          )}
        >
          {player.cards.length} 张
        </span>
      </div>
    </div>
  );
}
