import { cn } from '@/lib/utils';
import type { CellValue, Piece } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, PIECE_COLORS } from '../types';
import { getPieceCells, getGhostPosition } from '../utils/board';

type GameBoardProps = {
  board: CellValue[][];
  currentPiece: Piece | null;
};

export function GameBoard({ board, currentPiece }: GameBoardProps) {
  const currentCells = currentPiece ? getPieceCells(currentPiece) : [];
  const ghostPiece = currentPiece
    ? getGhostPosition(board, currentPiece)
    : null;
  const ghostCells = ghostPiece ? getPieceCells(ghostPiece) : [];

  const getCellContent = (row: number, col: number) => {
    // 检查是否是当前方块
    const currentCell = currentCells.find(c => c.x === col && c.y === row);
    if (currentCell && currentPiece) {
      return (
        <div
          className={cn(
            'w-full h-full rounded-sm',
            PIECE_COLORS[currentPiece.type],
            'border border-white/30'
          )}
        />
      );
    }

    // 检查是否是幽灵方块
    const ghostCell = ghostCells.find(c => c.x === col && c.y === row);
    if (ghostCell && currentPiece) {
      return (
        <div
          className={cn(
            'w-full h-full rounded-sm border-2',
            'border-zinc-400/50 bg-zinc-400/10'
          )}
        />
      );
    }

    // 检查是否是已锁定的方块
    const cell = board[row][col];
    if (cell) {
      return (
        <div
          className={cn(
            'w-full h-full rounded-sm',
            PIECE_COLORS[cell],
            'border border-white/20'
          )}
        />
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        'grid bg-zinc-900 gap-px p-1 rounded-lg',
        'border-2 border-zinc-700'
      )}
      style={{
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`,
      }}
    >
      {board.map((row, rowIdx) =>
        row.map((_, colIdx) => (
          <div
            key={`${rowIdx}-${colIdx}`}
            className="bg-zinc-800/50"
            style={{ width: CELL_SIZE, height: CELL_SIZE }}
          >
            {getCellContent(rowIdx, colIdx)}
          </div>
        ))
      )}
    </div>
  );
}
