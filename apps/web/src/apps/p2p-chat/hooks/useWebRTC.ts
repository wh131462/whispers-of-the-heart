import { useState, useRef, useCallback, useEffect } from 'react';
import { joinRoom, type Room } from 'trystero';
import type { RoomState, MessagePayload } from '../types';

const APP_ID = 'whispers-p2p-chat';

const initialState: RoomState = {
  connectionState: 'idle',
  roomCode: null,
  peerCount: 0,
  peers: new Map(),
  error: null,
};

interface UseRoomOptions {
  userName: string;
  onMessage?: (payload: MessagePayload) => void;
}

export function useRoom({ userName, onMessage }: UseRoomOptions) {
  const [state, setState] = useState<RoomState>(initialState);

  const roomRef = useRef<Room | null>(null);
  const sendMsgRef = useRef<
    ((msg: MessagePayload, peerId?: string) => void) | null
  >(null);
  const sendNameRef = useRef<((name: string, peerId?: string) => void) | null>(
    null
  );
  const userNameRef = useRef(userName);

  // 保持 userName 最新
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  const updateState = useCallback((updates: Partial<RoomState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 加入房间
  const joinRoomByCode = useCallback(
    (roomCode: string) => {
      try {
        updateState({
          connectionState: 'connecting',
          roomCode,
          peers: new Map(),
          error: null,
        });

        const room = joinRoom({ appId: APP_ID }, roomCode);
        roomRef.current = room;

        // 创建消息 action
        const [sendMsg, onMsg] = room.makeAction<MessagePayload>('chat');
        sendMsgRef.current = sendMsg;

        // 创建用户名同步 action
        const [sendName, onName] = room.makeAction<string>('name');
        sendNameRef.current = sendName;

        // 监听消息
        onMsg(payload => {
          onMessage?.(payload);
        });

        // 监听用户名同步
        onName((name, peerId) => {
          setState(prev => {
            const newPeers = new Map(prev.peers);
            newPeers.set(peerId, { id: peerId, name });
            return { ...prev, peers: newPeers };
          });
        });

        // 监听 peer 加入
        room.onPeerJoin(peerId => {
          // 发送自己的用户名给新加入的 peer
          sendName(userNameRef.current, peerId);

          setState(prev => {
            const newCount = prev.peerCount + 1;
            const newPeers = new Map(prev.peers);
            newPeers.set(peerId, { id: peerId, name: '匿名用户' });
            return {
              ...prev,
              peerCount: newCount,
              peers: newPeers,
              connectionState: 'connected',
            };
          });
        });

        // 监听 peer 离开
        room.onPeerLeave(peerId => {
          setState(prev => {
            const newCount = Math.max(0, prev.peerCount - 1);
            const newPeers = new Map(prev.peers);
            newPeers.delete(peerId);
            return {
              ...prev,
              peerCount: newCount,
              peers: newPeers,
              connectionState: newCount === 0 ? 'disconnected' : 'connected',
            };
          });
        });
      } catch (err) {
        updateState({
          connectionState: 'idle',
          error: err instanceof Error ? err.message : '加入房间失败',
        });
      }
    },
    [onMessage, updateState]
  );

  // 发送消息
  const sendMessage = useCallback((content: string) => {
    if (sendMsgRef.current) {
      const payload: MessagePayload = {
        content,
        senderName: userNameRef.current,
        timestamp: Date.now(),
      };
      sendMsgRef.current(payload);
      return true;
    }
    return false;
  }, []);

  // 离开房间
  const leaveRoom = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.leave();
      roomRef.current = null;
      sendMsgRef.current = null;
      sendNameRef.current = null;
    }
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    leaveRoom();
    setState(initialState);
  }, [leaveRoom]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  return {
    state,
    joinRoom: joinRoomByCode,
    sendMessage,
    leaveRoom,
    reset,
  };
}
