import { memo, useRef, useCallback } from 'react';
import { Flag, HelpCircle, Bomb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Cell as CellType } from '../types';

interface CellProps {
  cell: CellType;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onLongPress?: () => void;
  gameOver: boolean;
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-600',
  2: 'text-green-600',
  3: 'text-red-600',
  4: 'text-purple-600',
  5: 'text-amber-700',
  6: 'text-cyan-600',
  7: 'text-zinc-800',
  8: 'text-zinc-600',
};

function CellComponent({
  cell,
  onClick,
  onContextMenu,
  onDoubleClick,
  onLongPress,
  gameOver,
}: CellProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress?.();
    }, 500);
  }, [onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!isLongPress.current) {
      onClick();
    }
  }, [onClick]);

  const renderContent = () => {
    if (cell.state === 'flagged') {
      return <Flag className="w-3.5 h-3.5 text-red-400" />;
    }

    if (cell.state === 'questioned') {
      return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
    }

    if (cell.state === 'revealed') {
      if (cell.isMine) {
        return <Bomb className="w-4 h-4 text-red-500" />;
      }

      if (cell.adjacentMines > 0) {
        return (
          <span
            className={cn(
              'font-bold text-sm',
              NUMBER_COLORS[cell.adjacentMines]
            )}
          >
            {cell.adjacentMines}
          </span>
        );
      }

      return null;
    }

    return null;
  };

  return (
    <button
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      disabled={gameOver && cell.state !== 'revealed'}
      className={cn(
        'w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center',
        'text-xs font-mono transition-colors',
        'border border-zinc-300',
        cell.state === 'revealed'
          ? cn('bg-zinc-100', cell.isMine && 'bg-red-100')
          : cn('bg-zinc-200', 'hover:bg-zinc-300', 'active:bg-zinc-100'),
        gameOver && cell.state !== 'revealed' && 'opacity-50 cursor-not-allowed'
      )}
    >
      {renderContent()}
    </button>
  );
}

export const Cell = memo(CellComponent);
