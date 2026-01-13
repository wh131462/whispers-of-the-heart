export type Player = 'black' | 'white';
export type CellValue = Player | null;
export type GameStatus = 'idle' | 'playing' | 'won';
export type GameMode = 'pvp' | 'pve' | 'online';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type Position = {
  row: number;
  col: number;
};

export type GameState = {
  board: CellValue[][];
  currentPlayer: Player;
  winner: Player | null;
  winningLine: Position[] | null;
  lastMove: Position | null;
  status: GameStatus;
  mode: GameMode;
  difficulty: Difficulty;
  history: Position[];
};

export const BOARD_SIZE = 15;
export const WIN_COUNT = 5;
export const CELL_SIZE = 28;

export const PLAYER_NAMES: Record<Player, string> = {
  black: '黑棋',
  white: '白棋',
};
