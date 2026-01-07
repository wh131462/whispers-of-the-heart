import type { CellValue, Position, Player } from '../types';
import { BOARD_SIZE, WIN_COUNT } from '../types';

export function createEmptyBoard(): CellValue[][] {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
}

const DIRECTIONS = [
  { dr: 0, dc: 1 }, // 水平
  { dr: 1, dc: 0 }, // 垂直
  { dr: 1, dc: 1 }, // 对角线
  { dr: 1, dc: -1 }, // 反对角线
];

export function checkWin(
  board: CellValue[][],
  row: number,
  col: number,
  player: Player
): Position[] | null {
  for (const { dr, dc } of DIRECTIONS) {
    const line: Position[] = [{ row, col }];

    // 正向检查
    for (let i = 1; i < WIN_COUNT; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        board[r][c] === player
      ) {
        line.push({ row: r, col: c });
      } else {
        break;
      }
    }

    // 反向检查
    for (let i = 1; i < WIN_COUNT; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        board[r][c] === player
      ) {
        line.unshift({ row: r, col: c });
      } else {
        break;
      }
    }

    if (line.length >= WIN_COUNT) {
      return line;
    }
  }

  return null;
}

export function isBoardFull(board: CellValue[][]): boolean {
  return board.every(row => row.every(cell => cell !== null));
}

export function getValidMoves(board: CellValue[][]): Position[] {
  const moves: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
}
