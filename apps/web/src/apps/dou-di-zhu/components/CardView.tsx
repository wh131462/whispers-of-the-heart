import { cn } from '@/lib/utils';
import type { Card } from '../types';
import { getRankDisplay, SUIT_DISPLAY } from '../utils/card';

type CardViewProps = {
  card: Card;
  selected?: boolean;
  faceDown?: boolean;
  size?: 'sm' | 'md';
  onClick?: () => void;
};

export function CardView({
  card,
  selected,
  faceDown,
  size = 'md',
  onClick,
}: CardViewProps) {
  const isMd = size === 'md';
  const dims = isMd ? 'w-[52px] h-[72px]' : 'w-[38px] h-[52px]';

  if (faceDown) {
    return (
      <div
        className={cn(
          dims,
          'rounded-md border border-blue-900/30',
          'bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900',
          'flex items-center justify-center',
          'shadow-md'
        )}
      >
        <div
          className={cn(
            'rounded-sm border border-yellow-400/40',
            isMd ? 'w-[36px] h-[52px]' : 'w-[26px] h-[36px]',
            'bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.05)_3px,rgba(255,255,255,0.05)_6px)]',
            'flex items-center justify-center'
          )}
        >
          <span
            className={cn(
              'text-yellow-400 font-bold',
              isMd ? 'text-lg' : 'text-sm'
            )}
          >
            &diams;
          </span>
        </div>
      </div>
    );
  }

  const isJoker = card.suit === null;
  const isRedJoker = card.rank === 'jokerBig';
  const isRed = isJoker
    ? isRedJoker
    : card.suit === 'heart' || card.suit === 'diamond';
  const colorClass = isRed ? 'text-red-600' : 'text-zinc-800';

  const rankText = getRankDisplay(card.rank);
  const suitText = isJoker ? '' : SUIT_DISPLAY[card.suit!];

  return (
    <div
      onClick={onClick}
      className={cn(
        dims,
        'rounded-md border cursor-pointer select-none relative',
        'bg-gradient-to-br from-white via-white to-gray-50',
        'transition-all duration-150',
        'shadow-md hover:shadow-lg',
        'overflow-hidden',
        selected
          ? 'border-yellow-400 -translate-y-4 ring-2 ring-yellow-400/60 shadow-yellow-200/50'
          : 'border-zinc-300/80 hover:border-zinc-400',
        onClick && 'active:scale-95'
      )}
    >
      {/* 左上角 rank + suit */}
      <div
        className={cn(
          'absolute flex flex-col items-center leading-none',
          isMd ? 'top-1 left-1' : 'top-0.5 left-0.5'
        )}
      >
        <span
          className={cn(
            'font-bold',
            isMd ? 'text-[13px]' : 'text-[10px]',
            colorClass
          )}
        >
          {rankText}
        </span>
        {suitText && (
          <span
            className={cn(
              isMd ? 'text-[11px] -mt-0.5' : 'text-[8px]',
              colorClass
            )}
          >
            {suitText}
          </span>
        )}
      </div>

      {/* 中心区域 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isJoker ? (
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'font-black',
                isMd ? 'text-2xl' : 'text-lg',
                isRedJoker ? 'text-red-500' : 'text-zinc-700'
              )}
            >
              {isRedJoker ? '\u2605' : '\u2606'}
            </span>
            <span
              className={cn(
                'font-bold',
                isMd ? 'text-[10px] -mt-1' : 'text-[8px]',
                colorClass
              )}
            >
              {isRedJoker ? 'JOKER' : 'joker'}
            </span>
          </div>
        ) : (
          <span className={cn(isMd ? 'text-xl' : 'text-base', colorClass)}>
            {suitText}
          </span>
        )}
      </div>

      {/* 右下角倒置 rank + suit */}
      {!isJoker && (
        <div
          className={cn(
            'absolute flex flex-col items-center leading-none rotate-180',
            isMd ? 'bottom-1 right-1' : 'bottom-0.5 right-0.5'
          )}
        >
          <span
            className={cn(
              'font-bold',
              isMd ? 'text-[13px]' : 'text-[10px]',
              colorClass
            )}
          >
            {rankText}
          </span>
          <span
            className={cn(
              isMd ? 'text-[11px] -mt-0.5' : 'text-[8px]',
              colorClass
            )}
          >
            {suitText}
          </span>
        </div>
      )}
    </div>
  );
}
