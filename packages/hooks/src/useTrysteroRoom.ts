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
  allowRelay?: boolean;
}

// 房间状态
export interface TrysteroRoomState {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected';
  roomCode: string | null;
  peerCount: number;
  peers: Map<string, BasePeerInfo>;
  readyPeers: Set<string>;
  relayPeers: Set<string>;
  error: string | null;
}

// Action 发送函数类型
export type ActionSender<T> = (data: T, peerId?: string) => void;
export type ReliableActionSender<T> = (
  data: T,
  peerId: string
) => Promise<boolean>;

// Action 接收回调类型
export type ActionReceiver<T> = (data: T, peerId: string) => void;

export interface ActionOptions {
  requireDataChannel?: boolean;
  allowRelay?: boolean;
}

// Peer 连接
interface PeerConnection {
  peerId: string;
  name: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  isInitiator: boolean;
  iceRestartAttempts: number;
  connectionId: string;
  retryTimer?: ReturnType<typeof setTimeout>;
}

interface PendingIceCandidates {
  connectionId: string;
  candidates: RTCIceCandidateInit[];
}

interface PeerSignal {
  type: string;
  connectionId?: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
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
  relayPeers: new Set(),
  error: null,
};

// STUN 用于直连；聊天/文件由现有 Socket.IO 提供中转兜底。
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

interface WebRtcEnv {
  VITE_API_URL?: string;
  NODE_ENV?: string;
  VITE_WEBRTC_ICE_SERVERS?: string;
  VITE_TURN_URL?: string;
  VITE_TURN_USERNAME?: string;
  VITE_TURN_CREDENTIAL?: string;
}

const getWebRtcEnv = (): WebRtcEnv | undefined =>
  typeof import.meta !== 'undefined'
    ? (import.meta as { env?: WebRtcEnv }).env
    : undefined;

const DATA_CHANNEL_BUFFER_HIGH_WATER = 512 * 1024;
const DATA_CHANNEL_BUFFER_LOW_WATER = 128 * 1024;
const MAX_PENDING_ICE_CANDIDATES = 256;
const MAX_ICE_RESTART_ATTEMPTS = 2;
const NEGOTIATION_TIMEOUT_MS = 30000;
const CONNECTION_FAILED_MESSAGE =
  '直连未建立，且对方或服务器尚不支持中转，请更新页面或稍后重试';
const RELAY_DELAY_MS = 3000;
const MAX_RELAY_BYTES = 32 * 1024;

// 信令服务器地址
const getSignalingServerUrl = () => {
  const env = getWebRtcEnv();

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
  const allowRelayRef = useRef(config.allowRelay === true);
  const relaySupportedRef = useRef(false);
  const relayPeersRef = useRef(new Set<string>());
  const relayTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>()
  );
  const reliableActionsRef = useRef(new Set<string>());
  const reliableQueuesRef = useRef(
    new Map<string, { tail: Promise<void>; pending: number }>()
  );
  const retryPeerRef = useRef<(conn: PeerConnection) => void>(() => {});
  const pendingIceCandidatesRef = useRef<Map<string, PendingIceCandidates>>(
    new Map()
  );
  const peerSessionsRef = useRef<Map<string, string>>(new Map());
  const membersRef = useRef<Map<string, BasePeerInfo>>(new Map());
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

  const clearRelayPeer = useCallback((peerId: string) => {
    clearTimeout(relayTimersRef.current.get(peerId));
    relayTimersRef.current.delete(peerId);
    relayPeersRef.current.delete(peerId);
    reliableQueuesRef.current.delete(peerId);
    setState(prev => {
      const relayPeers = new Set(prev.relayPeers);
      relayPeers.delete(peerId);
      return { ...prev, relayPeers };
    });
  }, []);

  const clearRelayState = useCallback(() => {
    relayTimersRef.current.forEach(timer => clearTimeout(timer));
    relayTimersRef.current.clear();
    relayPeersRef.current.clear();
    reliableQueuesRef.current.clear();
    relaySupportedRef.current = false;
    updateState({ relayPeers: new Set() });
  }, [updateState]);

  const scheduleRelay = useCallback((peerId: string, relayVersion?: number) => {
    if (
      !allowRelayRef.current ||
      !relaySupportedRef.current ||
      relayVersion !== 1
    )
      return;
    const socket = socketRef.current;
    const sessionId = peerSessionsRef.current.get(peerId);
    clearTimeout(relayTimersRef.current.get(peerId));
    relayTimersRef.current.set(
      peerId,
      setTimeout(() => {
        relayTimersRef.current.delete(peerId);
        if (
          socketRef.current !== socket ||
          !socket?.connected ||
          !sessionId ||
          peerSessionsRef.current.get(peerId) !== sessionId
        )
          return;
        relayPeersRef.current.add(peerId);
        setState(prev => ({
          ...prev,
          relayPeers: new Set(prev.relayPeers).add(peerId),
          error: null,
        }));
      }, RELAY_DELAY_MS)
    );
  }, []);

  const closePeerConnection = useCallback((peerId: string) => {
    const conn = peerConnectionsRef.current.get(peerId);
    if (conn) {
      peerConnectionsRef.current.delete(peerId);
      clearTimeout(conn.retryTimer);
      conn.dataChannel?.close();
      conn.connection.close();
    }
    pendingIceCandidatesRef.current.delete(peerId);
    setState(prev => {
      const readyPeers = new Set(prev.readyPeers);
      readyPeers.delete(peerId);
      return { ...prev, readyPeers };
    });
  }, []);

  const sendSignal = useCallback((conn: PeerConnection, signal: PeerSignal) => {
    if (
      peerConnectionsRef.current.get(conn.peerId) !== conn ||
      !socketRef.current?.connected
    )
      return;
    socketRef.current.emit('signal', {
      roomCode: roomCodeRef.current,
      targetPeerId: conn.peerId,
      targetSessionId: peerSessionsRef.current.get(conn.peerId),
      signal: { ...signal, connectionId: conn.connectionId },
    });
  }, []);

  // 设置数据通道
  const setupDataChannel = useCallback(
    (channel: RTCDataChannel, peerId: string) => {
      channel.bufferedAmountLowThreshold = DATA_CHANNEL_BUFFER_LOW_WATER;
      channel.onopen = () => {
        console.log(`[WebRTC] Data channel to ${peerId} opened`);
        const connection = peerConnectionsRef.current.get(peerId);
        if (connection?.dataChannel !== channel) return;
        clearTimeout(connection.retryTimer);
        clearRelayPeer(peerId);
        connection.iceRestartAttempts = 0;
        setState(prev => {
          const readyPeers = new Set(prev.readyPeers);
          readyPeers.add(peerId);
          return { ...prev, readyPeers, error: null };
        });
      };

      channel.onclose = () => {
        console.log(`[WebRTC] Data channel to ${peerId} closed`);
        const connection = peerConnectionsRef.current.get(peerId);
        if (connection?.dataChannel !== channel) return;
        if (connection.isInitiator) {
          clearTimeout(connection.retryTimer);
          connection.retryTimer = setTimeout(
            () => retryPeerRef.current(connection),
            1000
          );
        }
        setState(prev => {
          const readyPeers = new Set(prev.readyPeers);
          readyPeers.delete(peerId);
          return { ...prev, readyPeers };
        });
      };

      channel.onmessage = event => {
        if (peerConnectionsRef.current.get(peerId)?.dataChannel !== channel)
          return;
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
    [clearRelayPeer]
  );

  // 创建 RTCPeerConnection
  const createPeerConnection = useCallback(
    (
      peerId: string,
      peerName: string,
      isInitiator: boolean,
      iceRestartAttempts = 0,
      connectionId = generatePeerId()
    ) => {
      // A new offer owns a new connection; preserve only its early candidates.
      const pending = pendingIceCandidatesRef.current.get(peerId);
      closePeerConnection(peerId);
      if (pending?.connectionId === connectionId) {
        pendingIceCandidatesRef.current.set(peerId, pending);
      }
      const pc = new RTCPeerConnection({
        iceServers: DEFAULT_ICE_SERVERS,
      });

      let dataChannel: RTCDataChannel | null = null;

      // 如果是发起方，创建数据通道
      if (isInitiator) {
        dataChannel = pc.createDataChannel('data');
        setupDataChannel(dataChannel, peerId);
      }

      // 接收方监听数据通道
      pc.ondatachannel = event => {
        const conn = peerConnectionsRef.current.get(peerId);
        if (conn?.connection !== pc) {
          event.channel.close();
          return;
        }
        dataChannel = event.channel;
        conn.dataChannel = dataChannel;
        setupDataChannel(dataChannel, peerId);
      };

      // ICE 候选
      pc.onicecandidate = event => {
        if (event.candidate) {
          sendSignal(peerConnection, {
            type: 'candidate',
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // 连接状态变化
      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection to ${peerId}: ${pc.connectionState}`);
        const current = peerConnectionsRef.current.get(peerId);
        if (current?.connection !== pc) return;
        if (pc.connectionState === 'connected') {
          if (current.dataChannel?.readyState === 'open') {
            current.iceRestartAttempts = 0;
            clearTimeout(current.retryTimer);
            setState(prev => ({
              ...prev,
              readyPeers: new Set(prev.readyPeers).add(peerId),
              error: null,
            }));
          }
          return;
        }
        if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'disconnected'
        ) {
          setState(prev => {
            const readyPeers = new Set(prev.readyPeers);
            readyPeers.delete(peerId);
            return { ...prev, readyPeers };
          });
          if (!current.isInitiator) return;
          clearTimeout(current.retryTimer);
          current.retryTimer = setTimeout(
            () => retryPeerRef.current(current),
            pc.connectionState === 'failed' ? 0 : 5000
          );
        }
      };

      pc.onicecandidateerror = event => {
        console.warn(
          `[WebRTC] ICE candidate error for ${peerId}: ${event.errorCode} ${event.errorText}`
        );
      };

      const peerConnection: PeerConnection = {
        peerId,
        name: peerName,
        connection: pc,
        dataChannel,
        isInitiator,
        iceRestartAttempts,
        connectionId,
      };

      peerConnectionsRef.current.set(peerId, peerConnection);
      if (isInitiator) {
        peerConnection.retryTimer = setTimeout(
          () => retryPeerRef.current(peerConnection),
          NEGOTIATION_TIMEOUT_MS
        );
      }

      return peerConnection;
    },
    [closePeerConnection, setupDataChannel, sendSignal]
  );

  // 为每个 Peer 选择唯一的 offer 发起方，避免 Socket.IO 重连时双方同时
  // 创建 offer 产生协商冲突。使用稳定的 peerId 排序，不依赖加入先后。
  const createOfferForPeer = useCallback(
    async (peerId: string, peerName: string, attempts = 0): Promise<void> => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (
        existing?.isInitiator &&
        ((existing.connection.connectionState === 'connected' &&
          existing.dataChannel?.readyState === 'open') ||
          existing.connection.signalingState === 'have-local-offer')
      ) {
        return;
      }

      const conn = createPeerConnection(peerId, peerName, true, attempts);
      const offer = await conn.connection.createOffer({
        iceRestart: attempts > 0,
      });
      if (peerConnectionsRef.current.get(peerId) !== conn) return;
      await conn.connection.setLocalDescription(offer);

      if (
        peerConnectionsRef.current.get(peerId)?.connection !==
          conn.connection ||
        !socketRef.current?.connected
      ) {
        return;
      }

      sendSignal(conn, {
        type: 'offer',
        sdp: conn.connection.localDescription?.sdp,
      });
    },
    [createPeerConnection, sendSignal]
  );

  retryPeerRef.current = conn => {
    if (
      peerConnectionsRef.current.get(conn.peerId) !== conn ||
      !socketRef.current?.connected
    )
      return;
    if (
      conn.connection.connectionState === 'connected' &&
      conn.dataChannel?.readyState === 'open'
    )
      return;
    if (conn.iceRestartAttempts >= MAX_ICE_RESTART_ATTEMPTS) {
      sendSignal(conn, { type: 'failed' });
      closePeerConnection(conn.peerId);
      if (!relayPeersRef.current.has(conn.peerId))
        updateState({ error: CONNECTION_FAILED_MESSAGE });
      return;
    }
    closePeerConnection(conn.peerId);
    void createOfferForPeer(
      conn.peerId,
      conn.name,
      conn.iceRestartAttempts + 1
    ).catch(error => {
      console.error('[WebRTC] Renegotiation failed:', error);
    });
  };

  // 移除 peer
  const removePeer = useCallback(
    (peerId: string) => {
      clearRelayPeer(peerId);
      closePeerConnection(peerId);
      peerSessionsRef.current.delete(peerId);
      membersRef.current.delete(peerId);
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
    },
    [closePeerConnection, clearRelayPeer]
  );

  const queueIceCandidate = useCallback(
    (peerId: string, connectionId: string, candidate: RTCIceCandidateInit) => {
      const pending = pendingIceCandidatesRef.current.get(peerId);
      const candidates =
        pending?.connectionId === connectionId ? pending.candidates : [];
      if (candidates.length >= MAX_PENDING_ICE_CANDIDATES) {
        console.warn(
          `[WebRTC] Too many pending ICE candidates for ${peerId}, dropping candidate`
        );
        return;
      }
      candidates.push(candidate);
      pendingIceCandidatesRef.current.set(peerId, { connectionId, candidates });
    },
    []
  );

  const flushIceCandidates = useCallback(
    async (conn: PeerConnection): Promise<void> => {
      const { peerId, connection, connectionId } = conn;
      if (!connection.remoteDescription) return;
      const pending = pendingIceCandidatesRef.current.get(peerId);
      if (pending?.connectionId !== connectionId) return;

      pendingIceCandidatesRef.current.delete(peerId);
      for (const candidate of pending.candidates) {
        if (peerConnectionsRef.current.get(peerId) !== conn) return;
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
    async (fromPeerId: string, signal: PeerSignal) => {
      let conn = peerConnectionsRef.current.get(fromPeerId);
      // Older clients omit connectionId; retain compatibility during rolling upgrades.
      const connectionId =
        signal.connectionId ?? conn?.connectionId ?? 'legacy';

      if (signal.type === 'offer') {
        if (peerIdRef.current < fromPeerId) return;
        // Retry offers use a fresh connection ID, so both peers replace the same SCTP session.
        const peerName =
          membersRef.current.get(fromPeerId)?.name || conn?.name || '对方';
        if (
          !conn ||
          conn.connectionId !== connectionId ||
          conn.connection.connectionState === 'closed'
        ) {
          conn = createPeerConnection(
            fromPeerId,
            peerName,
            false,
            0,
            connectionId
          );
        }

        await conn.connection.setRemoteDescription({
          type: 'offer',
          sdp: signal.sdp,
        });
        if (peerConnectionsRef.current.get(fromPeerId) !== conn) return;
        await flushIceCandidates(conn);
        const answer = await conn.connection.createAnswer();
        if (peerConnectionsRef.current.get(fromPeerId) !== conn) return;
        await conn.connection.setLocalDescription(answer);

        sendSignal(conn, {
          type: 'answer',
          sdp: conn.connection.localDescription?.sdp,
        });
      } else if (signal.type === 'answer') {
        // 收到 answer
        if (
          conn?.connectionId === connectionId &&
          conn.connection.signalingState === 'have-local-offer'
        ) {
          await conn.connection.setRemoteDescription({
            type: 'answer',
            sdp: signal.sdp,
          });
          await flushIceCandidates(conn);
        }
      } else if (signal.type === 'failed') {
        if (conn?.connectionId !== connectionId || conn.isInitiator) return;
        closePeerConnection(fromPeerId);
        if (!relayPeersRef.current.has(fromPeerId))
          updateState({ error: CONNECTION_FAILED_MESSAGE });
      } else if (signal.type === 'candidate') {
        // 收到 ICE 候选
        const candidate = signal.candidate;
        if (!candidate) return;

        // Trickle ICE 可能早于 offer/answer 到达。远端描述设置前调用
        // addIceCandidate 会失败，因此先缓存，待描述就绪后按顺序补入。
        if (
          !conn ||
          conn.connectionId !== connectionId ||
          !conn.connection.remoteDescription
        ) {
          // Initiators only accept candidates for their current offer.
          if (
            peerIdRef.current < fromPeerId &&
            conn?.connectionId !== connectionId
          )
            return;
          queueIceCandidate(fromPeerId, connectionId, candidate);
          return;
        }

        try {
          await conn.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('[WebRTC] Failed to add ICE candidate:', error);
        }
      }
    },
    [
      createPeerConnection,
      flushIceCandidates,
      queueIceCandidate,
      sendSignal,
      closePeerConnection,
      updateState,
    ]
  );

  /**
   * 主动离房与再次加入共用清理，旧 Socket 的回调不得影响新房间。
   */
  const leave = useCallback(() => {
    clearRelayState();
    reliableActionsRef.current.clear();
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      socket.emit('leave', {
        roomCode: roomCodeRef.current,
        peerId: peerIdRef.current,
      });
      socket.removeAllListeners();
      socket.disconnect();
    }
    peerConnectionsRef.current.forEach(conn =>
      closePeerConnection(conn.peerId)
    );
    pendingIceCandidatesRef.current.clear();
    peerSessionsRef.current.clear();
    membersRef.current.clear();
    messageBufferRef.current = [];
    messageHandlersRef.current.clear();
    peerJoinCallbackRef.current = null;
    peerLeaveCallbackRef.current = null;
    roomCodeRef.current = null;
  }, [closePeerConnection, clearRelayState]);

  /**
   * 加入房间
   */
  const join = useCallback(
    (roomCode: string) => {
      leave();
      // 组合 appId 和 roomCode 形成唯一的房间标识
      const fullRoomCode = `${appIdRef.current}:${roomCode}`;

      updateState({
        status: 'connecting',
        roomCode, // 显示给用户的仍然是原始房间码
        peers: new Map(),
        peerCount: 0,
        readyPeers: new Set(),
        error: null,
      });

      roomCodeRef.current = fullRoomCode;
      const serverUrl = getSignalingServerUrl();

      // 连接信令服务器
      const socket = io(serverUrl, {
        path: '/signaling',
        transports: ['websocket', 'polling'],
        tryAllTransports: true,
        reconnection: true,
        reconnectionAttempts: Infinity, // 无限重连
        reconnectionDelay: 1000, // 初始重连延迟 1 秒
        reconnectionDelayMax: 10000, // 最大重连延迟 10 秒
        timeout: 20000, // 连接超时 20 秒
      });

      socketRef.current = socket;
      let connectionGeneration = 0;
      const signalQueues = new Map<string, Promise<void>>();

      socket.on('connect', () => {
        const generation = ++connectionGeneration;
        void (async () => {
          console.log('[Signaling] Connected to server');
          if (
            socket !== socketRef.current ||
            generation !== connectionGeneration ||
            !socket.connected
          )
            return;
          clearRelayState();

          // Socket.IO 的 connect 会在首次连接和每次重连后触发。先清理失效的
          // PeerConnection，再根据服务端返回的成员列表完整重建 DataChannel。
          peerConnectionsRef.current.forEach(conn =>
            closePeerConnection(conn.peerId)
          );
          pendingIceCandidatesRef.current.clear();
          peerSessionsRef.current.clear();
          membersRef.current.clear();
          signalQueues.clear();

          // 加入房间（使用组合后的完整房间码）
          socket.timeout(10000).emit(
            'join',
            {
              roomCode: fullRoomCode,
              peerId: peerIdRef.current,
              name: userNameRef.current,
              relayVersion: allowRelayRef.current ? 1 : undefined,
            },
            (
              error: Error | null,
              response?: {
                success: boolean;
                relayVersion?: number;
                members: Array<{
                  peerId: string;
                  name: string;
                  sessionId?: string;
                  relayVersion?: number;
                }>;
              }
            ) => {
              if (
                socket !== socketRef.current ||
                generation !== connectionGeneration ||
                !socket.connected
              )
                return;
              if (error || !response?.success) {
                updateState({ error: '加入房间超时，正在重新连接...' });
                socket.disconnect().connect();
                return;
              }
              if (response.success) {
                relaySupportedRef.current = response.relayVersion === 1;
                const peers = new Map<string, BasePeerInfo>(
                  response.members.map(member => [
                    member.peerId,
                    { id: member.peerId, name: member.name },
                  ])
                );
                membersRef.current = new Map(peers);
                response.members.forEach(member => {
                  if (member.sessionId)
                    peerSessionsRef.current.set(
                      member.peerId,
                      member.sessionId
                    );
                  scheduleRelay(member.peerId, member.relayVersion);
                });
                updateState({
                  status: 'connected',
                  error: null,
                  peers,
                  peerCount: peers.size,
                  readyPeers: new Set(),
                });

                // 由 peerId 较小的一方发起连接，避免重连时双方同时发 offer。
                response.members.forEach(async member => {
                  try {
                    if (peerIdRef.current >= member.peerId) return;
                    await createOfferForPeer(member.peerId, member.name);
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
        })().catch(error => {
          console.error(
            '[Signaling] Failed to initialize room connection:',
            error
          );
        });
      });

      socket.on('connect_error', (error: Error) => {
        console.error('[Signaling] Connection error:', error);
        // 不立即设为 disconnected，等待重连
      });

      socket.on('session-replaced', () => {
        if (socket !== socketRef.current) return;
        leave();
        updateState({
          ...initialState,
          status: 'disconnected',
          error: '房间会话已被新的连接替换，请重新加入',
        });
      });

      socket.on('disconnect', (reason: string) => {
        if (socket !== socketRef.current) return;
        clearRelayState();
        connectionGeneration += 1;
        console.log('[Signaling] Disconnected from server:', reason);
        // 如果是服务端主动断开或传输关闭，尝试重连
        if (reason === 'io server disconnect') {
          // 服务端主动断开，需要手动重连
          socket.connect();
        }
        peerConnectionsRef.current.forEach(conn =>
          closePeerConnection(conn.peerId)
        );
        pendingIceCandidatesRef.current.clear();
        peerSessionsRef.current.clear();
        membersRef.current.clear();
        signalQueues.clear();
        messageBufferRef.current = [];
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
        if (socket !== socketRef.current) return;
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
        if (socket !== socketRef.current) return;
        console.error('[Signaling] Reconnection failed');
        updateState({
          status: 'disconnected',
          error: '重连失败，请刷新页面重试',
        });
      });

      // 新 peer 加入
      socket.on(
        'peer-joined',
        ({
          peerId,
          name,
          sessionId,
          relayVersion,
        }: {
          peerId: string;
          name: string;
          sessionId?: string;
          relayVersion?: number;
        }) => {
          if (socket !== socketRef.current) return;
          console.log(`[Signaling] Peer joined: ${name} (${peerId})`);
          // A repeated peerId belongs to a new Socket session. Always rebuild both sides.
          closePeerConnection(peerId);
          clearRelayPeer(peerId);
          signalQueues.delete(peerId);
          if (sessionId) peerSessionsRef.current.set(peerId, sessionId);
          else peerSessionsRef.current.delete(peerId);
          membersRef.current.set(peerId, { id: peerId, name });
          scheduleRelay(peerId, relayVersion);
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

          // 新成员加入时同样遵循稳定的发起方规则。若本地 peerId 较小，
          // 由当前客户端主动创建 offer；否则等待新成员发起。
          if (peerIdRef.current < peerId) {
            void createOfferForPeer(peerId, name).catch(error => {
              console.error(
                `[WebRTC] Failed to connect peer ${peerId}:`,
                error
              );
            });
          }
        }
      );

      // peer 离开
      socket.on(
        'peer-left',
        ({ peerId, sessionId }: { peerId: string; sessionId?: string }) => {
          if (
            socket !== socketRef.current ||
            (sessionId && peerSessionsRef.current.get(peerId) !== sessionId)
          )
            return;
          console.log(`[Signaling] Peer left: ${peerId}`);
          // 触发 peer leave 回调
          peerLeaveCallbackRef.current?.(peerId);
          removePeer(peerId);
          signalQueues.delete(peerId);
        }
      );

      // 收到信号
      socket.on(
        'signal',
        ({
          fromPeerId,
          fromSessionId,
          signal,
        }: {
          fromPeerId: string;
          fromSessionId?: string;
          signal: PeerSignal;
        }) => {
          const generation = connectionGeneration;
          // SDP operations must complete in arrival order before adding trickled candidates.
          const pending = (signalQueues.get(fromPeerId) ?? Promise.resolve())
            .then(async () => {
              if (
                socket !== socketRef.current ||
                generation !== connectionGeneration ||
                !membersRef.current.has(fromPeerId)
              )
                return;
              if (
                fromSessionId &&
                peerSessionsRef.current.get(fromPeerId) !== fromSessionId
              )
                return;
              await handleSignal(fromPeerId, signal);
            })
            .catch(error => {
              console.error(
                `[WebRTC] Failed to handle ${signal.type} from ${fromPeerId}:`,
                error
              );
            });
          signalQueues.set(fromPeerId, pending);
          void pending.then(() => {
            if (signalQueues.get(fromPeerId) === pending)
              signalQueues.delete(fromPeerId);
          });
        }
      );

      // 中转 ACK 只确认协议包已交给接收处理器，不表示业务校验成功。
      socket.on(
        'relay',
        (
          packet: {
            fromPeerId: string;
            fromSessionId: string;
            targetSessionId: string;
            message: string;
          },
          ack?: (reply: { success: boolean }) => void
        ) => {
          if (typeof ack !== 'function') return;
          if (
            !packet ||
            socket !== socketRef.current ||
            !allowRelayRef.current ||
            !relaySupportedRef.current ||
            packet.targetSessionId !== socket.id ||
            peerSessionsRef.current.get(packet.fromPeerId) !==
              packet.fromSessionId ||
            !membersRef.current.has(packet.fromPeerId) ||
            typeof packet.message !== 'string' ||
            new TextEncoder().encode(packet.message).length > MAX_RELAY_BYTES
          ) {
            ack({ success: false });
            return;
          }
          try {
            const parsed: unknown = JSON.parse(packet.message);
            if (
              !parsed ||
              typeof parsed !== 'object' ||
              !('action' in parsed) ||
              typeof parsed.action !== 'string' ||
              !('data' in parsed) ||
              !reliableActionsRef.current.has(parsed.action)
            ) {
              ack({ success: false });
              return;
            }
            const handler = messageHandlersRef.current.get(parsed.action);
            if (!handler) {
              ack({ success: false });
              return;
            }
            // Async validation (e.g. SHA-256) has its own verification response.
            void Promise.resolve(handler(parsed.data, packet.fromPeerId)).catch(
              error => {
                console.error('[Relay] Receive failed:', error);
              }
            );
            ack({ success: true });
          } catch {
            ack({ success: false });
          }
        }
      );

      // 游戏继续使用原有的轻量消息转发。
      socket.on(
        'message',
        ({
          fromPeerId,
          data,
        }: {
          fromPeerId: string;
          data: { action: string; payload: unknown };
        }) => {
          if (
            socket !== socketRef.current ||
            !membersRef.current.has(fromPeerId) ||
            reliableActionsRef.current.has(data.action)
          )
            return;
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
    [
      updateState,
      createOfferForPeer,
      handleSignal,
      removePeer,
      closePeerConnection,
      leave,
      clearRelayState,
      clearRelayPeer,
      scheduleRelay,
    ]
  );

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

  const isRelayAvailable = useCallback((peerId: string): boolean => {
    return Boolean(
      allowRelayRef.current &&
      relayPeersRef.current.has(peerId) &&
      socketRef.current?.connected
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
        // Defer delivery until all actions and sender refs have been registered.
        const socket = socketRef.current;
        queueMicrotask(() => {
          if (socketRef.current !== socket) return;
          bufferedMessages.forEach(msg => {
            if (membersRef.current.has(msg.peerId)) {
              messageHandlersRef.current.get(actionName)?.(
                msg.data,
                msg.peerId
              );
            }
          });
        });
      }

      if (options?.allowRelay) reliableActionsRef.current.add(actionName);

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
          if (
            options?.allowRelay &&
            relayPeersRef.current.has(targetPeerId) &&
            socketRef.current?.connected
          ) {
            const sessionId = peerSessionsRef.current.get(targetPeerId);
            if (
              sessionId &&
              new TextEncoder().encode(message).length <= MAX_RELAY_BYTES
            ) {
              socketRef.current.emit(
                'relay',
                {
                  roomCode: roomCodeRef.current,
                  targetPeerId,
                  targetSessionId: sessionId,
                  message,
                },
                (reply: { success?: boolean } | undefined) => {
                  if (reply?.success !== true) {
                    console.warn(
                      `[Relay] Delivery to ${targetPeerId} was rejected`
                    );
                  }
                }
              );
              return;
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
          membersRef.current.forEach(member => {
            const conn = peerConnectionsRef.current.get(member.id);
            if (conn?.dataChannel?.readyState === 'open') {
              try {
                conn.dataChannel.send(message);
              } catch (error) {
                console.error('[WebRTC] Data channel send failed:', error);
              }
            } else if (
              options?.allowRelay &&
              relayPeersRef.current.has(member.id) &&
              socketRef.current?.connected
            ) {
              const sessionId = peerSessionsRef.current.get(member.id);
              if (
                sessionId &&
                new TextEncoder().encode(message).length <= MAX_RELAY_BYTES
              ) {
                socketRef.current.emit('relay', {
                  roomCode: roomCodeRef.current,
                  targetPeerId: member.id,
                  targetSessionId: sessionId,
                  message,
                });
              }
            } else if (
              !options?.requireDataChannel &&
              socketRef.current?.connected
            ) {
              socketRef.current?.emit('message', {
                roomCode: roomCodeRef.current,
                targetPeerId: member.id,
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
        // A consumer may register after the join acknowledgement (or host election).
        membersRef.current.forEach(member => callback(member.id));
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
    selfPeerId: peerIdRef.current,
    state,
    join,
    leave,
    reset,
    createAction,
    waitForDataChannelDrain,
    isDataChannelOpen,
    isRelayAvailable,
    getRoom,
  };
}

// 生成随机 peer ID
function generatePeerId(): string {
  return `peer_${Math.random().toString(36).slice(2, 10)}`;
}
