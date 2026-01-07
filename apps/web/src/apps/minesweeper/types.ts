export type CellState = 'hidden' | 'revealed' | 'flagged' | 'questioned';

export interface Cell {
  isMine: boolean;
  state: CellState;
  adjacentMines: number;
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

export interface GameState {
  board: Cell[][];
  status: GameStatus;
  difficulty: Difficulty;
  mineCount: number;
  flagCount: number;
  timeElapsed: number;
  firstClick: boolean;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: '初级' },
  medium: { rows: 16, cols: 16, mines: 40, label: '中级' },
  hard: { rows: 16, cols: 30, mines: 99, label: '高级' },
};
