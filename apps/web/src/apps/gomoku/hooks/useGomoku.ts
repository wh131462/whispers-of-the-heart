import { useState, useCallback, useEffect } from 'react';
import type { GameState, GameMode, Difficulty, Player } from '../types';
import { createEmptyBoard, checkWin, isBoardFull } from '../utils/game';
import { getAIMove } from '../utils/ai';

function createInitialState(mode: GameMode, difficulty: Difficulty): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 'black',
    winner: null,
    winningLine: null,
    lastMove: null,
    status: 'idle',
    mode,
    difficulty,
    history: [],
  };
}

export function useGomoku() {
  const [state, setState] = useState<GameState>(() =>
    createInitialState('pve', 'medium')
  );

  const reset = useCallback(() => {
    setState(prev => createInitialState(prev.mode, prev.difficulty));
  }, []);

  const setMode = useCallback((mode: GameMode) => {
    setState(prev => createInitialState(mode, prev.difficulty));
  }, []);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setState(prev => createInitialState(prev.mode, difficulty));
  }, []);

  const makeMove = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status === 'won') return prev;
      if (prev.board[row][col] !== null) return prev;

      // 如果是 PVE 模式且不是玩家回合，忽略点击
      if (prev.mode === 'pve' && prev.currentPlayer === 'white') return prev;

      const newBoard = prev.board.map(r => [...r]);
      newBoard[row][col] = prev.currentPlayer;

      const winningLine = checkWin(newBoard, row, col, prev.currentPlayer);
      const isWin = winningLine !== null;
      const isDraw = !isWin && isBoardFull(newBoard);

      return {
        ...prev,
        board: newBoard,
        currentPlayer: isWin
          ? prev.currentPlayer
          : prev.currentPlayer === 'black'
            ? 'white'
            : 'black',
        winner: isWin ? prev.currentPlayer : null,
        winningLine: isWin ? winningLine : null,
        lastMove: { row, col },
        status: isWin || isDraw ? 'won' : 'playing',
        history: [...prev.history, { row, col }],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;

      // PVE 模式下撤销两步（玩家 + AI）
      const stepsToUndo =
        prev.mode === 'pve' && prev.history.length >= 2 ? 2 : 1;
      const newHistory = prev.history.slice(0, -stepsToUndo);

      // 重建棋盘
      const newBoard = createEmptyBoard();
      let currentPlayer: Player = 'black';
      for (const move of newHistory) {
        newBoard[move.row][move.col] = currentPlayer;
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
      }

      return {
        ...prev,
        board: newBoard,
        currentPlayer,
        winner: null,
        winningLine: null,
        lastMove:
          newHistory.length > 0 ? newHistory[newHistory.length - 1] : null,
        status: newHistory.length > 0 ? 'playing' : 'idle',
        history: newHistory,
      };
    });
  }, []);

  // AI 自动下棋
  useEffect(() => {
    if (
      state.mode === 'pve' &&
      state.status === 'playing' &&
      state.currentPlayer === 'white' &&
      !state.winner
    ) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(state.board, 'white', state.difficulty);
        setState(prev => {
          if (prev.currentPlayer !== 'white' || prev.winner) return prev;

          const newBoard = prev.board.map(r => [...r]);
          newBoard[aiMove.row][aiMove.col] = 'white';

          const winningLine = checkWin(
            newBoard,
            aiMove.row,
            aiMove.col,
            'white'
          );
          const isWin = winningLine !== null;

          return {
            ...prev,
            board: newBoard,
            currentPlayer: isWin ? 'white' : 'black',
            winner: isWin ? 'white' : null,
            winningLine: isWin ? winningLine : null,
            lastMove: aiMove,
            status: isWin ? 'won' : 'playing',
            history: [...prev.history, aiMove],
          };
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [
    state.mode,
    state.status,
    state.currentPlayer,
    state.winner,
    state.board,
    state.difficulty,
  ]);

  return {
    state,
    reset,
    setMode,
    setDifficulty,
    makeMove,
    undo,
    canUndo: state.history.length > 0 && state.status !== 'won',
  };
}
