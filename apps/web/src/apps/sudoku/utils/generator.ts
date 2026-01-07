import { BOARD_SIZE, BOX_SIZE, DIFFICULTY_EMPTY_CELLS } from '../types';
import type { Difficulty } from '../types';

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function isValidPlacement(
  board: number[][],
  row: number,
  col: number,
  num: number
): boolean {
  // 检查行
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board[row][c] === num) return false;
  }

  // 检查列
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r][col] === num) return false;
  }

  // 检查 3x3 宫
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

function solveSudoku(board: number[][]): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === 0) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of numbers) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) {
              return true;
            }
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generateFullBoard(): number[][] {
  const board: number[][] = Array(BOARD_SIZE)
    .fill(0)
    .map(() => Array(BOARD_SIZE).fill(0));
  solveSudoku(board);
  return board;
}

export function generatePuzzle(difficulty: Difficulty): {
  puzzle: (number | null)[][];
  solution: number[][];
} {
  const solution = generateFullBoard();
  const puzzle: (number | null)[][] = solution.map(row => [...row]);

  const emptyCells = DIFFICULTY_EMPTY_CELLS[difficulty];
  const positions: { row: number; col: number }[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push({ row, col });
    }
  }

  const shuffledPositions = shuffle(positions);

  for (let i = 0; i < emptyCells; i++) {
    const { row, col } = shuffledPositions[i];
    puzzle[row][col] = null;
  }

  return { puzzle, solution };
}
