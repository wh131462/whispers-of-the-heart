import type { CellValue, Position, Player, Difficulty } from '../types';
import { BOARD_SIZE, WIN_COUNT } from '../types';

const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 },
];

// 评估某个方向上的棋型
function evaluateLine(
  board: CellValue[][],
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: Player
): number {
  let count = 1;
  let openEnds = 0;

  // 正向检查
  let r = row + dr;
  let c = col + dc;
  while (
    r >= 0 &&
    r < BOARD_SIZE &&
    c >= 0 &&
    c < BOARD_SIZE &&
    board[r][c] === player
  ) {
    count++;
    r += dr;
    c += dc;
  }
  if (
    r >= 0 &&
    r < BOARD_SIZE &&
    c >= 0 &&
    c < BOARD_SIZE &&
    board[r][c] === null
  ) {
    openEnds++;
  }

  // 反向检查
  r = row - dr;
  c = col - dc;
  while (
    r >= 0 &&
    r < BOARD_SIZE &&
    c >= 0 &&
    c < BOARD_SIZE &&
    board[r][c] === player
  ) {
    count++;
    r -= dr;
    c -= dc;
  }
  if (
    r >= 0 &&
    r < BOARD_SIZE &&
    c >= 0 &&
    c < BOARD_SIZE &&
    board[r][c] === null
  ) {
    openEnds++;
  }

  // 评分规则
  if (count >= WIN_COUNT) return 100000;
  if (count === 4 && openEnds === 2) return 10000;
  if (count === 4 && openEnds === 1) return 1000;
  if (count === 3 && openEnds === 2) return 1000;
  if (count === 3 && openEnds === 1) return 100;
  if (count === 2 && openEnds === 2) return 100;
  if (count === 2 && openEnds === 1) return 10;
  if (count === 1 && openEnds === 2) return 10;

  return 0;
}

// 评估某个位置的价值
function evaluatePosition(
  board: CellValue[][],
  row: number,
  col: number,
  player: Player
): number {
  let score = 0;
  for (const { dr, dc } of DIRECTIONS) {
    score += evaluateLine(board, row, col, dr, dc, player);
  }
  return score;
}

// 获取有价值的候选位置（只考虑已有棋子周围的位置）
function getCandidateMoves(board: CellValue[][]): Position[] {
  const candidates = new Set<string>();
  const range = 2;

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
    // 棋盘为空，返回中心位置
    const center = Math.floor(BOARD_SIZE / 2);
    return [{ row: center, col: center }];
  }

  return Array.from(candidates).map(key => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });
}

// 简单 AI：随机选择
function getEasyMove(board: CellValue[][]): Position {
  const candidates = getCandidateMoves(board);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// 中等 AI：贪心算法
function getMediumMove(board: CellValue[][], player: Player): Position {
  const candidates = getCandidateMoves(board);
  const opponent = player === 'black' ? 'white' : 'black';

  let bestMove = candidates[0];
  let bestScore = -Infinity;

  for (const move of candidates) {
    // 模拟落子
    board[move.row][move.col] = player;
    const attackScore = evaluatePosition(board, move.row, move.col, player);
    board[move.row][move.col] = null;

    board[move.row][move.col] = opponent;
    const defenseScore = evaluatePosition(board, move.row, move.col, opponent);
    board[move.row][move.col] = null;

    const score = attackScore + defenseScore * 0.9;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// 困难 AI：Minimax + Alpha-Beta 剪枝
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

  const candidates = getCandidateMoves(board);
  if (candidates.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of candidates.slice(0, 15)) {
      board[move.row][move.col] = aiPlayer;

      // 检查是否获胜
      const score = evaluatePosition(board, move.row, move.col, aiPlayer);
      if (score >= 100000) {
        board[move.row][move.col] = null;
        return 100000 + depth;
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
    for (const move of candidates.slice(0, 15)) {
      board[move.row][move.col] = opponent;

      const score = evaluatePosition(board, move.row, move.col, opponent);
      if (score >= 100000) {
        board[move.row][move.col] = null;
        return -100000 - depth;
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

function evaluateBoard(board: CellValue[][], player: Player): number {
  const opponent = player === 'black' ? 'white' : 'black';
  let score = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) {
        score += evaluatePosition(board, r, c, player);
      } else if (board[r][c] === opponent) {
        score -= evaluatePosition(board, r, c, opponent);
      }
    }
  }

  return score;
}

function getHardMove(board: CellValue[][], player: Player): Position {
  const candidates = getCandidateMoves(board);
  const opponent = player === 'black' ? 'white' : 'black';

  // 先检查是否能直接获胜
  for (const move of candidates) {
    board[move.row][move.col] = player;
    const score = evaluatePosition(board, move.row, move.col, player);
    board[move.row][move.col] = null;
    if (score >= 100000) return move;
  }

  // 检查是否需要防守
  for (const move of candidates) {
    board[move.row][move.col] = opponent;
    const score = evaluatePosition(board, move.row, move.col, opponent);
    board[move.row][move.col] = null;
    if (score >= 100000) return move;
  }

  // 使用 minimax 寻找最佳位置
  let bestMove = candidates[0];
  let bestScore = -Infinity;

  for (const move of candidates.slice(0, 20)) {
    board[move.row][move.col] = player;
    const score = minimax(board, 2, -Infinity, Infinity, false, player);
    board[move.row][move.col] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
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
      return getEasyMove(boardCopy);
    case 'medium':
      return getMediumMove(boardCopy, player);
    case 'hard':
      return getHardMove(boardCopy, player);
  }
}
