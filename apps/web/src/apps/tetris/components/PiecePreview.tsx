import { cn } from '@/lib/utils';
import type { PieceType } from '../types';
import { PIECE_SHAPES, PIECE_COLORS } from '../types';

type PiecePreviewProps = {
  type: PieceType | null;
  label: string;
};

export function PiecePreview({ type, label }: PiecePreviewProps) {
  const shape = type ? PIECE_SHAPES[type][0] : null;
  const size = shape ? shape.length : 4;
  const cellSize = 16;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-zinc-500 font-medium">{label}</span>
      <div
        className={cn(
          'bg-zinc-100 rounded-lg p-2',
          'border border-zinc-200',
          'flex items-center justify-center'
        )}
        style={{ width: cellSize * 4 + 16, height: cellSize * 4 + 16 }}
      >
        {type && shape && (
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
            }}
          >
            {shape.map((row, rowIdx) =>
              row.map((cell, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={cn(
                    'rounded-sm',
                    cell ? PIECE_COLORS[type] : 'bg-transparent'
                  )}
                  style={{ width: cellSize, height: cellSize }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
