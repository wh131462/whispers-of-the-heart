import { cn } from '@/lib/utils';
import type { Position } from '../types';
import { GRID_SIZE, CELL_SIZE } from '../types';

type GameBoardProps = {
  snake: Position[];
  food: Position;
};

export function GameBoard({ snake, food }: GameBoardProps) {
  const boardSize = GRID_SIZE * CELL_SIZE;

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
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
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
            left: segment.x * CELL_SIZE + 1,
            top: segment.y * CELL_SIZE + 1,
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
          }}
        >
          {/* 蛇头眼睛 */}
          {index === 0 && (
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
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
          left: food.x * CELL_SIZE + 2,
          top: food.y * CELL_SIZE + 2,
          width: CELL_SIZE - 4,
          height: CELL_SIZE - 4,
        }}
      />
    </div>
  );
}
