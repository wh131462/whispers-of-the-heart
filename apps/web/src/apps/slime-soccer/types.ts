// 游戏模式
export type GameMode = 'single' | 'local' | 'online';

// 玩家类型
export type PlayerSide = 'left' | 'right';

// 游戏状态
export type GameStatus = 'menu' | 'playing' | 'paused' | 'ended';

// 比赛时长选项（分钟）
export type MatchDuration = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// 向量类型
export interface Vector2D {
  x: number;
  y: number;
}

// 史莱姆状态
export interface SlimeState {
  position: Vector2D;
  velocity: Vector2D;
  side: PlayerSide;
  isJumping: boolean;
  isGrabbing: boolean;
  grabAngle: number;
  campingTime: number;
  color: string;
}

// 球状态
export interface BallState {
  position: Vector2D;
  velocity: Vector2D;
  angularVelocity: number;
  rotation: number;
  isGrabbed: boolean;
  grabbedBy: PlayerSide | null;
}

// 球门状态
export interface GoalState {
  side: PlayerSide;
  position: Vector2D;
  width: number;
  height: number;
}

// 游戏配置常量
export const GAME_CONFIG = {
  FIELD_WIDTH: 800,
  FIELD_HEIGHT: 400,
  GROUND_HEIGHT: 40,
  SLIME_RADIUS: 40,
  SLIME_SPEED: 6,
  SLIME_JUMP_FORCE: 12,
  SLIME_GRAVITY: 0.4,
  SLIME_BOUNCE: 0.3,
  BALL_RADIUS: 20,
  BALL_GRAVITY: 0.3,
  BALL_BOUNCE: 0.7,
  BALL_FRICTION: 0.99,
  BALL_ANGULAR_FRICTION: 0.98,
  GOAL_WIDTH: 60,
  GOAL_HEIGHT: 120,
  GOAL_POST_RADIUS: 8,
  CAMPING_ZONE_WIDTH: 100,
  CAMPING_PENALTY_TIME: 3000,
  CAMPING_PENALTY_FORCE: 2,
  LEFT_SLIME_COLOR: '#00bcd4',
  RIGHT_SLIME_COLOR: '#f44336',
  BALL_COLOR: '#ffffff',
  FIELD_COLOR: '#1565c0',
  GROUND_COLOR: '#616161',
  GOAL_COLOR: '#ffffff',
  NET_COLOR: '#eeeeee',
} as const;

// 游戏状态
export interface GameState {
  status: GameStatus;
  mode: GameMode;
  leftSlime: SlimeState;
  rightSlime: SlimeState;
  ball: BallState;
  leftGoal: GoalState;
  rightGoal: GoalState;
  leftScore: number;
  rightScore: number;
  timeRemaining: number;
  matchDuration: MatchDuration;
  winner: PlayerSide | 'draw' | null;
}

// 输入状态
export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  grab: boolean;
}

// 玩家控制映射
export interface ControlMapping {
  left: string;
  right: string;
  up: string;
  grab: string;
}

// 默认控制映射
export const DEFAULT_CONTROLS: Record<PlayerSide, ControlMapping> = {
  left: {
    left: 'KeyA',
    right: 'KeyD',
    up: 'KeyW',
    grab: 'KeyS',
  },
  right: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    up: 'ArrowUp',
    grab: 'ArrowDown',
  },
};

// AI难度
export type AIDifficulty = 'easy' | 'medium' | 'hard';

// 在线游戏消息类型
export interface OnlineGameMessage {
  type: 'state_sync' | 'input' | 'goal' | 'game_start' | 'game_end';
  data: Record<string, unknown>;
  timestamp: number;
}

// 在线游戏状态
export interface OnlineState {
  roomStatus: 'idle' | 'connecting' | 'connected' | 'disconnected';
  roomCode: string | null;
  myRole: 'player1' | 'player2' | 'spectator' | null;
  mySide: PlayerSide | null;
  player1: { peerId: string; name: string } | null;
  player2: { peerId: string; name: string } | null;
  spectators: Array<{ peerId: string; name: string }>;
  isHost: boolean;
  gameReady: boolean;
  error: string | null;
  pendingSwapRequest?: {
    fromPeerId: string;
    fromName: string;
    targetRole: string;
  } | null;
  swapStatus?: 'waiting' | 'accepted' | 'rejected' | null;
}

// 聊天消息
export interface ChatMessage {
  from: string;
  fromName: string;
  content: string;
  timestamp: number;
}

// 创建初始史莱姆状态
export function createInitialSlime(side: PlayerSide): SlimeState {
  const { FIELD_WIDTH, FIELD_HEIGHT, GROUND_HEIGHT } = GAME_CONFIG;
  return {
    position: {
      x: side === 'left' ? FIELD_WIDTH * 0.25 : FIELD_WIDTH * 0.75,
      y: FIELD_HEIGHT - GROUND_HEIGHT, // 半圆底部在地面上
    },
    velocity: { x: 0, y: 0 },
    side,
    isJumping: false,
    isGrabbing: false,
    grabAngle: 0,
    campingTime: 0,
    color:
      side === 'left'
        ? GAME_CONFIG.LEFT_SLIME_COLOR
        : GAME_CONFIG.RIGHT_SLIME_COLOR,
  };
}

// 创建初始球状态
export function createInitialBall(): BallState {
  const { FIELD_WIDTH, FIELD_HEIGHT, BALL_RADIUS } = GAME_CONFIG;
  return {
    position: {
      x: FIELD_WIDTH / 2,
      y: FIELD_HEIGHT / 2 - BALL_RADIUS,
    },
    velocity: { x: 0, y: 0 },
    angularVelocity: 0,
    rotation: 0,
    isGrabbed: false,
    grabbedBy: null,
  };
}

// 创建球门状态
export function createGoal(side: PlayerSide): GoalState {
  const { FIELD_WIDTH, FIELD_HEIGHT, GROUND_HEIGHT, GOAL_WIDTH, GOAL_HEIGHT } =
    GAME_CONFIG;
  return {
    side,
    position: {
      x: side === 'left' ? 0 : FIELD_WIDTH - GOAL_WIDTH,
      y: FIELD_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT,
    },
    width: GOAL_WIDTH,
    height: GOAL_HEIGHT,
  };
}

// 创建初始游戏状态
export function createInitialGameState(
  mode: GameMode = 'single',
  duration: MatchDuration = 2
): GameState {
  return {
    status: 'menu',
    mode,
    leftSlime: createInitialSlime('left'),
    rightSlime: createInitialSlime('right'),
    ball: createInitialBall(),
    leftGoal: createGoal('left'),
    rightGoal: createGoal('right'),
    leftScore: 0,
    rightScore: 0,
    timeRemaining: duration * 60 * 1000,
    matchDuration: duration,
    winner: null,
  };
}
