import type { CellValue, Piece, PieceType } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, PIECE_SHAPES } from '../types';

export function createEmptyBoard(): CellValue[][] {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null));
}

export function getRandomPiece(): PieceType {
  const pieces: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return pieces[Math.floor(Math.random() * pieces.length)];
}

export function createPiece(type: PieceType): Piece {
  return {
    type,
    position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
    rotation: 0,
  };
}

export function getPieceShape(piece: Piece): number[][] {
  return PIECE_SHAPES[piece.type][piece.rotation];
}

export function getPieceCells(piece: Piece): { x: number; y: number }[] {
  const shape = getPieceShape(piece);
  const cells: { x: number; y: number }[] = [];

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        cells.push({
          x: piece.position.x + col,
          y: piece.position.y + row,
        });
      }
    }
  }

  return cells;
}

export function isValidPosition(board: CellValue[][], piece: Piece): boolean {
  const cells = getPieceCells(piece);

  for (const cell of cells) {
    // 检查边界
    if (cell.x < 0 || cell.x >= BOARD_WIDTH || cell.y >= BOARD_HEIGHT) {
      return false;
    }

    // 允许在顶部以上
    if (cell.y < 0) continue;

    // 检查碰撞
    if (board[cell.y][cell.x] !== null) {
      return false;
    }
  }

  return true;
}

export function lockPiece(board: CellValue[][], piece: Piece): CellValue[][] {
  const newBoard = board.map(row => [...row]);
  const cells = getPieceCells(piece);

  for (const cell of cells) {
    if (cell.y >= 0 && cell.y < BOARD_HEIGHT) {
      newBoard[cell.y][cell.x] = piece.type;
    }
  }

  return newBoard;
}

export function clearLines(board: CellValue[][]): {
  board: CellValue[][];
  linesCleared: number;
} {
  const newBoard = board.filter(row => row.some(cell => cell === null));
  const linesCleared = BOARD_HEIGHT - newBoard.length;

  // 添加空行到顶部
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }

  return { board: newBoard, linesCleared };
}

export function rotatePiece(piece: Piece, clockwise: boolean = true): Piece {
  const rotations = PIECE_SHAPES[piece.type].length;
  const newRotation = clockwise
    ? (piece.rotation + 1) % rotations
    : (piece.rotation - 1 + rotations) % rotations;

  return { ...piece, rotation: newRotation };
}

export function movePiece(piece: Piece, dx: number, dy: number): Piece {
  return {
    ...piece,
    position: {
      x: piece.position.x + dx,
      y: piece.position.y + dy,
    },
  };
}

export function getGhostPosition(board: CellValue[][], piece: Piece): Piece {
  let ghost = { ...piece };

  while (isValidPosition(board, movePiece(ghost, 0, 1))) {
    ghost = movePiece(ghost, 0, 1);
  }

  return ghost;
}
