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

function createInitialState(mode: GameMode, difficulty: Difficulty): GameState {
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
    winner: null,
  };
}

export function useReversi() {
  const [state, setState] = useState<GameState>(() =>
    createInitialState('pve', 'medium')
  );

  const reset = useCallback(() => {
    setState(prev => createInitialState(prev.mode, prev.difficulty));
  }, []);

  const setMode = useCallback((mode: GameMode) => {
    setState(createInitialState(mode, 'medium'));
  }, []);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setState(prev => createInitialState(prev.mode, difficulty));
  }, []);

  const placePiece = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status === 'ended') return prev;
      if (prev.mode === 'pve' && prev.currentPlayer === 'white') return prev;

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
      state.currentPlayer === 'white' &&
      state.validMoves.length > 0
    ) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(state.board, 'white', state.difficulty);

        setState(prev => {
          if (prev.currentPlayer !== 'white' || prev.status !== 'playing')
            return prev;

          const newBoard = makeMove(
            prev.board,
            aiMove.row,
            aiMove.col,
            'white'
          );
          const { black, white } = countPieces(newBoard);
          let validMoves = getValidMoves(newBoard, 'black');

          let nextPlayer: Player = 'black';
          if (validMoves.length === 0) {
            const whiteMoves = getValidMoves(newBoard, 'white');
            if (whiteMoves.length > 0) {
              nextPlayer = 'white';
              validMoves = whiteMoves;
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
    state.validMoves.length,
    state.board,
    state.difficulty,
  ]);

  return {
    state,
    reset,
    setMode,
    setDifficulty,
    placePiece,
  };
}
