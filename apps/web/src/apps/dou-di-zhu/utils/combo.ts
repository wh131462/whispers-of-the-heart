import type { Card, Combo, ComboType } from '../types';
import { countByValue, sortCards } from './card';

// 检测牌型
export function detectCombo(cards: Card[]): Combo | null {
  if (cards.length === 0) return null;
  const sorted = sortCards(cards);
  const len = sorted.length;
  const countMap = countByValue(sorted);
  const counts = Array.from(countMap.entries()).sort((a, b) => b[0] - a[0]);

  // 火箭
  if (
    len === 2 &&
    sorted[0].rank === 'jokerBig' &&
    sorted[1].rank === 'jokerSmall'
  ) {
    return { type: 'rocket', cards: sorted, mainValue: 17 };
  }

  // 单张
  if (len === 1) {
    return { type: 'single', cards: sorted, mainValue: sorted[0].value };
  }

  // 对子
  if (len === 2 && counts.length === 1 && counts[0][1].length === 2) {
    return { type: 'pair', cards: sorted, mainValue: counts[0][0] };
  }

  // 炸弹
  if (len === 4 && counts.length === 1 && counts[0][1].length === 4) {
    return { type: 'bomb', cards: sorted, mainValue: counts[0][0] };
  }

  // 按出现次数分组
  const groups: Record<number, number[]> = {};
  for (const [value, arr] of counts) {
    const c = arr.length;
    if (!groups[c]) groups[c] = [];
    groups[c].push(value);
  }

  // 三不带
  if (len === 3 && groups[3]?.length === 1) {
    return { type: 'triple', cards: sorted, mainValue: groups[3][0] };
  }

  // 三带一
  if (len === 4 && groups[3]?.length === 1 && groups[1]?.length === 1) {
    return { type: 'tripleWithOne', cards: sorted, mainValue: groups[3][0] };
  }

  // 三带二
  if (len === 5 && groups[3]?.length === 1 && groups[2]?.length === 1) {
    return { type: 'tripleWithPair', cards: sorted, mainValue: groups[3][0] };
  }

  // 四带二 (两张单或两对)
  if (len === 6 && groups[4]?.length === 1) {
    const kickerCount = counts.filter(([, arr]) => arr.length !== 4).length;
    if (kickerCount === 2) {
      return { type: 'fourWithTwo', cards: sorted, mainValue: groups[4][0] };
    }
  }
  if (len === 8 && groups[4]?.length === 1 && groups[2]?.length === 2) {
    return { type: 'fourWithTwo', cards: sorted, mainValue: groups[4][0] };
  }

  // 顺子 (>=5张连续单牌，不含2和王)
  if (len >= 5 && checkStraight(sorted, 1)) {
    const minVal = Math.min(...sorted.map(c => c.value));
    return { type: 'straight', cards: sorted, mainValue: minVal, length: len };
  }

  // 连对 (>=3对连续对子，不含2和王)
  if (len >= 6 && len % 2 === 0 && checkStraight(sorted, 2)) {
    const minVal = Math.min(...sorted.map(c => c.value));
    return {
      type: 'straightPair',
      cards: sorted,
      mainValue: minVal,
      length: len / 2,
    };
  }

  // 飞机不带 (>=2组连续三条)
  if (len >= 6 && len % 3 === 0 && groups[3]?.length === len / 3) {
    const triValues = groups[3].sort((a, b) => a - b);
    if (isConsecutive(triValues)) {
      return {
        type: 'plane',
        cards: sorted,
        mainValue: triValues[0],
        length: triValues.length,
      };
    }
  }

  // 飞机带翅膀（带单牌或带对子）
  if (groups[3] && groups[3].length >= 2) {
    const triValues = groups[3].sort((a, b) => a - b);
    if (isConsecutive(triValues)) {
      const triCount = triValues.length;
      const remaining = len - triCount * 3;
      // 带单牌
      if (remaining === triCount) {
        return {
          type: 'planeWithWings',
          cards: sorted,
          mainValue: triValues[0],
          length: triCount,
        };
      }
      // 带对子
      if (remaining === triCount * 2 && groups[2]?.length === triCount) {
        return {
          type: 'planeWithWings',
          cards: sorted,
          mainValue: triValues[0],
          length: triCount,
        };
      }
    }
  }

  return null;
}

// 检查是否为连续（顺子/连对检查）
function checkStraight(cards: Card[], groupSize: number): boolean {
  // 不能包含2和王
  if (cards.some(c => c.value >= 15)) return false;
  const countMap = countByValue(cards);
  // 每个 value 必须恰好 groupSize 张
  for (const [, arr] of countMap) {
    if (arr.length !== groupSize) return false;
  }
  const values = Array.from(countMap.keys()).sort((a, b) => a - b);
  return isConsecutive(values);
}

// 值是否连续
function isConsecutive(values: number[]): boolean {
  if (values.length < 2) return true;
  for (let i = 1; i < values.length; i++) {
    if (values[i] - values[i - 1] !== 1) return false;
  }
  // 不能包含2(15)或王(16,17)
  return values.every(v => v <= 14);
}

// 比较两个 combo: 返回 true 表示 a 能打过 b
export function canBeat(a: Combo, b: Combo): boolean {
  // 火箭打一切
  if (a.type === 'rocket') return true;
  if (b.type === 'rocket') return false;

  // 炸弹打非炸弹
  if (a.type === 'bomb' && b.type !== 'bomb') return true;
  if (a.type !== 'bomb' && b.type === 'bomb') return false;

  // 同类型比较
  if (a.type !== b.type) return false;

  // 顺子/连对/飞机必须长度相同
  if (a.length !== undefined && b.length !== undefined && a.length !== b.length)
    return false;
  if (a.cards.length !== b.cards.length) return false;

  return a.mainValue > b.mainValue;
}

// 获取牌型的中文名
export function getComboName(type: ComboType): string {
  const names: Record<ComboType, string> = {
    single: '\u5355\u5f20',
    pair: '\u5bf9\u5b50',
    triple: '\u4e09\u4e0d\u5e26',
    tripleWithOne: '\u4e09\u5e26\u4e00',
    tripleWithPair: '\u4e09\u5e26\u4e8c',
    straight: '\u987a\u5b50',
    straightPair: '\u8fde\u5bf9',
    plane: '\u98de\u673a',
    planeWithWings: '\u98de\u673a\u5e26\u7fc5\u8180',
    fourWithTwo: '\u56db\u5e26\u4e8c',
    bomb: '\u70b8\u5f39',
    rocket: '\u706b\u7bad',
  };
  return names[type];
}
