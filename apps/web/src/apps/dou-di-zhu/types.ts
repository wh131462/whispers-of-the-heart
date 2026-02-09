// 花色
export type Suit = 'spade' | 'heart' | 'diamond' | 'club';

// 牌面值: 3-10, J, Q, K, A, 2, 小王, 大王
export type Rank =
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'
  | '2'
  | 'jokerSmall'
  | 'jokerBig';

// 一张牌
export type Card = {
  id: string; // 唯一标识
  suit: Suit | null; // 花色，王牌为 null
  rank: Rank;
  value: number; // 排序权重: 3=3, 4=4, ..., 2=15, 小王=16, 大王=17
};

// 牌型
export type ComboType =
  | 'single' // 单张
  | 'pair' // 对子
  | 'triple' // 三不带
  | 'tripleWithOne' // 三带一
  | 'tripleWithPair' // 三带二
  | 'straight' // 顺子 (>=5张)
  | 'straightPair' // 连对 (>=3对)
  | 'plane' // 飞机不带
  | 'planeWithWings' // 飞机带翅膀
  | 'fourWithTwo' // 四带二
  | 'bomb' // 炸弹
  | 'rocket'; // 火箭 (双王)

// 一次出牌组合
export type Combo = {
  type: ComboType;
  cards: Card[];
  mainValue: number; // 主牌面值（用于比较大小）
  length?: number; // 顺子/连对/飞机的长度
};

// 玩家角色
export type Role = 'landlord' | 'farmer';

// 玩家
export type Player = {
  id: number; // 0=玩家, 1=AI左, 2=AI右
  name: string;
  role: Role | null;
  cards: Card[];
  isAI: boolean;
};

// 游戏阶段
export type GamePhase =
  | 'idle' // 未开始
  | 'dealing' // 发牌中
  | 'bidding' // 叫地主
  | 'playing' // 出牌中
  | 'finished'; // 结束

// 叫地主状态
export type BidAction = 'bid' | 'pass';

// 游戏状态
export type GameState = {
  phase: GamePhase;
  players: [Player, Player, Player];
  bottomCards: Card[]; // 底牌 (3张)
  currentPlayer: number; // 当前操作玩家 index
  lastCombo: Combo | null; // 上一次有效出牌
  lastPlayer: number | null; // 上一次出牌的玩家
  consecutivePasses: number; // 连续 pass 次数
  winner: Role | null; // 胜者
  bidding: {
    currentBidder: number;
    bids: (BidAction | null)[];
    landlordIndex: number | null;
  };
  bombCount: number; // 炸弹数量（翻倍用）
  selectedCards: Card[]; // 当前玩家选中的牌
  lastPlayedCards: [Card[], Card[], Card[]]; // 各玩家最近一次出的牌
  message: string; // 提示消息
};
