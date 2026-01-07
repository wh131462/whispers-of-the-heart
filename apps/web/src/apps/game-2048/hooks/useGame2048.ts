import { useState, useCallback, useEffect } from 'react';
import type { GameState, Direction, HistoryEntry } from '../types';
import { GRID_SIZE } from '../types';

const MAX_HISTORY = 10;
import {
  initGame,
  move,
  generateTile,
  canMove,
  hasWon,
  clearAnimationFlags,
} from '../utils/game';

const BEST_SCORE_KEY = '2048-best-score';

function loadBestScore(): number {
  try {
    const saved = localStorage.getItem(BEST_SCORE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, score.toString());
  } catch {
    // 忽略存储错误
  }
}

export function useGame2048() {
  const [state, setState] = useState<GameState>(() => ({
    tiles: initGame(GRID_SIZE),
    score: 0,
    bestScore: loadBestScore(),
    status: 'playing',
    gridSize: GRID_SIZE,
    history: [],
  }));

  // 重置游戏
  const reset = useCallback(() => {
    setState(prev => ({
      tiles: initGame(GRID_SIZE),
      score: 0,
      bestScore: prev.bestScore,
      status: 'playing',
      gridSize: GRID_SIZE,
      history: [],
    }));
  }, []);

  // 移动方块
  const handleMove = useCallback((direction: Direction) => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;

      // 清除之前的动画标记
      const clearedTiles = clearAnimationFlags(prev.tiles);

      // 执行移动
      const {
        tiles: movedTiles,
        score,
        moved,
      } = move(clearedTiles, direction, GRID_SIZE);

      if (!moved) return prev;

      // 保存历史记录（移动前的状态）
      const historyEntry: HistoryEntry = {
        tiles: prev.tiles.map(t => ({ ...t })),
        score: prev.score,
      };
      const newHistory = [...prev.history, historyEntry].slice(-MAX_HISTORY);

      // 生成新方块
      const newTile = generateTile(movedTiles, GRID_SIZE);
      const newTiles = newTile ? [...movedTiles, newTile] : movedTiles;

      // 计算新分数
      const newScore = prev.score + score;
      const newBestScore = Math.max(newScore, prev.bestScore);

      // 更新最高分
      if (newBestScore > prev.bestScore) {
        saveBestScore(newBestScore);
      }

      // 检查游戏状态
      let newStatus: GameState['status'] = prev.status;
      if (hasWon(newTiles)) {
        newStatus = 'won';
      } else if (!canMove(newTiles, GRID_SIZE)) {
        newStatus = 'lost';
      }

      return {
        ...prev,
        tiles: newTiles,
        score: newScore,
        bestScore: newBestScore,
        status: newStatus,
        history: newHistory,
      };
    });
  }, []);

  // 撤销上一步
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;

      const newHistory = [...prev.history];
      const lastState = newHistory.pop()!;

      return {
        ...prev,
        tiles: lastState.tiles,
        score: lastState.score,
        status: 'playing',
        history: newHistory,
      };
    });
  }, []);

  // 继续游戏（获胜后）
  const continueGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'playing',
    }));
  }, []);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const directionMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
        W: 'up',
        S: 'down',
        A: 'left',
        D: 'right',
      };

      const direction = directionMap[e.key];
      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  return {
    state,
    reset,
    handleMove,
    continueGame,
    undo,
    canUndo: state.history.length > 0,
  };
}
