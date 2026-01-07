import { cn } from '@/lib/utils';
import type { CellValue, Position } from '../types';
import { BOARD_SIZE } from '../types';

type BoardProps = {
  board: CellValue[][];
  validMoves: Position[];
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
  cellSize?: number;
};

export function Board({
  board,
  validMoves,
  onCellClick,
  disabled,
  cellSize = 48,
}: BoardProps) {
  const boardSize = BOARD_SIZE * cellSize;
  const validMoveSet = new Set(validMoves.map(m => `${m.row},${m.col}`));

  return (
    <div
      className={cn(
        'relative bg-emerald-700 rounded-lg',
        'border-4 border-emerald-900 box-content'
      )}
      style={{ width: boardSize, height: boardSize }}
    >
      {/* 棋盘格子 */}
      {board.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const isValidMove = validMoveSet.has(`${rowIdx},${colIdx}`);

          return (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={cn(
                'absolute border border-emerald-900/50',
                'flex items-center justify-center',
                !disabled &&
                  isValidMove &&
                  'cursor-pointer hover:bg-emerald-600/50',
                disabled && 'cursor-not-allowed'
              )}
              style={{
                left: colIdx * cellSize,
                top: rowIdx * cellSize,
                width: cellSize,
                height: cellSize,
              }}
              onClick={() =>
                !disabled && isValidMove && onCellClick(rowIdx, colIdx)
              }
            >
              {/* 棋子 */}
              {cell && (
                <div
                  className={cn(
                    'rounded-full shadow-lg transition-all duration-200',
                    cell === 'black'
                      ? 'bg-gradient-to-br from-zinc-700 to-zinc-900'
                      : 'bg-gradient-to-br from-white to-zinc-200 border border-zinc-300'
                  )}
                  style={{
                    width: cellSize - 8,
                    height: cellSize - 8,
                  }}
                />
              )}

              {/* 可落子提示 */}
              {!cell && isValidMove && !disabled && (
                <div
                  className="rounded-full bg-emerald-400/40 animate-pulse"
                  style={{
                    width: cellSize - 24,
                    height: cellSize - 24,
                  }}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
