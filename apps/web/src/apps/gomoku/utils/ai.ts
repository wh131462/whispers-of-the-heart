import type { CellValue, Position, Player, Difficulty } from '../types';
import { BOARD_SIZE, WIN_COUNT } from '../types';

const DIRECTIONS = [
  { dr: 0, dc: 1 }, // 水平
  { dr: 1, dc: 0 }, // 垂直
  { dr: 1, dc: 1 }, // 主对角线
  { dr: 1, dc: -1 }, // 副对角线
];

// 棋型分数 - 更精确的评分体系
const SCORES = {
  FIVE: 1000000, // 连五
  LIVE_FOUR: 100000, // 活四
  RUSH_FOUR: 10000, // 冲四
  LIVE_THREE: 10000, // 活三
  SLEEP_THREE: 1000, // 眠三
  LIVE_TWO: 1000, // 活二
  SLEEP_TWO: 100, // 眠二
  LIVE_ONE: 10, // 活一
};

// 分析一条线上的棋型
function analyzeLinePattern(
  board: CellValue[][],
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: Player
): number {
  // 获取这条线上连续的棋子数和两端情况
  let count = 1;
  let block = 0;
  let empty1 = 0;
  let empty2 = 0;

  // 正向扫描
  let r = row + dr;
  let c = col + dc;
  let foundEmpty = false;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
    if (board[r][c] === player) {
      if (!foundEmpty) {
        count++;
      } else {
        empty1++;
        break;
      }
    } else if (board[r][c] === null) {
      if (!foundEmpty) {
        foundEmpty = true;
        // 检查空位后是否还有己方棋子（跳活）
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 &&
          nr < BOARD_SIZE &&
          nc >= 0 &&
          nc < BOARD_SIZE &&
          board[nr][nc] === player
        ) {
          empty1 = 1;
        }
      }
      break;
    } else {
      block++;
      break;
    }
    r += dr;
    c += dc;
  }
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
    block++;
  }

  // 反向扫描
  foundEmpty = false;
  r = row - dr;
  c = col - dc;
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
    if (board[r][c] === player) {
      if (!foundEmpty) {
        count++;
      } else {
        empty2++;
        break;
      }
    } else if (board[r][c] === null) {
      if (!foundEmpty) {
        foundEmpty = true;
        const nr = r - dr;
        const nc = c - dc;
        if (
          nr >= 0 &&
          nr < BOARD_SIZE &&
          nc >= 0 &&
          nc < BOARD_SIZE &&
          board[nr][nc] === player
        ) {
          empty2 = 1;
        }
      }
      break;
    } else {
      block++;
      break;
    }
    r -= dr;
    c -= dc;
  }
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
    block++;
  }

  // 根据连子数、封堵数、跳空数评分
  return evaluatePattern(count, block, empty1 + empty2);
}

function evaluatePattern(count: number, block: number, empty: number): number {
  if (count >= WIN_COUNT) return SCORES.FIVE;

  if (block === 0) {
    // 两端都开放
    switch (count) {
      case 4:
        return SCORES.LIVE_FOUR;
      case 3:
        return empty > 0 ? SCORES.LIVE_THREE : SCORES.LIVE_THREE;
      case 2:
        return SCORES.LIVE_TWO;
      case 1:
        return SCORES.LIVE_ONE;
    }
  } else if (block === 1) {
    // 一端被封堵
    switch (count) {
      case 4:
        return SCORES.RUSH_FOUR;
      case 3:
        return SCORES.SLEEP_THREE;
      case 2:
        return SCORES.SLEEP_TWO;
    }
  }

  // 跳活棋型额外加分
  if (empty > 0 && count >= 2 && block < 2) {
    return evaluatePattern(count + empty, block, 0) * 0.8;
  }

  return 0;
}

// 评估某个位置对某个玩家的价值
function evaluatePosition(
  board: CellValue[][],
  row: number,
  col: number,
  player: Player
): number {
  let score = 0;
  for (const { dr, dc } of DIRECTIONS) {
    score += analyzeLinePattern(board, row, col, dr, dc, player);
  }
  return score;
}

// 计算位置的综合分数（考虑进攻和防守）
function getPositionScore(
  board: CellValue[][],
  row: number,
  col: number,
  player: Player
): { attack: number; defense: number; total: number } {
  const opponent = player === 'black' ? 'white' : 'black';

  board[row][col] = player;
  const attack = evaluatePosition(board, row, col, player);
  board[row][col] = null;

  board[row][col] = opponent;
  const defense = evaluatePosition(board, row, col, opponent);
  board[row][col] = null;

  // 进攻优先，但防守也很重要
  // 如果对手形成活四或更高威胁，必须防守
  const defenseMultiplier = defense >= SCORES.LIVE_FOUR ? 1.1 : 0.95;

  return {
    attack,
    defense,
    total: attack + defense * defenseMultiplier,
  };
}

// 获取有价值的候选位置
function getCandidateMoves(board: CellValue[][], range = 2): Position[] {
  const candidates = new Set<string>();

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) {
        for (let dr = -range; dr <= range; dr++) {
          for (let dc = -range; dc <= range; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 &&
              nr < BOARD_SIZE &&
              nc >= 0 &&
              nc < BOARD_SIZE &&
              board[nr][nc] === null
            ) {
              candidates.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  if (candidates.size === 0) {
    const center = Math.floor(BOARD_SIZE / 2);
    return [{ row: center, col: center }];
  }

  return Array.from(candidates).map(key => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });
}

// 获取排序后的候选位置（按评分从高到低）
function getSortedCandidates(
  board: CellValue[][],
  player: Player,
  maxCount = 20
): Array<Position & { score: number }> {
  const candidates = getCandidateMoves(board);

  const scored = candidates.map(pos => {
    const { total } = getPositionScore(board, pos.row, pos.col, player);
    return { ...pos, score: total };
  });

  // 按分数降序排序
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxCount);
}

// 检查是否有必杀点（VCF - Victory by Continuous Four）
function findWinningMove(
  board: CellValue[][],
  player: Player
): Position | null {
  const candidates = getCandidateMoves(board);

  for (const move of candidates) {
    board[move.row][move.col] = player;
    const score = evaluatePosition(board, move.row, move.col, player);
    board[move.row][move.col] = null;

    if (score >= SCORES.FIVE) {
      return move;
    }
  }

  return null;
}

// 检查是否有必须防守的点
function findDefensiveMove(
  board: CellValue[][],
  player: Player
): Position | null {
  const opponent = player === 'black' ? 'white' : 'black';
  const candidates = getCandidateMoves(board);

  // 检查对手是否有连五威胁
  for (const move of candidates) {
    board[move.row][move.col] = opponent;
    const score = evaluatePosition(board, move.row, move.col, opponent);
    board[move.row][move.col] = null;

    if (score >= SCORES.FIVE) {
      return move;
    }
  }

  return null;
}

// 检查是否有活四威胁需要防守
function findLiveFourThreat(
  board: CellValue[][],
  player: Player
): Position | null {
  const opponent = player === 'black' ? 'white' : 'black';
  const candidates = getCandidateMoves(board);

  for (const move of candidates) {
    board[move.row][move.col] = opponent;
    const score = evaluatePosition(board, move.row, move.col, opponent);
    board[move.row][move.col] = null;

    if (score >= SCORES.LIVE_FOUR) {
      return move;
    }
  }

  return null;
}

// ==================== Easy AI ====================
// 简单AI：有基础策略意识，但会犯错
function getEasyMove(board: CellValue[][], player: Player): Position {
  const candidates = getCandidateMoves(board);

  // 30% 概率纯随机
  if (Math.random() < 0.3) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // 检查是否能赢（70%概率会下）
  const winMove = findWinningMove(board, player);
  if (winMove && Math.random() < 0.7) {
    return winMove;
  }

  // 检查是否需要防守（50%概率会防）
  const defMove = findDefensiveMove(board, player);
  if (defMove && Math.random() < 0.5) {
    return defMove;
  }

  // 简单评估：选择分数前5的位置中随机一个
  const scored = getSortedCandidates(board, player, 5);
  const idx = Math.floor(Math.random() * Math.min(3, scored.length));
  return { row: scored[idx].row, col: scored[idx].col };
}

// ==================== Medium AI ====================
// 中等AI：贪心算法 + 威胁识别
function getMediumMove(board: CellValue[][], player: Player): Position {
  // 必须先检查是否能直接获胜
  const winMove = findWinningMove(board, player);
  if (winMove) return winMove;

  // 必须检查是否需要防守
  const defMove = findDefensiveMove(board, player);
  if (defMove) return defMove;

  // 检查活四威胁
  const liveFourThreat = findLiveFourThreat(board, player);
  if (liveFourThreat) return liveFourThreat;

  // 获取排序后的候选点
  const candidates = getSortedCandidates(board, player, 10);

  // 尝试找双三、四三等组合进攻
  const opponent = player === 'black' ? 'white' : 'black';
  let bestMove = candidates[0];
  let bestScore = -Infinity;

  for (const move of candidates) {
    board[move.row][move.col] = player;
    const attackScore = evaluatePosition(board, move.row, move.col, player);
    board[move.row][move.col] = null;

    board[move.row][move.col] = opponent;
    const defenseScore = evaluatePosition(board, move.row, move.col, opponent);
    board[move.row][move.col] = null;

    // 如果形成活三或以上，优先级更高
    let bonus = 0;
    if (attackScore >= SCORES.LIVE_THREE) {
      bonus = attackScore * 0.5;
    }

    const score = attackScore + defenseScore * 0.95 + bonus;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { row: bestMove.row, col: bestMove.col };
}

// ==================== Hard AI ====================
// 评估整个棋盘局面
function evaluateBoard(board: CellValue[][], player: Player): number {
  const opponent = player === 'black' ? 'white' : 'black';
  let score = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) {
        score += evaluatePosition(board, r, c, player);
      } else if (board[r][c] === opponent) {
        score -= evaluatePosition(board, r, c, opponent) * 1.05;
      }
    }
  }

  // 中心位置加分
  const center = Math.floor(BOARD_SIZE / 2);
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) {
        const distToCenter = Math.abs(r - center) + Math.abs(c - center);
        score += Math.max(0, 10 - distToCenter);
      }
    }
  }

  return score;
}

// Minimax + Alpha-Beta 剪枝
function minimax(
  board: CellValue[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player
): number {
  const opponent = aiPlayer === 'black' ? 'white' : 'black';

  if (depth === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  // 获取排序后的候选点以提高剪枝效率
  const candidates = getSortedCandidates(
    board,
    isMaximizing ? aiPlayer : opponent,
    12
  );
  if (candidates.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of candidates) {
      board[move.row][move.col] = aiPlayer;

      // 立即检查获胜
      const score = evaluatePosition(board, move.row, move.col, aiPlayer);
      if (score >= SCORES.FIVE) {
        board[move.row][move.col] = null;
        return SCORES.FIVE + depth * 1000;
      }

      const evalScore = minimax(board, depth - 1, alpha, beta, false, aiPlayer);
      board[move.row][move.col] = null;

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of candidates) {
      board[move.row][move.col] = opponent;

      const score = evaluatePosition(board, move.row, move.col, opponent);
      if (score >= SCORES.FIVE) {
        board[move.row][move.col] = null;
        return -SCORES.FIVE - depth * 1000;
      }

      const evalScore = minimax(board, depth - 1, alpha, beta, true, aiPlayer);
      board[move.row][move.col] = null;

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// 迭代加深搜索
function iterativeDeepening(
  board: CellValue[][],
  player: Player,
  maxDepth: number
): Position {
  const candidates = getSortedCandidates(board, player, 15);
  let bestMove = candidates[0];

  for (let depth = 1; depth <= maxDepth; depth++) {
    let bestScore = -Infinity;

    for (const move of candidates) {
      board[move.row][move.col] = player;
      const score = minimax(
        board,
        depth - 1,
        -Infinity,
        Infinity,
        false,
        player
      );
      board[move.row][move.col] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      // 找到必胜点直接返回
      if (score >= SCORES.FIVE) {
        return { row: bestMove.row, col: bestMove.col };
      }
    }
  }

  return { row: bestMove.row, col: bestMove.col };
}

// 困难AI：Minimax + 迭代加深 + 威胁识别
function getHardMove(board: CellValue[][], player: Player): Position {
  // 必杀检查
  const winMove = findWinningMove(board, player);
  if (winMove) return winMove;

  // 防守检查
  const defMove = findDefensiveMove(board, player);
  if (defMove) return defMove;

  // 活四威胁检查
  const liveFourThreat = findLiveFourThreat(board, player);
  if (liveFourThreat) return liveFourThreat;

  // 检查己方是否能形成活四（必须下）
  const candidates = getSortedCandidates(board, player, 15);
  for (const move of candidates) {
    board[move.row][move.col] = player;
    const score = evaluatePosition(board, move.row, move.col, player);
    board[move.row][move.col] = null;

    if (score >= SCORES.LIVE_FOUR) {
      return { row: move.row, col: move.col };
    }
  }

  // 使用迭代加深搜索，深度为4
  return iterativeDeepening(board, player, 4);
}

export function getAIMove(
  board: CellValue[][],
  player: Player,
  difficulty: Difficulty
): Position {
  // 复制棋盘以避免修改原始数据
  const boardCopy = board.map(row => [...row]);

  switch (difficulty) {
    case 'easy':
      return getEasyMove(boardCopy, player);
    case 'medium':
      return getMediumMove(boardCopy, player);
    case 'hard':
      return getHardMove(boardCopy, player);
  }
}
