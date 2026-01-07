import { cn } from '@/lib/utils';
import type { CellValue, Position } from '../types';
import { BOARD_SIZE, CELL_SIZE } from '../types';

type BoardProps = {
  board: CellValue[][];
  lastMove: Position | null;
  winningLine: Position[] | null;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
};

export function Board({
  board,
  lastMove,
  winningLine,
  onCellClick,
  disabled,
}: BoardProps) {
  const boardPixelSize = (BOARD_SIZE - 1) * CELL_SIZE + 40;
  const winningSet = new Set(winningLine?.map(p => `${p.row},${p.col}`));

  return (
    <div
      className={cn(
        'relative bg-amber-100 rounded-lg',
        'border-2 border-amber-300',
        'shadow-inner'
      )}
      style={{ width: boardPixelSize, height: boardPixelSize, padding: 20 }}
    >
      {/* 棋盘线 */}
      <svg
        className="absolute"
        style={{ left: 20, top: 20 }}
        width={(BOARD_SIZE - 1) * CELL_SIZE}
        height={(BOARD_SIZE - 1) * CELL_SIZE}
      >
        {/* 横线 */}
        {Array(BOARD_SIZE)
          .fill(0)
          .map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={i * CELL_SIZE}
              x2={(BOARD_SIZE - 1) * CELL_SIZE}
              y2={i * CELL_SIZE}
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
              x1={i * CELL_SIZE}
              y1={0}
              x2={i * CELL_SIZE}
              y2={(BOARD_SIZE - 1) * CELL_SIZE}
              stroke="#b45309"
              strokeWidth={1}
            />
          ))}
        {/* 星位点 */}
        {[3, 7, 11].map(row =>
          [3, 7, 11].map(col => (
            <circle
              key={`star-${row}-${col}`}
              cx={col * CELL_SIZE}
              cy={row * CELL_SIZE}
              r={3}
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
              left: 20 + colIdx * CELL_SIZE - CELL_SIZE / 2,
              top: 20 + rowIdx * CELL_SIZE - CELL_SIZE / 2,
              width: CELL_SIZE,
              height: CELL_SIZE,
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
                  width: CELL_SIZE - 4,
                  height: CELL_SIZE - 4,
                }}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}
