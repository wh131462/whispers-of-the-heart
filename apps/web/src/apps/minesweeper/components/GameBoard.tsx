import { cn } from '@/lib/utils';
import { Cell } from './Cell';
import type { Cell as CellType, GameStatus } from '../types';

interface GameBoardProps {
  board: CellType[][];
  status: GameStatus;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
}

export function GameBoard({
  board,
  status,
  onCellClick,
  onCellRightClick,
  onCellDoubleClick,
}: GameBoardProps) {
  const gameOver = status === 'won' || status === 'lost';

  const handleContextMenu = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    onCellRightClick(row, col);
  };

  return (
    <div
      className={cn(
        'inline-block p-2',
        'bg-zinc-50 rounded-lg',
        'border border-zinc-200'
      )}
    >
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${board[0]?.length || 9}, 1fr)`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              onClick={() => onCellClick(rowIndex, colIndex)}
              onContextMenu={e => handleContextMenu(e, rowIndex, colIndex)}
              onDoubleClick={() => onCellDoubleClick(rowIndex, colIndex)}
              gameOver={gameOver}
            />
          ))
        )}
      </div>
    </div>
  );
}
