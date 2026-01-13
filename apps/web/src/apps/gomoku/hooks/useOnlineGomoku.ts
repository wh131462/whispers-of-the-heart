import { useState, useCallback, useMemo } from 'react';
import { useOnlineGame, type PlayerRole } from '@whispers/hooks';
import type { GameState, Player } from '../types';
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
      } else if (action === 'reset') {
        setGameState(createInitialState());
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

  // 悔棋（在线模式暂不支持）
  const undo = useCallback(() => {
    // 在线模式不支持悔棋
  }, []);

  // 重置游戏
  const reset = useCallback(() => {
    resetGame();
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
    // 操作
    makeMove,
    undo,
    reset,
    join,
    leaveRoom,
    requestPlayerRole,
    requestSwap,
    respondSwap,
    canUndo: false, // 在线模式不支持悔棋
  };
}
