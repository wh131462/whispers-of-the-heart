import { useState, useCallback, useMemo } from 'react';
import { useOnlineGame, type PlayerRole } from '@whispers/hooks';
import type { GameState, Player } from '../types';
import {
  createInitialBoard,
  getValidMoves,
  makeMove,
  countPieces,
  getWinner,
} from '../utils/game';

const APP_ID = 'whispers-reversi-online';

interface UseOnlineReversiOptions {
  userName: string;
}

function createInitialState(): Omit<GameState, 'mode' | 'difficulty'> {
  const board = createInitialBoard();
  const { black, white } = countPieces(board);

  return {
    board,
    currentPlayer: 'black',
    validMoves: getValidMoves(board, 'black'),
    blackCount: black,
    whiteCount: white,
    status: 'playing',
    winner: null,
  };
}

export function useOnlineReversi({ userName }: UseOnlineReversiOptions) {
  const [gameState, setGameState] = useState(createInitialState);

  // 根据当前游戏状态计算应该行动的角色
  const currentTurnRole: PlayerRole | null = useMemo(() => {
    if (gameState.status === 'ended') return null;
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
          if (prev.status === 'ended') return prev;

          // 检查是否是有效移动
          const isValid = prev.validMoves.some(
            m => m.row === row && m.col === col
          );
          if (!isValid) return prev;

          const newBoard = makeMove(prev.board, row, col, player);
          const { black, white } = countPieces(newBoard);
          const nextPlayer: Player = player === 'black' ? 'white' : 'black';
          let validMoves = getValidMoves(newBoard, nextPlayer);

          // 检查对手是否有有效移动
          let actualNextPlayer = nextPlayer;
          if (validMoves.length === 0) {
            // 对手无法移动，检查当前玩家是否可以继续
            const currentPlayerMoves = getValidMoves(newBoard, player);
            if (currentPlayerMoves.length > 0) {
              actualNextPlayer = player;
              validMoves = currentPlayerMoves;
            }
          }

          const winner = getWinner(newBoard);

          return {
            ...prev,
            board: newBoard,
            currentPlayer: actualNextPlayer,
            validMoves,
            blackCount: black,
            whiteCount: white,
            status: winner !== null ? 'ended' : 'playing',
            winner,
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
  const placePiece = useCallback(
    (row: number, col: number) => {
      // 游戏必须就绪（两个玩家都在）
      if (!onlineState.gameReady) return;
      if (gameState.status === 'ended') return;

      // 检查是否轮到我
      if (!onlineState.isMyTurn) return;

      // 检查是否是有效移动
      const isValid = gameState.validMoves.some(
        m => m.row === row && m.col === col
      );
      if (!isValid) return;

      const myColor: Player =
        onlineState.myRole === 'player1' ? 'black' : 'white';

      // 本地更新
      handleGameAction('move', { row, col, player: myColor });

      // 发送给对方
      sendGameAction('move', { row, col, player: myColor });
    },
    [
      gameState.status,
      gameState.validMoves,
      onlineState.gameReady,
      onlineState.isMyTurn,
      onlineState.myRole,
      handleGameAction,
      sendGameAction,
    ]
  );

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
    placePiece,
    reset,
    join,
    leaveRoom,
    requestPlayerRole,
    requestSwap,
    respondSwap,
  };
}
