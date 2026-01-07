import type { CellValue, Position, Player } from '../types';
import { BOARD_SIZE, DIRECTIONS } from '../types';

export function createInitialBoard(): CellValue[][] {
  const board: CellValue[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  // 初始四个棋子
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = 'white';
  board[mid - 1][mid] = 'black';
  board[mid][mid - 1] = 'black';
  board[mid][mid] = 'white';

  return board;
}

export function getFlippedPieces(
  board: CellValue[][],
  row: number,
  col: number,
  player: Player
): Position[] {
  if (board[row][col] !== null) return [];

  const opponent = player === 'black' ? 'white' : 'black';
  const allFlipped: Position[] = [];

  for (const { dr, dc } of DIRECTIONS) {
    const flipped: Position[] = [];
    let r = row + dr;
    let c = col + dc;

    // 找到连续的对手棋子
    while (
      r >= 0 &&
      r < BOARD_SIZE &&
      c >= 0 &&
      c < BOARD_SIZE &&
      board[r][c] === opponent
    ) {
      flipped.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    // 检查是否以己方棋子结束
    if (
      flipped.length > 0 &&
      r >= 0 &&
      r < BOARD_SIZE &&
      c >= 0 &&
      c < BOARD_SIZE &&
      board[r][c] === player
    ) {
      allFlipped.push(...flipped);
    }
  }

  return allFlipped;
}

export function isValidMove(
  board: CellValue[][],
  row: number,
  col: number,
  player: Player
): boolean {
  return getFlippedPieces(board, row, col, player).length > 0;
}

export function getValidMoves(
  board: CellValue[][],
  player: Player
): Position[] {
  const moves: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(board, row, col, player)) {
        moves.push({ row, col });
      }
    }
  }

  return moves;
}

export function makeMove(
  board: CellValue[][],
  row: number,
  col: number,
  player: Player
): CellValue[][] {
  const newBoard = board.map(r => [...r]);
  const flipped = getFlippedPieces(board, row, col, player);

  if (flipped.length === 0) return newBoard;

  newBoard[row][col] = player;
  for (const pos of flipped) {
    newBoard[pos.row][pos.col] = player;
  }

  return newBoard;
}

export function countPieces(board: CellValue[][]): {
  black: number;
  white: number;
} {
  let black = 0;
  let white = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell === 'black') black++;
      else if (cell === 'white') white++;
    }
  }

  return { black, white };
}

export function getWinner(board: CellValue[][]): Player | 'draw' | null {
  const blackMoves = getValidMoves(board, 'black');
  const whiteMoves = getValidMoves(board, 'white');

  // 如果双方都无法落子，游戏结束
  if (blackMoves.length === 0 && whiteMoves.length === 0) {
    const { black, white } = countPieces(board);
    if (black > white) return 'black';
    if (white > black) return 'white';
    return 'draw';
  }

  return null;
}
