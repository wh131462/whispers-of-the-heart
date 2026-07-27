import { useCallback, useEffect, useRef, useState } from 'react';
import { useTrysteroRoom, type ActionSender } from '@whispers/hooks';
import type {
  RoomState,
  FileTransferItem,
  FileMetadata,
  FileChunk,
  TransferAck,
  TransferProgress,
  TransferFinalize,
  TransferVerification,
} from '../types';
import {
  base64ToBytes,
  chunkArrayBuffer,
  countReceivedChunks,
  findFirstMissingChunk,
  getChunkByteLength,
  sha256Hex,
} from './transfer-utils';

const APP_ID = 'whispers-p2p-file-transfer';
const PROTOCOL_VERSION = 1;
const CHUNK_SIZE = 16 * 1024;
const ACK_EVERY_CHUNKS = 8;
const MAX_CHECKSUM_RETRIES = 2;
const VERIFICATION_TIMEOUT_MS = 15_000;

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
  sendProgress: ActionSender<TransferProgress> | null;
  sendFinalize: ActionSender<TransferFinalize> | null;
  sendVerification: ActionSender<TransferVerification> | null;
}

interface SendQueueItem {
  chunks: string[];
  metadata: FileMetadata;
  targetPeerId: string;
  checksumRetries: number;
  sending: boolean;
  runId: number;
}

interface ReceiveBuffer {
  metadata: FileMetadata;
  peerId: string;
  chunks: Array<string | undefined>;
  receivedBytes: number;
  accepted: boolean;
  requestShown: boolean;
  checksumRetries: number;
  lastProgressAt: number;
  lastProgressChunk: number;
  verifiedBlob?: Blob;
}

function getProgress(buffer: ReceiveBuffer): TransferProgress {
  const receivedChunks = countReceivedChunks(buffer.chunks);
  return {
    fileId: buffer.metadata.fileId,
    nextChunkIndex: findFirstMissingChunk(
      buffer.chunks,
      buffer.metadata.totalChunks
    ),
    receivedChunks,
    receivedBytes: buffer.receivedBytes,
    totalChunks: buffer.metadata.totalChunks,
  };
}

function createEmptySenders(): ActionSenders {
  return {
    sendMetadata: null,
    sendChunk: null,
    sendAck: null,
    sendProgress: null,
    sendFinalize: null,
    sendVerification: null,
  };
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
    waitForDataChannelDrain,
    isDataChannelOpen,
  } = useTrysteroRoom({
    appId: APP_ID,
    userName,
  });

  const [transfers, setTransfers] = useState<FileTransferItem[]>([]);
  const sendersRef = useRef<ActionSenders>(createEmptySenders());
  const sendQueueRef = useRef<Map<string, SendQueueItem>>(new Map());
  const receiveBufferRef = useRef<Map<string, ReceiveBuffer>>(new Map());
  const verificationTimersRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  const peersRef = useRef(roomState.peers);
  const onFileReceiveRequestRef = useRef(onFileReceiveRequest);

  useEffect(() => {
    onFileReceiveRequestRef.current = onFileReceiveRequest;
  }, [onFileReceiveRequest]);

  useEffect(() => {
    peersRef.current = roomState.peers;
  }, [roomState.peers]);

  const generateFileId = useCallback(
    () => `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const updateTransfer = useCallback(
    (fileId: string, updates: Partial<FileTransferItem>) => {
      setTransfers(prev =>
        prev.map(item => (item.id === fileId ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const clearVerificationTimer = useCallback((fileId: string) => {
    const timer = verificationTimersRef.current.get(fileId);
    if (timer) clearTimeout(timer);
    verificationTimersRef.current.delete(fileId);
  }, []);

  const sendProgress = useCallback((buffer: ReceiveBuffer, peerId: string) => {
    const progress = getProgress(buffer);
    sendersRef.current.sendProgress?.(progress, peerId);
    buffer.lastProgressAt = Date.now();
    buffer.lastProgressChunk = progress.nextChunkIndex;
  }, []);

  const handleMetadata = useCallback(
    (metadata: FileMetadata, peerId: string) => {
      if (
        metadata.protocolVersion !== PROTOCOL_VERSION ||
        metadata.size < 0 ||
        metadata.chunkSize <= 0 ||
        !/^[a-f\d]{64}$/i.test(metadata.checksum)
      ) {
        sendersRef.current.sendAck?.(
          {
            fileId: metadata.fileId,
            accepted: false,
            reason: '文件元数据无效或协议版本不兼容',
            nextChunkIndex: 0,
            receivedChunks: 0,
            receivedBytes: 0,
          },
          peerId
        );
        return;
      }
      const expectedChunks = Math.max(
        1,
        Math.ceil(metadata.size / metadata.chunkSize)
      );
      if (metadata.totalChunks !== expectedChunks) {
        sendersRef.current.sendAck?.(
          {
            fileId: metadata.fileId,
            accepted: false,
            reason: '文件分块数量与大小不一致',
            nextChunkIndex: 0,
            receivedChunks: 0,
            receivedBytes: 0,
          },
          peerId
        );
        return;
      }

      let buffer = receiveBufferRef.current.get(metadata.fileId);
      if (buffer) {
        if (
          buffer.peerId !== peerId ||
          buffer.metadata.checksum !== metadata.checksum ||
          buffer.metadata.size !== metadata.size
        ) {
          sendersRef.current.sendAck?.(
            {
              fileId: metadata.fileId,
              accepted: false,
              reason: '文件会话标识冲突',
              nextChunkIndex: 0,
              receivedChunks: 0,
              receivedBytes: 0,
            },
            peerId
          );
          return;
        }
      } else {
        buffer = {
          metadata,
          peerId,
          chunks: new Array<string | undefined>(metadata.totalChunks),
          receivedBytes: 0,
          accepted: false,
          requestShown: false,
          checksumRetries: 0,
          lastProgressAt: 0,
          lastProgressChunk: -1,
        };
        receiveBufferRef.current.set(metadata.fileId, buffer);
        setTransfers(prev => {
          if (prev.some(item => item.id === metadata.fileId)) return prev;
          return [
            ...prev,
            {
              id: metadata.fileId,
              name: metadata.name,
              size: metadata.size,
              type: metadata.type,
              progress: 0,
              status: 'pending',
              direction: 'receive',
              peerId,
              peerName: metadata.senderName || '对方',
            },
          ];
        });
      }

      const accept = () => {
        if (!buffer) return;
        buffer.accepted = true;
        if (!buffer.verifiedBlob) {
          updateTransfer(metadata.fileId, {
            status: 'transferring',
            error: undefined,
          });
        }
        const progress = getProgress(buffer);
        sendersRef.current.sendAck?.(
          {
            fileId: metadata.fileId,
            accepted: true,
            reason: null,
            nextChunkIndex: progress.nextChunkIndex,
            receivedChunks: progress.receivedChunks,
            receivedBytes: progress.receivedBytes,
          },
          peerId
        );
      };

      const reject = () => {
        updateTransfer(metadata.fileId, {
          status: 'failed',
          error: '已拒绝接收',
        });
        receiveBufferRef.current.delete(metadata.fileId);
        sendersRef.current.sendAck?.(
          {
            fileId: metadata.fileId,
            accepted: false,
            reason: '对方拒绝接收',
            nextChunkIndex: 0,
            receivedChunks: 0,
            receivedBytes: 0,
          },
          peerId
        );
      };

      if (buffer.accepted) {
        accept();
      } else if (onFileReceiveRequestRef.current) {
        if (buffer.requestShown) return;
        buffer.requestShown = true;
        onFileReceiveRequestRef.current(metadata, accept, reject);
      } else {
        accept();
      }
    },
    [updateTransfer]
  );

  const handleChunk = useCallback(
    (chunk: FileChunk, peerId: string) => {
      const buffer = receiveBufferRef.current.get(chunk.fileId);
      if (
        !buffer ||
        !buffer.accepted ||
        buffer.peerId !== peerId ||
        chunk.chunkIndex < 0 ||
        chunk.chunkIndex >= buffer.metadata.totalChunks ||
        typeof chunk.data !== 'string'
      ) {
        return;
      }

      if (buffer.chunks[chunk.chunkIndex] === undefined) {
        try {
          const expectedBytes = getChunkByteLength(
            chunk.chunkIndex,
            buffer.metadata.size,
            buffer.metadata.chunkSize
          );
          if (base64ToBytes(chunk.data).byteLength !== expectedBytes) {
            sendProgress(buffer, peerId);
            return;
          }
        } catch {
          sendProgress(buffer, peerId);
          return;
        }
        buffer.chunks[chunk.chunkIndex] = chunk.data;
        buffer.receivedBytes += getChunkByteLength(
          chunk.chunkIndex,
          buffer.metadata.size,
          buffer.metadata.chunkSize
        );
      }

      const progress = getProgress(buffer);
      const percent = buffer.metadata.size
        ? Math.min(
            99,
            Math.round((progress.receivedBytes / buffer.metadata.size) * 100)
          )
        : 99;
      updateTransfer(chunk.fileId, {
        progress: percent,
        status: 'transferring',
        error: undefined,
      });

      const shouldAck =
        progress.nextChunkIndex - buffer.lastProgressChunk >=
          ACK_EVERY_CHUNKS ||
        Date.now() - buffer.lastProgressAt >= 250 ||
        progress.nextChunkIndex === buffer.metadata.totalChunks;
      if (shouldAck) sendProgress(buffer, peerId);
    },
    [sendProgress, updateTransfer]
  );

  const sendChunksAsync = useCallback(
    async (fileId: string, startIndex: number) => {
      const queueItem = sendQueueRef.current.get(fileId);
      if (!queueItem || queueItem.sending) return;
      queueItem.sending = true;
      const runId = ++queueItem.runId;
      updateTransfer(fileId, {
        status: 'transferring',
        error: undefined,
      });

      try {
        for (
          let index = Math.max(0, startIndex);
          index < queueItem.chunks.length;
          index += 1
        ) {
          if (!sendQueueRef.current.has(fileId)) return;
          if (queueItem.runId !== runId) return;
          if (
            !peersRef.current.has(queueItem.targetPeerId) ||
            !isDataChannelOpen(queueItem.targetPeerId)
          ) {
            updateTransfer(fileId, {
              status: 'paused',
              error: '连接已断开，等待重连',
            });
            return;
          }

          await waitForDataChannelDrain(queueItem.targetPeerId);
          sendersRef.current.sendChunk?.(
            {
              fileId,
              chunkIndex: index,
              data: queueItem.chunks[index],
              isLast: index === queueItem.chunks.length - 1,
            },
            queueItem.targetPeerId
          );

          if ((index + 1) % ACK_EVERY_CHUNKS === 0) {
            await new Promise<void>(resolve => setTimeout(resolve, 10));
          }
        }

        sendersRef.current.sendFinalize?.(
          {
            fileId,
            size: queueItem.metadata.size,
            totalChunks: queueItem.metadata.totalChunks,
            checksum: queueItem.metadata.checksum,
          },
          queueItem.targetPeerId
        );
        clearVerificationTimer(fileId);
        verificationTimersRef.current.set(
          fileId,
          setTimeout(() => {
            if (sendQueueRef.current.has(fileId)) {
              updateTransfer(fileId, {
                status: 'paused',
                error: '等待接收端校验超时，等待重连后重试',
              });
            }
            verificationTimersRef.current.delete(fileId);
          }, VERIFICATION_TIMEOUT_MS)
        );
        updateTransfer(fileId, { status: 'verifying', progress: 99 });
      } finally {
        queueItem.sending = false;
      }
    },
    [
      clearVerificationTimer,
      isDataChannelOpen,
      updateTransfer,
      waitForDataChannelDrain,
    ]
  );

  const handleAck = useCallback(
    (ack: TransferAck, _peerId: string) => {
      const queueItem = sendQueueRef.current.get(ack.fileId);
      if (!queueItem || queueItem.targetPeerId !== _peerId) return;
      if (!ack.accepted) {
        updateTransfer(ack.fileId, {
          status: 'failed',
          error: ack.reason || '对方拒绝接收',
        });
        sendQueueRef.current.delete(ack.fileId);
        return;
      }

      updateTransfer(ack.fileId, {
        status: 'transferring',
        progress: queueItem.metadata.size
          ? Math.round((ack.receivedBytes / queueItem.metadata.size) * 100)
          : 0,
      });
      void sendChunksAsync(ack.fileId, ack.nextChunkIndex);
    },
    [sendChunksAsync, updateTransfer]
  );

  const handleProgress = useCallback(
    (progress: TransferProgress, _peerId: string) => {
      const queueItem = sendQueueRef.current.get(progress.fileId);
      if (!queueItem || queueItem.targetPeerId !== _peerId) return;
      const percent = queueItem.metadata.size
        ? Math.min(
            99,
            Math.round((progress.receivedBytes / queueItem.metadata.size) * 100)
          )
        : 99;
      updateTransfer(progress.fileId, { progress: percent });
    },
    [updateTransfer]
  );

  const handleFinalize = useCallback(
    async (finalize: TransferFinalize, peerId: string) => {
      const buffer = receiveBufferRef.current.get(finalize.fileId);
      if (!buffer || buffer.peerId !== peerId || !buffer.accepted) return;

      if (buffer.verifiedBlob) {
        sendersRef.current.sendVerification?.(
          {
            fileId: finalize.fileId,
            verified: true,
            nextChunkIndex: buffer.metadata.totalChunks,
            reason: null,
            retryable: false,
          },
          peerId
        );
        return;
      }

      const progress = getProgress(buffer);
      if (
        progress.nextChunkIndex < buffer.metadata.totalChunks ||
        finalize.size !== buffer.metadata.size ||
        finalize.checksum !== buffer.metadata.checksum
      ) {
        sendProgress(buffer, peerId);
        sendersRef.current.sendVerification?.(
          {
            fileId: finalize.fileId,
            verified: false,
            nextChunkIndex: progress.nextChunkIndex,
            reason: '文件仍缺少分块',
            retryable: true,
          },
          peerId
        );
        return;
      }

      updateTransfer(finalize.fileId, { status: 'verifying', progress: 99 });
      try {
        const blob = new Blob(
          buffer.chunks.map(chunk => base64ToBytes(chunk ?? '')),
          { type: buffer.metadata.type }
        );
        const checksum = await sha256Hex(blob);
        if (
          blob.size !== buffer.metadata.size ||
          checksum !== buffer.metadata.checksum
        ) {
          buffer.checksumRetries += 1;
          const retryable = buffer.checksumRetries <= MAX_CHECKSUM_RETRIES;
          if (retryable) {
            buffer.chunks = new Array<string | undefined>(
              buffer.metadata.totalChunks
            );
            buffer.receivedBytes = 0;
          }
          sendersRef.current.sendVerification?.(
            {
              fileId: finalize.fileId,
              verified: false,
              nextChunkIndex: 0,
              reason: '文件完整性校验失败',
              retryable,
            },
            peerId
          );
          updateTransfer(finalize.fileId, {
            status: retryable ? 'paused' : 'failed',
            progress: 0,
            error: retryable ? '校验失败，准备重试' : '校验失败，已停止传输',
          });
          if (!retryable) receiveBufferRef.current.delete(finalize.fileId);
          return;
        }

        updateTransfer(finalize.fileId, {
          status: 'completed',
          progress: 100,
          blob,
          verified: true,
          error: undefined,
        });
        buffer.verifiedBlob = blob;
        sendersRef.current.sendVerification?.(
          {
            fileId: finalize.fileId,
            verified: true,
            nextChunkIndex: buffer.metadata.totalChunks,
            reason: null,
            retryable: false,
          },
          peerId
        );
      } catch {
        buffer.checksumRetries += 1;
        const retryable = buffer.checksumRetries <= MAX_CHECKSUM_RETRIES;
        if (retryable) {
          buffer.chunks = new Array<string | undefined>(
            buffer.metadata.totalChunks
          );
          buffer.receivedBytes = 0;
        }
        updateTransfer(finalize.fileId, {
          status: retryable ? 'paused' : 'failed',
          progress: retryable ? 0 : 99,
          error: retryable ? '校验失败，准备重试' : '校验失败，已停止传输',
        });
        sendersRef.current.sendVerification?.(
          {
            fileId: finalize.fileId,
            verified: false,
            nextChunkIndex: retryable ? 0 : progress.nextChunkIndex,
            reason: retryable ? '文件校验失败' : '文件校验失败，已停止传输',
            retryable,
          },
          peerId
        );
        if (!retryable) receiveBufferRef.current.delete(finalize.fileId);
      }
    },
    [sendProgress, updateTransfer]
  );

  const handleVerification = useCallback(
    (verification: TransferVerification, _peerId: string) => {
      const queueItem = sendQueueRef.current.get(verification.fileId);
      if (!queueItem || queueItem.targetPeerId !== _peerId) return;
      clearVerificationTimer(verification.fileId);
      if (verification.verified) {
        updateTransfer(verification.fileId, {
          status: 'completed',
          progress: 100,
          verified: true,
          error: undefined,
        });
        sendQueueRef.current.delete(verification.fileId);
        return;
      }
      if (
        verification.retryable &&
        queueItem.checksumRetries < MAX_CHECKSUM_RETRIES
      ) {
        queueItem.checksumRetries += 1;
        updateTransfer(verification.fileId, {
          status: 'paused',
          progress: 0,
          error: verification.reason || '校验失败，准备重试',
        });
        void sendChunksAsync(verification.fileId, verification.nextChunkIndex);
        return;
      }
      updateTransfer(verification.fileId, {
        status: 'failed',
        error: verification.reason || '接收端校验失败',
      });
      clearVerificationTimer(verification.fileId);
      sendQueueRef.current.delete(verification.fileId);
    },
    [clearVerificationTimer, sendChunksAsync, updateTransfer]
  );

  useEffect(() => {
    if (roomState.status !== 'connected') return;
    sendersRef.current.sendMetadata = createAction<FileMetadata>(
      'file-metadata',
      handleMetadata
    );
    sendersRef.current.sendChunk = createAction<FileChunk>(
      'file-chunk',
      handleChunk,
      { requireDataChannel: true }
    );
    sendersRef.current.sendAck = createAction<TransferAck>(
      'file-ack',
      handleAck
    );
    sendersRef.current.sendProgress = createAction<TransferProgress>(
      'file-progress',
      handleProgress
    );
    sendersRef.current.sendFinalize = createAction<TransferFinalize>(
      'file-finalize',
      handleFinalize
    );
    sendersRef.current.sendVerification = createAction<TransferVerification>(
      'file-verification',
      handleVerification
    );
  }, [
    createAction,
    handleAck,
    handleChunk,
    handleFinalize,
    handleMetadata,
    handleProgress,
    handleVerification,
    roomState.status,
  ]);

  useEffect(() => {
    if (roomState.status !== 'connected') {
      setTransfers(prev =>
        prev.map(item =>
          item.status === 'transferring' || item.status === 'verifying'
            ? {
                ...item,
                status: 'paused',
                error: '连接已断开，等待重连',
              }
            : item
        )
      );
      return;
    }

    setTransfers(prev =>
      prev.map(item =>
        (item.status === 'transferring' || item.status === 'verifying') &&
        !roomState.readyPeers.has(item.peerId)
          ? {
              ...item,
              status: 'paused',
              error: '数据通道已断开，等待重连',
            }
          : item
      )
    );

    sendQueueRef.current.forEach(queueItem => {
      if (!roomState.readyPeers.has(queueItem.targetPeerId)) return;
      queueItem.runId += 1;
      queueItem.sending = false;
      sendersRef.current.sendMetadata?.(
        queueItem.metadata,
        queueItem.targetPeerId
      );
    });
  }, [roomState.status, roomState.peers, roomState.readyPeers]);

  const sendFile = useCallback(
    async (file: File, targetPeerId?: string) => {
      if (!sendersRef.current.sendMetadata) return;
      const targetPeer = targetPeerId
        ? roomState.peers.get(targetPeerId)
        : roomState.peers.values().next().value;
      if (!targetPeer) return;

      const fileId = generateFileId();
      const arrayBuffer = await file.arrayBuffer();
      const chunks = chunkArrayBuffer(arrayBuffer, CHUNK_SIZE);
      const metadata: FileMetadata = {
        protocolVersion: PROTOCOL_VERSION,
        fileId,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        chunkSize: CHUNK_SIZE,
        totalChunks: chunks.length,
        checksum: await sha256Hex(arrayBuffer),
        senderName: userName,
      };

      sendQueueRef.current.set(fileId, {
        chunks,
        metadata,
        targetPeerId: targetPeer.id,
        checksumRetries: 0,
        sending: false,
        runId: 0,
      });
      setTransfers(prev => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          size: file.size,
          type: metadata.type,
          progress: 0,
          status: 'pending',
          direction: 'send',
          peerId: targetPeer.id,
          peerName: targetPeer.name,
        },
      ]);
      sendersRef.current.sendMetadata(metadata, targetPeer.id);
    },
    [generateFileId, roomState.peers, userName]
  );

  const downloadFile = useCallback(
    (fileId: string) => {
      const item = transfers.find(transfer => transfer.id === fileId);
      if (!item?.blob) return;
      const url = URL.createObjectURL(item.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = item.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    },
    [transfers]
  );

  const removeTransfer = useCallback((fileId: string) => {
    setTransfers(prev => prev.filter(item => item.id !== fileId));
    sendQueueRef.current.delete(fileId);
    receiveBufferRef.current.delete(fileId);
    const timer = verificationTimersRef.current.get(fileId);
    if (timer) clearTimeout(timer);
    verificationTimersRef.current.delete(fileId);
  }, []);

  const clearTransfers = useCallback(() => {
    setTransfers([]);
    sendQueueRef.current.clear();
    receiveBufferRef.current.clear();
    verificationTimersRef.current.forEach(timer => clearTimeout(timer));
    verificationTimersRef.current.clear();
  }, []);

  const handleReset = useCallback(() => {
    sendersRef.current = createEmptySenders();
    clearTransfers();
    reset();
  }, [clearTransfers, reset]);

  useEffect(() => {
    return () => {
      verificationTimersRef.current.forEach(timer => clearTimeout(timer));
      verificationTimersRef.current.clear();
    };
  }, []);

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
