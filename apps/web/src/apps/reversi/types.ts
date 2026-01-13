export type Player = 'black' | 'white';
export type CellValue = Player | null;
export type GameStatus = 'idle' | 'playing' | 'ended';
export type GameMode = 'pvp' | 'pve' | 'online';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type Position = {
  row: number;
  col: number;
};

export type GameState = {
  board: CellValue[][];
  currentPlayer: Player;
  validMoves: Position[];
  blackCount: number;
  whiteCount: number;
  status: GameStatus;
  mode: GameMode;
  difficulty: Difficulty;
  winner: Player | 'draw' | null;
};

export const BOARD_SIZE = 8;
export const CELL_SIZE = 48;

export const PLAYER_NAMES: Record<Player, string> = {
  black: '黑棋',
  white: '白棋',
};

export const DIRECTIONS = [
  { dr: -1, dc: 0 }, // 上
  { dr: -1, dc: 1 }, // 右上
  { dr: 0, dc: 1 }, // 右
  { dr: 1, dc: 1 }, // 右下
  { dr: 1, dc: 0 }, // 下
  { dr: 1, dc: -1 }, // 左下
  { dr: 0, dc: -1 }, // 左
  { dr: -1, dc: -1 }, // 左上
];

// 时间限制类型：0 = 不限时
export type TimeLimit = 30 | 60 | 0;

// 游戏设置
export interface GameSettings {
  timeLimit: TimeLimit;
}

// 棋步记录（用于悔棋，包含被翻转的棋子位置）
export interface MoveRecord {
  row: number;
  col: number;
  player: Player;
  flippedCells: Position[];
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
