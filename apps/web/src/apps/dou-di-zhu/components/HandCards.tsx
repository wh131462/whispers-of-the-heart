import { useRef, useEffect, useState } from 'react';
import type { Card } from '../types';
import { CardView } from './CardView';

type HandCardsProps = {
  cards: Card[];
  selectedCards: Card[];
  interactive?: boolean;
  faceDown?: boolean;
  onToggle?: (card: Card) => void;
};

export function HandCards({
  cards,
  selectedCards,
  interactive,
  faceDown,
  onToggle,
}: HandCardsProps) {
  const selectedIds = new Set(selectedCards.map(c => c.id));
  const dragRef = useRef({
    active: false,
    selecting: true,
    toggled: new Set<string>(),
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(320);

  // 监听容器宽度，用于玩家手牌自适应
  useEffect(() => {
    if (!containerRef.current || faceDown) return;
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [faceDown]);

  // AI 背面牌只显示有限张数（实际数量由 PlayerInfo 展示）
  const visibleCards = faceDown ? cards.slice(0, 6) : cards;

  const cardWidth = faceDown ? 38 : 52;
  const maxWidth = faceDown ? 80 : Math.min(containerWidth, 520);
  const minSpacing = faceDown ? 4 : 14;
  const spacing =
    visibleCards.length > 1
      ? Math.min(
          cardWidth - 8,
          Math.max(
            minSpacing,
            (maxWidth - cardWidth) / (visibleCards.length - 1)
          )
        )
      : 0;

  // 全局监听松手结束拖选
  useEffect(() => {
    const endDrag = () => {
      dragRef.current.active = false;
      dragRef.current.toggled.clear();
    };
    window.addEventListener('pointerup', endDrag);
    return () => window.removeEventListener('pointerup', endDrag);
  }, []);

  // 按下开始拖选：记录方向（未选→选中 / 已选→取消）
  const handlePointerDown = (card: Card, e: React.PointerEvent) => {
    if (!interactive || !onToggle) return;
    e.preventDefault();
    const isSelected = selectedIds.has(card.id);
    dragRef.current = {
      active: true,
      selecting: !isSelected,
      toggled: new Set([card.id]),
    };
    onToggle(card);
  };

  // 滑动经过其他牌时，按同方向切换
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active || !interactive || !onToggle) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cardEl = (el as HTMLElement | null)?.closest(
      '[data-card-id]'
    ) as HTMLElement | null;
    if (!cardEl) return;
    const cardId = cardEl.dataset.cardId;
    if (!cardId || dragRef.current.toggled.has(cardId)) return;
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const isSelected = selectedIds.has(card.id);
    if (
      (dragRef.current.selecting && !isSelected) ||
      (!dragRef.current.selecting && isSelected)
    ) {
      dragRef.current.toggled.add(card.id);
      onToggle(card);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex items-end justify-center w-full"
      style={{
        minHeight: faceDown ? 52 : 72,
        touchAction: interactive ? 'none' : undefined,
      }}
      onPointerMove={interactive ? handlePointerMove : undefined}
    >
      {visibleCards.map((card, i) => {
        const isSelected = selectedIds.has(card.id);
        return (
          <div
            key={card.id}
            data-card-id={card.id}
            style={{
              marginLeft: i === 0 ? 0 : -(cardWidth - spacing),
              zIndex: isSelected ? 50 : i,
            }}
            className="relative"
            onPointerDown={
              interactive ? e => handlePointerDown(card, e) : undefined
            }
          >
            <CardView
              card={card}
              faceDown={faceDown}
              selected={isSelected}
              size={faceDown ? 'sm' : 'md'}
            />
          </div>
        );
      })}
    </div>
  );
}
