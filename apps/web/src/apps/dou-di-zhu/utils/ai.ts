import type { Card, Combo, Player, Role } from '../types';
import { countByValue, sortCards } from './card';
import { detectCombo } from './combo';

// ========== 手牌拆解 ==========

type HandGroup = {
  type:
    | 'single'
    | 'pair'
    | 'triple'
    | 'bomb'
    | 'straight'
    | 'straightPair'
    | 'plane';
  cards: Card[];
  value: number;
};

// 将手牌拆解为最优组合组
function decomposeHand(hand: Card[]): HandGroup[] {
  const sorted = sortCards(hand);
  const countMap = countByValue(sorted);
  const groups: HandGroup[] = [];
  const used = new Set<string>();

  // 1. 先提取炸弹
  for (const [value, cards] of countMap) {
    if (cards.length === 4) {
      groups.push({ type: 'bomb', cards: [...cards], value });
      cards.forEach(c => used.add(c.id));
    }
  }

  // 2. 尝试提取顺子 (5+张连续)
  const availSingles = sorted.filter(c => !used.has(c.id) && c.value <= 14);
  const singleCountMap = countByValue(availSingles);
  const straightGroups = findStraightGroups(singleCountMap, 1, 5);
  for (const sg of straightGroups) {
    groups.push({ type: 'straight', cards: sg.cards, value: sg.minValue });
    sg.cards.forEach(c => used.add(c.id));
  }

  // 3. 尝试提取连对
  const availPairs = sorted.filter(c => !used.has(c.id) && c.value <= 14);
  const pairCountMap = countByValue(availPairs);
  const pairGroups = findStraightGroups(pairCountMap, 2, 3);
  for (const sg of pairGroups) {
    groups.push({ type: 'straightPair', cards: sg.cards, value: sg.minValue });
    sg.cards.forEach(c => used.add(c.id));
  }

  // 4. 提取三条
  const remaining = sorted.filter(c => !used.has(c.id));
  const remCountMap = countByValue(remaining);
  for (const [value, cards] of remCountMap) {
    if (cards.length >= 3) {
      groups.push({ type: 'triple', cards: cards.slice(0, 3), value });
      cards.slice(0, 3).forEach(c => used.add(c.id));
    }
  }

  // 5. 提取对子
  const remaining2 = sorted.filter(c => !used.has(c.id));
  const rem2CountMap = countByValue(remaining2);
  for (const [value, cards] of rem2CountMap) {
    if (cards.length >= 2) {
      groups.push({ type: 'pair', cards: cards.slice(0, 2), value });
      cards.slice(0, 2).forEach(c => used.add(c.id));
    }
  }

  // 6. 剩余单张
  const remaining3 = sorted.filter(c => !used.has(c.id));
  for (const c of remaining3) {
    groups.push({ type: 'single', cards: [c], value: c.value });
    used.add(c.id);
  }

  return groups;
}

// 寻找连续组合 (顺子/连对)
function findStraightGroups(
  countMap: Map<number, Card[]>,
  groupSize: number,
  minLength: number
): { cards: Card[]; minValue: number }[] {
  const results: { cards: Card[]; minValue: number }[] = [];
  const values = Array.from(countMap.keys())
    .filter(v => v <= 14)
    .sort((a, b) => a - b);

  let start = 0;
  while (start < values.length) {
    let end = start;
    while (end + 1 < values.length && values[end + 1] === values[end] + 1) {
      const cards = countMap.get(values[end + 1]);
      if (!cards || cards.length < groupSize) break;
      end++;
    }
    const startCards = countMap.get(values[start]);
    if (!startCards || startCards.length < groupSize) {
      start++;
      continue;
    }
    const length = end - start + 1;
    if (length >= minLength) {
      const cards: Card[] = [];
      for (let i = start; i <= end; i++) {
        const c = countMap.get(values[i])!;
        cards.push(...c.slice(0, groupSize));
      }
      results.push({ cards, minValue: values[start] });
      start = end + 1;
    } else {
      start++;
    }
  }
  return results;
}

// ========== AI 出牌核心 ==========

type AIContext = {
  myRole: Role | null;
  myIndex: number;
  players: Player[];
  lastPlayer: number | null;
};

// AI 出牌: 增强版
export function aiPlay(
  hand: Card[],
  lastCombo: Combo | null,
  context?: AIContext
): Card[] | null {
  if (hand.length === 0) return null;

  // 自由出牌
  if (!lastCombo) {
    return aiSmartFreePlay(hand, context);
  }

  // 跟牌
  return aiSmartFollowPlay(hand, lastCombo, context);
}

// 智能自由出牌
function aiSmartFreePlay(hand: Card[], context?: AIContext): Card[] {
  const sorted = sortCards(hand);

  // 手牌 <= 当前组合可以一次出完就出
  const combo = detectCombo(sorted);
  if (combo) return sorted;

  const groups = decomposeHand(hand);

  // 优先出顺子、连对、飞机等大牌型（减少手数）
  const bigCombos = groups.filter(
    g =>
      g.type === 'straight' || g.type === 'straightPair' || g.type === 'plane'
  );
  if (bigCombos.length > 0) {
    // 出最小的大组合
    bigCombos.sort((a, b) => a.value - b.value);
    return bigCombos[0].cards;
  }

  // 如果有三条，带上最小的单张或对子
  const triples = groups.filter(g => g.type === 'triple');
  if (triples.length > 0) {
    triples.sort((a, b) => a.value - b.value);
    const tri = triples[0];
    // 找带牌
    const singles = groups.filter(
      g => g.type === 'single' && g.value !== tri.value
    );
    if (singles.length > 0) {
      singles.sort((a, b) => a.value - b.value);
      return [...tri.cards, singles[0].cards[0]];
    }
    const pairs = groups.filter(
      g => g.type === 'pair' && g.value !== tri.value
    );
    if (pairs.length > 0) {
      pairs.sort((a, b) => a.value - b.value);
      return [...tri.cards, ...pairs[0].cards];
    }
    return tri.cards;
  }

  // 对手牌少时，优先出对子消耗
  if (context && isOpponentDangerous(context)) {
    const pairs = groups.filter(g => g.type === 'pair');
    if (pairs.length > 0) {
      pairs.sort((a, b) => a.value - b.value);
      return pairs[0].cards;
    }
  }

  // 出最小的单张（但不拆对子/三条）
  const pureSingles = groups.filter(g => g.type === 'single');
  if (pureSingles.length > 0) {
    pureSingles.sort((a, b) => a.value - b.value);
    // 不出大牌（2、王）除非只剩这些
    const smallSingles = pureSingles.filter(g => g.value <= 14);
    if (smallSingles.length > 0) return smallSingles[0].cards;
    return pureSingles[0].cards;
  }

  // 出最小的对子
  const pairs = groups.filter(g => g.type === 'pair');
  if (pairs.length > 0) {
    pairs.sort((a, b) => a.value - b.value);
    return pairs[0].cards;
  }

  return [sorted[sorted.length - 1]];
}

// 判断对手是否危险（牌少）
function isOpponentDangerous(context: AIContext): boolean {
  const { myIndex, myRole, players } = context;
  for (let i = 0; i < 3; i++) {
    if (i === myIndex) continue;
    // 对手阵营
    const isEnemy =
      myRole === 'landlord'
        ? players[i].role === 'farmer'
        : players[i].role === 'landlord';
    if (isEnemy && players[i].cards.length <= 3) return true;
  }
  return false;
}

// 是否为队友
function isTeammate(context: AIContext, playerIdx: number): boolean {
  if (!context.myRole) return false;
  return context.myRole === context.players[playerIdx].role;
}

// 智能跟牌
function aiSmartFollowPlay(
  hand: Card[],
  lastCombo: Combo,
  context?: AIContext
): Card[] | null {
  const candidates = findAllBeatingCombos(hand, lastCombo);
  if (candidates.length === 0) return null;

  // 如果上家是队友，且不是很危急，不压
  if (
    context &&
    context.lastPlayer !== null &&
    isTeammate(context, context.lastPlayer)
  ) {
    // 队友出牌，除非对手即将获胜，否则不压
    if (!isOpponentDangerous(context)) {
      return null;
    }
  }

  // 剩余牌能一次出完，直接出
  if (hand.length === lastCombo.cards.length && candidates.length > 0) {
    return candidates[0];
  }

  // 如果手牌很少，积极出
  if (hand.length <= 4) {
    return candidates[0];
  }

  // 分类: 普通牌 vs 炸弹/火箭
  const nonBombs: Card[][] = [];
  const bombs: Card[][] = [];
  for (const c of candidates) {
    const cb = detectCombo(c);
    if (cb && (cb.type === 'bomb' || cb.type === 'rocket')) {
      bombs.push(c);
    } else {
      nonBombs.push(c);
    }
  }

  // 有普通牌能打就打
  if (nonBombs.length > 0) {
    // 智能选择: 避免出过大的牌（节省大牌）
    // 对地主出牌要积极，对农民友军不压
    if (context && context.lastPlayer !== null) {
      const lastIsLandlord =
        context.players[context.lastPlayer].role === 'landlord';
      const iAmFarmer = context.myRole === 'farmer';

      if (iAmFarmer && lastIsLandlord) {
        // 打地主，积极出最小的
        return nonBombs[0];
      }
    }

    // 默认出最小的能赢的
    return nonBombs[0];
  }

  // 只有炸弹
  // 对手快赢了，果断炸
  if (context && isOpponentDangerous(context)) {
    return bombs[0];
  }

  // 手牌不多也炸
  if (hand.length <= 8) {
    return bombs[0];
  }

  // 保留炸弹
  return null;
}

// ========== 查找所有可赢组合 ==========

function findAllBeatingCombos(hand: Card[], lastCombo: Combo): Card[][] {
  const results: Card[][] = [];
  const sorted = sortCards(hand);
  const countMap = countByValue(sorted);

  switch (lastCombo.type) {
    case 'single':
      findBeatingSingles(countMap, lastCombo.mainValue, results);
      break;
    case 'pair':
      findBeatingPairs(countMap, lastCombo.mainValue, results);
      break;
    case 'triple':
      findBeatingTriples(countMap, lastCombo.mainValue, results, 0, hand);
      break;
    case 'tripleWithOne':
      findBeatingTriples(countMap, lastCombo.mainValue, results, 1, hand);
      break;
    case 'tripleWithPair':
      findBeatingTriples(countMap, lastCombo.mainValue, results, 2, hand);
      break;
    case 'straight':
      findBeatingStraights(sorted, lastCombo, results);
      break;
    case 'straightPair':
      findBeatingStraightPairs(sorted, lastCombo, results);
      break;
    case 'bomb':
      findBeatingBombs(countMap, lastCombo.mainValue, results);
      break;
    case 'plane':
    case 'planeWithWings':
      // 飞机较复杂，简单处理
      break;
    case 'fourWithTwo':
      break;
    default:
      break;
  }

  // 非炸弹/火箭类型，追加炸弹
  if (lastCombo.type !== 'bomb' && lastCombo.type !== 'rocket') {
    findBeatingBombs(countMap, -1, results);
  }
  findRocket(sorted, results);

  return results;
}

function findBeatingSingles(
  countMap: Map<number, Card[]>,
  minValue: number,
  results: Card[][]
) {
  const entries = Array.from(countMap.entries()).sort((a, b) => a[0] - b[0]);
  // 优先从数量少的组里出（不拆炸弹）
  for (const [value, cards] of entries) {
    if (value > minValue && cards.length < 4) {
      results.push([cards[0]]);
    }
  }
  // 如果没有就拆
  if (results.length === 0) {
    for (const [value, cards] of entries) {
      if (value > minValue) {
        results.push([cards[0]]);
      }
    }
  }
}

function findBeatingPairs(
  countMap: Map<number, Card[]>,
  minValue: number,
  results: Card[][]
) {
  const entries = Array.from(countMap.entries()).sort((a, b) => a[0] - b[0]);
  for (const [value, cards] of entries) {
    if (value > minValue && cards.length >= 2 && cards.length < 4) {
      results.push(cards.slice(0, 2));
    }
  }
  // 如果没有就拆
  if (results.length === 0) {
    for (const [value, cards] of entries) {
      if (value > minValue && cards.length >= 2) {
        results.push(cards.slice(0, 2));
      }
    }
  }
}

function findBeatingTriples(
  countMap: Map<number, Card[]>,
  minValue: number,
  results: Card[][],
  kickerSize: number,
  hand: Card[]
) {
  const entries = Array.from(countMap.entries()).sort((a, b) => a[0] - b[0]);
  for (const [value, cards] of entries) {
    if (value > minValue && cards.length >= 3) {
      const triCards = cards.slice(0, 3);
      if (kickerSize === 0) {
        results.push(triCards);
      } else {
        const kicker = findKicker(hand, value, kickerSize);
        if (kicker) {
          results.push([...triCards, ...kicker]);
        }
      }
    }
  }
}

function findKicker(
  hand: Card[],
  excludeValue: number,
  size: number
): Card[] | null {
  const countMap = countByValue(hand);
  const entries = Array.from(countMap.entries()).sort((a, b) => a[0] - b[0]);

  if (size === 1) {
    // 优先带单张（不拆对子和三条）
    for (const [value, cards] of entries) {
      if (value !== excludeValue && cards.length === 1) return [cards[0]];
    }
    for (const [value, cards] of entries) {
      if (value !== excludeValue) return [cards[0]];
    }
  } else if (size === 2) {
    // 优先带纯对子
    for (const [value, cards] of entries) {
      if (value !== excludeValue && cards.length === 2)
        return cards.slice(0, 2);
    }
    for (const [value, cards] of entries) {
      if (value !== excludeValue && cards.length >= 2) return cards.slice(0, 2);
    }
  }
  return null;
}

function findBeatingStraights(
  sorted: Card[],
  lastCombo: Combo,
  results: Card[][]
) {
  const length = lastCombo.length!;
  const minValue = lastCombo.mainValue;
  const eligible = sorted.filter(c => c.value <= 14);
  const countMap = countByValue(eligible);

  for (let start = minValue + 1; start + length - 1 <= 14; start++) {
    const combo: Card[] = [];
    let valid = true;
    for (let v = start; v < start + length; v++) {
      const cards = countMap.get(v);
      if (!cards || cards.length < 1) {
        valid = false;
        break;
      }
      combo.push(cards[0]);
    }
    if (valid) results.push(combo);
  }
}

function findBeatingStraightPairs(
  sorted: Card[],
  lastCombo: Combo,
  results: Card[][]
) {
  const length = lastCombo.length!;
  const minValue = lastCombo.mainValue;
  const eligible = sorted.filter(c => c.value <= 14);
  const countMap = countByValue(eligible);

  for (let start = minValue + 1; start + length - 1 <= 14; start++) {
    const combo: Card[] = [];
    let valid = true;
    for (let v = start; v < start + length; v++) {
      const cards = countMap.get(v);
      if (!cards || cards.length < 2) {
        valid = false;
        break;
      }
      combo.push(cards[0], cards[1]);
    }
    if (valid) results.push(combo);
  }
}

function findBeatingBombs(
  countMap: Map<number, Card[]>,
  minValue: number,
  results: Card[][]
) {
  const entries = Array.from(countMap.entries()).sort((a, b) => a[0] - b[0]);
  for (const [value, cards] of entries) {
    if (value > minValue && cards.length === 4) {
      results.push(cards.slice(0, 4));
    }
  }
}

function findRocket(sorted: Card[], results: Card[][]) {
  const small = sorted.find(c => c.rank === 'jokerSmall');
  const big = sorted.find(c => c.rank === 'jokerBig');
  if (small && big) {
    results.push([big, small]);
  }
}

// ========== AI 叫地主 ==========

export function aiBid(hand: Card[]): boolean {
  let score = 0;
  const countMap = countByValue(hand);

  // 大小王
  if (hand.some(c => c.rank === 'jokerBig')) score += 4;
  if (hand.some(c => c.rank === 'jokerSmall')) score += 3;

  // 2的数量
  const twos = countMap.get(15);
  if (twos) score += twos.length * 2;

  // 炸弹
  for (const [, cards] of countMap) {
    if (cards.length === 4) score += 5;
  }

  // A的数量
  const aces = countMap.get(14);
  if (aces) score += aces.length;

  // K的数量
  const kings = countMap.get(13);
  if (kings) score += kings.length * 0.5;

  // 顺子/连续性加分
  const groups = decomposeHand(hand);
  const bigCombos = groups.filter(
    g =>
      g.type === 'straight' || g.type === 'straightPair' || g.type === 'plane'
  );
  score += bigCombos.length * 2;

  // 手牌整齐度: 单张越少越好
  const singleCount = groups.filter(g => g.type === 'single').length;
  if (singleCount <= 2) score += 2;
  if (singleCount >= 5) score -= 2;

  return score >= 7;
}
