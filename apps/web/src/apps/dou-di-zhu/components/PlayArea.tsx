import { cn } from '@/lib/utils';
import type { Card } from '../types';
import { CardView } from './CardView';

type PlayAreaProps = {
  cards: Card[];
  label?: string;
};

export function PlayArea({ cards, label }: PlayAreaProps) {
  if (cards.length === 0 && !label) return null;

  // 牌数多时加大重叠，避免溢出
  const overlap = cards.length > 8 ? -24 : cards.length > 5 ? -20 : -14;

  return (
    <div className="flex flex-col items-center gap-1 min-h-[60px] justify-center">
      {cards.length > 0 ? (
        <div className="flex items-center">
          {cards.map((card, i) => (
            <div key={card.id} style={{ marginLeft: i === 0 ? 0 : overlap }}>
              <CardView card={card} size="sm" />
            </div>
          ))}
        </div>
      ) : label ? (
        <span
          className={cn(
            'text-sm font-medium px-4 py-1 rounded-full',
            'bg-black/20 text-white/80 backdrop-blur-sm'
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
