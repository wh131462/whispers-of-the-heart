import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  GameState,
  GameMode,
  MatchDuration,
  AIDifficulty,
  InputState,
} from '../types';
import { createInitialGameState, DEFAULT_CONTROLS } from '../types';
import {
  updateSlime,
  updateBall,
  checkSlimeBallCollision,
  checkGoal,
  resetBallToCenter,
  resetSlime,
} from '../utils/physics';
import { getAIInput } from '../utils/ai';

const FRAME_RATE = 60;
const FRAME_TIME = 1000 / FRAME_RATE;

export function useSlimeSoccer(initialDuration: MatchDuration = 2) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState('single', initialDuration)
  );

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const inputRef = useRef<{ left: InputState; right: InputState }>({
    left: { left: false, right: false, up: false, grab: false },
    right: { left: false, right: false, up: false, grab: false },
  });
  const difficultyRef = useRef<AIDifficulty>('medium');

  // 游戏控制按键列表
  const gameKeys = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
  ];

  // 键盘输入处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 游戏进行中阻止方向键等的默认行为（防止页面滚动）
      if (gameState.status === 'playing' && gameKeys.includes(e.code)) {
        e.preventDefault();
      }

      // ESC 暂停
      if (e.code === 'Escape' && gameState.status === 'playing') {
        setGameState(prev => ({ ...prev, status: 'paused' }));
        return;
      }

      // 单人模式：玩家控制右侧（方向键）
      if (gameState.mode === 'single') {
        const rightControls = DEFAULT_CONTROLS.right;
        if (e.code === rightControls.left) inputRef.current.right.left = true;
        if (e.code === rightControls.right) inputRef.current.right.right = true;
        if (e.code === rightControls.up) inputRef.current.right.up = true;
        if (e.code === rightControls.grab) inputRef.current.right.grab = true;
      } else {
        // 双人模式：左边 WASD，右边方向键
        const leftControls = DEFAULT_CONTROLS.left;
        if (e.code === leftControls.left) inputRef.current.left.left = true;
        if (e.code === leftControls.right) inputRef.current.left.right = true;
        if (e.code === leftControls.up) inputRef.current.left.up = true;
        if (e.code === leftControls.grab) inputRef.current.left.grab = true;

        const rightControls = DEFAULT_CONTROLS.right;
        if (e.code === rightControls.left) inputRef.current.right.left = true;
        if (e.code === rightControls.right) inputRef.current.right.right = true;
        if (e.code === rightControls.up) inputRef.current.right.up = true;
        if (e.code === rightControls.grab) inputRef.current.right.grab = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 游戏进行中阻止方向键等的默认行为
      if (gameState.status === 'playing' && gameKeys.includes(e.code)) {
        e.preventDefault();
      }

      // 单人模式：玩家控制右侧
      if (gameState.mode === 'single') {
        const rightControls = DEFAULT_CONTROLS.right;
        if (e.code === rightControls.left) inputRef.current.right.left = false;
        if (e.code === rightControls.right)
          inputRef.current.right.right = false;
        if (e.code === rightControls.up) inputRef.current.right.up = false;
        if (e.code === rightControls.grab) inputRef.current.right.grab = false;
      } else {
        // 双人模式
        const leftControls = DEFAULT_CONTROLS.left;
        if (e.code === leftControls.left) inputRef.current.left.left = false;
        if (e.code === leftControls.right) inputRef.current.left.right = false;
        if (e.code === leftControls.up) inputRef.current.left.up = false;
        if (e.code === leftControls.grab) inputRef.current.left.grab = false;

        const rightControls = DEFAULT_CONTROLS.right;
        if (e.code === rightControls.left) inputRef.current.right.left = false;
        if (e.code === rightControls.right)
          inputRef.current.right.right = false;
        if (e.code === rightControls.up) inputRef.current.right.up = false;
        if (e.code === rightControls.grab) inputRef.current.right.grab = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.status, gameState.mode]);

  // 游戏循环
  const gameLoop = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const deltaTime = timestamp - lastTimeRef.current;

    if (deltaTime >= FRAME_TIME) {
      lastTimeRef.current = timestamp;

      setGameState(prev => {
        if (prev.status !== 'playing') return prev;

        // 获取输入
        let leftInput = inputRef.current.left;
        const rightInput = inputRef.current.right;

        // 单人模式：AI 控制左侧，玩家控制右侧
        if (prev.mode === 'single') {
          leftInput = getAIInput(
            prev.leftSlime,
            prev.ball,
            prev.rightSlime,
            difficultyRef.current
          );
        }

        // 更新史莱姆
        let newLeftSlime = updateSlime(prev.leftSlime, leftInput, deltaTime);
        let newRightSlime = updateSlime(prev.rightSlime, rightInput, deltaTime);

        // 更新球
        let newBall = updateBall(prev.ball, deltaTime);

        // 碰撞检测
        const leftCollision = checkSlimeBallCollision(newLeftSlime, newBall);
        if (leftCollision) newBall = leftCollision;

        const rightCollision = checkSlimeBallCollision(newRightSlime, newBall);
        if (rightCollision) newBall = rightCollision;

        // 检测进球
        const scorer = checkGoal(newBall);
        let newLeftScore = prev.leftScore;
        let newRightScore = prev.rightScore;

        if (scorer) {
          if (scorer === 'left') {
            newLeftScore++;
          } else {
            newRightScore++;
          }

          // 重置位置
          newBall = resetBallToCenter();
          newLeftSlime = resetSlime('left', newLeftSlime);
          newRightSlime = resetSlime('right', newRightSlime);
        }

        // 更新时间
        const newTimeRemaining = Math.max(0, prev.timeRemaining - deltaTime);

        // 检查游戏结束
        if (newTimeRemaining <= 0) {
          let winner: 'left' | 'right' | 'draw' | null = null;
          if (newLeftScore > newRightScore) winner = 'left';
          else if (newRightScore > newLeftScore) winner = 'right';
          else winner = 'draw';

          return {
            ...prev,
            status: 'ended',
            leftSlime: newLeftSlime,
            rightSlime: newRightSlime,
            ball: newBall,
            leftScore: newLeftScore,
            rightScore: newRightScore,
            timeRemaining: 0,
            winner,
          };
        }

        return {
          ...prev,
          leftSlime: newLeftSlime,
          rightSlime: newRightSlime,
          ball: newBall,
          leftScore: newLeftScore,
          rightScore: newRightScore,
          timeRemaining: newTimeRemaining,
        };
      });
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // 启动/停止游戏循环
  useEffect(() => {
    if (gameState.status === 'playing') {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(gameLoop);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.status, gameLoop]);

  // 开始游戏
  const startGame = useCallback(
    (mode: GameMode, duration: MatchDuration, difficulty?: AIDifficulty) => {
      if (difficulty) {
        difficultyRef.current = difficulty;
      }

      setGameState({
        ...createInitialGameState(mode, duration),
        status: 'playing',
      });
    },
    []
  );

  // 暂停/继续
  const resumeGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'playing' }));
  }, []);

  // 重新开始
  const restartGame = useCallback(() => {
    setGameState(prev => ({
      ...createInitialGameState(prev.mode, prev.matchDuration),
      status: 'playing',
    }));
  }, []);

  // 返回菜单
  const quitToMenu = useCallback(() => {
    setGameState(prev => ({
      ...createInitialGameState(prev.mode, prev.matchDuration),
      status: 'menu',
    }));
  }, []);

  // 修改比赛时长
  const setMatchDuration = useCallback((duration: MatchDuration) => {
    setGameState(prev => ({
      ...prev,
      matchDuration: duration,
      timeRemaining: duration * 60 * 1000,
    }));
  }, []);

  // 更新触摸输入状态（供移动端触摸控制使用）
  // side: 'left' | 'right' - 控制哪一方
  // 单人模式默认控制右侧（玩家），双人模式需要指定
  const updateTouchInput = useCallback(
    (input: InputState, side: 'left' | 'right' = 'right') => {
      inputRef.current[side] = input;
    },
    []
  );

  return {
    gameState,
    startGame,
    resumeGame,
    restartGame,
    quitToMenu,
    setMatchDuration,
    updateTouchInput,
  };
}
