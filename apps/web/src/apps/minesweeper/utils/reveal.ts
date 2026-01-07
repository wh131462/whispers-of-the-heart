import type { Cell } from '../types';

/**
 * 揭开单个格子
 */
export function revealCell(
  board: Cell[][],
  row: number,
  col: number
): { board: Cell[][]; hitMine: boolean } {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  const cell = newBoard[row][col];

  // 已经揭开或标记的格子不处理
  if (cell.state !== 'hidden') {
    return { board: newBoard, hitMine: false };
  }

  // 踩到地雷
  if (cell.isMine) {
    cell.state = 'revealed';
    return { board: newBoard, hitMine: true };
  }

  // 递归揭开
  const stack: [number, number][] = [[row, col]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const currentCell = newBoard[r][c];

    if (currentCell.state !== 'hidden' || currentCell.isMine) {
      continue;
    }

    currentCell.state = 'revealed';

    // 如果周围没有地雷，继续揭开周围的格子
    if (currentCell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            stack.push([nr, nc]);
          }
        }
      }
    }
  }

  return { board: newBoard, hitMine: false };
}

/**
 * 揭开所有地雷（游戏失败时）
 */
export function revealAllMines(board: Cell[][]): Cell[][] {
  return board.map(row =>
    row.map(cell => {
      if (cell.isMine) {
        return { ...cell, state: 'revealed' as const };
      }
      return cell;
    })
  );
}

/**
 * 检查是否获胜
 */
export function checkWin(board: Cell[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      // 如果有非地雷格子还没揭开，则未获胜
      if (!cell.isMine && cell.state !== 'revealed') {
        return false;
      }
    }
  }
  return true;
}

/**
 * 快速揭开（双击已揭开的数字格）
 */
export function chordReveal(
  board: Cell[][],
  row: number,
  col: number
): { board: Cell[][]; hitMine: boolean } {
  const rows = board.length;
  const cols = board[0].length;
  const cell = board[row][col];

  // 只对已揭开的数字格有效
  if (cell.state !== 'revealed' || cell.adjacentMines === 0) {
    return { board, hitMine: false };
  }

  // 计算周围的旗帜数
  let flagCount = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (board[nr][nc].state === 'flagged') {
          flagCount++;
        }
      }
    }
  }

  // 旗帜数不等于周围地雷数，不执行
  if (flagCount !== cell.adjacentMines) {
    return { board, hitMine: false };
  }

  // 揭开周围未标记的格子
  let newBoard = board.map(r => r.map(c => ({ ...c })));
  let hitMine = false;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (newBoard[nr][nc].state === 'hidden') {
          const result = revealCell(newBoard, nr, nc);
          newBoard = result.board;
          if (result.hitMine) {
            hitMine = true;
          }
        }
      }
    }
  }

  return { board: newBoard, hitMine };
}
