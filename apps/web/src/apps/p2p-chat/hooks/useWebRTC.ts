import { useCallback, useEffect, useRef } from 'react';
import { useTrysteroRoom, type ActionSender } from '@whispers/hooks';
import type { RoomState, MessagePayload } from '../types';

const APP_ID = 'whispers-p2p-chat';

// 分块大小：16KB（WebRTC 安全范围内）
const CHUNK_SIZE = 16 * 1024;

// 分块消息类型
type ChunkPayload = {
  messageId: string;
  chunkIndex: number;
  totalChunks: number;
  data: string;
  // 元数据只在第一个块发送
  meta?: {
    type: string;
    senderName: string;
    timestamp: number;
  };
};

// 生成消息 ID
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

  const sendMsgRef = useRef<ActionSender<ChunkPayload> | null>(null);
  const onMessageRef = useRef(onMessage);

  // 存储接收中的分块消息
  const pendingChunksRef = useRef<
    Map<
      string,
      {
        chunks: Map<number, string>;
        totalChunks: number;
        meta?: ChunkPayload['meta'];
      }
    >
  >(new Map());

  // 保持 onMessage 最新
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // 处理接收到的分块
  const handleChunk = useCallback((chunk: ChunkPayload) => {
    const { messageId, chunkIndex, totalChunks, data, meta } = chunk;

    // 获取或创建待处理消息
    let pending = pendingChunksRef.current.get(messageId);
    if (!pending) {
      pending = { chunks: new Map(), totalChunks };
      pendingChunksRef.current.set(messageId, pending);
    }

    // 存储分块
    pending.chunks.set(chunkIndex, data);

    // 存储元数据（来自第一个块）
    if (meta) {
      pending.meta = meta;
    }

    // 检查是否所有分块都已接收
    if (pending.chunks.size === totalChunks && pending.meta) {
      // 按顺序组装完整内容
      let fullContent = '';
      for (let i = 0; i < totalChunks; i++) {
        fullContent += pending.chunks.get(i) || '';
      }

      // 构建完整消息
      const payload: MessagePayload = {
        type: pending.meta.type,
        content: fullContent,
        senderName: pending.meta.senderName,
        timestamp: pending.meta.timestamp,
      };

      // 清理
      pendingChunksRef.current.delete(messageId);

      // 回调
      onMessageRef.current?.(payload);
    }
  }, []);

  // 连接成功后创建消息通道
  useEffect(() => {
    if (roomState.status === 'connected' && !sendMsgRef.current) {
      const send = createAction<ChunkPayload>('chat-chunk', handleChunk);
      sendMsgRef.current = send;
    }
  }, [roomState.status, createAction, handleChunk]);

  // 发送消息（自动分块）
  const sendMessage = useCallback(
    (content: string, type: string = 'text') => {
      if (!sendMsgRef.current) return false;

      const messageId = generateMessageId();
      const totalChunks = Math.ceil(content.length / CHUNK_SIZE);

      // 分块发送
      for (let i = 0; i < totalChunks; i++) {
        const chunkData = content.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

        const chunk: ChunkPayload = {
          messageId,
          chunkIndex: i,
          totalChunks,
          data: chunkData,
        };

        // 第一个块包含元数据
        if (i === 0) {
          chunk.meta = {
            type,
            senderName: userName,
            timestamp: Date.now(),
          };
        }

        sendMsgRef.current(chunk);
      }

      return true;
    },
    [userName]
  );

  // 重置时清理
  const handleReset = useCallback(() => {
    sendMsgRef.current = null;
    pendingChunksRef.current.clear();
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
