import { useCallback, useEffect, useRef, useState } from 'react';
import { useTrysteroRoom, type ActionSender } from '@whispers/hooks';
import type {
  RoomState,
  FileTransferItem,
  FileMetadata,
  FileChunk,
  TransferAck,
} from '../types';

const APP_ID = 'whispers-p2p-file-transfer';
const CHUNK_SIZE = 16 * 1024; // 16KB per chunk

interface UseFileTransferOptions {
  userName: string;
  onFileReceiveRequest?: (
    metadata: FileMetadata,
    accept: () => void,
    reject: () => void
  ) => void;
}

interface ActionSenders {
  sendMetadata: ActionSender<FileMetadata> | null;
  sendChunk: ActionSender<FileChunk> | null;
  sendAck: ActionSender<TransferAck> | null;
}

export function useFileTransfer({
  userName,
  onFileReceiveRequest,
}: UseFileTransferOptions) {
  const {
    state: roomState,
    join,
    reset,
    createAction,
  } = useTrysteroRoom({
    appId: APP_ID,
    userName,
  });

  const [transfers, setTransfers] = useState<FileTransferItem[]>([]);
  const sendersRef = useRef<ActionSenders>({
    sendMetadata: null,
    sendChunk: null,
    sendAck: null,
  });

  // 发送队列：存储待发送文件的数据
  const sendQueueRef = useRef<Map<string, { file: File; chunks: string[] }>>(
    new Map()
  );
  // 接收缓冲区：存储接收中文件的分块
  const receiveBufferRef = useRef<
    Map<string, { metadata: FileMetadata; chunks: string[] }>
  >(new Map());
  // 保持回调最新
  const onFileReceiveRequestRef = useRef(onFileReceiveRequest);

  useEffect(() => {
    onFileReceiveRequestRef.current = onFileReceiveRequest;
  }, [onFileReceiveRequest]);

  // 生成文件 ID
  const generateFileId = useCallback(() => {
    return `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }, []);

  // 更新传输项
  const updateTransfer = useCallback(
    (fileId: string, updates: Partial<FileTransferItem>) => {
      setTransfers(prev =>
        prev.map(item => (item.id === fileId ? { ...item, ...updates } : item))
      );
    },
    []
  );

  // 处理接收到的文件元数据
  const handleMetadata = useCallback(
    (metadata: FileMetadata, peerId: string) => {
      const peerName = metadata.senderName || '对方';

      // 添加到传输列表
      const newItem: FileTransferItem = {
        id: metadata.fileId,
        name: metadata.name,
        size: metadata.size,
        type: metadata.type,
        progress: 0,
        status: 'pending',
        direction: 'receive',
        peerId,
        peerName,
      };
      setTransfers(prev => [...prev, newItem]);

      // 初始化接收缓冲区
      receiveBufferRef.current.set(metadata.fileId, {
        metadata,
        chunks: new Array(metadata.totalChunks),
      });

      // 调用回调或自动接受
      const accept = () => {
        updateTransfer(metadata.fileId, { status: 'transferring' });
        sendersRef.current.sendAck?.(
          { fileId: metadata.fileId, accepted: true, reason: null },
          peerId
        );
      };

      const reject = () => {
        updateTransfer(metadata.fileId, { status: 'failed', error: '已拒绝' });
        receiveBufferRef.current.delete(metadata.fileId);
        sendersRef.current.sendAck?.(
          { fileId: metadata.fileId, accepted: false, reason: '对方拒绝接收' },
          peerId
        );
      };

      if (onFileReceiveRequestRef.current) {
        onFileReceiveRequestRef.current(metadata, accept, reject);
      } else {
        accept();
      }
    },
    [updateTransfer]
  );

  // 处理接收到的文件分块
  const handleChunk = useCallback(
    (chunk: FileChunk, _peerId: string) => {
      const buffer = receiveBufferRef.current.get(chunk.fileId);
      if (!buffer) return;

      // 存储分块
      buffer.chunks[chunk.chunkIndex] = chunk.data;

      // 计算进度
      const receivedCount = buffer.chunks.filter(Boolean).length;
      const progress = Math.round(
        (receivedCount / buffer.metadata.totalChunks) * 100
      );
      updateTransfer(chunk.fileId, { progress });

      // 检查是否完成
      if (chunk.isLast || receivedCount === buffer.metadata.totalChunks) {
        // 合并所有分块
        const allChunksReceived = buffer.chunks.every(Boolean);
        if (allChunksReceived) {
          try {
            // 将 base64 分块转换为 Blob
            const binaryChunks = buffer.chunks.map(base64 => {
              const binary = atob(base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              return bytes;
            });
            const blob = new Blob(binaryChunks, { type: buffer.metadata.type });

            updateTransfer(chunk.fileId, {
              progress: 100,
              status: 'completed',
              blob,
            });
          } catch {
            updateTransfer(chunk.fileId, {
              status: 'failed',
              error: '文件合并失败',
            });
          }
          receiveBufferRef.current.delete(chunk.fileId);
        }
      }
    },
    [updateTransfer]
  );

  // 异步发送文件分块（带流量控制）
  const sendChunksAsync = useCallback(
    async (fileId: string, chunks: string[]) => {
      const BATCH_SIZE = 5; // 每批发送的分块数
      const BATCH_DELAY = 50; // 批次间延迟（毫秒）

      for (let i = 0; i < chunks.length; i++) {
        // 检查传输是否被取消
        if (!sendQueueRef.current.has(fileId)) {
          return;
        }

        sendersRef.current.sendChunk?.({
          fileId,
          chunkIndex: i,
          data: chunks[i],
          isLast: i === chunks.length - 1,
        });

        // 更新发送进度
        const progress = Math.round(((i + 1) / chunks.length) * 100);
        updateTransfer(fileId, { progress });

        // 每发送一批后暂停，让 DataChannel 有时间处理
        if ((i + 1) % BATCH_SIZE === 0 && i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      updateTransfer(fileId, { status: 'completed', progress: 100 });
      sendQueueRef.current.delete(fileId);
    },
    [updateTransfer]
  );

  // 处理接收确认
  const handleAck = useCallback(
    (ack: TransferAck, _peerId: string) => {
      if (ack.accepted) {
        // 开始发送文件分块
        const queueItem = sendQueueRef.current.get(ack.fileId);
        if (queueItem) {
          updateTransfer(ack.fileId, { status: 'transferring' });
          // 异步发送分块
          sendChunksAsync(ack.fileId, queueItem.chunks);
        }
      } else {
        updateTransfer(ack.fileId, {
          status: 'failed',
          error: ack.reason || '对方拒绝接收',
        });
        sendQueueRef.current.delete(ack.fileId);
      }
    },
    [updateTransfer, sendChunksAsync]
  );

  // 连接成功后创建消息通道
  useEffect(() => {
    if (roomState.status === 'connected') {
      sendersRef.current.sendMetadata = createAction<FileMetadata>(
        'file-metadata',
        handleMetadata
      );
      sendersRef.current.sendChunk = createAction<FileChunk>(
        'file-chunk',
        handleChunk
      );
      sendersRef.current.sendAck = createAction<TransferAck>(
        'file-ack',
        handleAck
      );
    }
  }, [roomState.status, createAction, handleMetadata, handleChunk, handleAck]);

  // 发送文件
  const sendFile = useCallback(
    async (file: File, targetPeerId?: string) => {
      if (!sendersRef.current.sendMetadata) return;

      const fileId = generateFileId();
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // 读取文件并分块
      const arrayBuffer = await file.arrayBuffer();
      const chunks: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunkData = arrayBuffer.slice(start, end);
        // 转换为 base64
        const bytes = new Uint8Array(chunkData);
        let binary = '';
        bytes.forEach(byte => {
          binary += String.fromCharCode(byte);
        });
        chunks.push(btoa(binary));
      }

      // 存储到发送队列
      sendQueueRef.current.set(fileId, { file, chunks });

      // 获取目标 peer 名称
      const peers = roomState.peers;
      const targetPeer = targetPeerId
        ? peers.get(targetPeerId)
        : peers.values().next().value;
      const peerName = targetPeer?.name || '对方';

      // 添加到传输列表
      const newItem: FileTransferItem = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'pending',
        direction: 'send',
        peerId: targetPeerId || '',
        peerName,
      };
      setTransfers(prev => [...prev, newItem]);

      // 发送元数据
      const metadata: FileMetadata = {
        fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        totalChunks,
        senderName: userName,
      };
      sendersRef.current.sendMetadata(metadata, targetPeerId);
    },
    [generateFileId, roomState.peers, userName]
  );

  // 下载已接收的文件
  const downloadFile = useCallback(
    (fileId: string) => {
      const item = transfers.find(t => t.id === fileId);
      if (item?.blob) {
        const url = URL.createObjectURL(item.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    },
    [transfers]
  );

  // 移除传输记录
  const removeTransfer = useCallback((fileId: string) => {
    setTransfers(prev => prev.filter(t => t.id !== fileId));
    sendQueueRef.current.delete(fileId);
    receiveBufferRef.current.delete(fileId);
  }, []);

  // 清空所有传输记录
  const clearTransfers = useCallback(() => {
    setTransfers([]);
    sendQueueRef.current.clear();
    receiveBufferRef.current.clear();
  }, []);

  // 重置时清理
  const handleReset = useCallback(() => {
    sendersRef.current = {
      sendMetadata: null,
      sendChunk: null,
      sendAck: null,
    };
    clearTransfers();
    reset();
  }, [reset, clearTransfers]);

  // 转换状态格式
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
    transfers,
    joinRoom: join,
    sendFile,
    downloadFile,
    removeTransfer,
    clearTransfers,
    reset: handleReset,
  };
}
