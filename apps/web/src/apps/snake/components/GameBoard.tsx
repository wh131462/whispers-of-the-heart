import { cn } from '@/lib/utils';
import type { Position } from '../types';
import { GRID_SIZE } from '../types';

type GameBoardProps = {
  snake: Position[];
  food: Position;
  cellSize?: number;
};

export function GameBoard({ snake, food, cellSize = 20 }: GameBoardProps) {
  const boardSize = GRID_SIZE * cellSize;

  return (
    <div
      className={cn(
        'relative bg-zinc-100 rounded-lg',
        'border-2 border-zinc-300'
      )}
      style={{ width: boardSize, height: boardSize }}
    >
      {/* 网格背景 */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #a1a1aa 1px, transparent 1px),
            linear-gradient(to bottom, #a1a1aa 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
        }}
      />

      {/* 蛇身 */}
      {snake.map((segment, index) => (
        <div
          key={index}
          className={cn(
            'absolute rounded-sm transition-all duration-75',
            index === 0 ? 'bg-emerald-600' : 'bg-emerald-500'
          )}
          style={{
            left: segment.x * cellSize + 1,
            top: segment.y * cellSize + 1,
            width: cellSize - 2,
            height: cellSize - 2,
          }}
        >
          {/* 蛇头眼睛 */}
          {index === 0 && cellSize >= 16 && (
            <div className="absolute inset-0 flex items-center justify-center gap-0.5">
              <div
                className="bg-white rounded-full"
                style={{ width: cellSize * 0.15, height: cellSize * 0.15 }}
              />
              <div
                className="bg-white rounded-full"
                style={{ width: cellSize * 0.15, height: cellSize * 0.15 }}
              />
            </div>
          )}
        </div>
      ))}

      {/* 食物 */}
      <div
        className={cn(
          'absolute bg-red-500 rounded-full',
          'animate-pulse shadow-md shadow-red-300'
        )}
        style={{
          left: food.x * cellSize + 2,
          top: food.y * cellSize + 2,
          width: cellSize - 4,
          height: cellSize - 4,
        }}
      />
    </div>
  );
}
