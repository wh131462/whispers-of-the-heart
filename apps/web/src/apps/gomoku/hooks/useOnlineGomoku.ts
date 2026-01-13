import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useOnlineGame, type PlayerRole } from '@whispers/hooks';
import type {
  GameState,
  Player,
  TimeLimit,
  MoveRecord,
  ChatMessage,
  UndoRequest,
  UndoStatus,
} from '../types';
import { createEmptyBoard, checkWin, isBoardFull } from '../utils/game';

const APP_ID = 'whispers-gomoku-online';

interface UseOnlineGomokuOptions {
  userName: string;
}

function createInitialState(): Omit<GameState, 'mode' | 'difficulty'> {
  return {
    board: createEmptyBoard(),
    currentPlayer: 'black',
    winner: null,
    winningLine: null,
    lastMove: null,
    status: 'idle',
    history: [],
  };
}

export function useOnlineGomoku({ userName }: UseOnlineGomokuOptions) {
  const [gameState, setGameState] = useState(createInitialState);

  // 新功能状态
  const [timeLimit, setTimeLimitState] = useState<TimeLimit>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [canUndo, setCanUndo] = useState(true);
  const [undoRequest, setUndoRequest] = useState<UndoRequest | null>(null);
  const [lastChatMessage, setLastChatMessage] = useState<ChatMessage | null>(
    null
  );
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [undoStatus, setUndoStatus] = useState<UndoStatus>(null);

  const timerRef = useRef<number | null>(null);
  const chatTimeoutRef = useRef<number | null>(null);
  const moveHistoryRef = useRef<MoveRecord[]>([]);
  const undoStatusTimeoutRef = useRef<number | null>(null);
  const timeLimitRef = useRef<TimeLimit>(timeLimit);

  // 保持 timeLimitRef 最新
  useEffect(() => {
    timeLimitRef.current = timeLimit;
  }, [timeLimit]);

  // 根据当前游戏状态计算应该行动的角色
  const currentTurnRole: PlayerRole | null = useMemo(() => {
    if (gameState.status === 'won') return null;
    // player1 = 黑棋, player2 = 白棋
    return gameState.currentPlayer === 'black' ? 'player1' : 'player2';
  }, [gameState.status, gameState.currentPlayer]);

  // 处理游戏动作
  const handleGameAction = useCallback(
    (action: string, data: Record<string, unknown>) => {
      if (action === 'move') {
        const row = data.row as number;
        const col = data.col as number;
        const player = data.player as Player;

        setGameState(prev => {
          if (prev.status === 'won') return prev;
          if (prev.board[row][col] !== null) return prev;

          const newBoard = prev.board.map(r => [...r]);
          newBoard[row][col] = player;

          const winningLine = checkWin(newBoard, row, col, player);
          const isWin = winningLine !== null;
          const isDraw = !isWin && isBoardFull(newBoard);

          return {
            ...prev,
            board: newBoard,
            currentPlayer: isWin
              ? player
              : player === 'black'
                ? 'white'
                : 'black',
            winner: isWin ? player : null,
            winningLine: isWin ? winningLine : null,
            lastMove: { row, col },
            status: isWin || isDraw ? 'won' : 'playing',
            history: [...prev.history, { row, col }],
          };
        });

        // 记录棋步（用于悔棋）
        setMoveHistory(prev => {
          const newHistory = [...prev, { row, col, player }];
          moveHistoryRef.current = newHistory;
          return newHistory;
        });

        // 重置计时器（使用 ref 获取最新的 timeLimit）
        const currentTimeLimit = timeLimitRef.current;
        if (currentTimeLimit > 0) {
          setTimeLeft(currentTimeLimit);
        }
      } else if (action === 'reset') {
        setGameState(createInitialState());
        setMoveHistory([]);
        moveHistoryRef.current = [];
        setCanUndo(true);
        setIsGameStarted(false);
        setTimeLeft(0);
      } else if (action === 'settings') {
        // 设置时间限制
        const newTimeLimit = data.timeLimit as TimeLimit;
        setTimeLimitState(newTimeLimit);
      } else if (action === 'start') {
        // 游戏开始
        setIsGameStarted(true);
        // 从消息中获取时间限制，确保双方同步
        const startTimeLimit = (data.timeLimit as TimeLimit) ?? timeLimit;
        if (startTimeLimit > 0) {
          setTimeLimitState(startTimeLimit);
          setTimeLeft(startTimeLimit);
        }
      } else if (action === 'chat') {
        // 收到聊天消息
        const message: ChatMessage = {
          from: data.from as string,
          fromName: data.fromName as string,
          content: data.content as string,
          timestamp: Date.now(),
        };
        setLastChatMessage(message);

        // 3秒后清除消息
        if (chatTimeoutRef.current) {
          clearTimeout(chatTimeoutRef.current);
        }
        chatTimeoutRef.current = window.setTimeout(() => {
          setLastChatMessage(null);
        }, 3000);
      } else if (action === 'undo_request') {
        // 收到悔棋请求
        setUndoRequest({
          fromPeerId: data.fromPeerId as string,
          fromName: data.fromName as string,
        });
      } else if (action === 'undo_response') {
        // 收到悔棋响应
        const approved = data.approved as boolean;

        // 显示状态提示
        setUndoStatus(approved ? 'accepted' : 'rejected');
        if (undoStatusTimeoutRef.current) {
          clearTimeout(undoStatusTimeoutRef.current);
        }
        undoStatusTimeoutRef.current = window.setTimeout(() => {
          setUndoStatus(null);
        }, 2000);

        if (approved) {
          // 执行悔棋：撤销最后一步（使用 ref 获取最新值）
          const currentMoveHistory = moveHistoryRef.current;
          if (currentMoveHistory.length === 0) {
            setUndoRequest(null);
            return;
          }

          const lastMove = currentMoveHistory[currentMoveHistory.length - 1];

          setGameState(prev => {
            const newBoard = prev.board.map(r => [...r]);
            newBoard[lastMove.row][lastMove.col] = null;

            const newHistory = prev.history.slice(0, -1);
            const newLastMove =
              newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;

            return {
              ...prev,
              board: newBoard,
              currentPlayer: lastMove.player,
              lastMove: newLastMove,
              history: newHistory,
            };
          });

          const newMoveHistory = currentMoveHistory.slice(0, -1);
          setMoveHistory(newMoveHistory);
          moveHistoryRef.current = newMoveHistory;
          setCanUndo(false);
        }
        setUndoRequest(null);
      } else if (action === 'timeout') {
        // 超时判负
        const loser = data.loser as PlayerRole;
        const winner: Player = loser === 'player1' ? 'white' : 'black';
        setGameState(prev => ({
          ...prev,
          winner,
          status: 'won',
        }));
      }
    },
    []
  );

  const {
    state: onlineState,
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

  // 倒计时逻辑 - 只有轮到我时才递减，有悔棋请求时暂停
  useEffect(() => {
    if (
      !isGameStarted ||
      timeLimit === 0 ||
      gameState.status === 'won' ||
      !onlineState.isMyTurn ||
      undoRequest // 收到悔棋请求时暂停计时
    ) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // 超时
          const loser = currentTurnRole;
          if (loser) {
            sendGameAction('timeout', { loser });
            handleGameAction('timeout', { loser });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isGameStarted,
    timeLimit,
    gameState.status,
    currentTurnRole,
    onlineState.isMyTurn,
    undoRequest,
    sendGameAction,
    handleGameAction,
  ]);

  // 清理 chatTimeout 和 undoStatusTimeout
  useEffect(() => {
    return () => {
      if (chatTimeoutRef.current) {
        clearTimeout(chatTimeoutRef.current);
      }
      if (undoStatusTimeoutRef.current) {
        clearTimeout(undoStatusTimeoutRef.current);
      }
    };
  }, []);

  // 落子
  const makeMove = useCallback(
    (row: number, col: number) => {
      // 游戏必须就绪（两个玩家都在）
      if (!onlineState.gameReady) return;
      if (gameState.status === 'won') return;
      if (gameState.board[row][col] !== null) return;

      // 检查是否轮到我
      if (!onlineState.isMyTurn) return;

      const myColor: Player =
        onlineState.myRole === 'player1' ? 'black' : 'white';

      // 本地更新
      handleGameAction('move', { row, col, player: myColor });

      // 发送给对方
      sendGameAction('move', { row, col, player: myColor });
    },
    [
      gameState.status,
      gameState.board,
      onlineState.gameReady,
      onlineState.isMyTurn,
      onlineState.myRole,
      handleGameAction,
      sendGameAction,
    ]
  );

  // 设置时间限制（游戏开始前）
  const setTimeLimit = useCallback(
    (limit: TimeLimit) => {
      if (isGameStarted) return;
      setTimeLimitState(limit);
      sendGameAction('settings', { timeLimit: limit });
    },
    [isGameStarted, sendGameAction]
  );

  // 开始游戏
  const startGame = useCallback(() => {
    if (!onlineState.gameReady) return;
    setIsGameStarted(true);
    if (timeLimit > 0) {
      setTimeLeft(timeLimit);
    }
    // 发送时间限制，确保双方同步
    sendGameAction('start', { timeLimit });
  }, [onlineState.gameReady, timeLimit, sendGameAction]);

  // 发送聊天消息
  const sendChat = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      const message = {
        from: '__self__',
        fromName: userName,
        content: content.trim(),
      };
      // 本地显示
      handleGameAction('chat', message);
      // 发送给对方
      sendGameAction('chat', message);
    },
    [userName, handleGameAction, sendGameAction]
  );

  // 请求悔棋
  const requestUndo = useCallback(() => {
    if (!canUndo || moveHistory.length === 0) return;
    setUndoStatus('waiting');
    sendGameAction('undo_request', {
      fromPeerId: '__self__',
      fromName: userName,
    });
  }, [canUndo, moveHistory.length, userName, sendGameAction]);

  // 响应悔棋请求
  const respondUndo = useCallback(
    (approved: boolean) => {
      if (!undoRequest) return;

      sendGameAction('undo_response', { approved });

      if (approved) {
        // 执行悔棋
        handleGameAction('undo_response', { approved: true });
      }
      setUndoRequest(null);
    },
    [undoRequest, sendGameAction, handleGameAction]
  );

  // 重置游戏
  const reset = useCallback(() => {
    resetGame();
    setMoveHistory([]);
    moveHistoryRef.current = [];
    setCanUndo(true);
    setIsGameStarted(false);
    setTimeLeft(0);
  }, [resetGame]);

  // 获取我的颜色
  const myColor: Player | null =
    onlineState.myRole === 'player1'
      ? 'black'
      : onlineState.myRole === 'player2'
        ? 'white'
        : null;

  // 获取对手信息
  const opponent =
    onlineState.myRole === 'player1'
      ? onlineState.player2
      : onlineState.myRole === 'player2'
        ? onlineState.player1
        : null;

  return {
    // 游戏状态
    gameState: {
      ...gameState,
      mode: 'online' as const,
      difficulty: 'medium' as const,
    },
    // 在线状态
    onlineState: {
      ...onlineState,
      myColor,
      opponent,
    },
    // 新功能状态
    timeLimit,
    timeLeft,
    canUndo: canUndo && moveHistory.length > 0 && isGameStarted,
    undoRequest,
    undoStatus,
    lastChatMessage,
    isGameStarted,
    // 操作
    makeMove,
    reset,
    join,
    leaveRoom,
    requestPlayerRole,
    requestSwap,
    respondSwap,
    // 新功能操作
    setTimeLimit,
    startGame,
    sendChat,
    requestUndo,
    respondUndo,
  };
}
