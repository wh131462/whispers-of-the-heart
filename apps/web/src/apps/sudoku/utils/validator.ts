import type { Cell } from '../types';
import { BOARD_SIZE, BOX_SIZE } from '../types';

export function getConflicts(
  board: Cell[][],
  row: number,
  col: number,
  value: number
): { row: number; col: number }[] {
  const conflicts: { row: number; col: number }[] = [];

  // 检查行
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (c !== col && board[row][c].value === value) {
      conflicts.push({ row, col: c });
    }
  }

  // 检查列
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (r !== row && board[r][col].value === value) {
      conflicts.push({ row: r, col });
    }
  }

  // 检查 3x3 宫
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if ((r !== row || c !== col) && board[r][c].value === value) {
        // 避免重复添加
        if (!conflicts.some(p => p.row === r && p.col === c)) {
          conflicts.push({ row: r, col: c });
        }
      }
    }
  }

  return conflicts;
}

export function isBoardComplete(board: Cell[][]): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].value === null || board[row][col].isError) {
        return false;
      }
    }
  }
  return true;
}

export function isBoardCorrect(board: Cell[][], solution: number[][]): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].value !== solution[row][col]) {
        return false;
      }
    }
  }
  return true;
}
