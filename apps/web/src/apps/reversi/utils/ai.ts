import type { CellValue, Position, Player, Difficulty } from '../types';
import { BOARD_SIZE } from '../types';
import { getValidMoves, makeMove, countPieces } from './game';

// 基础位置权重矩阵
const BASE_POSITION_WEIGHTS = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
];

// 角落位置
const CORNERS: Position[] = [
  { row: 0, col: 0 },
  { row: 0, col: 7 },
  { row: 7, col: 0 },
  { row: 7, col: 7 },
];

// X位（角落对角线，非常危险）
const X_SQUARES: Position[] = [
  { row: 1, col: 1 },
  { row: 1, col: 6 },
  { row: 6, col: 1 },
  { row: 6, col: 6 },
];

// C位（角落相邻，危险）
const C_SQUARES: Position[] = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: 6 },
  { row: 1, col: 7 },
  { row: 6, col: 0 },
  { row: 7, col: 1 },
  { row: 6, col: 7 },
  { row: 7, col: 6 },
];

// 获取动态位置权重（根据角落占领情况调整）
function getDynamicWeights(board: CellValue[][]): number[][] {
  const weights = BASE_POSITION_WEIGHTS.map(row => [...row]);

  // 如果角落被占领，相邻的X位和C位不再危险
  // 角落0,0
  if (board[0][0] !== null) {
    weights[0][1] = Math.abs(weights[0][1]);
    weights[1][0] = Math.abs(weights[1][0]);
    weights[1][1] = Math.abs(weights[1][1]);
  }
  // 角落0,7
  if (board[0][7] !== null) {
    weights[0][6] = Math.abs(weights[0][6]);
    weights[1][7] = Math.abs(weights[1][7]);
    weights[1][6] = Math.abs(weights[1][6]);
  }
  // 角落7,0
  if (board[7][0] !== null) {
    weights[7][1] = Math.abs(weights[7][1]);
    weights[6][0] = Math.abs(weights[6][0]);
    weights[6][1] = Math.abs(weights[6][1]);
  }
  // 角落7,7
  if (board[7][7] !== null) {
    weights[7][6] = Math.abs(weights[7][6]);
    weights[6][7] = Math.abs(weights[6][7]);
    weights[6][6] = Math.abs(weights[6][6]);
  }

  return weights;
}

// 计算稳定子（无法被翻转的棋子）
function countStableDiscs(board: CellValue[][], player: Player): number {
  const stable: boolean[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(false));

  // 从四个角落开始标记稳定子
  const directions = [
    [
      { row: 1, col: 0 },
      { row: 0, col: 1 },
    ], // 从左上角
    [
      { row: 1, col: 0 },
      { row: 0, col: -1 },
    ], // 从右上角
    [
      { row: -1, col: 0 },
      { row: 0, col: 1 },
    ], // 从左下角
    [
      { row: -1, col: 0 },
      { row: 0, col: -1 },
    ], // 从右下角
  ];

  const corners = [
    { row: 0, col: 0 },
    { row: 0, col: 7 },
    { row: 7, col: 0 },
    { row: 7, col: 7 },
  ];

  for (let i = 0; i < 4; i++) {
    const corner = corners[i];
    if (board[corner.row][corner.col] === player) {
      // 从角落沿边扩展标记稳定子
      markStableFromCorner(board, stable, player, corner, directions[i]);
    }
  }

  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (stable[r][c]) count++;
    }
  }
  return count;
}

function markStableFromCorner(
  board: CellValue[][],
  stable: boolean[][],
  player: Player,
  corner: Position,
  dirs: { row: number; col: number }[]
): void {
  const queue: Position[] = [corner];
  stable[corner.row][corner.col] = true;

  while (queue.length > 0) {
    const pos = queue.shift()!;

    for (const dir of dirs) {
      const nr = pos.row + dir.row;
      const nc = pos.col + dir.col;

      if (
        nr >= 0 &&
        nr < BOARD_SIZE &&
        nc >= 0 &&
        nc < BOARD_SIZE &&
        !stable[nr][nc] &&
        board[nr][nc] === player
      ) {
        // 检查是否与已稳定的子相邻
        let isStable = false;
        if (dir.row !== 0 && stable[pos.row][nc]) isStable = true;
        if (dir.col !== 0 && stable[nr][pos.col]) isStable = true;
        if (dir.row === 0 || dir.col === 0) isStable = true;

        if (isStable) {
          stable[nr][nc] = true;
          queue.push({ row: nr, col: nc });
        }
      }
    }
  }
}

// 计算边界子（在边界上的棋子数）
function countEdgeDiscs(board: CellValue[][], player: Player): number {
  let count = 0;
  // 上下边
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board[0][c] === player) count++;
    if (board[7][c] === player) count++;
  }
  // 左右边（不重复计算角落）
  for (let r = 1; r < BOARD_SIZE - 1; r++) {
    if (board[r][0] === player) count++;
    if (board[r][7] === player) count++;
  }
  return count;
}

// 计算角落控制
function countCorners(board: CellValue[][], player: Player): number {
  let count = 0;
  for (const corner of CORNERS) {
    if (board[corner.row][corner.col] === player) count++;
  }
  return count;
}

// 计算危险位置（X位和C位在角落未被占领时）
function countDangerousPositions(board: CellValue[][], player: Player): number {
  let count = 0;

  // X位
  const xCorners = [
    { x: { row: 1, col: 1 }, corner: { row: 0, col: 0 } },
    { x: { row: 1, col: 6 }, corner: { row: 0, col: 7 } },
    { x: { row: 6, col: 1 }, corner: { row: 7, col: 0 } },
    { x: { row: 6, col: 6 }, corner: { row: 7, col: 7 } },
  ];

  for (const { x, corner } of xCorners) {
    if (
      board[corner.row][corner.col] === null &&
      board[x.row][x.col] === player
    ) {
      count += 3; // X位惩罚更重
    }
  }

  // C位
  const cCorners = [
    {
      c: [
        { row: 0, col: 1 },
        { row: 1, col: 0 },
      ],
      corner: { row: 0, col: 0 },
    },
    {
      c: [
        { row: 0, col: 6 },
        { row: 1, col: 7 },
      ],
      corner: { row: 0, col: 7 },
    },
    {
      c: [
        { row: 7, col: 1 },
        { row: 6, col: 0 },
      ],
      corner: { row: 7, col: 0 },
    },
    {
      c: [
        { row: 7, col: 6 },
        { row: 6, col: 7 },
      ],
      corner: { row: 7, col: 7 },
    },
  ];

  for (const { c, corner } of cCorners) {
    if (board[corner.row][corner.col] === null) {
      for (const pos of c) {
        if (board[pos.row][pos.col] === player) count++;
      }
    }
  }

  return count;
}

// 前沿子（与空格相邻的棋子，越少越好）
function countFrontierDiscs(board: CellValue[][], player: Player): number {
  let count = 0;
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) {
        for (const [dr, dc] of directions) {
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < BOARD_SIZE &&
            nc >= 0 &&
            nc < BOARD_SIZE &&
            board[nr][nc] === null
          ) {
            count++;
            break;
          }
        }
      }
    }
  }
  return count;
}

// 综合评估函数
function evaluateBoard(board: CellValue[][], player: Player): number {
  const opponent = player === 'black' ? 'white' : 'black';
  const { black, white } = countPieces(board);
  const totalPieces = black + white;
  // 游戏阶段判断
  const isEarlyGame = totalPieces <= 20;
  const isMidGame = totalPieces > 20 && totalPieces <= 50;
  const isEndGame = totalPieces > 50;

  let score = 0;

  // 1. 位置权重分数（使用动态权重）
  const weights = getDynamicWeights(board);
  let positionScore = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) {
        positionScore += weights[r][c];
      } else if (board[r][c] === opponent) {
        positionScore -= weights[r][c];
      }
    }
  }
  score += positionScore;

  // 2. 角落控制（非常重要）
  const myCorners = countCorners(board, player);
  const oppCorners = countCorners(board, opponent);
  score += (myCorners - oppCorners) * 100;

  // 3. 稳定子（重要）
  const myStable = countStableDiscs(board, player);
  const oppStable = countStableDiscs(board, opponent);
  score += (myStable - oppStable) * 25;

  // 4. 行动力（可下位置数量）
  const myMoves = getValidMoves(board, player).length;
  const oppMoves = getValidMoves(board, opponent).length;

  if (isEarlyGame || isMidGame) {
    // 早期和中期行动力很重要
    if (oppMoves === 0 && myMoves > 0) {
      score += 50; // 让对方无子可下
    }
    score += (myMoves - oppMoves) * 10;
  }

  // 5. 危险位置惩罚
  const myDangerous = countDangerousPositions(board, player);
  const oppDangerous = countDangerousPositions(board, opponent);
  score -= myDangerous * 15;
  score += oppDangerous * 15;

  // 6. 边界控制
  const myEdge = countEdgeDiscs(board, player);
  const oppEdge = countEdgeDiscs(board, opponent);
  score += (myEdge - oppEdge) * 5;

  // 7. 前沿子（越少越好）
  if (!isEndGame) {
    const myFrontier = countFrontierDiscs(board, player);
    const oppFrontier = countFrontierDiscs(board, opponent);
    score -= (myFrontier - oppFrontier) * 3;
  }

  // 8. 棋子数量（仅在终局重要）
  if (isEndGame) {
    const pieceScore = player === 'black' ? black - white : white - black;
    score += pieceScore * 10;
  } else if (isEarlyGame) {
    // 早期减少棋子数可能更好（更灵活）
    const pieceScore = player === 'black' ? black - white : white - black;
    score -= pieceScore * 2;
  }

  return score;
}

// Move ordering: 按评估分数排序以提高剪枝效率
function orderMoves(
  board: CellValue[][],
  moves: Position[],
  player: Player
): Position[] {
  const scored = moves.map(move => {
    const newBoard = makeMove(board, move.row, move.col, player);
    const score = evaluateBoard(newBoard, player);
    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.move);
}

// ==================== Easy AI ====================
// 简单AI：有基础策略意识但会犯错
function getEasyMove(board: CellValue[][], player: Player): Position {
  const moves = getValidMoves(board, player);

  // 40% 纯随机
  if (Math.random() < 0.4) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // 60% 概率会抢角落
  for (const move of moves) {
    const isCorner = CORNERS.some(
      c => c.row === move.row && c.col === move.col
    );
    if (isCorner && Math.random() < 0.6) {
      return move;
    }
  }

  // 50% 概率避开X位
  const safeMovesFromX = moves.filter(
    m => !X_SQUARES.some(x => x.row === m.row && x.col === m.col)
  );
  if (safeMovesFromX.length > 0 && Math.random() < 0.5) {
    return safeMovesFromX[Math.floor(Math.random() * safeMovesFromX.length)];
  }

  return moves[Math.floor(Math.random() * moves.length)];
}

// ==================== Medium AI ====================
// 中等AI：贪心 + 威胁识别
function getMediumMove(board: CellValue[][], player: Player): Position {
  const moves = getValidMoves(board, player);
  const opponent = player === 'black' ? 'white' : 'black';

  // 优先抢角落
  for (const move of moves) {
    const isCorner = CORNERS.some(
      c => c.row === move.row && c.col === move.col
    );
    if (isCorner) return move;
  }

  // 避免给对手角落机会
  const safeFromX = moves.filter(m => {
    // 检查这步是否会让对手能下角落
    const newBoard = makeMove(board, m.row, m.col, player);
    const oppMoves = getValidMoves(newBoard, opponent);
    return !oppMoves.some(om =>
      CORNERS.some(c => c.row === om.row && c.col === om.col)
    );
  });

  const candidates = safeFromX.length > 0 ? safeFromX : moves;

  let bestMove = candidates[0];
  let bestScore = -Infinity;

  for (const move of candidates) {
    const newBoard = makeMove(board, move.row, move.col, player);
    const score = evaluateBoard(newBoard, player);

    // 额外惩罚X位和C位
    const isXSquare = X_SQUARES.some(
      x => x.row === move.row && x.col === move.col
    );
    const isCSquare = C_SQUARES.some(
      c => c.row === move.row && c.col === move.col
    );

    let adjustedScore = score;
    if (isXSquare) adjustedScore -= 50;
    if (isCSquare) adjustedScore -= 25;

    if (adjustedScore > bestScore) {
      bestScore = adjustedScore;
      bestMove = move;
    }
  }

  return bestMove;
}

// ==================== Hard AI ====================
// Minimax + Alpha-Beta + Move Ordering
function minimax(
  board: CellValue[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  useOrdering: boolean
): number {
  const opponent = aiPlayer === 'black' ? 'white' : 'black';
  const currentPlayer = isMaximizing ? aiPlayer : opponent;

  let moves = getValidMoves(board, currentPlayer);
  const opponentMoves = getValidMoves(
    board,
    currentPlayer === 'black' ? 'white' : 'black'
  );

  // 终止条件：达到深度限制或游戏结束
  if (depth === 0 || (moves.length === 0 && opponentMoves.length === 0)) {
    return evaluateBoard(board, aiPlayer);
  }

  // 无法落子时跳过
  if (moves.length === 0) {
    return minimax(
      board,
      depth - 1,
      alpha,
      beta,
      !isMaximizing,
      aiPlayer,
      useOrdering
    );
  }

  // Move ordering（仅在深度较大时使用以节省性能）
  if (useOrdering && depth >= 3) {
    moves = orderMoves(board, moves, currentPlayer);
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
        aiPlayer,
        useOrdering
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
        aiPlayer,
        useOrdering
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
  const opponent = player === 'black' ? 'white' : 'black';

  // 优先抢角落
  for (const move of moves) {
    const isCorner = CORNERS.some(
      c => c.row === move.row && c.col === move.col
    );
    if (isCorner) return move;
  }

  // 动态调整搜索深度
  const { black, white } = countPieces(board);
  const emptyCount = BOARD_SIZE * BOARD_SIZE - black - white;

  let depth: number;
  if (emptyCount <= 12) {
    // 终局：尽可能深搜
    depth = Math.min(emptyCount, 10);
  } else if (emptyCount <= 20) {
    depth = 6;
  } else {
    depth = 5;
  }

  // 对moves进行预排序
  const orderedMoves = orderMoves(board, moves, player);

  let bestMove = orderedMoves[0];
  let bestScore = -Infinity;

  for (const move of orderedMoves) {
    const newBoard = makeMove(board, move.row, move.col, player);

    // 检查这步是否给对手角落
    const oppMoves = getValidMoves(newBoard, opponent);
    const givesCorner = oppMoves.some(om =>
      CORNERS.some(c => c.row === om.row && c.col === om.col)
    );

    let score = minimax(
      newBoard,
      depth - 1,
      -Infinity,
      Infinity,
      false,
      player,
      true
    );

    // 如果给对手角落机会，大幅减分
    if (givesCorner) {
      score -= 200;
    }

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
