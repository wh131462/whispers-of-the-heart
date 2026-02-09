import type { Card, Rank, Suit } from '../types';

const SUITS: Suit[] = ['spade', 'heart', 'diamond', 'club'];
const RANKS: Rank[] = [
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
  '2',
];

// 牌面值映射
const RANK_VALUE: Record<Rank, number> = {
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
  '2': 15,
  jokerSmall: 16,
  jokerBig: 17,
};

// 花色显示
export const SUIT_DISPLAY: Record<Suit, string> = {
  spade: '\u2660',
  heart: '\u2665',
  diamond: '\u2666',
  club: '\u2663',
};

// 花色颜色
export const SUIT_COLOR: Record<Suit, string> = {
  spade: 'text-zinc-900',
  heart: 'text-red-500',
  diamond: 'text-red-500',
  club: 'text-zinc-900',
};

// 牌面显示
export function getRankDisplay(rank: Rank): string {
  if (rank === 'jokerSmall') return '\u5c0f';
  if (rank === 'jokerBig') return '\u5927';
  return rank;
}

// 生成一副完整的牌 (54张)
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: RANK_VALUE[rank],
      });
    }
  }
  deck.push({ id: 'joker-small', suit: null, rank: 'jokerSmall', value: 16 });
  deck.push({ id: 'joker-big', suit: null, rank: 'jokerBig', value: 17 });
  return deck;
}

// 洗牌 (Fisher-Yates)
export function shuffle(deck: Card[]): Card[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 排序: 从大到小
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    if (a.suit === null) return 1;
    if (b.suit === null) return -1;
    return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
  });
}

// 发牌: 返回 [玩家0, 玩家1, 玩家2, 底牌]
export function dealCards(): [Card[], Card[], Card[], Card[]] {
  const deck = shuffle(createDeck());
  return [
    sortCards(deck.slice(0, 17)),
    sortCards(deck.slice(17, 34)),
    sortCards(deck.slice(34, 51)),
    deck.slice(51, 54),
  ];
}

// 从手牌中移除指定的牌
export function removeCards(hand: Card[], played: Card[]): Card[] {
  const playedIds = new Set(played.map(c => c.id));
  return hand.filter(c => !playedIds.has(c.id));
}

// 统计每个 value 出现的次数
export function countByValue(cards: Card[]): Map<number, Card[]> {
  const map = new Map<number, Card[]>();
  for (const c of cards) {
    const arr = map.get(c.value) || [];
    arr.push(c);
    map.set(c.value, arr);
  }
  return map;
}
