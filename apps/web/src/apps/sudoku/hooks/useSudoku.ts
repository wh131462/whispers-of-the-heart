import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Cell, Position, Difficulty } from '../types';
import { BOARD_SIZE, MAX_MISTAKES } from '../types';
import { generatePuzzle } from '../utils/generator';
import { isBoardComplete, isBoardCorrect } from '../utils/validator';

function createCell(value: number | null, isFixed: boolean): Cell {
  return {
    value,
    isFixed,
    notes: new Set(),
    isError: false,
  };
}

function createInitialState(difficulty: Difficulty): GameState {
  const { puzzle, solution } = generatePuzzle(difficulty);
  const board: Cell[][] = puzzle.map(row =>
    row.map(value => createCell(value, value !== null))
  );

  return {
    board,
    solution,
    selectedCell: null,
    difficulty,
    status: 'playing',
    mistakes: 0,
    time: 0,
    isNoteMode: false,
  };
}

export function useSudoku() {
  const [state, setState] = useState<GameState>(() =>
    createInitialState('medium')
  );
  const timerRef = useRef<number | null>(null);

  // 计时器
  useEffect(() => {
    if (state.status === 'playing') {
      timerRef.current = window.setInterval(() => {
        setState(prev => ({ ...prev, time: prev.time + 1 }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.status]);

  const reset = useCallback((difficulty?: Difficulty) => {
    setState(prev => createInitialState(difficulty ?? prev.difficulty));
  }, []);

  const selectCell = useCallback((position: Position | null) => {
    setState(prev => ({ ...prev, selectedCell: position }));
  }, []);

  const toggleNoteMode = useCallback(() => {
    setState(prev => ({ ...prev, isNoteMode: !prev.isNoteMode }));
  }, []);

  const setNumber = useCallback((num: number) => {
    setState(prev => {
      if (prev.status !== 'playing' || !prev.selectedCell) return prev;

      const { row, col } = prev.selectedCell;
      const cell = prev.board[row][col];

      if (cell.isFixed) return prev;

      const newBoard = prev.board.map(r =>
        r.map(c => ({ ...c, notes: new Set(c.notes) }))
      );

      if (prev.isNoteMode) {
        // 笔记模式
        if (newBoard[row][col].value !== null) return prev;

        const notes = newBoard[row][col].notes;
        if (notes.has(num)) {
          notes.delete(num);
        } else {
          notes.add(num);
        }
      } else {
        // 填数模式
        const isCorrect = num === prev.solution[row][col];

        if (!isCorrect) {
          const newMistakes = prev.mistakes + 1;
          newBoard[row][col] = {
            ...newBoard[row][col],
            value: num,
            isError: true,
            notes: new Set(),
          };

          if (newMistakes >= MAX_MISTAKES) {
            return {
              ...prev,
              board: newBoard,
              mistakes: newMistakes,
              status: 'won', // 实际是失败，但用 won 表示游戏结束
            };
          }

          return {
            ...prev,
            board: newBoard,
            mistakes: newMistakes,
          };
        }

        newBoard[row][col] = {
          ...newBoard[row][col],
          value: num,
          isError: false,
          notes: new Set(),
        };

        // 移除同行、同列、同宫的笔记
        for (let c = 0; c < BOARD_SIZE; c++) {
          newBoard[row][c].notes.delete(num);
        }
        for (let r = 0; r < BOARD_SIZE; r++) {
          newBoard[r][col].notes.delete(num);
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
          for (let c = boxCol; c < boxCol + 3; c++) {
            newBoard[r][c].notes.delete(num);
          }
        }

        // 检查是否完成
        if (
          isBoardComplete(newBoard) &&
          isBoardCorrect(newBoard, prev.solution)
        ) {
          return {
            ...prev,
            board: newBoard,
            status: 'won',
          };
        }
      }

      return {
        ...prev,
        board: newBoard,
      };
    });
  }, []);

  const clearCell = useCallback(() => {
    setState(prev => {
      if (prev.status !== 'playing' || !prev.selectedCell) return prev;

      const { row, col } = prev.selectedCell;
      const cell = prev.board[row][col];

      if (cell.isFixed) return prev;

      const newBoard = prev.board.map(r =>
        r.map(c => ({ ...c, notes: new Set(c.notes) }))
      );
      newBoard[row][col] = {
        ...newBoard[row][col],
        value: null,
        isError: false,
        notes: new Set(),
      };

      return {
        ...prev,
        board: newBoard,
      };
    });
  }, []);

  const getHint = useCallback(() => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;

      // 找一个空格填入正确答案
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (prev.board[row][col].value === null) {
            const newBoard = prev.board.map(r =>
              r.map(c => ({ ...c, notes: new Set(c.notes) }))
            );
            newBoard[row][col] = {
              ...newBoard[row][col],
              value: prev.solution[row][col],
              isFixed: true,
              notes: new Set(),
            };

            if (
              isBoardComplete(newBoard) &&
              isBoardCorrect(newBoard, prev.solution)
            ) {
              return {
                ...prev,
                board: newBoard,
                selectedCell: { row, col },
                status: 'won',
              };
            }

            return {
              ...prev,
              board: newBoard,
              selectedCell: { row, col },
            };
          }
        }
      }

      return prev;
    });
  }, []);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.status !== 'playing') return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        setNumber(num);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        clearCell();
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        toggleNoteMode();
        return;
      }

      // 方向键移动选中格子
      if (state.selectedCell) {
        let { row, col } = state.selectedCell;
        if (e.key === 'ArrowUp' && row > 0) row--;
        else if (e.key === 'ArrowDown' && row < BOARD_SIZE - 1) row++;
        else if (e.key === 'ArrowLeft' && col > 0) col--;
        else if (e.key === 'ArrowRight' && col < BOARD_SIZE - 1) col++;

        if (row !== state.selectedCell.row || col !== state.selectedCell.col) {
          selectCell({ row, col });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state.status,
    state.selectedCell,
    setNumber,
    clearCell,
    toggleNoteMode,
    selectCell,
  ]);

  return {
    state,
    reset,
    selectCell,
    setNumber,
    clearCell,
    toggleNoteMode,
    getHint,
  };
}
