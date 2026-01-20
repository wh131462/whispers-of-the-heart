import { useState, useCallback, useEffect, useRef } from 'react';
import { useOnlineGame, type PlayerRole } from '@whispers/hooks';
import type {
  GameState,
  MatchDuration,
  InputState,
  ChatMessage,
  OnlineState,
  PlayerSide,
  SlimeState,
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

const APP_ID = 'whispers-slime-soccer-online';
const FRAME_RATE = 60;
const FRAME_TIME = 1000 / FRAME_RATE;
const SYNC_INTERVAL = 100; // 每 100ms 同步一次（10fps），配合客户端预测
const INTERPOLATION_FACTOR = 0.3; // 插值平滑因子（0-1，越小越平滑但延迟越高）

interface UseOnlineSlimeSoccerOptions {
  userName: string;
}

export function useOnlineSlimeSoccer({
  userName,
}: UseOnlineSlimeSoccerOptions) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState('online', 2)
  );
  const [matchDuration, setMatchDuration] = useState<MatchDuration>(2);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [lastChatMessage, setLastChatMessage] = useState<ChatMessage | null>(
    null
  );

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(0);
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    up: false,
    grab: false,
  });
  // 存储远程玩家的史莱姆状态（带时间戳用于预测）
  const remoteSlimeRef = useRef<{
    state: SlimeState;
    receivedAt: number; // 收到时的时间戳
  } | null>(null);
  // 存储从主机接收的球和游戏状态（客户端用，带时间戳）
  const remoteBallDataRef = useRef<{
    ball: GameState['ball'];
    leftScore: number;
    rightScore: number;
    timeRemaining: number;
    status: GameState['status'];
    winner: GameState['winner'];
    receivedAt: number; // 收到时的时间戳
  } | null>(null);
  const chatTimeoutRef = useRef<number | null>(null);
  const mySideRef = useRef<PlayerSide | null>(null);
  const isHostRef = useRef(false);
  const sendGameActionRef = useRef<
    ((action: string, data: Record<string, unknown>) => void) | null
  >(null);
  // 用于同步时获取最新游戏状态（避免在 setGameState 回调中执行副作用）
  const gameStateRef = useRef<GameState>(gameState);

  // 处理游戏动作
  const handleGameAction = useCallback(
    (action: string, data: Record<string, unknown>) => {
      if (action === 'slime_sync') {
        // 接收对方的史莱姆状态（带时间戳）
        const slimeData = data.slime as SlimeState;
        if (slimeData) {
          remoteSlimeRef.current = {
            state: slimeData,
            receivedAt: performance.now(),
          };
        }
      } else if (action === 'ball_sync') {
        // 接收主机同步的球状态（仅客户端处理）
        // 存储到 ref，让游戏循环使用，避免被 setGameState 覆盖
        if (!isHostRef.current) {
          remoteBallDataRef.current = {
            ball: data.ball as GameState['ball'],
            leftScore: data.leftScore as number,
            rightScore: data.rightScore as number,
            timeRemaining: data.timeRemaining as number,
            status: data.status as GameState['status'],
            winner: data.winner as GameState['winner'],
            receivedAt: performance.now(),
          };
        }
      } else if (action === 'start') {
        // 游戏开始
        const duration = (data.duration as MatchDuration) ?? matchDuration;
        setMatchDuration(duration);
        setIsGameStarted(true);
        setGameState({
          ...createInitialGameState('online', duration),
          status: 'playing',
        });
      } else if (action === 'reset') {
        // 重置游戏
        setIsGameStarted(false);
        setGameState(createInitialGameState('online', matchDuration));
        remoteSlimeRef.current = null;
        remoteBallDataRef.current = null;
      } else if (action === 'settings') {
        // 设置变更
        const newDuration = data.duration as MatchDuration;
        if (newDuration) {
          setMatchDuration(newDuration);
        }
      } else if (action === 'chat') {
        // 聊天消息
        const message: ChatMessage = {
          from: data.from as string,
          fromName: data.fromName as string,
          content: data.content as string,
          timestamp: Date.now(),
        };
        setLastChatMessage(message);

        if (chatTimeoutRef.current) {
          clearTimeout(chatTimeoutRef.current);
        }
        chatTimeoutRef.current = window.setTimeout(() => {
          setLastChatMessage(null);
        }, 3000);
      }
    },
    [matchDuration]
  );

  // 当前应该操作的角色（实时游戏两方同时操作）
  const currentTurnRole: PlayerRole | null = null;

  const {
    state: rawOnlineState,
    join,
    leaveRoom,
    sendGameAction,
    requestPlayerRole,
    resetGame,
    requestSwap,
    respondSwap,
  } = useOnlineGame({
    appId: APP_ID,
    userName,
    currentTurnRole,
    onGameAction: handleGameAction,
  });

  // 转换在线状态
  const onlineState: OnlineState = {
    roomStatus: rawOnlineState.roomStatus,
    roomCode: rawOnlineState.roomCode,
    myRole: rawOnlineState.myRole,
    mySide:
      rawOnlineState.myRole === 'player1'
        ? 'left'
        : rawOnlineState.myRole === 'player2'
          ? 'right'
          : null,
    player1: rawOnlineState.player1 ?? null,
    player2: rawOnlineState.player2 ?? null,
    spectators: rawOnlineState.spectators,
    isHost: rawOnlineState.myRole === 'player1',
    gameReady: !!(rawOnlineState.player1 && rawOnlineState.player2),
    error: null,
  };

  // 保持 refs 同步（用于游戏循环中避免闭包问题）
  mySideRef.current = onlineState.mySide;
  isHostRef.current = onlineState.isHost;
  sendGameActionRef.current = sendGameAction as (
    action: string,
    data: Record<string, unknown>
  ) => void;
  gameStateRef.current = gameState;

  // 监听玩家退出：当游戏进行中有玩家退出时，重置游戏状态
  useEffect(() => {
    // 如果游戏已开始但房间不再准备好（有玩家退出），则重置游戏
    if (isGameStarted && !onlineState.gameReady) {
      setIsGameStarted(false);
      setGameState(createInitialGameState('online', matchDuration));
      remoteSlimeRef.current = null;
      remoteBallDataRef.current = null;
    }
  }, [isGameStarted, onlineState.gameReady, matchDuration]);

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
    if (!isGameStarted || !onlineState.mySide) return;

    const controls =
      onlineState.mySide === 'left'
        ? DEFAULT_CONTROLS.left
        : DEFAULT_CONTROLS.right;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 阻止方向键等的默认行为（防止页面滚动）
      if (gameKeys.includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === controls.left) inputRef.current.left = true;
      if (e.code === controls.right) inputRef.current.right = true;
      if (e.code === controls.up) inputRef.current.up = true;
      if (e.code === controls.grab) inputRef.current.grab = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 阻止方向键等的默认行为
      if (gameKeys.includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === controls.left) inputRef.current.left = false;
      if (e.code === controls.right) inputRef.current.right = false;
      if (e.code === controls.up) inputRef.current.up = false;
      if (e.code === controls.grab) inputRef.current.grab = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameStarted, onlineState.mySide]);

  // 游戏循环（使用 ref 存储以保持稳定引用）
  const gameLoopRef = useRef<(timestamp: number) => void>(() => {});
  gameLoopRef.current = (timestamp: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
      lastSyncRef.current = timestamp;
    }

    const deltaTime = timestamp - lastTimeRef.current;

    if (deltaTime >= FRAME_TIME) {
      lastTimeRef.current = timestamp;
      const mySide = mySideRef.current;

      // 双方都更新自己的史莱姆
      setGameState(prev => {
        if (prev.status !== 'playing') return prev;

        // 更新自己的史莱姆
        const mySlime = mySide === 'left' ? prev.leftSlime : prev.rightSlime;
        const newMySlime = updateSlime(mySlime, inputRef.current, deltaTime);

        // 使用远程玩家的史莱姆状态（带预测和插值）
        const remoteData = remoteSlimeRef.current;
        let remoteSlime: SlimeState | null = null;
        if (remoteData) {
          const { state: receivedSlime, receivedAt } = remoteData;
          const timeSinceReceived = timestamp - receivedAt;

          // 基于速度预测当前位置
          const predictedX =
            receivedSlime.position.x +
            receivedSlime.velocity.x * (timeSinceReceived / 16);
          const predictedY =
            receivedSlime.position.y +
            receivedSlime.velocity.y * (timeSinceReceived / 16);

          // 获取当前显示的远程史莱姆位置
          const currentRemote =
            mySide === 'left' ? prev.rightSlime : prev.leftSlime;

          // 插值平滑过渡到预测位置
          remoteSlime = {
            ...receivedSlime,
            position: {
              x:
                currentRemote.position.x +
                (predictedX - currentRemote.position.x) * INTERPOLATION_FACTOR,
              y:
                currentRemote.position.y +
                (predictedY - currentRemote.position.y) * INTERPOLATION_FACTOR,
            },
          };
        }

        let newLeftSlime =
          mySide === 'left' ? newMySlime : remoteSlime || prev.leftSlime;
        let newRightSlime =
          mySide === 'right' ? newMySlime : remoteSlime || prev.rightSlime;

        // 球和游戏状态的处理
        let newBall = prev.ball;
        let newLeftScore = prev.leftScore;
        let newRightScore = prev.rightScore;
        let newTimeRemaining = prev.timeRemaining;
        let newStatus: GameState['status'] = prev.status;
        let newWinner: GameState['winner'] = prev.winner;

        if (isHostRef.current) {
          // 主机：本地计算球的物理
          newBall = updateBall(prev.ball, deltaTime);

          // 碰撞检测
          const leftCollision = checkSlimeBallCollision(newLeftSlime, newBall);
          if (leftCollision) newBall = leftCollision;

          const rightCollision = checkSlimeBallCollision(
            newRightSlime,
            newBall
          );
          if (rightCollision) newBall = rightCollision;

          // 检测进球
          const scorer = checkGoal(newBall);

          if (scorer) {
            if (scorer === 'left') {
              newLeftScore++;
            } else {
              newRightScore++;
            }

            newBall = resetBallToCenter();
            newLeftSlime = resetSlime('left', newLeftSlime);
            newRightSlime = resetSlime('right', newRightSlime);
          }

          // 更新时间
          newTimeRemaining = Math.max(0, prev.timeRemaining - deltaTime);

          // 检查游戏结束
          if (newTimeRemaining <= 0) {
            if (newLeftScore > newRightScore) newWinner = 'left';
            else if (newRightScore > newLeftScore) newWinner = 'right';
            else newWinner = 'draw';
            newStatus = 'ended';
          }
        } else {
          // 客户端：使用从主机接收的球和游戏状态（带预测和插值）
          const remoteBallData = remoteBallDataRef.current;
          if (remoteBallData) {
            const { ball: receivedBall, receivedAt } = remoteBallData;
            const timeSinceReceived = timestamp - receivedAt;

            // 基于速度预测球的当前位置
            const predictedBallX =
              receivedBall.position.x +
              receivedBall.velocity.x * (timeSinceReceived / 16);
            const predictedBallY =
              receivedBall.position.y +
              receivedBall.velocity.y * (timeSinceReceived / 16);

            // 插值平滑过渡到预测位置
            newBall = {
              ...receivedBall,
              position: {
                x:
                  prev.ball.position.x +
                  (predictedBallX - prev.ball.position.x) *
                    INTERPOLATION_FACTOR,
                y:
                  prev.ball.position.y +
                  (predictedBallY - prev.ball.position.y) *
                    INTERPOLATION_FACTOR,
              },
              // 速度也做插值，避免突变
              velocity: {
                x:
                  prev.ball.velocity.x +
                  (receivedBall.velocity.x - prev.ball.velocity.x) *
                    INTERPOLATION_FACTOR,
                y:
                  prev.ball.velocity.y +
                  (receivedBall.velocity.y - prev.ball.velocity.y) *
                    INTERPOLATION_FACTOR,
              },
            };

            newLeftScore = remoteBallData.leftScore;
            newRightScore = remoteBallData.rightScore;
            newTimeRemaining = remoteBallData.timeRemaining;
            newStatus = remoteBallData.status;
            newWinner = remoteBallData.winner;
          }
        }

        const newState = {
          ...prev,
          leftSlime: newLeftSlime,
          rightSlime: newRightSlime,
          ball: newBall,
          leftScore: newLeftScore,
          rightScore: newRightScore,
          timeRemaining: newTimeRemaining,
          status: newStatus,
          winner: newWinner,
        };
        // 同步更新 ref，确保同步时能获取到最新状态
        gameStateRef.current = newState;
        return newState;
      });

      // 定期同步（使用 gameStateRef 获取最新状态，避免在 setGameState 回调中执行副作用）
      if (timestamp - lastSyncRef.current >= SYNC_INTERVAL) {
        lastSyncRef.current = timestamp;

        const currentState = gameStateRef.current;
        // 双方都发送自己的史莱姆状态
        const mySlime =
          mySide === 'left' ? currentState.leftSlime : currentState.rightSlime;
        sendGameActionRef.current?.('slime_sync', { slime: mySlime });

        // 主机额外发送球的状态
        if (isHostRef.current) {
          sendGameActionRef.current?.('ball_sync', {
            ball: currentState.ball,
            leftScore: currentState.leftScore,
            rightScore: currentState.rightScore,
            timeRemaining: currentState.timeRemaining,
            status: currentState.status,
            winner: currentState.winner,
          });
        }
      }
    }

    animationRef.current = requestAnimationFrame(gameLoopRef.current!);
  };

  // 稳定的游戏循环启动函数
  const startGameLoop = useCallback(() => {
    lastTimeRef.current = 0;
    lastSyncRef.current = 0;
    animationRef.current = requestAnimationFrame(gameLoopRef.current!);
  }, []);

  // 启动/停止游戏循环
  useEffect(() => {
    if (isGameStarted && gameState.status === 'playing') {
      startGameLoop();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isGameStarted, gameState.status, startGameLoop]);

  // 开始游戏
  const startGame = useCallback(() => {
    sendGameAction('start', { duration: matchDuration });
    setIsGameStarted(true);
    setGameState({
      ...createInitialGameState('online', matchDuration),
      status: 'playing',
    });
  }, [sendGameAction, matchDuration]);

  // 重置游戏
  const reset = useCallback(() => {
    sendGameAction('reset', {});
    setIsGameStarted(false);
    setGameState(createInitialGameState('online', matchDuration));
    remoteSlimeRef.current = null;
    remoteBallDataRef.current = null;
    resetGame();
  }, [sendGameAction, matchDuration, resetGame]);

  // 退出房间
  const quitToMenu = useCallback(() => {
    leaveRoom();
    setIsGameStarted(false);
    setGameState(createInitialGameState('online', matchDuration));
    remoteSlimeRef.current = null;
    remoteBallDataRef.current = null;
  }, [leaveRoom, matchDuration]);

  // 发送聊天消息
  const sendChat = useCallback(
    (content: string) => {
      sendGameAction('chat', {
        from: userName,
        fromName: userName,
        content,
      });
    },
    [sendGameAction, userName]
  );

  // 设置比赛时长
  const handleSetMatchDuration = useCallback(
    (duration: MatchDuration) => {
      setMatchDuration(duration);
      sendGameAction('settings', { duration });
    },
    [sendGameAction]
  );

  return {
    gameState,
    matchDuration,
    isGameStarted,
    lastChatMessage,
    onlineState: {
      ...onlineState,
      pendingSwapRequest: rawOnlineState.pendingSwapRequest,
      swapStatus: rawOnlineState.swapStatus,
    },
    join,
    leaveRoom,
    requestPlayerRole,
    requestSwap,
    respondSwap,
    setMatchDuration: handleSetMatchDuration,
    startGame,
    reset,
    sendChat,
    quitToMenu,
  };
}
