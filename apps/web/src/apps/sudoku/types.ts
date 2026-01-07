export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameStatus = 'idle' | 'playing' | 'won';

export type Cell = {
  value: number | null;
  isFixed: boolean;
  notes: Set<number>;
  isError: boolean;
};

export type Position = {
  row: number;
  col: number;
};

export type GameState = {
  board: Cell[][];
  solution: number[][];
  selectedCell: Position | null;
  difficulty: Difficulty;
  status: GameStatus;
  mistakes: number;
  time: number;
  isNoteMode: boolean;
};

export const BOARD_SIZE = 9;
export const BOX_SIZE = 3;
export const MAX_MISTAKES = 3;

export const DIFFICULTY_EMPTY_CELLS: Record<Difficulty, number> = {
  easy: 30,
  medium: 40,
  hard: 50,
};

export const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};
