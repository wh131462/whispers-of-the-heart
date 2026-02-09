import { useCallback, useRef, useState } from 'react';
import type { BidAction, Card, Combo, GameState, Role } from '../types';
import { dealCards, removeCards, sortCards } from '../utils/card';
import { canBeat, detectCombo } from '../utils/combo';
import { aiBid, aiPlay } from '../utils/ai';

const INITIAL_STATE: GameState = {
  phase: 'idle',
  players: [
    { id: 0, name: '你', role: null, cards: [], isAI: false },
    { id: 1, name: '电脑左', role: null, cards: [], isAI: true },
    { id: 2, name: '电脑右', role: null, cards: [], isAI: true },
  ],
  bottomCards: [],
  currentPlayer: 0,
  lastCombo: null,
  lastPlayer: null,
  consecutivePasses: 0,
  winner: null,
  bidding: { currentBidder: 0, bids: [null, null, null], landlordIndex: null },
  bombCount: 0,
  selectedCards: [],
  lastPlayedCards: [[], [], []],
  message: '点击"开始游戏"开始',
};

// 构建AI上下文
function buildAIContext(state: GameState, playerIdx: number) {
  return {
    myRole: state.players[playerIdx].role,
    myIndex: playerIdx,
    players: state.players,
    lastPlayer: state.lastPlayer,
  };
}

export function useGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 开始游戏
  const startGame = useCallback(() => {
    clearTimer();
    const [p0, p1, p2, bottom] = dealCards();
    const firstBidder = Math.floor(Math.random() * 3);

    setState({
      ...INITIAL_STATE,
      phase: 'bidding',
      players: [
        { id: 0, name: '你', role: null, cards: p0, isAI: false },
        { id: 1, name: '电脑左', role: null, cards: p1, isAI: true },
        { id: 2, name: '电脑右', role: null, cards: p2, isAI: true },
      ],
      bottomCards: bottom,
      bidding: {
        currentBidder: firstBidder,
        bids: [null, null, null],
        landlordIndex: null,
      },
      message:
        firstBidder === 0
          ? '请选择是否叫地主'
          : `${INITIAL_STATE.players[firstBidder].name}正在思考...`,
      lastPlayedCards: [[], [], []],
    });

    if (firstBidder !== 0) {
      setTimeout(() => handleAIBid(firstBidder), 1000);
    }
  }, [clearTimer]);

  // 处理AI叫地主
  const handleAIBid = useCallback((bidderIndex: number) => {
    setState(prev => {
      if (prev.phase !== 'bidding') return prev;
      const player = prev.players[bidderIndex];
      const shouldBid = aiBid(player.cards);
      return processBid(prev, bidderIndex, shouldBid ? 'bid' : 'pass');
    });
  }, []);

  // 玩家叫地主
  const playerBid = useCallback((action: BidAction) => {
    setState(prev => {
      if (prev.phase !== 'bidding' || prev.bidding.currentBidder !== 0)
        return prev;
      return processBid(prev, 0, action);
    });
  }, []);

  // 处理叫地主逻辑
  const processBid = (
    state: GameState,
    bidder: number,
    action: BidAction
  ): GameState => {
    const newBids = [...state.bidding.bids] as (BidAction | null)[];
    newBids[bidder] = action;

    if (action === 'bid') {
      return assignLandlord(
        { ...state, bidding: { ...state.bidding, bids: newBids } },
        bidder
      );
    }

    const passCount = newBids.filter(b => b === 'pass').length;
    if (passCount === 3) {
      return { ...state, phase: 'idle', message: '没人叫地主，请重新开始' };
    }

    const next = (bidder + 1) % 3;
    const newState: GameState = {
      ...state,
      bidding: { ...state.bidding, currentBidder: next, bids: newBids },
      message:
        next === 0
          ? '请选择是否叫地主'
          : `${state.players[next].name}正在思考...`,
    };

    if (next !== 0) {
      setTimeout(() => handleAIBid(next), 1000);
    }

    return newState;
  };

  // 确定地主
  const assignLandlord = (
    state: GameState,
    landlordIndex: number
  ): GameState => {
    const players = state.players.map((p, i) => ({
      ...p,
      role: (i === landlordIndex ? 'landlord' : 'farmer') as Role,
      cards:
        i === landlordIndex
          ? sortCards([...p.cards, ...state.bottomCards])
          : p.cards,
    })) as [
      (typeof state.players)[0],
      (typeof state.players)[1],
      (typeof state.players)[2],
    ];

    const newState: GameState = {
      ...state,
      phase: 'playing',
      players,
      currentPlayer: landlordIndex,
      bidding: { ...state.bidding, landlordIndex },
      message:
        landlordIndex === 0
          ? '你是地主，请出牌'
          : `${players[landlordIndex].name}是地主，正在出牌...`,
    };

    if (landlordIndex !== 0) {
      setTimeout(() => handleAITurn(landlordIndex), 1200);
    }

    return newState;
  };

  // 选择/取消选择手牌
  const toggleCard = useCallback((card: Card) => {
    setState(prev => {
      if (prev.phase !== 'playing' || prev.currentPlayer !== 0) return prev;
      const isSelected = prev.selectedCards.some(c => c.id === card.id);
      return {
        ...prev,
        selectedCards: isSelected
          ? prev.selectedCards.filter(c => c.id !== card.id)
          : [...prev.selectedCards, card],
      };
    });
  }, []);

  // 玩家出牌
  const playCards = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing' || prev.currentPlayer !== 0) return prev;
      if (prev.selectedCards.length === 0)
        return { ...prev, message: '请先选牌' };

      const combo = detectCombo(prev.selectedCards);
      if (!combo) return { ...prev, message: '无效的牌型' };

      if (prev.lastCombo && prev.lastPlayer !== 0) {
        if (!canBeat(combo, prev.lastCombo)) {
          return { ...prev, message: '打不过上家的牌' };
        }
      }

      return executePlay(prev, 0, prev.selectedCards, combo);
    });
  }, []);

  // 玩家 pass
  const pass = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing' || prev.currentPlayer !== 0) return prev;
      if (prev.lastCombo === null || prev.lastPlayer === 0) {
        return { ...prev, message: '你必须出牌' };
      }
      return executePass(prev, 0);
    });
  }, []);

  // 执行出牌
  const executePlay = (
    state: GameState,
    playerIdx: number,
    cards: Card[],
    combo: Combo
  ): GameState => {
    const newPlayers = state.players.map((p, i) =>
      i === playerIdx ? { ...p, cards: removeCards(p.cards, cards) } : p
    ) as GameState['players'];

    let bombCount = state.bombCount;
    if (combo.type === 'bomb' || combo.type === 'rocket') bombCount++;

    const newLastPlayed = [
      ...state.lastPlayedCards,
    ] as GameState['lastPlayedCards'];
    newLastPlayed[playerIdx] = cards;

    if (newPlayers[playerIdx].cards.length === 0) {
      clearTimer();
      const winnerRole = newPlayers[playerIdx].role!;
      return {
        ...state,
        phase: 'finished',
        players: newPlayers,
        winner: winnerRole,
        lastCombo: combo,
        lastPlayer: playerIdx,
        bombCount,
        selectedCards: [],
        lastPlayedCards: newLastPlayed,
        message: winnerRole === 'landlord' ? '地主赢了！' : '农民赢了！',
      };
    }

    const next = (playerIdx + 1) % 3;
    const newState: GameState = {
      ...state,
      players: newPlayers,
      currentPlayer: next,
      lastCombo: combo,
      lastPlayer: playerIdx,
      consecutivePasses: 0,
      bombCount,
      selectedCards: [],
      lastPlayedCards: newLastPlayed,
      message:
        next === 0 ? '轮到你出牌' : `${newPlayers[next].name}正在思考...`,
    };

    if (next !== 0) {
      timerRef.current = setTimeout(() => handleAITurn(next), 1000);
    }

    return newState;
  };

  // 执行 pass
  const executePass = (state: GameState, playerIdx: number): GameState => {
    const newPasses = state.consecutivePasses + 1;
    const newLastPlayed = [
      ...state.lastPlayedCards,
    ] as GameState['lastPlayedCards'];
    newLastPlayed[playerIdx] = [];

    const next = (playerIdx + 1) % 3;
    const resetCombo = newPasses >= 2;
    const newState: GameState = {
      ...state,
      currentPlayer: next,
      consecutivePasses: resetCombo ? 0 : newPasses,
      lastCombo: resetCombo ? null : state.lastCombo,
      lastPlayer: resetCombo ? null : state.lastPlayer,
      selectedCards: [],
      lastPlayedCards: newLastPlayed,
      message:
        next === 0
          ? resetCombo
            ? '轮到你自由出牌'
            : '轮到你出牌'
          : `${state.players[next].name}正在思考...`,
    };

    if (next !== 0) {
      timerRef.current = setTimeout(() => handleAITurn(next), 1000);
    }

    return newState;
  };

  // AI 回合（带上下文）
  const handleAITurn = useCallback(
    (playerIdx: number) => {
      setState(prev => {
        if (prev.phase !== 'playing' || prev.currentPlayer !== playerIdx)
          return prev;

        const hand = prev.players[playerIdx].cards;
        const mustPlay =
          prev.lastCombo === null || prev.lastPlayer === playerIdx;
        const context = buildAIContext(prev, playerIdx);
        const played = aiPlay(hand, mustPlay ? null : prev.lastCombo, context);

        if (!played) {
          return executePass(prev, playerIdx);
        }

        const combo = detectCombo(played);
        if (!combo) {
          return executePass(prev, playerIdx);
        }

        return executePlay(prev, playerIdx, played, combo);
      });
    },
    [clearTimer]
  );

  // 提示功能
  const hint = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing' || prev.currentPlayer !== 0) return prev;
      const hand = prev.players[0].cards;
      const mustPlay = prev.lastCombo === null || prev.lastPlayer === 0;
      const context = buildAIContext(prev, 0);
      const played = aiPlay(hand, mustPlay ? null : prev.lastCombo, context);

      if (!played) {
        return {
          ...prev,
          message: '没有能出的牌，请选择不出',
          selectedCards: [],
        };
      }

      return { ...prev, selectedCards: played };
    });
  }, []);

  return {
    state,
    startGame,
    playerBid,
    toggleCard,
    playCards,
    pass,
    hint,
  };
}
