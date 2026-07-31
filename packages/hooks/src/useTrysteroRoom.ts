/* eslint-disable no-console */
import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// 基础 Peer 信息
export interface BasePeerInfo {
  id: string;
  name: string;
}

// 房间配置
export interface RoomConfig {
  appId: string;
  userName: string;
}

// 房间状态
export interface TrysteroRoomState {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected';
  roomCode: string | null;
  peerCount: number;
  peers: Map<string, BasePeerInfo>;
  readyPeers: Set<string>;
  error: string | null;
}

// Action 发送函数类型
export type ActionSender<T> = (data: T, peerId?: string) => void;

// Action 接收回调类型
export type ActionReceiver<T> = (data: T, peerId: string) => void;

export interface ActionOptions {
  requireDataChannel?: boolean;
}

// Peer 连接
interface PeerConnection {
  peerId: string;
  name: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
}

// 房间对象（兼容原有 API）
export interface Room {
  onPeerJoin: (callback: (peerId: string) => void) => void;
  onPeerLeave: (callback: (peerId: string) => void) => void;
}

const initialState: TrysteroRoomState = {
  status: 'idle',
  roomCode: null,
  peerCount: 0,
  peers: new Map(),
  readyPeers: new Set(),
  error: null,
};

// ICE 服务器配置
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

const DATA_CHANNEL_BUFFER_HIGH_WATER = 512 * 1024;
const DATA_CHANNEL_BUFFER_LOW_WATER = 128 * 1024;
const MAX_PENDING_ICE_CANDIDATES = 256;

// 信令服务器地址
const getSignalingServerUrl = () => {
  const env =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: { VITE_API_URL?: string; NODE_ENV?: string } })
          .env
      : undefined;

  // 生产环境使用环境变量中的 API 地址
  if (env?.NODE_ENV === 'production' && env?.VITE_API_URL) {
    return env.VITE_API_URL;
  }

  // 开发环境使用当前域名（通过 Vite 代理转发），支持 IP 访问
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  return 'http://localhost:7777';
};

/**
 * P2P 房间 Hook（使用自定义信令服务器）
 */
export function useTrysteroRoom(config: RoomConfig) {
  const { appId, userName } = config;
  const [state, setState] = useState<TrysteroRoomState>(initialState);
  const appIdRef = useRef(appId);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map()
  );
  const userNameRef = useRef(userName);
  const roomCodeRef = useRef<string | null>(null);
  const peerIdRef = useRef<string>(generatePeerId());
  const messageHandlersRef = useRef<Map<string, ActionReceiver<unknown>>>(
    new Map()
  );
  // 消息缓冲区：保存在 handler 注册之前收到的消息
  const messageBufferRef = useRef<
    Array<{ action: string; data: unknown; peerId: string }>
  >([]);
  const peerJoinCallbackRef = useRef<((peerId: string) => void) | null>(null);
  const peerLeaveCallbackRef = useRef<((peerId: string) => void) | null>(null);

  // 保持 userName 最新
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  const updateState = useCallback((updates: Partial<TrysteroRoomState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 设置数据通道
  const setupDataChannel = useCallback(
    (channel: RTCDataChannel, peerId: string) => {
      channel.bufferedAmountLowThreshold = DATA_CHANNEL_BUFFER_LOW_WATER;
      channel.onopen = () => {
        console.log(`[WebRTC] Data channel to ${peerId} opened`);
        const connection = peerConnectionsRef.current.get(peerId);
        if (connection && connection.dataChannel !== channel) return;
        setState(prev => {
          const readyPeers = new Set(prev.readyPeers);
          readyPeers.add(peerId);
          return { ...prev, readyPeers };
        });
      };

      channel.onclose = () => {
        console.log(`[WebRTC] Data channel to ${peerId} closed`);
        const connection = peerConnectionsRef.current.get(peerId);
        if (connection && connection.dataChannel !== channel) return;
        setState(prev => {
          const readyPeers = new Set(prev.readyPeers);
          readyPeers.delete(peerId);
          return { ...prev, readyPeers };
        });
      };

      channel.onmessage = event => {
        try {
          const { action, data } = JSON.parse(event.data);
          const handler = messageHandlersRef.current.get(action);
          if (handler) {
            handler(data, peerId);
          } else {
            // Handler 还没注册，放入缓冲区
            messageBufferRef.current.push({ action, data, peerId });
          }
        } catch (e) {
          console.error('[WebRTC] Failed to parse message:', e);
        }
      };
    },
    []
  );

  // 创建 RTCPeerConnection
  const createPeerConnection = useCallback(
    (peerId: string, peerName: string, isInitiator: boolean) => {
      const existingConnection = peerConnectionsRef.current.get(peerId);
      if (existingConnection) {
        existingConnection.dataChannel?.close();
        existingConnection.connection.close();
        peerConnectionsRef.current.delete(peerId);
      }
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      let dataChannel: RTCDataChannel | null = null;

      // 如果是发起方，创建数据通道
      if (isInitiator) {
        dataChannel = pc.createDataChannel('data');
        setupDataChannel(dataChannel, peerId);
      }

      // 接收方监听数据通道
      pc.ondatachannel = event => {
        dataChannel = event.channel;
        setupDataChannel(dataChannel, peerId);
        // 更新连接中的 dataChannel
        const conn = peerConnectionsRef.current.get(peerId);
        if (conn) {
          conn.dataChannel = dataChannel;
        }
      };

      // ICE 候选
      pc.onicecandidate = event => {
        if (event.candidate) {
          socketRef.current?.emit('signal', {
            roomCode: roomCodeRef.current,
            targetPeerId: peerId,
            signal: { type: 'candidate', candidate: event.candidate },
          });
        }
      };

      // 连接状态变化
      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection to ${peerId}: ${pc.connectionState}`);
        if (pc.connectionState === 'failed') {
          const current = peerConnectionsRef.current.get(peerId);
          if (current?.connection === pc) {
            current.dataChannel?.close();
            current.connection.close();
            peerConnectionsRef.current.delete(peerId);
          }
        }
      };

      const peerConnection: PeerConnection = {
        peerId,
        name: peerName,
        connection: pc,
        dataChannel,
      };

      peerConnectionsRef.current.set(peerId, peerConnection);

      return peerConnection;
    },
    [setupDataChannel]
  );

  // 移除 peer
  const removePeer = useCallback((peerId: string) => {
    const conn = peerConnectionsRef.current.get(peerId);
    if (conn) {
      conn.dataChannel?.close();
      conn.connection.close();
      peerConnectionsRef.current.delete(peerId);
    }
    pendingIceCandidatesRef.current.delete(peerId);
    setState(prev => {
      const newPeers = new Map(prev.peers);
      const readyPeers = new Set(prev.readyPeers);
      newPeers.delete(peerId);
      readyPeers.delete(peerId);
      return {
        ...prev,
        peerCount: newPeers.size,
        peers: newPeers,
        readyPeers,
      };
    });
  }, []);

  const queueIceCandidate = useCallback(
    (peerId: string, candidate: RTCIceCandidateInit) => {
      const candidates = pendingIceCandidatesRef.current.get(peerId) ?? [];
      if (candidates.length >= MAX_PENDING_ICE_CANDIDATES) {
        console.warn(
          `[WebRTC] Too many pending ICE candidates for ${peerId}, dropping candidate`
        );
        return;
      }
      candidates.push(candidate);
      pendingIceCandidatesRef.current.set(peerId, candidates);
    },
    []
  );

  const flushIceCandidates = useCallback(
    async (peerId: string, connection: RTCPeerConnection) => {
      const candidates = pendingIceCandidatesRef.current.get(peerId);
      if (!candidates?.length) return;

      pendingIceCandidatesRef.current.delete(peerId);
      for (const candidate of candidates) {
        try {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('[WebRTC] Failed to add queued ICE candidate:', error);
        }
      }
    },
    []
  );

  // 处理信号
  const handleSignal = useCallback(
    async (
      fromPeerId: string,
      signal: { type: string; [key: string]: unknown }
    ) => {
      let conn = peerConnectionsRef.current.get(fromPeerId);

      if (signal.type === 'offer') {
        // 收到 offer，创建连接并回复 answer
        const peerName =
          state.peers.get(fromPeerId)?.name || conn?.name || '对方';
        conn = createPeerConnection(fromPeerId, peerName, false);

        await conn.connection.setRemoteDescription(
          new RTCSessionDescription(signal as RTCSessionDescriptionInit)
        );
        await flushIceCandidates(fromPeerId, conn.connection);
        const answer = await conn.connection.createAnswer();
        await conn.connection.setLocalDescription(answer);

        socketRef.current?.emit('signal', {
          roomCode: roomCodeRef.current,
          targetPeerId: fromPeerId,
          signal: { type: 'answer', sdp: answer.sdp },
        });
      } else if (signal.type === 'answer') {
        // 收到 answer
        if (conn) {
          await conn.connection.setRemoteDescription(
            new RTCSessionDescription(signal as RTCSessionDescriptionInit)
          );
          await flushIceCandidates(fromPeerId, conn.connection);
        }
      } else if (signal.type === 'candidate') {
        // 收到 ICE 候选
        const candidate = signal.candidate as RTCIceCandidateInit | undefined;
        if (!candidate) return;

        // Trickle ICE 可能早于 offer/answer 到达。远端描述设置前调用
        // addIceCandidate 会失败，因此先缓存，待描述就绪后按顺序补入。
        if (!conn?.connection.remoteDescription) {
          queueIceCandidate(fromPeerId, candidate);
          return;
        }

        try {
          await conn.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('[WebRTC] Failed to add ICE candidate:', error);
        }
      }
    },
    [createPeerConnection, flushIceCandidates, queueIceCandidate, state.peers]
  );

  /**
   * 加入房间
   */
  const join = useCallback(
    (roomCode: string) => {
      // 组合 appId 和 roomCode 形成唯一的房间标识
      const fullRoomCode = `${appIdRef.current}:${roomCode}`;

      updateState({
        status: 'connecting',
        roomCode, // 显示给用户的仍然是原始房间码
        peers: new Map(),
        readyPeers: new Set(),
        error: null,
      });

      roomCodeRef.current = fullRoomCode;
      const serverUrl = getSignalingServerUrl();

      // 连接信令服务器
      const socket = io(serverUrl, {
        path: '/signaling',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity, // 无限重连
        reconnectionDelay: 1000, // 初始重连延迟 1 秒
        reconnectionDelayMax: 10000, // 最大重连延迟 10 秒
        timeout: 20000, // 连接超时 20 秒
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Signaling] Connected to server');

        // Socket.IO 的 connect 会在首次连接和每次重连后触发。先清理失效的
        // PeerConnection，再根据服务端返回的成员列表完整重建 DataChannel。
        peerConnectionsRef.current.forEach(conn => {
          conn.dataChannel?.close();
          conn.connection.close();
        });
        peerConnectionsRef.current.clear();
        pendingIceCandidatesRef.current.clear();

        // 加入房间（使用组合后的完整房间码）
        socket.emit(
          'join',
          {
            roomCode: fullRoomCode,
            peerId: peerIdRef.current,
            name: userNameRef.current,
          },
          (response: {
            success: boolean;
            members: Array<{ peerId: string; name: string }>;
          }) => {
            if (response.success) {
              const peers = new Map<string, BasePeerInfo>(
                response.members.map(member => [
                  member.peerId,
                  { id: member.peerId, name: member.name },
                ])
              );
              updateState({
                status: 'connected',
                error: null,
                peers,
                peerCount: peers.size,
                readyPeers: new Set(),
              });

              // 向所有现有成员发起连接
              response.members.forEach(async member => {
                try {
                  const conn = createPeerConnection(
                    member.peerId,
                    member.name,
                    true
                  );
                  peerJoinCallbackRef.current?.(member.peerId);
                  const offer = await conn.connection.createOffer();
                  await conn.connection.setLocalDescription(offer);

                  socket.emit('signal', {
                    roomCode: fullRoomCode,
                    targetPeerId: member.peerId,
                    signal: { type: 'offer', sdp: offer.sdp },
                  });
                } catch (error) {
                  console.error(
                    `[WebRTC] Failed to reconnect peer ${member.peerId}:`,
                    error
                  );
                }
              });
            }
          }
        );
      });

      socket.on('connect_error', (error: Error) => {
        console.error('[Signaling] Connection error:', error);
        // 不立即设为 disconnected，等待重连
      });

      socket.on('disconnect', (reason: string) => {
        console.log('[Signaling] Disconnected from server:', reason);
        // 如果是服务端主动断开或传输关闭，尝试重连
        if (reason === 'io server disconnect') {
          // 服务端主动断开，需要手动重连
          socket.connect();
        }
        peerConnectionsRef.current.forEach(conn => {
          conn.dataChannel?.close();
          conn.connection.close();
        });
        peerConnectionsRef.current.clear();
        pendingIceCandidatesRef.current.clear();
        // 设置状态为 connecting 表示正在重连
        updateState({
          status: 'connecting',
          error: '连接断开，正在重连...',
          peers: new Map(),
          peerCount: 0,
          readyPeers: new Set(),
        });
      });

      // 重连尝试
      socket.io.on('reconnect_attempt', (attempt: number) => {
        console.log(`[Signaling] Reconnection attempt ${attempt}`);
        updateState({
          status: 'connecting',
          error: `正在重连... (${attempt})`,
        });
      });

      // 重连成功
      socket.io.on('reconnect', () => {
        console.log('[Signaling] Reconnected to server');
      });

      // 重连失败（达到最大次数）
      socket.io.on('reconnect_failed', () => {
        console.error('[Signaling] Reconnection failed');
        updateState({
          status: 'disconnected',
          error: '重连失败，请刷新页面重试',
        });
      });

      // 新 peer 加入
      socket.on(
        'peer-joined',
        ({ peerId, name }: { peerId: string; name: string }) => {
          console.log(`[Signaling] Peer joined: ${name} (${peerId})`);
          setState(prev => {
            const newPeers = new Map(prev.peers);
            newPeers.set(peerId, { id: peerId, name });
            return {
              ...prev,
              peerCount: newPeers.size,
              peers: newPeers,
            };
          });

          // 触发 peer join 回调
          peerJoinCallbackRef.current?.(peerId);
        }
      );

      // peer 离开
      socket.on('peer-left', ({ peerId }: { peerId: string }) => {
        console.log(`[Signaling] Peer left: ${peerId}`);
        // 触发 peer leave 回调
        peerLeaveCallbackRef.current?.(peerId);
        removePeer(peerId);
      });

      // 收到信号
      socket.on(
        'signal',
        ({
          fromPeerId,
          signal,
        }: {
          fromPeerId: string;
          signal: { type: string };
        }) => {
          void handleSignal(fromPeerId, signal).catch(error => {
            console.error(
              `[WebRTC] Failed to handle ${signal.type} from ${fromPeerId}:`,
              error
            );
          });
        }
      );

      // 收到消息（通过信令服务器转发，用于 DataChannel 建立前）
      socket.on(
        'message',
        ({
          fromPeerId,
          data,
        }: {
          fromPeerId: string;
          data: { action: string; payload: unknown };
        }) => {
          const handler = messageHandlersRef.current.get(data.action);
          if (handler) {
            handler(data.payload, fromPeerId);
          } else {
            // Handler 还没注册，放入缓冲区
            messageBufferRef.current.push({
              action: data.action,
              data: data.payload,
              peerId: fromPeerId,
            });
          }
        }
      );
    },
    [updateState, createPeerConnection, handleSignal, removePeer]
  );

  /**
   * 离开房间
   */
  const leave = useCallback(() => {
    if (socketRef.current && roomCodeRef.current) {
      socketRef.current.emit('leave', {
        roomCode: roomCodeRef.current,
        peerId: peerIdRef.current,
      });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // 关闭所有 peer 连接
    peerConnectionsRef.current.forEach(conn => {
      conn.dataChannel?.close();
      conn.connection.close();
    });
    peerConnectionsRef.current.clear();
    pendingIceCandidatesRef.current.clear();

    // 清空消息缓冲区
    messageBufferRef.current = [];

    roomCodeRef.current = null;
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    leave();
    setState(initialState);
    peerIdRef.current = generatePeerId();
  }, [leave]);

  /**
   * 等待指定 DataChannel 的发送缓冲回落到低水位。
   * DataChannel 尚未建立时控制消息会由 createAction 回退到信令通道，无需等待。
   */
  const waitForDataChannelDrain = useCallback(
    (peerId: string): Promise<void> => {
      const channel = peerConnectionsRef.current.get(peerId)?.dataChannel;
      if (
        !channel ||
        channel.readyState !== 'open' ||
        channel.bufferedAmount < DATA_CHANNEL_BUFFER_HIGH_WATER
      ) {
        return Promise.resolve();
      }

      return new Promise(resolve => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          channel.removeEventListener('bufferedamountlow', finish);
          channel.removeEventListener('close', finish);
          clearTimeout(timeout);
          resolve();
        };
        const timeout = setTimeout(finish, 1000);
        channel.addEventListener('bufferedamountlow', finish, { once: true });
        channel.addEventListener('close', finish, { once: true });
      });
    },
    []
  );

  const isDataChannelOpen = useCallback((peerId: string): boolean => {
    return (
      peerConnectionsRef.current.get(peerId)?.dataChannel?.readyState === 'open'
    );
  }, []);

  /**
   * 创建一个消息通道（Action）
   * @param actionName 通道名称
   * @param onReceive 接收消息回调
   * @returns 发送函数
   */
  const createAction = useCallback(
    <T extends Record<string, unknown>>(
      actionName: string,
      onReceive?: ActionReceiver<T>,
      options?: ActionOptions
    ): ActionSender<T> | null => {
      if (onReceive) {
        messageHandlersRef.current.set(
          actionName,
          onReceive as ActionReceiver<unknown>
        );

        // 处理缓冲区中该 action 的消息
        const bufferedMessages = messageBufferRef.current.filter(
          msg => msg.action === actionName
        );
        messageBufferRef.current = messageBufferRef.current.filter(
          msg => msg.action !== actionName
        );
        bufferedMessages.forEach(msg => {
          onReceive(msg.data as T, msg.peerId);
        });
      }

      // 返回发送函数
      return (data: T, targetPeerId?: string) => {
        const message = JSON.stringify({ action: actionName, data });

        if (targetPeerId) {
          // 发送给特定 peer
          const conn = peerConnectionsRef.current.get(targetPeerId);
          if (conn?.dataChannel?.readyState === 'open') {
            try {
              conn.dataChannel.send(message);
              return;
            } catch (error) {
              console.error('[WebRTC] Data channel send failed:', error);
            }
          }
          if (options?.requireDataChannel) {
            console.warn(
              `[WebRTC] Data channel for ${targetPeerId} is unavailable`
            );
          } else if (socketRef.current?.connected) {
            // DataChannel 未就绪，通过信令服务器转发
            socketRef.current.emit('message', {
              roomCode: roomCodeRef.current,
              targetPeerId,
              data: { action: actionName, payload: data },
            });
          } else {
            console.warn(`[WebRTC] Peer ${targetPeerId} is unavailable`);
          }
        } else {
          // 广播给所有 peer
          peerConnectionsRef.current.forEach(conn => {
            if (conn.dataChannel?.readyState === 'open') {
              try {
                conn.dataChannel.send(message);
              } catch (error) {
                console.error('[WebRTC] Data channel send failed:', error);
              }
            } else if (!options?.requireDataChannel) {
              socketRef.current?.emit('message', {
                roomCode: roomCodeRef.current,
                targetPeerId: conn.peerId,
                data: { action: actionName, payload: data },
              });
            }
          });
        }
      };
    },
    []
  );

  /**
   * 获取房间实例（兼容原有 API）
   */
  const getRoom = useCallback((): Room | null => {
    if (state.status !== 'connected') return null;

    return {
      onPeerJoin: callback => {
        peerJoinCallbackRef.current = callback;
      },
      onPeerLeave: callback => {
        peerLeaveCallbackRef.current = callback;
      },
    };
  }, [state.status]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      leave();
    };
  }, [leave]);

  return {
    state,
    join,
    leave,
    reset,
    createAction,
    waitForDataChannelDrain,
    isDataChannelOpen,
    getRoom,
  };
}

// 生成随机 peer ID
function generatePeerId(): string {
  return `peer_${Math.random().toString(36).slice(2, 10)}`;
}
