import { cn } from '@/lib/utils';
import type { CellValue, Position } from '../types';
import { BOARD_SIZE } from '../types';

type BoardProps = {
  board: CellValue[][];
  lastMove: Position | null;
  winningLine: Position[] | null;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
  cellSize?: number;
};

export function Board({
  board,
  lastMove,
  winningLine,
  onCellClick,
  disabled,
  cellSize = 28,
}: BoardProps) {
  const padding = cellSize < 24 ? 12 : 20;
  const boardPixelSize = (BOARD_SIZE - 1) * cellSize + padding * 2;
  const winningSet = new Set(winningLine?.map(p => `${p.row},${p.col}`));
  const starRadius = cellSize < 24 ? 2 : 3;

  return (
    <div
      className={cn(
        'relative bg-amber-100 rounded-lg',
        'border-2 border-amber-300',
        'shadow-inner'
      )}
      style={{ width: boardPixelSize, height: boardPixelSize, padding }}
    >
      {/* 棋盘线 */}
      <svg
        className="absolute"
        style={{ left: padding, top: padding }}
        width={(BOARD_SIZE - 1) * cellSize}
        height={(BOARD_SIZE - 1) * cellSize}
      >
        {/* 横线 */}
        {Array(BOARD_SIZE)
          .fill(0)
          .map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={i * cellSize}
              x2={(BOARD_SIZE - 1) * cellSize}
              y2={i * cellSize}
              stroke="#b45309"
              strokeWidth={1}
            />
          ))}
        {/* 竖线 */}
        {Array(BOARD_SIZE)
          .fill(0)
          .map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * cellSize}
              y1={0}
              x2={i * cellSize}
              y2={(BOARD_SIZE - 1) * cellSize}
              stroke="#b45309"
              strokeWidth={1}
            />
          ))}
        {/* 星位点 */}
        {[3, 7, 11].map(row =>
          [3, 7, 11].map(col => (
            <circle
              key={`star-${row}-${col}`}
              cx={col * cellSize}
              cy={row * cellSize}
              r={starRadius}
              fill="#b45309"
            />
          ))
        )}
      </svg>

      {/* 交叉点（可点击区域） */}
      {board.map((row, rowIdx) =>
        row.map((cell, colIdx) => (
          <div
            key={`${rowIdx}-${colIdx}`}
            className={cn(
              'absolute flex items-center justify-center',
              'cursor-pointer',
              !disabled && cell === null && 'hover:bg-amber-200/50',
              disabled && 'cursor-not-allowed'
            )}
            style={{
              left: padding + colIdx * cellSize - cellSize / 2,
              top: padding + rowIdx * cellSize - cellSize / 2,
              width: cellSize,
              height: cellSize,
            }}
            onClick={() => !disabled && onCellClick(rowIdx, colIdx)}
          >
            {cell && (
              <div
                className={cn(
                  'rounded-full shadow-md transition-all',
                  cell === 'black'
                    ? 'bg-zinc-800'
                    : 'bg-white border border-zinc-300',
                  lastMove?.row === rowIdx &&
                    lastMove?.col === colIdx &&
                    'ring-2 ring-red-500',
                  winningSet.has(`${rowIdx},${colIdx}`) &&
                    'ring-2 ring-emerald-500'
                )}
                style={{
                  width: cellSize - 4,
                  height: cellSize - 4,
                }}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}
