import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Tile as TileType, Direction } from '../types';
import { GRID_SIZE } from '../types';
import { Tile } from './Tile';

interface GameBoardProps {
  tiles: TileType[];
  onMove: (direction: Direction) => void;
  cellSize?: number;
  gap?: number;
}

export function GameBoard({
  tiles,
  onMove,
  cellSize = 80,
  gap = 8,
}: GameBoardProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const boardSize = GRID_SIZE * cellSize + (GRID_SIZE - 1) * gap;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      const minSwipeDistance = 30;

      if (
        Math.abs(deltaX) < minSwipeDistance &&
        Math.abs(deltaY) < minSwipeDistance
      ) {
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        onMove(deltaX > 0 ? 'right' : 'left');
      } else {
        onMove(deltaY > 0 ? 'down' : 'up');
      }

      touchStartRef.current = null;
    },
    [onMove]
  );

  // 生成背景格子
  const cells = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      cells.push(
        <div
          key={`${row}-${col}`}
          className="bg-zinc-200 rounded-md"
          style={{
            width: cellSize,
            height: cellSize,
          }}
        />
      );
    }
  }

  const padding = cellSize < 60 ? 6 : 8;

  return (
    <div
      className={cn(
        'relative bg-zinc-300 rounded-lg',
        'touch-none select-none'
      )}
      style={{
        width: boardSize + padding * 2,
        height: boardSize + padding * 2,
        padding,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 背景格子 */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          gap,
        }}
      >
        {cells}
      </div>

      {/* 方块层 */}
      <div
        className="absolute"
        style={{
          top: padding,
          left: padding,
          width: boardSize,
          height: boardSize,
        }}
      >
        {tiles.map(tile => (
          <Tile key={tile.id} tile={tile} cellSize={cellSize} gap={gap} />
        ))}
      </div>
    </div>
  );
}
