import type { BidAction, Card, Combo, Role } from '../types';

// 本地玩家标识（与 useOnlineGame 保持一致）
export const SELF_PEER_ID = '__self__';

// 座位索引
export type SeatIndex = 0 | 1 | 2;

// ──── 座位信息 ────

export type SeatInfo = {
  peerId: string;
  name: string;
  ready: boolean;
  connected: boolean;
};

// ──── 联机房间阶段 ────

export type OnlinePhase = 'waiting' | 'bidding' | 'playing' | 'finished';

// ──── 玩家视角的游戏状态（房主针对每人生成，只包含该视角可见的信息）────

export type DDZViewState = {
  phase: OnlinePhase;
  myCards: Card[];
  bottomCards: Card[];
  currentPlayer: number;
  lastCombo: Combo | null;
  lastPlayer: number | null;
  lastPlayedCards: [Card[], Card[], Card[]];
  cardCounts: [number, number, number];
  landlordSeat: number | null;
  bidding: {
    currentBidder: number;
    bids: (BidAction | null)[];
  };
  bombCount: number;
  winner: Role | null;
  message: string;
};

// ──── 客户端 → 房主消息 ────

interface SeatRequestMsg {
  type: 'seat_request';
  [key: string]: string | undefined;
}

interface LeaveSeatMsg {
  type: 'leave_seat';
  [key: string]: string | undefined;
}

interface ReadyToggleMsg {
  type: 'ready_toggle';
  [key: string]: string | undefined;
}

interface BidMsg {
  type: 'bid';
  action: 'bid' | 'pass';
  [key: string]: string | undefined;
}

interface PlayMsg {
  type: 'play';
  cardIds: string[];
  [key: string]: string | string[] | undefined;
}

interface PassMsg {
  type: 'pass';
  [key: string]: string | undefined;
}

interface SyncRequestMsg {
  type: 'sync_request';
  [key: string]: string | undefined;
}

export type DDZClientMsg =
  | SeatRequestMsg
  | LeaveSeatMsg
  | ReadyToggleMsg
  | BidMsg
  | PlayMsg
  | PassMsg
  | SyncRequestMsg;

// ──── 房主 → 客户端消息 ────

interface RoomUpdateMsg {
  type: 'room_update';
  seats: (SeatInfo | null)[];
  spectatorCount: number;
  phase: string;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | Array<unknown>
    | Record<string, unknown>;
}

interface GameSyncMsg {
  type: 'game_sync';
  view: DDZViewState;
  mySeat: number;
  [key: string]: string | number | boolean | null | DDZViewState;
}

interface ErrorMsg {
  type: 'error';
  message: string;
  [key: string]: string;
}

export type DDZHostMsg = RoomUpdateMsg | GameSyncMsg | ErrorMsg;

// ──── 房主内部游戏状态（不直接广播，用于房主运行游戏逻辑）────

export type HostGameState = {
  phase: OnlinePhase;
  hands: [Card[], Card[], Card[]];
  bottomCards: Card[];
  currentPlayer: number;
  lastCombo: Combo | null;
  lastPlayer: number | null;
  consecutivePasses: number;
  lastPlayedCards: [Card[], Card[], Card[]];
  landlordSeat: number | null;
  bidding: {
    currentBidder: number;
    bids: (BidAction | null)[];
  };
  bombCount: number;
  winner: Role | null;
};
