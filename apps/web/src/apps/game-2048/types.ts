export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
};

export type HistoryEntry = {
  tiles: Tile[];
  score: number;
};

export type GameState = {
  tiles: Tile[];
  score: number;
  bestScore: number;
  status: GameStatus;
  gridSize: number;
  history: HistoryEntry[];
};

export const GRID_SIZE = 4;
export const WIN_VALUE = 2048;

// 方块颜色配置
export const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: 'bg-amber-100', text: 'text-amber-900' },
  4: { bg: 'bg-amber-200', text: 'text-amber-900' },
  8: { bg: 'bg-orange-300', text: 'text-white' },
  16: { bg: 'bg-orange-400', text: 'text-white' },
  32: { bg: 'bg-orange-500', text: 'text-white' },
  64: { bg: 'bg-red-500', text: 'text-white' },
  128: { bg: 'bg-yellow-400', text: 'text-white' },
  256: { bg: 'bg-yellow-500', text: 'text-white' },
  512: { bg: 'bg-yellow-600', text: 'text-white' },
  1024: { bg: 'bg-yellow-700', text: 'text-white' },
  2048: { bg: 'bg-yellow-800', text: 'text-white' },
};

export function getTileColor(value: number): { bg: string; text: string } {
  return TILE_COLORS[value] || { bg: 'bg-purple-600', text: 'text-white' };
}
