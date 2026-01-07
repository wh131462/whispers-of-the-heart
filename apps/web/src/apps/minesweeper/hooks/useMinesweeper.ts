import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Difficulty, CellState } from '../types';
import { DIFFICULTIES } from '../types';
import { createEmptyBoard, placeMines } from '../utils/board';
import {
  revealCell,
  revealAllMines,
  checkWin,
  chordReveal,
} from '../utils/reveal';

const createInitialState = (difficulty: Difficulty): GameState => {
  const config = DIFFICULTIES[difficulty];
  return {
    board: createEmptyBoard(config.rows, config.cols),
    status: 'idle',
    difficulty,
    mineCount: config.mines,
    flagCount: 0,
    timeElapsed: 0,
    firstClick: true,
  };
};

export function useMinesweeper() {
  const [state, setState] = useState<GameState>(() =>
    createInitialState('easy')
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 计时器
  useEffect(() => {
    if (state.status === 'playing') {
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          timeElapsed: Math.min(prev.timeElapsed + 1, 999),
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.status]);

  // 设置难度并重置
  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setState(createInitialState(difficulty));
  }, []);

  // 重置游戏
  const reset = useCallback(() => {
    setState(prev => createInitialState(prev.difficulty));
  }, []);

  // 揭开格子
  const reveal = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status === 'won' || prev.status === 'lost') {
        return prev;
      }

      const cell = prev.board[row][col];
      if (cell.state !== 'hidden') {
        return prev;
      }

      let newBoard = prev.board;

      // 首次点击：放置地雷
      if (prev.firstClick) {
        newBoard = placeMines(prev.board, prev.mineCount, row, col);
      }

      // 揭开格子
      const result = revealCell(newBoard, row, col);

      if (result.hitMine) {
        // 踩雷
        return {
          ...prev,
          board: revealAllMines(result.board),
          status: 'lost',
          firstClick: false,
        };
      }

      // 检查胜利
      if (checkWin(result.board)) {
        return {
          ...prev,
          board: result.board,
          status: 'won',
          firstClick: false,
        };
      }

      return {
        ...prev,
        board: result.board,
        status: 'playing',
        firstClick: false,
      };
    });
  }, []);

  // 标记/取消标记旗帜
  const toggleFlag = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status === 'won' || prev.status === 'lost') {
        return prev;
      }

      const cell = prev.board[row][col];
      if (cell.state === 'revealed') {
        return prev;
      }

      const newBoard = prev.board.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            let newState: CellState;
            if (c.state === 'hidden') {
              newState = 'flagged';
            } else if (c.state === 'flagged') {
              newState = 'questioned';
            } else {
              newState = 'hidden';
            }
            return { ...c, state: newState };
          }
          return c;
        })
      );

      // 计算旗帜数
      let flagCount = 0;
      for (const row of newBoard) {
        for (const cell of row) {
          if (cell.state === 'flagged') {
            flagCount++;
          }
        }
      }

      return {
        ...prev,
        board: newBoard,
        flagCount,
        status: prev.status === 'idle' ? 'playing' : prev.status,
      };
    });
  }, []);

  // 双击快速揭开
  const chord = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status !== 'playing') {
        return prev;
      }

      const result = chordReveal(prev.board, row, col);

      if (result.hitMine) {
        return {
          ...prev,
          board: revealAllMines(result.board),
          status: 'lost',
        };
      }

      if (checkWin(result.board)) {
        return {
          ...prev,
          board: result.board,
          status: 'won',
        };
      }

      return {
        ...prev,
        board: result.board,
      };
    });
  }, []);

  // 计算剩余地雷数
  const remainingMines = state.mineCount - state.flagCount;

  return {
    state,
    remainingMines,
    setDifficulty,
    reset,
    reveal,
    toggleFlag,
    chord,
  };
}
