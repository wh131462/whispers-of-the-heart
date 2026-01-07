import { cn } from '@/lib/utils';
import type { Tile as TileType } from '../types';
import { getTileColor } from '../types';

interface TileProps {
  tile: TileType;
  cellSize: number;
  gap: number;
}

export function Tile({ tile, cellSize, gap }: TileProps) {
  const { bg, text } = getTileColor(tile.value);
  const x = tile.col * (cellSize + gap);
  const y = tile.row * (cellSize + gap);

  const fontSize =
    tile.value < 100
      ? 'text-3xl'
      : tile.value < 1000
        ? 'text-2xl'
        : tile.value < 10000
          ? 'text-xl'
          : 'text-lg';

  return (
    <div
      className={cn(
        'absolute flex items-center justify-center rounded-md font-bold',
        'transition-[left,top] duration-150 ease-out',
        bg,
        text,
        fontSize,
        tile.isNew && 'animate-tile-new',
        tile.isMerged && 'animate-tile-merge'
      )}
      style={{
        width: cellSize,
        height: cellSize,
        left: x,
        top: y,
        zIndex: tile.isMerged ? 10 : 1,
      }}
    >
      {tile.value}
    </div>
  );
}
