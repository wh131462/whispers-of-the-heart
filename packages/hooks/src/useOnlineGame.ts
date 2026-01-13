import { useState, useCallback, useEffect, useRef } from 'react';
import {
  useTrysteroRoom,
  type ActionSender,
  type TrysteroRoomState,
} from './useTrysteroRoom';

// 玩家角色
export type PlayerRole = 'player1' | 'player2' | 'spectator';

// 玩家信息
export interface OnlinePlayer {
  peerId: string;
  name: string;
  role: PlayerRole;
  joinedAt: number;
}

// 房间信息同步消息
interface RoomInfoPayload {
  type: 'room_info';
  players: Array<{ peerId: string; name: string; role: PlayerRole }>;
  [key: string]: string | number | boolean | null | Array<unknown>;
}

// 角色请求消息
interface RoleRequestPayload {
  type: 'role_request';
  role: PlayerRole;
  peerId: string;
  name: string;
  [key: string]: string | number | boolean | null;
}

// 角色响应消息
interface RoleResponsePayload {
  type: 'role_response';
  approved: boolean;
  role: PlayerRole;
  peerId: string;
  [key: string]: string | number | boolean | null;
}

// 游戏动作消息（泛型）
interface GameActionPayload {
  type: 'game_action';
  action: string;
  data: Record<string, string | number | boolean | null>;
  [key: string]: string | number | boolean | null | Record<string, unknown>;
}

// 系统消息
interface SystemPayload {
  type: 'system';
  event: 'player_left' | 'game_reset' | 'role_changed';
  data: Record<string, string | number | boolean | null>;
  [key: string]: string | number | boolean | null | Record<string, unknown>;
}

// 交换位置请求
interface SwapRequestPayload {
  type: 'swap_request';
  fromPeerId: string;
  fromRole: PlayerRole;
  toRole: PlayerRole;
  fromName: string;
  [key: string]: string | number | boolean | null;
}

// 交换位置响应
interface SwapResponsePayload {
  type: 'swap_response';
  approved: boolean;
  fromPeerId: string;
  fromRole: PlayerRole;
  toRole: PlayerRole;
  [key: string]: string | number | boolean | null;
}

// 待处理的交换请求
export interface PendingSwapRequest {
  fromPeerId: string;
  fromRole: PlayerRole;
  toRole: PlayerRole;
  fromName: string;
}

type MessagePayload =
  | RoomInfoPayload
  | RoleRequestPayload
  | RoleResponsePayload
  | GameActionPayload
  | SystemPayload
  | SwapRequestPayload
  | SwapResponsePayload;

// 在线游戏状态
export interface OnlineGameState {
  roomStatus: TrysteroRoomState['status'];
  roomCode: string | null;
  myRole: PlayerRole;
  players: Map<string, OnlinePlayer>;
  spectators: OnlinePlayer[];
  isMyTurn: boolean;
  gameReady: boolean; // 两个玩家都就位
  pendingSwapRequest: PendingSwapRequest | null; // 待处理的交换请求
  error: string | null;
}

export interface UseOnlineGameOptions {
  appId: string;
  userName: string;
  // 当前应该行动的角色（由游戏逻辑决定）
  currentTurnRole?: PlayerRole | null;
  // 游戏动作回调
  onGameAction?: (action: string, data: Record<string, unknown>) => void;
  // 玩家变化回调
  onPlayersChange?: (players: Map<string, OnlinePlayer>) => void;
}

const SELF_PEER_ID = '__self__';

export function useOnlineGame(options: UseOnlineGameOptions) {
  const { appId, userName, currentTurnRole, onGameAction, onPlayersChange } =
    options;

  const {
    state: roomState,
    join,
    reset: resetRoom,
    createAction,
    getRoom,
  } = useTrysteroRoom({ appId, userName });

  const [myRole, setMyRole] = useState<PlayerRole>('spectator');
  const [players, setPlayers] = useState<Map<string, OnlinePlayer>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [pendingSwapRequest, setPendingSwapRequest] =
    useState<PendingSwapRequest | null>(null);

  const sendMessageRef = useRef<ActionSender<MessagePayload> | null>(null);
  const userNameRef = useRef(userName);
  const myRoleRef = useRef(myRole);
  const playersRef = useRef(players);

  // 保持 refs 最新
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  useEffect(() => {
    myRoleRef.current = myRole;
  }, [myRole]);

  useEffect(() => {
    playersRef.current = players;
    onPlayersChange?.(players);
  }, [players, onPlayersChange]);

  // 获取可用角色
  const getAvailableRole = useCallback((): PlayerRole => {
    const currentPlayers = playersRef.current;
    const hasPlayer1 = Array.from(currentPlayers.values()).some(
      p => p.role === 'player1'
    );
    const hasPlayer2 = Array.from(currentPlayers.values()).some(
      p => p.role === 'player2'
    );

    if (!hasPlayer1) return 'player1';
    if (!hasPlayer2) return 'player2';
    return 'spectator';
  }, []);

  // 处理收到的消息
  const handleMessage = useCallback(
    (payload: MessagePayload, peerId: string) => {
      switch (payload.type) {
        case 'room_info': {
          // 收到房间信息，更新玩家列表
          const newPlayers = new Map<string, OnlinePlayer>();
          for (const p of payload.players) {
            // 将发送方的 SELF_PEER_ID 替换为实际的 peerId
            const actualPeerId = p.peerId === SELF_PEER_ID ? peerId : p.peerId;
            newPlayers.set(actualPeerId, {
              peerId: actualPeerId,
              name: p.name,
              role: p.role,
              joinedAt: Date.now(),
            });
          }

          // 确定自己的角色
          const availableRole = (() => {
            const hasP1 = payload.players.some(p => p.role === 'player1');
            const hasP2 = payload.players.some(p => p.role === 'player2');
            if (!hasP1) return 'player1';
            if (!hasP2) return 'player2';
            return 'spectator';
          })();

          setMyRole(availableRole);

          // 把自己添加到玩家列表
          newPlayers.set(SELF_PEER_ID, {
            peerId: SELF_PEER_ID,
            name: userNameRef.current,
            role: availableRole,
            joinedAt: Date.now(),
          });
          setPlayers(new Map(newPlayers));

          // 告诉对方我的角色
          sendMessageRef.current?.(
            {
              type: 'role_request',
              role: availableRole,
              peerId: SELF_PEER_ID,
              name: userNameRef.current,
            },
            peerId
          );
          break;
        }

        case 'role_request': {
          // 有人请求角色
          const currentPlayers = playersRef.current;
          const requestedRole = payload.role;

          // 检查角色是否可用
          const isRoleAvailable = !Array.from(currentPlayers.values()).some(
            p => p.role === requestedRole && p.peerId !== peerId
          );

          const approved = isRoleAvailable || requestedRole === 'spectator';
          const finalRole = approved ? requestedRole : 'spectator';

          // 添加到玩家列表
          setPlayers(prev => {
            const newPlayers = new Map(prev);
            newPlayers.set(peerId, {
              peerId,
              name: payload.name,
              role: finalRole,
              joinedAt: Date.now(),
            });
            return newPlayers;
          });

          // 发送响应
          sendMessageRef.current?.(
            {
              type: 'role_response',
              approved,
              role: finalRole,
              peerId,
            },
            peerId
          );
          break;
        }

        case 'role_response': {
          // 收到角色分配响应
          if (payload.approved) {
            setMyRole(payload.role);
          } else {
            setMyRole('spectator');
          }
          break;
        }

        case 'game_action': {
          // 游戏动作
          onGameAction?.(payload.action, payload.data);
          break;
        }

        case 'system': {
          if (payload.event === 'player_left') {
            // 玩家离开，如果是对战玩家，观战者可以接替
            const leftRole = payload.data.role as PlayerRole;
            if (leftRole !== 'spectator' && myRoleRef.current === 'spectator') {
              // 观战者自动请求接替
              setMyRole(leftRole);
              // 广播自己的新角色
              sendMessageRef.current?.({
                type: 'role_request',
                role: leftRole,
                peerId: SELF_PEER_ID,
                name: userNameRef.current,
              });
            }
          } else if (payload.event === 'game_reset') {
            onGameAction?.('reset', {});
          }
          break;
        }

        case 'swap_request': {
          // 收到交换位置请求
          // 检查是否是发给我的（目标角色是我的角色）
          if (payload.toRole === myRoleRef.current) {
            setPendingSwapRequest({
              fromPeerId: peerId,
              fromRole: payload.fromRole,
              toRole: payload.toRole,
              fromName: payload.fromName,
            });
          }
          break;
        }

        case 'swap_response': {
          // 收到交换位置响应
          if (payload.approved) {
            // 对方同意，执行交换
            // payload.fromRole = 响应方原来的角色（即发起方想要的角色）
            // payload.toRole = 响应方变成的角色（即发起方原来的角色）
            const newRole = payload.fromRole;
            setMyRole(newRole);

            // 更新自己在玩家列表中的角色
            setPlayers(prev => {
              const newPlayers = new Map(prev);
              const selfPlayer = newPlayers.get(SELF_PEER_ID);
              if (selfPlayer) {
                newPlayers.set(SELF_PEER_ID, { ...selfPlayer, role: newRole });
              }
              // 更新对方的角色（变成发起方原来的角色）
              const otherPlayer = newPlayers.get(peerId);
              if (otherPlayer) {
                newPlayers.set(peerId, {
                  ...otherPlayer,
                  role: payload.toRole,
                });
              }
              return newPlayers;
            });
          }
          // 清除等待状态
          setPendingSwapRequest(null);
          break;
        }
      }
    },
    [onGameAction]
  );

  // 连接成功后初始化消息通道
  useEffect(() => {
    if (roomState.status === 'connected' && !sendMessageRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const send = createAction<any>(
        'game',
        (payload: MessagePayload, peerId: string) => {
          handleMessage(payload, peerId);
        }
      );
      sendMessageRef.current = send as ActionSender<MessagePayload> | null;

      // 如果是第一个加入的，自动成为 player1
      if (roomState.peerCount === 0) {
        setMyRole('player1');
        setPlayers(
          new Map([
            [
              SELF_PEER_ID,
              {
                peerId: SELF_PEER_ID,
                name: userNameRef.current,
                role: 'player1',
                joinedAt: Date.now(),
              },
            ],
          ])
        );
      }
    }
  }, [roomState.status, roomState.peerCount, createAction, handleMessage]);

  // 监听 peer 加入，发送房间信息
  useEffect(() => {
    const room = getRoom();
    if (!room) return;

    const handlePeerJoin = (peerId: string) => {
      // 发送当前房间信息给新加入的 peer
      const currentPlayers = playersRef.current;

      // 收集其他玩家（排除自己）
      const playersArray = Array.from(currentPlayers.values())
        .filter(p => p.peerId !== SELF_PEER_ID)
        .map(p => ({
          peerId: p.peerId,
          name: p.name,
          role: p.role,
        }));

      // 添加自己（使用最新的角色信息）
      playersArray.push({
        peerId: SELF_PEER_ID,
        name: userNameRef.current,
        role: myRoleRef.current,
      });

      setTimeout(() => {
        sendMessageRef.current?.(
          {
            type: 'room_info',
            players: playersArray,
          },
          peerId
        );
      }, 100);
    };

    room.onPeerJoin(handlePeerJoin);
  }, [getRoom]);

  // 监听 peer 离开
  useEffect(() => {
    const room = getRoom();
    if (!room) return;

    const handlePeerLeave = (peerId: string) => {
      setPlayers(prev => {
        const player = prev.get(peerId);
        const newPlayers = new Map(prev);
        newPlayers.delete(peerId);

        // 广播玩家离开
        if (player && player.role !== 'spectator') {
          sendMessageRef.current?.({
            type: 'system',
            event: 'player_left',
            data: { role: player.role, name: player.name },
          });
        }

        return newPlayers;
      });
    };

    room.onPeerLeave(handlePeerLeave);
  }, [getRoom]);

  // 发送游戏动作
  const sendGameAction = useCallback(
    (
      action: string,
      data: Record<string, string | number | boolean | null>
    ) => {
      sendMessageRef.current?.({
        type: 'game_action',
        action,
        data,
      });
    },
    []
  );

  // 请求成为玩家（从观战者升级）
  const requestPlayerRole = useCallback(() => {
    const availableRole = getAvailableRole();
    if (availableRole === 'spectator') {
      setError('当前没有空位');
      return false;
    }

    setMyRole(availableRole);
    sendMessageRef.current?.({
      type: 'role_request',
      role: availableRole,
      peerId: SELF_PEER_ID,
      name: userNameRef.current,
    });
    return true;
  }, [getAvailableRole]);

  // 重置游戏
  const resetGame = useCallback(() => {
    sendMessageRef.current?.({
      type: 'system',
      event: 'game_reset',
      data: {},
    });
    onGameAction?.('reset', {});
  }, [onGameAction]);

  // 请求交换位置
  const requestSwap = useCallback((targetRole: PlayerRole) => {
    const currentRole = myRoleRef.current;
    if (currentRole === targetRole) {
      setError('不能和自己交换');
      return false;
    }

    // 找到目标角色的玩家
    const targetPlayer = Array.from(playersRef.current.values()).find(
      p => p.role === targetRole && p.peerId !== SELF_PEER_ID
    );

    if (!targetPlayer) {
      setError('找不到目标玩家');
      return false;
    }

    // 发送交换请求
    sendMessageRef.current?.(
      {
        type: 'swap_request',
        fromPeerId: SELF_PEER_ID,
        fromRole: currentRole,
        toRole: targetRole,
        fromName: userNameRef.current,
      },
      targetPlayer.peerId
    );

    return true;
  }, []);

  // 响应交换请求
  const respondSwap = useCallback(
    (approved: boolean) => {
      const request = pendingSwapRequest;
      if (!request) return;

      // 发送响应
      sendMessageRef.current?.(
        {
          type: 'swap_response',
          approved,
          fromPeerId: SELF_PEER_ID,
          fromRole: myRoleRef.current,
          toRole: request.fromRole,
        },
        request.fromPeerId
      );

      if (approved) {
        // 执行交换
        const newRole = request.fromRole;
        setMyRole(newRole);

        // 更新玩家列表
        setPlayers(prev => {
          const newPlayers = new Map(prev);
          const selfPlayer = newPlayers.get(SELF_PEER_ID);
          if (selfPlayer) {
            newPlayers.set(SELF_PEER_ID, { ...selfPlayer, role: newRole });
          }
          const otherPlayer = newPlayers.get(request.fromPeerId);
          if (otherPlayer) {
            newPlayers.set(request.fromPeerId, {
              ...otherPlayer,
              role: request.toRole,
            });
          }
          return newPlayers;
        });
      }

      // 清除请求
      setPendingSwapRequest(null);
    },
    [pendingSwapRequest]
  );

  // 离开房间
  const leaveRoom = useCallback(() => {
    sendMessageRef.current = null;
    setMyRole('spectator');
    setPlayers(new Map());
    setError(null);
    resetRoom();
  }, [resetRoom]);

  // 获取观战者列表
  const spectators = Array.from(players.values()).filter(
    p => p.role === 'spectator'
  );

  // 获取玩家1和玩家2
  const player1 = Array.from(players.values()).find(p => p.role === 'player1');
  const player2 = Array.from(players.values()).find(p => p.role === 'player2');

  // 游戏是否就绪（两个玩家都在）
  const gameReady = !!player1 && !!player2;

  // 计算是否轮到我（需要游戏就绪且当前回合是我）
  const isMyTurn =
    gameReady && myRole !== 'spectator' && currentTurnRole === myRole;

  return {
    state: {
      roomStatus: roomState.status,
      roomCode: roomState.roomCode,
      myRole,
      players,
      spectators,
      isMyTurn,
      gameReady,
      pendingSwapRequest,
      error,
      player1,
      player2,
    },
    join,
    leaveRoom,
    sendGameAction,
    requestPlayerRole,
    resetGame,
    requestSwap,
    respondSwap,
  };
}
