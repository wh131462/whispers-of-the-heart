import type { CellValue, Position, Player, Difficulty } from '../types';
import { BOARD_SIZE } from '../types';
import { getValidMoves, makeMove, countPieces } from './game';

// 位置权重矩阵
const POSITION_WEIGHTS = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
];

function evaluateBoard(board: CellValue[][], player: Player): number {
  const opponent = player === 'black' ? 'white' : 'black';
  let score = 0;

  // 位置权重分数
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) {
        score += POSITION_WEIGHTS[r][c];
      } else if (board[r][c] === opponent) {
        score -= POSITION_WEIGHTS[r][c];
      }
    }
  }

  // 可移动性分数
  const playerMoves = getValidMoves(board, player).length;
  const opponentMoves = getValidMoves(board, opponent).length;
  score += (playerMoves - opponentMoves) * 5;

  // 棋子数量（后期更重要）
  const { black, white } = countPieces(board);
  const totalPieces = black + white;
  if (totalPieces > 50) {
    const pieceScore = player === 'black' ? black - white : white - black;
    score += pieceScore * 2;
  }

  return score;
}

// 简单 AI：随机选择
function getEasyMove(board: CellValue[][], player: Player): Position {
  const moves = getValidMoves(board, player);
  return moves[Math.floor(Math.random() * moves.length)];
}

// 中等 AI：贪心算法（考虑位置权重）
function getMediumMove(board: CellValue[][], player: Player): Position {
  const moves = getValidMoves(board, player);

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const newBoard = makeMove(board, move.row, move.col, player);
    const score = evaluateBoard(newBoard, player);

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
  const currentPlayer = isMaximizing ? aiPlayer : opponent;

  const moves = getValidMoves(board, currentPlayer);
  const opponentMoves = getValidMoves(
    board,
    currentPlayer === 'black' ? 'white' : 'black'
  );

  // 终止条件
  if (depth === 0 || (moves.length === 0 && opponentMoves.length === 0)) {
    return evaluateBoard(board, aiPlayer);
  }

  // 无法落子时跳过
  if (moves.length === 0) {
    return minimax(board, depth - 1, alpha, beta, !isMaximizing, aiPlayer);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move.row, move.col, currentPlayer);
      const evalScore = minimax(
        newBoard,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer
      );
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move.row, move.col, currentPlayer);
      const evalScore = minimax(
        newBoard,
        depth - 1,
        alpha,
        beta,
        true,
        aiPlayer
      );
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getHardMove(board: CellValue[][], player: Player): Position {
  const moves = getValidMoves(board, player);

  let bestMove = moves[0];
  let bestScore = -Infinity;

  // 动态调整搜索深度
  const { black, white } = countPieces(board);
  const emptyCount = BOARD_SIZE * BOARD_SIZE - black - white;
  const depth = emptyCount > 10 ? 4 : 6;

  for (const move of moves) {
    const newBoard = makeMove(board, move.row, move.col, player);
    const score = minimax(newBoard, depth, -Infinity, Infinity, false, player);

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
  const boardCopy = board.map(r => [...r]);

  switch (difficulty) {
    case 'easy':
      return getEasyMove(boardCopy, player);
    case 'medium':
      return getMediumMove(boardCopy, player);
    case 'hard':
      return getHardMove(boardCopy, player);
  }
}
