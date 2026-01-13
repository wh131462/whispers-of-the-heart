/* eslint-disable no-console */
import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// 基础 Peer 信息
export interface BasePeerInfo {
  id: string;
  name: string;
}

// 房间配置
export interface SignalingRoomConfig {
  appId: string;
  userName: string;
  serverUrl?: string;
}

// 房间状态
export interface SignalingRoomState {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected';
  roomCode: string | null;
  peerCount: number;
  peers: Map<string, BasePeerInfo>;
  error: string | null;
}

// Peer 连接
interface PeerConnection {
  peerId: string;
  name: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
}

// Action 发送函数类型
export type ActionSender<T> = (data: T, peerId?: string) => void;

// Action 接收回调类型
export type ActionReceiver<T> = (data: T, peerId: string) => void;

const initialState: SignalingRoomState = {
  status: 'idle',
  roomCode: null,
  peerCount: 0,
  peers: new Map(),
  error: null,
};

// ICE 服务器配置
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

// 默认信令服务器地址
const DEFAULT_SERVER_URL = 'http://localhost:7777/signaling';

/**
 * 使用自定义信令服务器的 P2P 房间 Hook
 */
export function useSignalingRoom(config: SignalingRoomConfig) {
  const { userName, serverUrl = DEFAULT_SERVER_URL } = config;
  const [state, setState] = useState<SignalingRoomState>(initialState);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const userNameRef = useRef(userName);
  const roomCodeRef = useRef<string | null>(null);
  const peerIdRef = useRef<string>(generatePeerId());
  const messageHandlersRef = useRef<Map<string, ActionReceiver<unknown>>>(
    new Map()
  );

  // 保持 userName 最新
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  const updateState = useCallback((updates: Partial<SignalingRoomState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 创建 RTCPeerConnection
  const createPeerConnection = useCallback(
    (peerId: string, peerName: string, isInitiator: boolean) => {
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
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed'
        ) {
          removePeer(peerId);
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
    []
  );

  // 设置数据通道
  const setupDataChannel = (channel: RTCDataChannel, peerId: string) => {
    channel.onopen = () => {
      console.log(`[WebRTC] Data channel to ${peerId} opened`);
    };

    channel.onclose = () => {
      console.log(`[WebRTC] Data channel to ${peerId} closed`);
    };

    channel.onmessage = event => {
      try {
        const { action, data } = JSON.parse(event.data);
        const handler = messageHandlersRef.current.get(action);
        if (handler) {
          handler(data, peerId);
        }
      } catch (e) {
        console.error('[WebRTC] Failed to parse message:', e);
      }
    };
  };

  // 移除 peer
  const removePeer = useCallback((peerId: string) => {
    const conn = peerConnectionsRef.current.get(peerId);
    if (conn) {
      conn.dataChannel?.close();
      conn.connection.close();
      peerConnectionsRef.current.delete(peerId);

      setState(prev => {
        const newPeers = new Map(prev.peers);
        newPeers.delete(peerId);
        return {
          ...prev,
          peerCount: Math.max(0, prev.peerCount - 1),
          peers: newPeers,
        };
      });
    }
  }, []);

  // 处理信号
  const handleSignal = useCallback(
    async (
      fromPeerId: string,
      signal: { type: string; [key: string]: unknown }
    ) => {
      let conn = peerConnectionsRef.current.get(fromPeerId);

      if (signal.type === 'offer') {
        // 收到 offer，创建连接并回复 answer
        if (!conn) {
          conn = createPeerConnection(fromPeerId, '对方', false);
        }

        await conn.connection.setRemoteDescription(
          new RTCSessionDescription(signal as RTCSessionDescriptionInit)
        );
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
        }
      } else if (signal.type === 'candidate') {
        // 收到 ICE 候选
        if (conn) {
          try {
            await conn.connection.addIceCandidate(
              new RTCIceCandidate(signal.candidate as RTCIceCandidateInit)
            );
          } catch (e) {
            console.error('[WebRTC] Failed to add ICE candidate:', e);
          }
        }
      }
    },
    [createPeerConnection]
  );

  // 加入房间
  const join = useCallback(
    (roomCode: string) => {
      updateState({
        status: 'connecting',
        roomCode,
        peers: new Map(),
        error: null,
      });

      roomCodeRef.current = roomCode;

      // 连接信令服务器
      const socket = io(serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Signaling] Connected to server');

        // 加入房间
        socket.emit(
          'join',
          {
            roomCode,
            peerId: peerIdRef.current,
            name: userNameRef.current,
          },
          (response: {
            success: boolean;
            members: Array<{ peerId: string; name: string }>;
          }) => {
            if (response.success) {
              updateState({ status: 'connected' });

              // 向所有现有成员发起连接
              response.members.forEach(async member => {
                const conn = createPeerConnection(
                  member.peerId,
                  member.name,
                  true
                );

                // 更新 peers
                setState(prev => {
                  const newPeers = new Map(prev.peers);
                  newPeers.set(member.peerId, {
                    id: member.peerId,
                    name: member.name,
                  });
                  return {
                    ...prev,
                    peerCount: newPeers.size,
                    peers: newPeers,
                  };
                });

                // 创建并发送 offer
                const offer = await conn.connection.createOffer();
                await conn.connection.setLocalDescription(offer);

                socket.emit('signal', {
                  roomCode,
                  targetPeerId: member.peerId,
                  signal: { type: 'offer', sdp: offer.sdp },
                });
              });
            }
          }
        );
      });

      socket.on('connect_error', error => {
        console.error('[Signaling] Connection error:', error);
        updateState({
          status: 'disconnected',
          error: '无法连接到信令服务器',
        });
      });

      socket.on('disconnect', () => {
        console.log('[Signaling] Disconnected from server');
        updateState({ status: 'disconnected' });
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
        }
      );

      // peer 离开
      socket.on('peer-left', ({ peerId }: { peerId: string }) => {
        console.log(`[Signaling] Peer left: ${peerId}`);
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
          handleSignal(fromPeerId, signal);
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
          }
        }
      );
    },
    [serverUrl, updateState, createPeerConnection, handleSignal, removePeer]
  );

  // 离开房间
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

    roomCodeRef.current = null;
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    leave();
    setState(initialState);
    peerIdRef.current = generatePeerId();
  }, [leave]);

  // 创建消息通道
  const createAction = useCallback(
    <T extends Record<string, unknown>>(
      actionName: string,
      onReceive?: ActionReceiver<T>
    ): ActionSender<T> | null => {
      if (onReceive) {
        messageHandlersRef.current.set(
          actionName,
          onReceive as ActionReceiver<unknown>
        );
      }

      // 返回发送函数
      return (data: T, targetPeerId?: string) => {
        const message = JSON.stringify({ action: actionName, data });

        if (targetPeerId) {
          // 发送给特定 peer
          const conn = peerConnectionsRef.current.get(targetPeerId);
          if (conn?.dataChannel?.readyState === 'open') {
            conn.dataChannel.send(message);
          } else {
            // DataChannel 未就绪，通过信令服务器转发
            socketRef.current?.emit('message', {
              roomCode: roomCodeRef.current,
              targetPeerId,
              data: { action: actionName, payload: data },
            });
          }
        } else {
          // 广播给所有 peer
          peerConnectionsRef.current.forEach(conn => {
            if (conn.dataChannel?.readyState === 'open') {
              conn.dataChannel.send(message);
            } else {
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

  // 获取 peer 连接（用于高级用法）
  const getPeerConnections = useCallback(() => peerConnectionsRef.current, []);

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
    getPeerConnections,
  };
}

// 生成随机 peer ID
function generatePeerId(): string {
  return `peer_${Math.random().toString(36).slice(2, 10)}`;
}
