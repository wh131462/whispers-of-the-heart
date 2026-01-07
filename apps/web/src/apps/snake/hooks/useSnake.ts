import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Direction } from '../types';
import {
  INITIAL_SPEED,
  SPEED_INCREMENT,
  MIN_SPEED,
  DIRECTION_KEYS,
  OPPOSITE_DIRECTION,
} from '../types';
import {
  createInitialSnake,
  generateFood,
  getNextHead,
  checkWallCollision,
  checkSelfCollision,
  checkFoodCollision,
} from '../utils/game';

const STORAGE_KEY = 'snake-best-score';

function loadBestScore(): number {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? parseInt(saved, 10) : 0;
}

function saveBestScore(score: number): void {
  localStorage.setItem(STORAGE_KEY, score.toString());
}

function createInitialState(): GameState {
  const snake = createInitialSnake();
  return {
    snake,
    food: generateFood(snake),
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    bestScore: loadBestScore(),
    status: 'idle',
    speed: INITIAL_SPEED,
  };
}

export function useSnake() {
  const [state, setState] = useState<GameState>(createInitialState);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const reset = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    setState(createInitialState());
  }, []);

  const start = useCallback(() => {
    setState(prev => ({ ...prev, status: 'playing' }));
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

  const changeDirection = useCallback((newDirection: Direction) => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;
      if (OPPOSITE_DIRECTION[newDirection] === prev.direction) return prev;
      return { ...prev, nextDirection: newDirection };
    });
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;

      if (timestamp - lastUpdateRef.current < prev.speed) {
        return prev;
      }
      lastUpdateRef.current = timestamp;

      const direction = prev.nextDirection;
      const head = prev.snake[0];
      const newHead = getNextHead(head, direction);

      if (checkWallCollision(newHead)) {
        const newBestScore = Math.max(prev.score, prev.bestScore);
        if (newBestScore > prev.bestScore) {
          saveBestScore(newBestScore);
        }
        return { ...prev, status: 'lost', bestScore: newBestScore };
      }

      if (checkSelfCollision(newHead, prev.snake)) {
        const newBestScore = Math.max(prev.score, prev.bestScore);
        if (newBestScore > prev.bestScore) {
          saveBestScore(newBestScore);
        }
        return { ...prev, status: 'lost', bestScore: newBestScore };
      }

      const ateFood = checkFoodCollision(newHead, prev.food);
      const newSnake = ateFood
        ? [newHead, ...prev.snake]
        : [newHead, ...prev.snake.slice(0, -1)];

      const newScore = ateFood ? prev.score + 10 : prev.score;
      const newSpeed = ateFood
        ? Math.max(prev.speed - SPEED_INCREMENT, MIN_SPEED)
        : prev.speed;
      const newFood = ateFood ? generateFood(newSnake) : prev.food;

      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        direction,
        score: newScore,
        speed: newSpeed,
      };
    });
  }, []);

  useEffect(() => {
    if (state.status !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      gameLoop(timestamp);
      gameLoopRef.current = requestAnimationFrame(animate);
    };

    gameLoopRef.current = requestAnimationFrame(animate);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [state.status, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const direction = DIRECTION_KEYS[e.key];
      if (direction) {
        e.preventDefault();
        if (state.status === 'idle') {
          start();
        }
        changeDirection(direction);
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (state.status === 'idle') {
          start();
        } else if (state.status === 'playing') {
          pause();
        } else if (state.status === 'paused') {
          resume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.status, start, pause, resume, changeDirection]);

  return {
    state,
    reset,
    start,
    pause,
    resume,
    changeDirection,
  };
}
