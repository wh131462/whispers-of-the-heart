import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState } from '../types';
import {
  POINTS_PER_LINE,
  LINES_PER_LEVEL,
  BASE_SPEED,
  SPEED_DECREASE_PER_LEVEL,
  MIN_SPEED,
} from '../types';
import {
  createEmptyBoard,
  getRandomPiece,
  createPiece,
  isValidPosition,
  lockPiece,
  clearLines,
  rotatePiece,
  movePiece,
} from '../utils/board';

function createInitialState(): GameState {
  return {
    board: createEmptyBoard(),
    currentPiece: null,
    nextPiece: getRandomPiece(),
    holdPiece: null,
    canHold: true,
    score: 0,
    level: 1,
    lines: 0,
    status: 'idle',
  };
}

function getSpeed(level: number): number {
  return Math.max(
    BASE_SPEED - (level - 1) * SPEED_DECREASE_PER_LEVEL,
    MIN_SPEED
  );
}

export function useTetris() {
  const [state, setState] = useState<GameState>(createInitialState);
  const gameLoopRef = useRef<number | null>(null);
  const lastDropRef = useRef<number>(0);

  const moveLeft = useCallback(() => {
    setState(prev => {
      if (!prev.currentPiece || prev.status !== 'playing') return prev;
      const moved = movePiece(prev.currentPiece, -1, 0);
      if (isValidPosition(prev.board, moved)) {
        return { ...prev, currentPiece: moved };
      }
      return prev;
    });
  }, []);

  const moveRight = useCallback(() => {
    setState(prev => {
      if (!prev.currentPiece || prev.status !== 'playing') return prev;
      const moved = movePiece(prev.currentPiece, 1, 0);
      if (isValidPosition(prev.board, moved)) {
        return { ...prev, currentPiece: moved };
      }
      return prev;
    });
  }, []);

  const moveDown = useCallback(() => {
    setState(prev => {
      if (!prev.currentPiece || prev.status !== 'playing') return prev;
      const moved = movePiece(prev.currentPiece, 0, 1);
      if (isValidPosition(prev.board, moved)) {
        return { ...prev, currentPiece: moved, score: prev.score + 1 };
      }
      return prev;
    });
  }, []);

  const hardDrop = useCallback(() => {
    setState(prev => {
      if (!prev.currentPiece || prev.status !== 'playing') return prev;

      let dropped = prev.currentPiece;
      let dropDistance = 0;

      while (isValidPosition(prev.board, movePiece(dropped, 0, 1))) {
        dropped = movePiece(dropped, 0, 1);
        dropDistance++;
      }

      const lockedBoard = lockPiece(prev.board, dropped);
      const { board: clearedBoard, linesCleared } = clearLines(lockedBoard);

      const newLines = prev.lines + linesCleared;
      const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;
      const newScore =
        prev.score +
        dropDistance * 2 +
        (POINTS_PER_LINE[linesCleared] || 0) * prev.level;

      const newPiece = createPiece(prev.nextPiece);
      if (!isValidPosition(clearedBoard, newPiece)) {
        return {
          ...prev,
          board: clearedBoard,
          currentPiece: null,
          score: newScore,
          level: newLevel,
          lines: newLines,
          status: 'lost',
        };
      }

      return {
        ...prev,
        board: clearedBoard,
        currentPiece: newPiece,
        nextPiece: getRandomPiece(),
        score: newScore,
        level: newLevel,
        lines: newLines,
        canHold: true,
      };
    });
  }, []);

  const rotate = useCallback((clockwise: boolean = true) => {
    setState(prev => {
      if (!prev.currentPiece || prev.status !== 'playing') return prev;

      const rotated = rotatePiece(prev.currentPiece, clockwise);

      // 尝试基本旋转
      if (isValidPosition(prev.board, rotated)) {
        return { ...prev, currentPiece: rotated };
      }

      // Wall kick 尝试
      const kicks = [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: -1 },
        { x: -2, y: 0 },
        { x: 2, y: 0 },
      ];

      for (const kick of kicks) {
        const kicked = movePiece(rotated, kick.x, kick.y);
        if (isValidPosition(prev.board, kicked)) {
          return { ...prev, currentPiece: kicked };
        }
      }

      return prev;
    });
  }, []);

  const hold = useCallback(() => {
    setState(prev => {
      if (!prev.currentPiece || !prev.canHold || prev.status !== 'playing')
        return prev;

      const currentType = prev.currentPiece.type;

      if (prev.holdPiece) {
        const newPiece = createPiece(prev.holdPiece);
        if (!isValidPosition(prev.board, newPiece)) return prev;

        return {
          ...prev,
          currentPiece: newPiece,
          holdPiece: currentType,
          canHold: false,
        };
      } else {
        const newPiece = createPiece(prev.nextPiece);
        if (!isValidPosition(prev.board, newPiece)) return prev;

        return {
          ...prev,
          currentPiece: newPiece,
          nextPiece: getRandomPiece(),
          holdPiece: currentType,
          canHold: false,
        };
      }
    });
  }, []);

  const start = useCallback(() => {
    setState(prev => {
      const newPiece = createPiece(prev.nextPiece);
      return {
        ...prev,
        currentPiece: newPiece,
        nextPiece: getRandomPiece(),
        status: 'playing',
      };
    });
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: prev.status === 'playing' ? 'paused' : prev.status,
    }));
  }, []);

  const resume = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: prev.status === 'paused' ? 'playing' : prev.status,
    }));
  }, []);

  const reset = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    setState(createInitialState());
  }, []);

  // 游戏循环
  useEffect(() => {
    if (state.status !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const speed = getSpeed(state.level);

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastDropRef.current >= speed) {
        lastDropRef.current = timestamp;

        setState(prev => {
          if (!prev.currentPiece || prev.status !== 'playing') return prev;

          const moved = movePiece(prev.currentPiece, 0, 1);
          if (isValidPosition(prev.board, moved)) {
            return { ...prev, currentPiece: moved };
          }

          // 锁定当前方块
          const lockedBoard = lockPiece(prev.board, prev.currentPiece);
          const { board: clearedBoard, linesCleared } = clearLines(lockedBoard);

          const newLines = prev.lines + linesCleared;
          const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;
          const newScore =
            prev.score + (POINTS_PER_LINE[linesCleared] || 0) * prev.level;

          const newPiece = createPiece(prev.nextPiece);
          if (!isValidPosition(clearedBoard, newPiece)) {
            return {
              ...prev,
              board: clearedBoard,
              currentPiece: null,
              score: newScore,
              level: newLevel,
              lines: newLines,
              status: 'lost',
            };
          }

          return {
            ...prev,
            board: clearedBoard,
            currentPiece: newPiece,
            nextPiece: getRandomPiece(),
            score: newScore,
            level: newLevel,
            lines: newLines,
            canHold: true,
          };
        });
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [state.status, state.level]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.status === 'idle') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          start();
        }
        return;
      }

      if (state.status === 'paused') {
        if (e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          resume();
        }
        return;
      }

      if (state.status !== 'playing') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          rotate(true);
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          rotate(false);
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          hold();
          break;
        case 'Escape':
          e.preventDefault();
          pause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state.status,
    start,
    resume,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    hardDrop,
    hold,
    pause,
  ]);

  return {
    state,
    start,
    pause,
    resume,
    reset,
    moveLeft,
    moveRight,
    moveDown,
    hardDrop,
    rotate,
    hold,
  };
}
