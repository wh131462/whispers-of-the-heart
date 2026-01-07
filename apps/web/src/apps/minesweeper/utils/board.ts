import type { Cell } from '../types';

/**
 * 创建空棋盘
 */
export function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => ({
          isMine: false,
          state: 'hidden',
          adjacentMines: 0,
        }))
    );
}

/**
 * 在棋盘上放置地雷（避开首次点击位置）
 */
export function placeMines(
  board: Cell[][],
  mineCount: number,
  safeRow: number,
  safeCol: number
): Cell[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  // 安全区域（首次点击周围的9格）
  const safeZone = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = safeRow + dr;
      const nc = safeCol + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        safeZone.add(`${nr},${nc}`);
      }
    }
  }

  // 获取所有可放置地雷的位置
  const availablePositions: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safeZone.has(`${r},${c}`)) {
        availablePositions.push([r, c]);
      }
    }
  }

  // 随机选择位置放置地雷
  const shuffled = availablePositions.sort(() => Math.random() - 0.5);
  const minePositions = shuffled.slice(0, Math.min(mineCount, shuffled.length));

  for (const [r, c] of minePositions) {
    newBoard[r][c].isMine = true;
  }

  // 计算每个格子周围的地雷数
  return calculateAdjacentMines(newBoard);
}

/**
 * 计算每个格子周围的地雷数
 */
function calculateAdjacentMines(board: Cell[][]): Cell[][] {
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 &&
              nr < rows &&
              nc >= 0 &&
              nc < cols &&
              board[nr][nc].isMine
            ) {
              count++;
            }
          }
        }
        board[r][c].adjacentMines = count;
      }
    }
  }

  return board;
}
