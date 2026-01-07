import type { Tile, Direction } from '../types';
import { GRID_SIZE, WIN_VALUE } from '../types';

let tileIdCounter = 0;

export function generateTileId(): number {
  return ++tileIdCounter;
}

export function resetTileIdCounter(): void {
  tileIdCounter = 0;
}

// 获取空位置
export function getEmptyPositions(
  tiles: Tile[],
  size: number
): { row: number; col: number }[] {
  const occupied = new Set(tiles.map(t => `${t.row}-${t.col}`));
  const empty: { row: number; col: number }[] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!occupied.has(`${row}-${col}`)) {
        empty.push({ row, col });
      }
    }
  }
  return empty;
}

// 生成新方块
export function generateTile(tiles: Tile[], size: number): Tile | null {
  const emptyPositions = getEmptyPositions(tiles, size);
  if (emptyPositions.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * emptyPositions.length);
  const { row, col } = emptyPositions[randomIndex];
  const value = Math.random() < 0.9 ? 2 : 4;

  return {
    id: generateTileId(),
    value,
    row,
    col,
    isNew: true,
  };
}

// 初始化游戏
export function initGame(size: number = GRID_SIZE): Tile[] {
  resetTileIdCounter();
  const tiles: Tile[] = [];

  const tile1 = generateTile(tiles, size);
  if (tile1) tiles.push(tile1);

  const tile2 = generateTile(tiles, size);
  if (tile2) tiles.push(tile2);

  return tiles;
}

// 创建网格
function createGrid(tiles: Tile[], size: number): (Tile | null)[][] {
  const grid: (Tile | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );
  tiles.forEach(tile => {
    grid[tile.row][tile.col] = { ...tile, isNew: false, isMerged: false };
  });
  return grid;
}

// 从网格提取方块
function extractTiles(grid: (Tile | null)[][]): Tile[] {
  const tiles: Tile[] = [];
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col]) {
        tiles.push({ ...grid[row][col]!, row, col });
      }
    }
  }
  return tiles;
}

// 比较两个网格是否相同
function gridsEqual(a: (Tile | null)[][], b: (Tile | null)[][]): boolean {
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i].length; j++) {
      const tileA = a[i][j];
      const tileB = b[i][j];
      if ((tileA === null) !== (tileB === null)) return false;
      if (tileA && tileB && tileA.value !== tileB.value) return false;
    }
  }
  return true;
}

// 向左移动一行
function slideRowLeft(row: (Tile | null)[]): {
  row: (Tile | null)[];
  score: number;
} {
  // 提取非空方块
  const tiles = row.filter((t): t is Tile => t !== null);
  const result: (Tile | null)[] = [];
  let score = 0;
  let i = 0;

  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
      // 合并两个相同的方块
      const mergedValue = tiles[i].value * 2;
      result.push({
        ...tiles[i],
        value: mergedValue,
        isMerged: true,
      });
      score += mergedValue;
      i += 2; // 跳过两个方块
    } else {
      result.push({ ...tiles[i] });
      i += 1;
    }
  }

  // 填充空位
  while (result.length < row.length) {
    result.push(null);
  }

  return { row: result, score };
}

// 向右移动一行
function slideRowRight(row: (Tile | null)[]): {
  row: (Tile | null)[];
  score: number;
} {
  // 反转 -> 向左移动 -> 反转回来
  const reversed = [...row].reverse();
  const { row: slid, score } = slideRowLeft(reversed);
  return { row: slid.reverse(), score };
}

// 移动整个网格
export function move(
  tiles: Tile[],
  direction: Direction,
  size: number = GRID_SIZE
): { tiles: Tile[]; score: number; moved: boolean } {
  const originalGrid = createGrid(tiles, size);
  const grid = createGrid(tiles, size);
  let totalScore = 0;

  if (direction === 'left') {
    for (let row = 0; row < size; row++) {
      const { row: newRow, score } = slideRowLeft(grid[row]);
      grid[row] = newRow;
      totalScore += score;
    }
  } else if (direction === 'right') {
    for (let row = 0; row < size; row++) {
      const { row: newRow, score } = slideRowRight(grid[row]);
      grid[row] = newRow;
      totalScore += score;
    }
  } else if (direction === 'up') {
    for (let col = 0; col < size; col++) {
      // 提取列
      const column: (Tile | null)[] = [];
      for (let row = 0; row < size; row++) {
        column.push(grid[row][col]);
      }
      // 向左移动（相当于向上）
      const { row: newColumn, score } = slideRowLeft(column);
      // 放回列
      for (let row = 0; row < size; row++) {
        grid[row][col] = newColumn[row];
      }
      totalScore += score;
    }
  } else if (direction === 'down') {
    for (let col = 0; col < size; col++) {
      // 提取列
      const column: (Tile | null)[] = [];
      for (let row = 0; row < size; row++) {
        column.push(grid[row][col]);
      }
      // 向右移动（相当于向下）
      const { row: newColumn, score } = slideRowRight(column);
      // 放回列
      for (let row = 0; row < size; row++) {
        grid[row][col] = newColumn[row];
      }
      totalScore += score;
    }
  }

  const moved = !gridsEqual(originalGrid, grid);
  return { tiles: extractTiles(grid), score: totalScore, moved };
}

// 检查是否可以继续移动
export function canMove(tiles: Tile[], size: number = GRID_SIZE): boolean {
  if (tiles.length < size * size) return true;

  const grid = createGrid(tiles, size);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = grid[row][col]?.value;
      if (value === undefined) return true;

      // 检查右边
      if (col + 1 < size && grid[row][col + 1]?.value === value) return true;
      // 检查下边
      if (row + 1 < size && grid[row + 1][col]?.value === value) return true;
    }
  }

  return false;
}

// 检查是否获胜
export function hasWon(tiles: Tile[]): boolean {
  return tiles.some(tile => tile.value >= WIN_VALUE);
}

// 清除动画标记
export function clearAnimationFlags(tiles: Tile[]): Tile[] {
  return tiles.map(tile => ({
    ...tile,
    isNew: false,
    isMerged: false,
  }));
}
