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

// 时间限制类型：0 = 不限时
export type TimeLimit = 30 | 60 | 0;

// 游戏设置
export interface GameSettings {
  timeLimit: TimeLimit;
}

// 棋步记录（用于悔棋）
export interface MoveRecord {
  row: number;
  col: number;
  player: Player;
}

// 聊天消息
export interface ChatMessage {
  from: string;
  fromName: string;
  content: string;
  timestamp: number;
}

// 悔棋请求
export interface UndoRequest {
  fromPeerId: string;
  fromName: string;
}

// 悔棋状态提示
export type UndoStatus = 'waiting' | 'accepted' | 'rejected' | null;
