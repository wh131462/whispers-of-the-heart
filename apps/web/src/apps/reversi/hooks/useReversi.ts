import { useState, useCallback, useEffect } from 'react';
import type { GameState, GameMode, Difficulty, Player } from '../types';
import {
  createInitialBoard,
  getValidMoves,
  makeMove,
  countPieces,
  getWinner,
} from '../utils/game';
import { getAIMove } from '../utils/ai';

function createInitialState(
  mode: GameMode,
  difficulty: Difficulty,
  humanColor: Player
): GameState {
  const board = createInitialBoard();
  const { black, white } = countPieces(board);

  return {
    board,
    currentPlayer: 'black',
    validMoves: getValidMoves(board, 'black'),
    blackCount: black,
    whiteCount: white,
    status: 'playing',
    mode,
    difficulty,
    humanColor,
    winner: null,
  };
}

export function useReversi() {
  const [state, setState] = useState<GameState>(() =>
    createInitialState('pve', 'medium', 'black')
  );

  const reset = useCallback(() => {
    setState(prev =>
      createInitialState(prev.mode, prev.difficulty, prev.humanColor)
    );
  }, []);

  const setMode = useCallback((mode: GameMode) => {
    setState(prev =>
      createInitialState(mode, prev.difficulty, prev.humanColor)
    );
  }, []);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setState(prev =>
      createInitialState(prev.mode, difficulty, prev.humanColor)
    );
  }, []);

  const setHumanColor = useCallback((humanColor: Player) => {
    setState(prev =>
      createInitialState(prev.mode, prev.difficulty, humanColor)
    );
  }, []);

  const placePiece = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status === 'ended') return prev;
      if (prev.mode === 'pve' && prev.currentPlayer !== prev.humanColor)
        return prev;

      // 检查是否是有效移动
      const isValid = prev.validMoves.some(m => m.row === row && m.col === col);
      if (!isValid) return prev;

      const newBoard = makeMove(prev.board, row, col, prev.currentPlayer);
      const { black, white } = countPieces(newBoard);
      const nextPlayer: Player =
        prev.currentPlayer === 'black' ? 'white' : 'black';
      let validMoves = getValidMoves(newBoard, nextPlayer);

      // 检查对手是否有有效移动
      let actualNextPlayer = nextPlayer;
      if (validMoves.length === 0) {
        // 对手无法移动，检查当前玩家是否可以继续
        const currentPlayerMoves = getValidMoves(newBoard, prev.currentPlayer);
        if (currentPlayerMoves.length > 0) {
          actualNextPlayer = prev.currentPlayer;
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
  }, []);

  // AI 自动下棋
  useEffect(() => {
    if (
      state.mode === 'pve' &&
      state.status === 'playing' &&
      state.currentPlayer !== state.humanColor &&
      state.validMoves.length > 0
    ) {
      const aiColor: Player = state.currentPlayer;
      const timer = setTimeout(() => {
        const aiMove = getAIMove(state.board, aiColor, state.difficulty);

        setState(prev => {
          if (prev.currentPlayer !== aiColor || prev.status !== 'playing')
            return prev;

          const newBoard = makeMove(
            prev.board,
            aiMove.row,
            aiMove.col,
            aiColor
          );
          const { black, white } = countPieces(newBoard);
          const opponent: Player = aiColor === 'black' ? 'white' : 'black';
          let validMoves = getValidMoves(newBoard, opponent);

          let nextPlayer: Player = opponent;
          if (validMoves.length === 0) {
            const aiMoves = getValidMoves(newBoard, aiColor);
            if (aiMoves.length > 0) {
              nextPlayer = aiColor;
              validMoves = aiMoves;
            }
          }

          const winner = getWinner(newBoard);

          return {
            ...prev,
            board: newBoard,
            currentPlayer: nextPlayer,
            validMoves,
            blackCount: black,
            whiteCount: white,
            status: winner !== null ? 'ended' : 'playing',
            winner,
          };
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    state.mode,
    state.status,
    state.currentPlayer,
    state.humanColor,
    state.validMoves.length,
    state.board,
    state.difficulty,
  ]);

  return {
    state,
    reset,
    setMode,
    setDifficulty,
    setHumanColor,
    placePiece,
  };
}
