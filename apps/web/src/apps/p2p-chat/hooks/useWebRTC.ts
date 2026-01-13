import { useCallback, useEffect, useRef } from 'react';
import { useTrysteroRoom, type ActionSender } from '@whispers/hooks';
import type { RoomState, MessagePayload } from '../types';

const APP_ID = 'whispers-p2p-chat';

interface UseRoomOptions {
  userName: string;
  onMessage?: (payload: MessagePayload) => void;
}

export function useRoom({ userName, onMessage }: UseRoomOptions) {
  const {
    state: roomState,
    join,
    reset,
    createAction,
  } = useTrysteroRoom({
    appId: APP_ID,
    userName,
  });

  const sendMsgRef = useRef<ActionSender<MessagePayload> | null>(null);
  const onMessageRef = useRef(onMessage);

  // 保持 onMessage 最新
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // 连接成功后创建消息通道
  useEffect(() => {
    if (roomState.status === 'connected' && !sendMsgRef.current) {
      const send = createAction<MessagePayload>('chat', payload => {
        onMessageRef.current?.(payload);
      });
      sendMsgRef.current = send;
    }
  }, [roomState.status, createAction]);

  // 发送消息
  const sendMessage = useCallback(
    (content: string) => {
      if (sendMsgRef.current) {
        const payload: MessagePayload = {
          content,
          senderName: userName,
          timestamp: Date.now(),
        };
        sendMsgRef.current(payload);
        return true;
      }
      return false;
    },
    [userName]
  );

  // 重置时清理消息发送引用
  const handleReset = useCallback(() => {
    sendMsgRef.current = null;
    reset();
  }, [reset]);

  // 转换状态格式以兼容现有组件
  const state: RoomState = {
    connectionState:
      roomState.status === 'idle'
        ? 'idle'
        : roomState.status === 'connecting'
          ? 'connecting'
          : roomState.status === 'connected'
            ? 'connected'
            : 'disconnected',
    roomCode: roomState.roomCode,
    peerCount: roomState.peerCount,
    peers: roomState.peers,
    error: roomState.error,
  };

  return {
    state,
    joinRoom: join,
    sendMessage,
    leaveRoom: handleReset,
    reset: handleReset,
  };
}
