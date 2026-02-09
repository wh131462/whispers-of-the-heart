/* eslint-disable no-console */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useTrysteroRoom, type ActionSender } from '@whispers/hooks';
import type { BidAction, Card, Player, Role } from '../types';
import type {
  DDZClientMsg,
  DDZHostMsg,
  DDZViewState,
  HostGameState,
  SeatIndex,
  SeatInfo,
} from '../types/online';
import { SELF_PEER_ID } from '../types/online';
import { dealCards, removeCards, sortCards } from '../utils/card';
import { detectCombo, canBeat } from '../utils/combo';
import { aiBid, aiPlay } from '../utils/ai';

// ──── 辅助函数 ────

function buildAIContext(game: HostGameState, playerIdx: number) {
  const players: Player[] = [0, 1, 2].map(i => ({
    id: i,
    name: `P${i}`,
    role:
      game.landlordSeat === i
        ? ('landlord' as Role)
        : game.landlordSeat !== null
          ? ('farmer' as Role)
          : null,
    cards: game.hands[i],
    isAI: true,
  }));
  return {
    myRole: players[playerIdx].role,
    myIndex: playerIdx,
    players,
    lastPlayer: game.lastPlayer,
  };
}

function buildViewForSeat(
  game: HostGameState,
  forSeat: SeatIndex | null,
  seats: (SeatInfo | null)[]
): DDZViewState {
  const isSpectator = forSeat === null;
  let message = '';

  if (game.winner) {
    message = game.winner === 'landlord' ? '地主赢了！' : '农民赢了！';
  } else if (game.phase === 'bidding') {
    message =
      forSeat === game.bidding.currentBidder
        ? '请选择是否叫地主'
        : `${seats[game.bidding.currentBidder]?.name ?? ''}正在思考...`;
  } else if (game.phase === 'playing') {
    if (forSeat === game.currentPlayer) {
      message =
        game.lastCombo === null || game.lastPlayer === forSeat
          ? '轮到你自由出牌'
          : '轮到你出牌';
    } else {
      message = `${seats[game.currentPlayer]?.name ?? ''}正在思考...`;
    }
  }

  return {
    phase: game.phase,
    myCards: isSpectator ? [] : game.hands[forSeat],
    bottomCards: game.landlordSeat !== null ? game.bottomCards : [],
    currentPlayer: game.currentPlayer,
    lastCombo: game.lastCombo,
    lastPlayer: game.lastPlayer,
    lastPlayedCards: game.lastPlayedCards,
    cardCounts: [
      game.hands[0].length,
      game.hands[1].length,
      game.hands[2].length,
    ],
    landlordSeat: game.landlordSeat,
    bidding: game.bidding,
    bombCount: game.bombCount,
    winner: game.winner,
    message,
  };
}

// ──── Hook ────

export function useOnlineDDZ(config: { appId: string; userName: string }) {
  const {
    state: roomState,
    join,
    leave,
    reset: resetRoom,
    createAction,
    getRoom,
  } = useTrysteroRoom({ appId: config.appId, userName: config.userName });

  // ──── UI 状态 ────
  const [isHost, setIsHost] = useState(false);
  const [mySeat, setMySeat] = useState<SeatIndex | null>(null);
  const [seats, setSeats] = useState<(SeatInfo | null)[]>([null, null, null]);
  const [viewState, setViewState] = useState<DDZViewState | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [localMessage, setLocalMessage] = useState('');

  // ──── Refs（避免闭包陈旧 + 解决循环依赖）────
  const isHostRef = useRef(false);
  const mySeatRef = useRef<SeatIndex | null>(null);
  const seatsRef = useRef<(SeatInfo | null)[]>([null, null, null]);
  const hostGameRef = useRef<HostGameState | null>(null);
  const sendToHostRef = useRef<ActionSender<DDZClientMsg> | null>(null);
  const sendToClientsRef = useRef<ActionSender<DDZHostMsg> | null>(null);
  const seatPeerMapRef = useRef<Map<SeatIndex, string>>(new Map());
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peersRef = useRef(roomState.peers);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);
  useEffect(() => {
    mySeatRef.current = mySeat;
  }, [mySeat]);
  useEffect(() => {
    seatsRef.current = seats;
  }, [seats]);
  useEffect(() => {
    peersRef.current = roomState.peers;
  }, [roomState.peers]);

  // ──── 房主: 广播游戏状态给所有远端座位 + 更新本地视角 ────
  const broadcastGameState = useCallback((game: HostGameState) => {
    const send = sendToClientsRef.current;
    const currentSeats = seatsRef.current;

    // 给每个远端座位定向发送
    if (send) {
      seatPeerMapRef.current.forEach((peerId, seat) => {
        if (peerId === SELF_PEER_ID) return;
        send(
          {
            type: 'game_sync',
            view: buildViewForSeat(game, seat, currentSeats),
            mySeat: seat,
          },
          peerId
        );
      });
    }

    // 更新本地（房主）视角
    setViewState(buildViewForSeat(game, mySeatRef.current, currentSeats));
  }, []);

  // ──── 房主: 广播房间状态 ────
  const broadcastRoomUpdate = useCallback(
    (targetPeerId?: string, targetSeat?: SeatIndex | null) => {
      const send = sendToClientsRef.current;
      if (!send) return;

      const msg: DDZHostMsg = {
        type: 'room_update',
        seats: seatsRef.current as (SeatInfo | null)[],
        spectatorCount: 0,
        phase: hostGameRef.current?.phase ?? 'waiting',
      };

      if (targetPeerId) {
        send({ ...msg, mySeat: targetSeat ?? -1 }, targetPeerId);
      } else {
        // 给每个远端座位发（含 mySeat）
        seatPeerMapRef.current.forEach((peerId, seat) => {
          if (peerId === SELF_PEER_ID) return;
          send({ ...msg, mySeat: seat }, peerId);
        });
      }
    },
    []
  );

  // ──── 房主: 查找 peerId 对应的座位 ────
  const findSeatByPeer = useCallback((peerId: string): SeatIndex | null => {
    for (const [seat, pid] of seatPeerMapRef.current.entries()) {
      if (pid === peerId) return seat;
    }
    return null;
  }, []);

  // ──── 房主: 游戏逻辑（使用 ref 读取最新状态，避免循环依赖）────
  // 所有 process 函数通过 actionsRef 互相引用

  const actionsRef = useRef({
    startGame: () => {},
    processBid: (_seat: SeatIndex, _action: BidAction) => {},
    processPlay: (_seat: SeatIndex, _cardIds: string[]) => {},
    processPass: (_seat: SeatIndex) => {},
    checkAITakeover: (_game: HostGameState) => {},
    scheduleAI: (_game: HostGameState, _seat: number) => {},
  });

  // 每次 render 更新 actionsRef 指向最新的闭包
  actionsRef.current.scheduleAI = (_game: HostGameState, seatIdx: number) => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = setTimeout(() => {
      const g = hostGameRef.current;
      if (!g) return;
      if (g.phase === 'bidding' && g.bidding.currentBidder === seatIdx) {
        actionsRef.current.processBid(
          seatIdx as SeatIndex,
          aiBid(g.hands[seatIdx]) ? 'bid' : 'pass'
        );
      } else if (g.phase === 'playing' && g.currentPlayer === seatIdx) {
        const hand = g.hands[seatIdx];
        const mustPlay = g.lastCombo === null || g.lastPlayer === seatIdx;
        const ctx = buildAIContext(g, seatIdx);
        const played = aiPlay(hand, mustPlay ? null : g.lastCombo, ctx);
        if (played) {
          const combo = detectCombo(played);
          if (combo) {
            actionsRef.current.processPlay(
              seatIdx as SeatIndex,
              played.map(c => c.id)
            );
            return;
          }
        }
        actionsRef.current.processPass(seatIdx as SeatIndex);
      }
    }, 1500);
  };

  actionsRef.current.checkAITakeover = (game: HostGameState) => {
    if (game.phase !== 'bidding' && game.phase !== 'playing') return;
    const currentSeat =
      game.phase === 'bidding'
        ? game.bidding.currentBidder
        : game.currentPlayer;
    const seatInfo = seatsRef.current[currentSeat];
    // 断线玩家由 AI 接管
    if (seatInfo && !seatInfo.connected) {
      actionsRef.current.scheduleAI(game, currentSeat);
    }
  };

  actionsRef.current.startGame = () => {
    const [h0, h1, h2, bottom] = dealCards();
    const firstBidder = Math.floor(Math.random() * 3) as SeatIndex;
    const game: HostGameState = {
      phase: 'bidding',
      hands: [h0, h1, h2],
      bottomCards: bottom,
      currentPlayer: firstBidder,
      lastCombo: null,
      lastPlayer: null,
      consecutivePasses: 0,
      lastPlayedCards: [[], [], []],
      landlordSeat: null,
      bidding: { currentBidder: firstBidder, bids: [null, null, null] },
      bombCount: 0,
      winner: null,
    };
    hostGameRef.current = game;
    broadcastGameState(game);
    actionsRef.current.checkAITakeover(game);
  };

  actionsRef.current.processBid = (seat: SeatIndex, action: BidAction) => {
    const game = hostGameRef.current;
    if (
      !game ||
      game.phase !== 'bidding' ||
      game.bidding.currentBidder !== seat
    )
      return;

    const newBids = [...game.bidding.bids] as (BidAction | null)[];
    newBids[seat] = action;

    if (action === 'bid') {
      const landlordHand = sortCards([
        ...game.hands[seat],
        ...game.bottomCards,
      ]);
      const newHands = [...game.hands] as [Card[], Card[], Card[]];
      newHands[seat] = landlordHand;
      const newGame: HostGameState = {
        ...game,
        phase: 'playing',
        hands: newHands,
        currentPlayer: seat,
        landlordSeat: seat,
        bidding: { ...game.bidding, bids: newBids },
      };
      hostGameRef.current = newGame;
      broadcastGameState(newGame);
      actionsRef.current.checkAITakeover(newGame);
      return;
    }

    const passCount = newBids.filter(b => b === 'pass').length;
    if (passCount === 3) {
      actionsRef.current.startGame(); // 没人叫，重新发牌
      return;
    }

    const next = ((seat + 1) % 3) as SeatIndex;
    const newGame: HostGameState = {
      ...game,
      bidding: { ...game.bidding, currentBidder: next, bids: newBids },
    };
    hostGameRef.current = newGame;
    broadcastGameState(newGame);
    actionsRef.current.checkAITakeover(newGame);
  };

  actionsRef.current.processPlay = (seat: SeatIndex, cardIds: string[]) => {
    const game = hostGameRef.current;
    if (!game || game.phase !== 'playing' || game.currentPlayer !== seat)
      return;

    const hand = game.hands[seat];
    const playedCards = cardIds
      .map(id => hand.find(c => c.id === id))
      .filter(Boolean) as Card[];
    if (playedCards.length !== cardIds.length) return;

    const combo = detectCombo(playedCards);
    if (!combo) return;
    if (
      game.lastCombo &&
      game.lastPlayer !== seat &&
      !canBeat(combo, game.lastCombo)
    )
      return;

    const newHands = [...game.hands] as [Card[], Card[], Card[]];
    newHands[seat] = removeCards(hand, playedCards);

    let bombCount = game.bombCount;
    if (combo.type === 'bomb' || combo.type === 'rocket') bombCount++;

    const newLastPlayed = [...game.lastPlayedCards] as [Card[], Card[], Card[]];
    newLastPlayed[seat] = playedCards;

    if (newHands[seat].length === 0) {
      const winnerRole = (
        game.landlordSeat === seat ? 'landlord' : 'farmer'
      ) as Role;
      const endGame: HostGameState = {
        ...game,
        phase: 'finished',
        hands: newHands,
        lastCombo: combo,
        lastPlayer: seat,
        lastPlayedCards: newLastPlayed,
        bombCount,
        winner: winnerRole,
      };
      hostGameRef.current = endGame;
      broadcastGameState(endGame);
      return;
    }

    const next = ((seat + 1) % 3) as SeatIndex;
    const newGame: HostGameState = {
      ...game,
      hands: newHands,
      currentPlayer: next,
      lastCombo: combo,
      lastPlayer: seat,
      consecutivePasses: 0,
      lastPlayedCards: newLastPlayed,
      bombCount,
    };
    hostGameRef.current = newGame;
    broadcastGameState(newGame);
    actionsRef.current.checkAITakeover(newGame);
  };

  actionsRef.current.processPass = (seat: SeatIndex) => {
    const game = hostGameRef.current;
    if (!game || game.phase !== 'playing' || game.currentPlayer !== seat)
      return;
    if (game.lastCombo === null || game.lastPlayer === seat) return;

    const newPasses = game.consecutivePasses + 1;
    const resetCombo = newPasses >= 2;
    const newLastPlayed = [...game.lastPlayedCards] as [Card[], Card[], Card[]];
    newLastPlayed[seat] = [];

    const next = ((seat + 1) % 3) as SeatIndex;
    const newGame: HostGameState = {
      ...game,
      currentPlayer: next,
      consecutivePasses: resetCombo ? 0 : newPasses,
      lastCombo: resetCombo ? null : game.lastCombo,
      lastPlayer: resetCombo ? null : game.lastPlayer,
      lastPlayedCards: newLastPlayed,
    };
    hostGameRef.current = newGame;
    broadcastGameState(newGame);
    actionsRef.current.checkAITakeover(newGame);
  };

  // ──── 房主: 检查是否全部准备 ────
  const checkAllReady = useCallback((currentSeats: (SeatInfo | null)[]) => {
    if (!isHostRef.current) return;
    const game = hostGameRef.current;
    if (game && game.phase !== 'waiting' && game.phase !== 'finished') return;

    const allSeated = currentSeats.every(s => s !== null);
    const allReady = currentSeats.every(s => s?.ready);
    if (allSeated && allReady) {
      actionsRef.current.startGame();
    }
  }, []);

  // ──── 房主: 处理客户端消息 ────
  const handleClientMsg = useCallback(
    (data: DDZClientMsg, peerId: string) => {
      if (!isHostRef.current) return;

      switch (data.type) {
        case 'seat_request': {
          const currentSeats = seatsRef.current;
          const peerName =
            (data.name as string) ||
            peersRef.current.get(peerId)?.name ||
            '玩家';
          const emptySeat = currentSeats.findIndex(s => s === null);
          if (emptySeat === -1) {
            // 满座，观战
            broadcastRoomUpdate(peerId, null);
            return;
          }
          const newSeats = [...currentSeats];
          newSeats[emptySeat] = {
            peerId,
            name: peerName,
            ready: false,
            connected: true,
          };
          seatsRef.current = newSeats;
          setSeats([...newSeats]);
          seatPeerMapRef.current.set(emptySeat as SeatIndex, peerId);
          // 定向通知该玩家座位
          broadcastRoomUpdate(peerId, emptySeat as SeatIndex);
          // 广播给其他人
          broadcastRoomUpdate();
          break;
        }
        case 'leave_seat': {
          const leaveSeat = findSeatByPeer(peerId);
          if (leaveSeat !== null) {
            const newSeats = [...seatsRef.current];
            newSeats[leaveSeat] = null;
            seatsRef.current = newSeats;
            setSeats([...newSeats]);
            seatPeerMapRef.current.delete(leaveSeat);
            broadcastRoomUpdate();
          }
          break;
        }
        case 'ready_toggle': {
          const toggleSeat = findSeatByPeer(peerId);
          if (toggleSeat !== null && seatsRef.current[toggleSeat]) {
            const newSeats = [...seatsRef.current];
            const info = newSeats[toggleSeat]!;
            newSeats[toggleSeat] = { ...info, ready: !info.ready };
            seatsRef.current = newSeats;
            setSeats([...newSeats]);
            broadcastRoomUpdate();
            checkAllReady(newSeats);
          }
          break;
        }
        case 'bid': {
          const bidSeat = findSeatByPeer(peerId);
          if (bidSeat !== null)
            actionsRef.current.processBid(bidSeat, data.action as BidAction);
          break;
        }
        case 'play': {
          const playSeat = findSeatByPeer(peerId);
          if (playSeat !== null && data.cardIds)
            actionsRef.current.processPlay(playSeat, data.cardIds as string[]);
          break;
        }
        case 'pass': {
          const passSeat = findSeatByPeer(peerId);
          if (passSeat !== null) actionsRef.current.processPass(passSeat);
          break;
        }
        case 'sync_request': {
          const syncSeat = findSeatByPeer(peerId);
          const game = hostGameRef.current;
          if (game && syncSeat !== null) {
            sendToClientsRef.current?.(
              {
                type: 'game_sync',
                view: buildViewForSeat(game, syncSeat, seatsRef.current),
                mySeat: syncSeat,
              },
              peerId
            );
          } else {
            broadcastRoomUpdate(peerId, syncSeat);
          }
          break;
        }
      }
    },
    [broadcastRoomUpdate, findSeatByPeer, checkAllReady]
  );

  // ──── 客户端: 处理房主消息 ────
  const handleHostMsg = useCallback((data: DDZHostMsg, _peerId?: string) => {
    if (isHostRef.current) return;

    switch (data.type) {
      case 'room_update': {
        const roomSeats = data.seats as (SeatInfo | null)[] | undefined;
        if (roomSeats) setSeats([...roomSeats]);
        if (typeof data.mySeat === 'number' && data.mySeat >= 0) {
          setMySeat(data.mySeat as SeatIndex);
        }
        break;
      }
      case 'game_sync': {
        const view = data.view as DDZViewState | undefined;
        if (view) {
          setViewState(view);
        }
        if (typeof data.mySeat === 'number') {
          setMySeat(data.mySeat as SeatIndex);
        }
        setSelectedCards([]);
        break;
      }
      case 'error': {
        setLocalMessage(data.message as string);
        break;
      }
    }
  }, []);

  // ──── 建立消息通道 ────
  useEffect(() => {
    if (roomState.status !== 'connected') return;

    sendToHostRef.current = createAction<DDZClientMsg>(
      'ddz:client',
      (data: DDZClientMsg, peerId: string) => {
        if (isHostRef.current) handleClientMsg(data, peerId);
      }
    );

    sendToClientsRef.current = createAction<DDZHostMsg>(
      'ddz:host',
      (data: DDZHostMsg, peerId: string) => {
        if (!isHostRef.current) handleHostMsg(data, peerId);
      }
    );
  }, [roomState.status, createAction, handleClientMsg, handleHostMsg]);

  // ──── 房主初始化 ────
  useEffect(() => {
    if (roomState.status !== 'connected') return;
    if (isHostRef.current) return; // 已经是房主

    // 延迟检查，等待 peers 列表稳定
    const timer = setTimeout(() => {
      if (roomState.peers.size === 0 && !isHostRef.current) {
        console.log('[DDZ] I am the host');
        setIsHost(true);
        isHostRef.current = true;
        const seat0: SeatInfo = {
          peerId: SELF_PEER_ID,
          name: config.userName,
          ready: false,
          connected: true,
        };
        const newSeats: (SeatInfo | null)[] = [seat0, null, null];
        setSeats(newSeats);
        seatsRef.current = newSeats;
        setMySeat(0);
        mySeatRef.current = 0;
        seatPeerMapRef.current.set(0, SELF_PEER_ID);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [roomState.status]);

  // 客户端入座由 DDZLobby UI 手动触发（requestSeat），不再自动入座

  // ──── 房主: 监听 peer 加入/离开 ────
  useEffect(() => {
    if (!isHost) return;
    const room = getRoom();
    if (!room) return;

    room.onPeerJoin((peerId: string) => {
      console.log(`[DDZ] Peer joined: ${peerId}`);
      // 发送当前房间状态给新加入的 peer（未入座，mySeat=-1）
      broadcastRoomUpdate(peerId, null);
    });

    room.onPeerLeave((peerId: string) => {
      console.log(`[DDZ] Peer left: ${peerId}`);
      const leftSeat = findSeatByPeer(peerId);
      if (leftSeat === null) return;

      const game = hostGameRef.current;
      const newSeats = [...seatsRef.current];

      if (!game || game.phase === 'waiting' || game.phase === 'finished') {
        // 未游戏中，直接移除
        newSeats[leftSeat] = null;
        seatPeerMapRef.current.delete(leftSeat);
      } else {
        // 游戏中，标记断线（AI 接管）
        const info = newSeats[leftSeat];
        if (info) newSeats[leftSeat] = { ...info, connected: false };
      }

      seatsRef.current = newSeats;
      setSeats([...newSeats]);
      broadcastRoomUpdate();

      // 检查 AI 接管
      if (game && game.phase !== 'waiting' && game.phase !== 'finished') {
        actionsRef.current.checkAITakeover(game);
      }
    });
  }, [isHost, getRoom, findSeatByPeer, broadcastRoomUpdate]);

  // ──── 玩家操作 ────

  const joinRoom = useCallback(
    (code: string) => {
      join(code);
    },
    [join]
  );

  const leaveRoom = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    leave();
    resetRoom();
    setIsHost(false);
    isHostRef.current = false;
    setMySeat(null);
    mySeatRef.current = null;
    setSeats([null, null, null]);
    seatsRef.current = [null, null, null];
    setViewState(null);
    setSelectedCards([]);
    setLocalMessage('');
    hostGameRef.current = null;
    seatPeerMapRef.current.clear();
    sendToHostRef.current = null;
    sendToClientsRef.current = null;
  }, [leave, resetRoom]);

  const requestSeat = useCallback(
    (name?: string) => {
      if (isHostRef.current) return;
      sendToHostRef.current?.({
        type: 'seat_request',
        name: name ?? config.userName,
      });
    },
    [config.userName]
  );

  const leaveSeat = useCallback(() => {
    if (isHostRef.current) return;
    sendToHostRef.current?.({ type: 'leave_seat' });
    setMySeat(null);
    mySeatRef.current = null;
  }, []);

  const toggleReady = useCallback(() => {
    if (isHostRef.current) {
      const newSeats = [...seatsRef.current];
      const info = newSeats[0];
      if (info) {
        newSeats[0] = { ...info, ready: !info.ready };
        seatsRef.current = newSeats;
        setSeats([...newSeats]);
        broadcastRoomUpdate();
        checkAllReady(newSeats);
      }
    } else {
      sendToHostRef.current?.({ type: 'ready_toggle' });
    }
  }, [broadcastRoomUpdate, checkAllReady]);

  const bid = useCallback((action: BidAction) => {
    if (isHostRef.current) {
      actionsRef.current.processBid(mySeatRef.current!, action);
    } else {
      sendToHostRef.current?.({ type: 'bid', action });
    }
  }, []);

  const playCards = useCallback(() => {
    const cards = selectedCards;
    if (cards.length === 0) {
      setLocalMessage('请先选牌');
      return;
    }

    if (isHostRef.current) {
      const game = hostGameRef.current;
      if (!game || game.currentPlayer !== mySeatRef.current) return;
      const combo = detectCombo(cards);
      if (!combo) {
        setLocalMessage('无效的牌型');
        return;
      }
      if (
        game.lastCombo &&
        game.lastPlayer !== mySeatRef.current &&
        !canBeat(combo, game.lastCombo)
      ) {
        setLocalMessage('打不过上家的牌');
        return;
      }
      actionsRef.current.processPlay(
        mySeatRef.current!,
        cards.map(c => c.id)
      );
    } else {
      sendToHostRef.current?.({ type: 'play', cardIds: cards.map(c => c.id) });
    }
    setSelectedCards([]);
  }, [selectedCards]);

  const passAction = useCallback(() => {
    if (isHostRef.current) {
      const game = hostGameRef.current;
      if (!game || game.currentPlayer !== mySeatRef.current) return;
      if (game.lastCombo === null || game.lastPlayer === mySeatRef.current) {
        setLocalMessage('你必须出牌');
        return;
      }
      actionsRef.current.processPass(mySeatRef.current!);
    } else {
      sendToHostRef.current?.({ type: 'pass' });
    }
    setSelectedCards([]);
  }, []);

  const toggleCard = useCallback((card: Card) => {
    setSelectedCards(prev =>
      prev.some(c => c.id === card.id)
        ? prev.filter(c => c.id !== card.id)
        : [...prev, card]
    );
  }, []);

  const hint = useCallback(() => {
    const view = viewState;
    if (!view || view.currentPlayer !== mySeatRef.current) return;
    const hand = view.myCards;
    const mustPlay =
      view.lastCombo === null || view.lastPlayer === mySeatRef.current;
    const role = (
      view.landlordSeat === mySeatRef.current ? 'landlord' : 'farmer'
    ) as Role;
    const players: Player[] = [0, 1, 2].map(i => ({
      id: i,
      name: seatsRef.current[i]?.name ?? '',
      role: view.landlordSeat === i ? ('landlord' as Role) : ('farmer' as Role),
      cards:
        i === mySeatRef.current
          ? hand
          : Array.from(
              { length: view.cardCounts[i] },
              (_, j) =>
                ({
                  id: `ph-${i}-${j}`,
                  suit: null,
                  rank: '3' as const,
                  value: 0,
                }) as Card
            ),
      isAI: i !== mySeatRef.current,
    }));
    const ctx = {
      myRole: role,
      myIndex: mySeatRef.current!,
      players,
      lastPlayer: view.lastPlayer,
    };
    const played = aiPlay(hand, mustPlay ? null : view.lastCombo, ctx);
    if (!played) {
      setLocalMessage('没有能出的牌，请选择不出');
      setSelectedCards([]);
    } else {
      setSelectedCards(played);
    }
  }, [viewState]);

  const startNewRound = useCallback(() => {
    if (!isHostRef.current) return;
    // 重置准备状态
    const newSeats = seatsRef.current.map(s =>
      s ? { ...s, ready: false } : null
    );
    seatsRef.current = newSeats;
    setSeats([...newSeats]);
    hostGameRef.current = null;
    setViewState(null);
    broadcastRoomUpdate();
  }, [broadcastRoomUpdate]);

  // ──── 清理 ────
  useEffect(
    () => () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    },
    []
  );

  // ──── viewState 变化时清除临时消息 ────
  useEffect(() => {
    setLocalMessage('');
  }, [viewState]);

  // ──── 导出 ────

  // 合并消息：localMessage（操作反馈）优先，viewState.message（游戏状态）次之
  const displayMessage = localMessage || viewState?.message || '';

  return {
    roomState,
    isHost,
    mySeat,
    seats,
    phase: viewState?.phase ?? 'waiting',
    message: displayMessage,
    viewState,
    selectedCards,

    joinRoom,
    leaveRoom,
    requestSeat,
    leaveSeat,
    toggleReady,
    bid,
    playCards,
    pass: passAction,
    hint,
    toggleCard,
    startNewRound,
  };
}
