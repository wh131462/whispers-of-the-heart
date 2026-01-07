import { cn } from '@/lib/utils';
import type { Cell, Position } from '../types';
import { BOARD_SIZE, BOX_SIZE } from '../types';

type BoardProps = {
  board: Cell[][];
  selectedCell: Position | null;
  onCellClick: (position: Position) => void;
};

export function Board({ board, selectedCell, onCellClick }: BoardProps) {
  const getHighlightClass = (row: number, col: number): string => {
    if (!selectedCell) return '';

    const { row: selRow, col: selCol } = selectedCell;
    const isSelected = row === selRow && col === selCol;
    const isSameRow = row === selRow;
    const isSameCol = col === selCol;
    const isSameBox =
      Math.floor(row / BOX_SIZE) === Math.floor(selRow / BOX_SIZE) &&
      Math.floor(col / BOX_SIZE) === Math.floor(selCol / BOX_SIZE);
    const isSameValue =
      board[row][col].value !== null &&
      board[row][col].value === board[selRow][selCol].value;

    if (isSelected) return 'bg-blue-200';
    if (isSameValue) return 'bg-blue-100';
    if (isSameRow || isSameCol || isSameBox) return 'bg-zinc-100';

    return '';
  };

  return (
    <div
      className={cn(
        'inline-grid rounded-lg overflow-hidden',
        'border-2 border-zinc-800'
      )}
      style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 40px)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, 40px)`,
      }}
    >
      {board.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          // 九宫格粗线边框
          const isLeftBoxBorder = colIdx % BOX_SIZE === 0 && colIdx > 0;
          const isTopBoxBorder = rowIdx % BOX_SIZE === 0 && rowIdx > 0;

          return (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={cn(
                'flex items-center justify-center',
                'bg-white cursor-pointer select-none',
                'transition-colors duration-100',
                'border-r border-b border-zinc-300',
                // 九宫格粗线
                isLeftBoxBorder && 'border-l-2 border-l-zinc-800',
                isTopBoxBorder && 'border-t-2 border-t-zinc-800',
                getHighlightClass(rowIdx, colIdx),
                !cell.isFixed && 'hover:bg-blue-50'
              )}
              onClick={() => onCellClick({ row: rowIdx, col: colIdx })}
            >
              {cell.value !== null ? (
                <span
                  className={cn(
                    'text-lg font-semibold',
                    cell.isFixed ? 'text-zinc-800' : 'text-blue-600',
                    cell.isError && 'text-red-500'
                  )}
                >
                  {cell.value}
                </span>
              ) : cell.notes.size > 0 ? (
                <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <span
                      key={n}
                      className={cn(
                        'text-[8px] text-zinc-400 flex items-center justify-center',
                        !cell.notes.has(n) && 'opacity-0'
                      )}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
