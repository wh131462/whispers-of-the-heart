import { useCallback, useEffect, useRef } from 'react';
import { useTrysteroRoom, type ActionSender } from '@whispers/hooks';
import type {
  ChatAck,
  ChatChunk,
  ChatFinalize,
  ChatMetadata,
  ChatProgress,
  ChatVerification,
  DeliveryUpdate,
  MessagePayload,
  OutgoingChatMessage,
  PeerDeliveryStatus,
  RoomState,
} from '../types';
import {
  assembleChunks,
  base64ToBytes,
  chunkUtf8Content,
  countReceivedChunks,
  decodeUtf8,
  findFirstMissingChunk,
  getChunkByteLength,
  sha256Hex,
} from './chat-transfer-utils';

const APP_ID = 'whispers-p2p-chat';
const PROTOCOL_VERSION = 1;
const CHUNK_SIZE = 16 * 1024;
const ACK_EVERY_CHUNKS = 8;
const MAX_MESSAGE_BYTES = 8 * 1024 * 1024;
const MAX_MESSAGE_CHUNKS = Math.ceil(MAX_MESSAGE_BYTES / CHUNK_SIZE);
const MAX_RECEIVE_SESSIONS = 32;
const MAX_CHECKSUM_RETRIES = 2;
const MAX_VERIFICATION_ATTEMPTS = 3;
const VERIFICATION_TIMEOUT_MS = 10_000;
const RECEIVE_SESSION_TTL_MS = 5 * 60_000;
const VERIFIED_SESSION_TTL_MS = 10 * 60_000;
const RECEIVE_CLEANUP_INTERVAL_MS = 30_000;

interface UseRoomOptions {
  userName: string;
  onMessage?: (payload: MessagePayload) => void;
  onDeliveryUpdate?: (update: DeliveryUpdate) => void;
}

interface ActionSenders {
  sendMetadata: ActionSender<ChatMetadata> | null;
  sendChunk: ActionSender<ChatChunk> | null;
  sendAck: ActionSender<ChatAck> | null;
  sendProgress: ActionSender<ChatProgress> | null;
  sendFinalize: ActionSender<ChatFinalize> | null;
  sendVerification: ActionSender<ChatVerification> | null;
}

interface SendTarget {
  peerId: string;
  status: PeerDeliveryStatus;
  checksumRetries: number;
  verificationAttempts: number;
  sending: boolean;
  runId: number;
  error?: string;
}

interface SendQueueItem {
  metadata: ChatMetadata;
  chunks: string[];
  targets: Map<string, SendTarget>;
}

interface ReceiveBuffer {
  metadata: ChatMetadata;
  peerId: string;
  chunks: Array<string | undefined>;
  receivedBytes: number;
  checksumRetries: number;
  lastProgressAt: number;
  lastProgressChunk: number;
  lastActivityAt: number;
  verifying: boolean;
  delivered: boolean;
  failedReason?: string;
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

function getReceiveKey(peerId: string, messageId: string): string {
  return `${peerId}\u0000${messageId}`;
}

function getReceiveProgress(buffer: ReceiveBuffer): ChatProgress {
  return {
    messageId: buffer.metadata.messageId,
    nextChunkIndex: findFirstMissingChunk(
      buffer.chunks,
      buffer.metadata.totalChunks
    ),
    receivedChunks: countReceivedChunks(buffer.chunks),
    receivedBytes: buffer.receivedBytes,
    totalChunks: buffer.metadata.totalChunks,
  };
}

function isValidMetadata(metadata: ChatMetadata): boolean {
  if (
    !metadata ||
    typeof metadata !== 'object' ||
    metadata.protocolVersion !== PROTOCOL_VERSION ||
    typeof metadata.messageId !== 'string' ||
    metadata.messageId.length === 0 ||
    metadata.messageId.length > 128 ||
    (metadata.type !== 'text' && metadata.type !== 'image') ||
    typeof metadata.senderName !== 'string' ||
    metadata.senderName.length === 0 ||
    metadata.senderName.length > 80 ||
    !Number.isFinite(metadata.timestamp) ||
    metadata.timestamp <= 0 ||
    !Number.isInteger(metadata.byteLength) ||
    metadata.byteLength < 0 ||
    metadata.byteLength > MAX_MESSAGE_BYTES ||
    metadata.chunkSize !== CHUNK_SIZE ||
    !Number.isInteger(metadata.totalChunks) ||
    metadata.totalChunks < 1 ||
    metadata.totalChunks > MAX_MESSAGE_CHUNKS ||
    !/^[a-f\d]{64}$/i.test(metadata.checksum)
  ) {
    return false;
  }

  return (
    metadata.totalChunks ===
    Math.max(1, Math.ceil(metadata.byteLength / metadata.chunkSize))
  );
}

export function useRoom({
  userName,
  onMessage,
  onDeliveryUpdate,
}: UseRoomOptions) {
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

  const sendersRef = useRef<ActionSenders>(createEmptySenders());
  const sendQueueRef = useRef<Map<string, SendQueueItem>>(new Map());
  const receiveBuffersRef = useRef<Map<string, ReceiveBuffer>>(new Map());
  const verificationTimersRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  const peersRef = useRef(roomState.peers);
  const readyPeersRef = useRef(roomState.readyPeers);
  const onMessageRef = useRef(onMessage);
  const onDeliveryUpdateRef = useRef(onDeliveryUpdate);
  const sessionRunRef = useRef(0);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onDeliveryUpdateRef.current = onDeliveryUpdate;
  }, [onDeliveryUpdate]);

  useEffect(() => {
    peersRef.current = roomState.peers;
    readyPeersRef.current = roomState.readyPeers;
  }, [roomState.peers, roomState.readyPeers]);

  const clearVerificationTimer = useCallback(
    (messageId: string, peerId: string) => {
      const key = getReceiveKey(peerId, messageId);
      const timer = verificationTimersRef.current.get(key);
      if (timer) clearTimeout(timer);
      verificationTimersRef.current.delete(key);
    },
    []
  );

  const notifyDelivery = useCallback(
    (messageId: string) => {
      const queueItem = sendQueueRef.current.get(messageId);
      if (!queueItem) return;

      const targets = Array.from(queueItem.targets.values());
      const totalPeers = targets.length;
      const deliveredPeers = targets.filter(
        target => target.status === 'delivered'
      ).length;
      const failedTargets = targets.filter(
        target => target.status === 'failed'
      );
      const settledPeers = deliveredPeers + failedTargets.length;

      let status: DeliveryUpdate['status'] = 'sending';
      if (deliveredPeers === totalPeers) status = 'delivered';
      else if (settledPeers === totalPeers && deliveredPeers > 0)
        status = 'partial';
      else if (failedTargets.length === totalPeers) status = 'failed';

      onDeliveryUpdateRef.current?.({
        messageId,
        status,
        deliveredPeers,
        totalPeers,
        error:
          status === 'partial' || status === 'failed'
            ? failedTargets.map(target => target.error).find(Boolean)
            : undefined,
      });

      if (status === 'delivered') {
        targets.forEach(target =>
          clearVerificationTimer(messageId, target.peerId)
        );
        sendQueueRef.current.delete(messageId);
      }
    },
    [clearVerificationTimer]
  );

  const sendReceiveProgress = useCallback(
    (buffer: ReceiveBuffer, peerId: string) => {
      const progress = getReceiveProgress(buffer);
      sendersRef.current.sendProgress?.(progress, peerId);
      buffer.lastProgressAt = Date.now();
      buffer.lastProgressChunk = progress.nextChunkIndex;
      buffer.lastActivityAt = Date.now();
    },
    []
  );

  const handleMetadata = useCallback(
    (metadata: ChatMetadata, peerId: string) => {
      const reject = (reason: string) => {
        sendersRef.current.sendAck?.(
          {
            messageId:
              metadata && typeof metadata.messageId === 'string'
                ? metadata.messageId
                : '',
            accepted: false,
            reason,
            nextChunkIndex: 0,
            receivedChunks: 0,
            receivedBytes: 0,
          },
          peerId
        );
      };

      if (!isValidMetadata(metadata)) {
        reject('消息元数据无效或协议版本不兼容');
        return;
      }

      const key = getReceiveKey(peerId, metadata.messageId);
      let buffer = receiveBuffersRef.current.get(key);
      if (buffer) {
        if (
          buffer.metadata.checksum !== metadata.checksum ||
          buffer.metadata.byteLength !== metadata.byteLength ||
          buffer.metadata.totalChunks !== metadata.totalChunks ||
          buffer.metadata.type !== metadata.type ||
          buffer.metadata.senderName !== metadata.senderName ||
          buffer.metadata.timestamp !== metadata.timestamp
        ) {
          reject('消息会话标识冲突');
          return;
        }
        if (buffer.failedReason) {
          reject(buffer.failedReason);
          return;
        }
      } else {
        if (receiveBuffersRef.current.size >= MAX_RECEIVE_SESSIONS) {
          reject('接收队列已满，请稍后重试');
          return;
        }
        buffer = {
          metadata,
          peerId,
          chunks: new Array<string | undefined>(metadata.totalChunks),
          receivedBytes: 0,
          checksumRetries: 0,
          lastProgressAt: 0,
          lastProgressChunk: -1,
          lastActivityAt: Date.now(),
          verifying: false,
          delivered: false,
        };
        receiveBuffersRef.current.set(key, buffer);
      }

      buffer.lastActivityAt = Date.now();
      const progress = buffer.delivered
        ? {
            messageId: metadata.messageId,
            nextChunkIndex: metadata.totalChunks,
            receivedChunks: metadata.totalChunks,
            receivedBytes: metadata.byteLength,
            totalChunks: metadata.totalChunks,
          }
        : getReceiveProgress(buffer);
      sendersRef.current.sendAck?.(
        {
          messageId: metadata.messageId,
          accepted: true,
          reason: null,
          nextChunkIndex: progress.nextChunkIndex,
          receivedChunks: progress.receivedChunks,
          receivedBytes: progress.receivedBytes,
        },
        peerId
      );
    },
    []
  );

  const handleChunk = useCallback(
    (chunk: ChatChunk, peerId: string) => {
      if (
        !chunk ||
        typeof chunk !== 'object' ||
        typeof chunk.messageId !== 'string'
      )
        return;
      const buffer = receiveBuffersRef.current.get(
        getReceiveKey(peerId, chunk.messageId)
      );
      if (
        !buffer ||
        buffer.delivered ||
        buffer.failedReason ||
        chunk.totalChunks !== buffer.metadata.totalChunks ||
        !Number.isInteger(chunk.chunkIndex) ||
        chunk.chunkIndex < 0 ||
        chunk.chunkIndex >= buffer.metadata.totalChunks ||
        !Number.isInteger(chunk.byteLength) ||
        typeof chunk.data !== 'string'
      ) {
        return;
      }

      const expectedBytes = getChunkByteLength(
        chunk.chunkIndex,
        buffer.metadata.byteLength,
        buffer.metadata.chunkSize
      );
      try {
        if (
          chunk.byteLength !== expectedBytes ||
          chunk.data.length > Math.ceil((expectedBytes * 4) / 3) + 4 ||
          base64ToBytes(chunk.data).byteLength !== expectedBytes
        ) {
          sendReceiveProgress(buffer, peerId);
          return;
        }
      } catch {
        sendReceiveProgress(buffer, peerId);
        return;
      }

      const existing = buffer.chunks[chunk.chunkIndex];
      if (existing === undefined) {
        buffer.chunks[chunk.chunkIndex] = chunk.data;
        buffer.receivedBytes += expectedBytes;
      } else if (existing !== chunk.data) {
        sendReceiveProgress(buffer, peerId);
        return;
      }

      buffer.lastActivityAt = Date.now();
      const progress = getReceiveProgress(buffer);
      const shouldReport =
        progress.nextChunkIndex - buffer.lastProgressChunk >=
          ACK_EVERY_CHUNKS ||
        Date.now() - buffer.lastProgressAt >= 250 ||
        progress.nextChunkIndex === buffer.metadata.totalChunks;
      if (shouldReport) sendReceiveProgress(buffer, peerId);
    },
    [sendReceiveProgress]
  );

  const handleFinalize = useCallback(
    async (finalize: ChatFinalize, peerId: string) => {
      if (
        !finalize ||
        typeof finalize !== 'object' ||
        typeof finalize.messageId !== 'string'
      )
        return;
      const buffer = receiveBuffersRef.current.get(
        getReceiveKey(peerId, finalize.messageId)
      );
      if (!buffer || buffer.peerId !== peerId || buffer.failedReason) return;

      const progress = getReceiveProgress(buffer);
      if (
        finalize.byteLength !== buffer.metadata.byteLength ||
        finalize.totalChunks !== buffer.metadata.totalChunks ||
        finalize.checksum !== buffer.metadata.checksum
      ) {
        sendersRef.current.sendVerification?.(
          {
            messageId: finalize.messageId,
            verified: false,
            nextChunkIndex: progress.nextChunkIndex,
            reason: '消息完成信息与元数据不一致',
            retryable: false,
          },
          peerId
        );
        return;
      }

      buffer.lastActivityAt = Date.now();
      if (buffer.delivered) {
        sendersRef.current.sendVerification?.(
          {
            messageId: finalize.messageId,
            verified: true,
            nextChunkIndex: buffer.metadata.totalChunks,
            reason: null,
            retryable: false,
          },
          peerId
        );
        return;
      }
      if (buffer.verifying) return;

      if (
        progress.nextChunkIndex < buffer.metadata.totalChunks ||
        progress.receivedBytes !== buffer.metadata.byteLength
      ) {
        sendReceiveProgress(buffer, peerId);
        sendersRef.current.sendVerification?.(
          {
            messageId: finalize.messageId,
            verified: false,
            nextChunkIndex: progress.nextChunkIndex,
            reason: '消息仍缺少分块',
            retryable: true,
          },
          peerId
        );
        return;
      }

      buffer.verifying = true;
      try {
        const bytes = assembleChunks(buffer.chunks, buffer.metadata.byteLength);
        const checksum = await sha256Hex(bytes);
        if (checksum !== buffer.metadata.checksum) {
          buffer.checksumRetries += 1;
          const retryable = buffer.checksumRetries <= MAX_CHECKSUM_RETRIES;
          if (retryable) {
            buffer.chunks = new Array<string | undefined>(
              buffer.metadata.totalChunks
            );
            buffer.receivedBytes = 0;
            buffer.lastProgressChunk = -1;
          } else {
            buffer.failedReason = '消息完整性校验失败，已停止重试';
          }
          sendersRef.current.sendVerification?.(
            {
              messageId: finalize.messageId,
              verified: false,
              nextChunkIndex: 0,
              reason: buffer.failedReason ?? '消息完整性校验失败',
              retryable,
            },
            peerId
          );
          return;
        }

        const content = decodeUtf8(bytes);
        buffer.delivered = true;
        buffer.chunks = [];
        buffer.lastActivityAt = Date.now();
        onMessageRef.current?.({
          messageId: buffer.metadata.messageId,
          type: buffer.metadata.type,
          content,
          senderName: buffer.metadata.senderName,
          timestamp: buffer.metadata.timestamp,
          peerId,
        });
        sendersRef.current.sendVerification?.(
          {
            messageId: finalize.messageId,
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
          buffer.lastProgressChunk = -1;
        } else {
          buffer.failedReason = '消息解码或完整性校验失败，已停止重试';
        }
        sendersRef.current.sendVerification?.(
          {
            messageId: finalize.messageId,
            verified: false,
            nextChunkIndex: 0,
            reason: buffer.failedReason ?? '消息解码或完整性校验失败',
            retryable,
          },
          peerId
        );
      } finally {
        buffer.verifying = false;
      }
    },
    [sendReceiveProgress]
  );

  const armVerificationTimer = useCallback(
    (messageId: string, peerId: string) => {
      clearVerificationTimer(messageId, peerId);
      const key = getReceiveKey(peerId, messageId);

      const handleTimeout = () => {
        const queueItem = sendQueueRef.current.get(messageId);
        const target = queueItem?.targets.get(peerId);
        if (
          !queueItem ||
          !target ||
          target.status === 'delivered' ||
          target.status === 'failed'
        ) {
          verificationTimersRef.current.delete(key);
          return;
        }

        if (!isDataChannelOpen(peerId)) {
          target.status = 'paused';
          target.error = '连接已断开，等待重连';
          verificationTimersRef.current.delete(key);
          notifyDelivery(messageId);
          return;
        }

        if (target.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
          target.status = 'failed';
          target.error = '接收端确认超时';
          verificationTimersRef.current.delete(key);
          notifyDelivery(messageId);
          return;
        }

        target.verificationAttempts += 1;
        sendersRef.current.sendMetadata?.(queueItem.metadata, peerId);
        verificationTimersRef.current.set(
          key,
          setTimeout(handleTimeout, VERIFICATION_TIMEOUT_MS)
        );
      };

      verificationTimersRef.current.set(
        key,
        setTimeout(handleTimeout, VERIFICATION_TIMEOUT_MS)
      );
    },
    [clearVerificationTimer, isDataChannelOpen, notifyDelivery]
  );

  const sendChunksAsync = useCallback(
    async (messageId: string, peerId: string, startIndex: number) => {
      const queueItem = sendQueueRef.current.get(messageId);
      const target = queueItem?.targets.get(peerId);
      if (!queueItem || !target || target.sending) return;

      target.sending = true;
      target.status = 'sending';
      target.error = undefined;
      const runId = ++target.runId;
      notifyDelivery(messageId);

      try {
        for (
          let index = Math.max(0, startIndex);
          index < queueItem.chunks.length;
          index += 1
        ) {
          if (!sendQueueRef.current.has(messageId) || target.runId !== runId) {
            return;
          }
          if (!peersRef.current.has(peerId) || !isDataChannelOpen(peerId)) {
            target.status = 'paused';
            target.error = '连接已断开，等待重连';
            notifyDelivery(messageId);
            return;
          }

          await waitForDataChannelDrain(peerId);
          if (!isDataChannelOpen(peerId)) {
            target.status = 'paused';
            target.error = '连接已断开，等待重连';
            notifyDelivery(messageId);
            return;
          }

          const byteLength = getChunkByteLength(
            index,
            queueItem.metadata.byteLength,
            queueItem.metadata.chunkSize
          );
          sendersRef.current.sendChunk?.(
            {
              messageId,
              chunkIndex: index,
              totalChunks: queueItem.metadata.totalChunks,
              byteLength,
              data: queueItem.chunks[index],
            },
            peerId
          );

          if ((index + 1) % ACK_EVERY_CHUNKS === 0) {
            await new Promise<void>(resolve => setTimeout(resolve, 10));
          }
        }

        if (!isDataChannelOpen(peerId)) {
          target.status = 'paused';
          target.error = '连接已断开，等待重连';
          notifyDelivery(messageId);
          return;
        }
        sendersRef.current.sendFinalize?.(
          {
            messageId,
            byteLength: queueItem.metadata.byteLength,
            totalChunks: queueItem.metadata.totalChunks,
            checksum: queueItem.metadata.checksum,
          },
          peerId
        );
        armVerificationTimer(messageId, peerId);
      } finally {
        if (target.runId === runId) target.sending = false;
      }
    },
    [
      armVerificationTimer,
      isDataChannelOpen,
      notifyDelivery,
      waitForDataChannelDrain,
    ]
  );

  const handleAck = useCallback(
    (ack: ChatAck, peerId: string) => {
      if (!ack || typeof ack !== 'object' || typeof ack.messageId !== 'string')
        return;
      const queueItem = sendQueueRef.current.get(ack.messageId);
      const target = queueItem?.targets.get(peerId);
      if (!queueItem || !target || target.status === 'delivered') return;
      clearVerificationTimer(ack.messageId, peerId);

      if (!ack.accepted) {
        target.runId += 1;
        target.sending = false;
        target.status = 'failed';
        target.error = ack.reason || '接收端拒绝消息';
        notifyDelivery(ack.messageId);
        return;
      }
      if (
        !Number.isInteger(ack.nextChunkIndex) ||
        ack.nextChunkIndex < 0 ||
        ack.nextChunkIndex > queueItem.metadata.totalChunks
      ) {
        target.runId += 1;
        target.sending = false;
        target.status = 'failed';
        target.error = '接收端返回了无效进度';
        notifyDelivery(ack.messageId);
        return;
      }

      void sendChunksAsync(ack.messageId, peerId, ack.nextChunkIndex);
    },
    [clearVerificationTimer, notifyDelivery, sendChunksAsync]
  );

  const handleProgress = useCallback(
    (progress: ChatProgress, peerId: string) => {
      if (
        !progress ||
        typeof progress !== 'object' ||
        typeof progress.messageId !== 'string'
      )
        return;
      const queueItem = sendQueueRef.current.get(progress.messageId);
      const target = queueItem?.targets.get(peerId);
      if (!queueItem || !target || target.status === 'delivered') return;
      if (
        !Number.isInteger(progress.nextChunkIndex) ||
        progress.nextChunkIndex < 0 ||
        progress.nextChunkIndex > queueItem.metadata.totalChunks ||
        progress.totalChunks !== queueItem.metadata.totalChunks
      ) {
        target.runId += 1;
        target.sending = false;
        target.status = 'failed';
        target.error = '接收端返回了无效进度';
        notifyDelivery(progress.messageId);
      }
    },
    [notifyDelivery]
  );

  const handleVerification = useCallback(
    (verification: ChatVerification, peerId: string) => {
      if (
        !verification ||
        typeof verification !== 'object' ||
        typeof verification.messageId !== 'string'
      )
        return;
      const queueItem = sendQueueRef.current.get(verification.messageId);
      const target = queueItem?.targets.get(peerId);
      if (!queueItem || !target || target.status === 'delivered') return;
      clearVerificationTimer(verification.messageId, peerId);

      if (
        verification.verified &&
        verification.nextChunkIndex === queueItem.metadata.totalChunks
      ) {
        target.status = 'delivered';
        target.error = undefined;
        notifyDelivery(verification.messageId);
        return;
      }

      if (
        verification.retryable &&
        target.checksumRetries < MAX_CHECKSUM_RETRIES &&
        Number.isInteger(verification.nextChunkIndex) &&
        verification.nextChunkIndex >= 0 &&
        verification.nextChunkIndex <= queueItem.metadata.totalChunks
      ) {
        target.checksumRetries += 1;
        target.verificationAttempts = 0;
        target.runId += 1;
        target.sending = false;
        target.status = 'pending';
        target.error = verification.reason || '消息校验失败，准备重试';
        notifyDelivery(verification.messageId);
        void sendChunksAsync(
          verification.messageId,
          peerId,
          verification.nextChunkIndex
        );
        return;
      }

      target.status = 'failed';
      target.error = verification.reason || '接收端完整性校验失败';
      notifyDelivery(verification.messageId);
    },
    [clearVerificationTimer, notifyDelivery, sendChunksAsync]
  );

  useEffect(() => {
    if (roomState.status !== 'connected') return;
    const options = { requireDataChannel: true } as const;
    sendersRef.current.sendMetadata = createAction<ChatMetadata>(
      'chat-metadata',
      handleMetadata,
      options
    );
    sendersRef.current.sendChunk = createAction<ChatChunk>(
      'chat-chunk-v2',
      handleChunk,
      options
    );
    sendersRef.current.sendAck = createAction<ChatAck>(
      'chat-ack',
      handleAck,
      options
    );
    sendersRef.current.sendProgress = createAction<ChatProgress>(
      'chat-progress',
      handleProgress,
      options
    );
    sendersRef.current.sendFinalize = createAction<ChatFinalize>(
      'chat-finalize',
      handleFinalize,
      options
    );
    sendersRef.current.sendVerification = createAction<ChatVerification>(
      'chat-verification',
      handleVerification,
      options
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
    sendQueueRef.current.forEach(queueItem => {
      queueItem.targets.forEach(target => {
        if (target.status === 'delivered' || target.status === 'failed') return;
        if (!roomState.readyPeers.has(target.peerId)) {
          target.runId += 1;
          target.sending = false;
          target.status = 'paused';
          target.error = '数据通道已断开，等待重连';
          clearVerificationTimer(queueItem.metadata.messageId, target.peerId);
          notifyDelivery(queueItem.metadata.messageId);
          return;
        }

        if (target.status !== 'paused' && target.status !== 'pending') return;
        target.runId += 1;
        target.sending = false;
        target.status = 'pending';
        target.error = undefined;
        sendersRef.current.sendMetadata?.(queueItem.metadata, target.peerId);
        armVerificationTimer(queueItem.metadata.messageId, target.peerId);
      });
    });
  }, [
    armVerificationTimer,
    clearVerificationTimer,
    notifyDelivery,
    roomState.readyPeers,
    roomState.status,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      receiveBuffersRef.current.forEach((buffer, key) => {
        const ttl = buffer.delivered
          ? VERIFIED_SESSION_TTL_MS
          : RECEIVE_SESSION_TTL_MS;
        if (!buffer.verifying && now - buffer.lastActivityAt > ttl) {
          receiveBuffersRef.current.delete(key);
        }
      });
    }, RECEIVE_CLEANUP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      verificationTimersRef.current.forEach(timer => clearTimeout(timer));
      verificationTimersRef.current.clear();
    };
  }, []);

  const sendMessage = useCallback(
    (message: OutgoingChatMessage): boolean => {
      const targetPeers = Array.from(peersRef.current.values());
      if (targetPeers.length === 0) {
        onDeliveryUpdateRef.current?.({
          messageId: message.messageId,
          status: 'failed',
          deliveredPeers: 0,
          totalPeers: 0,
          error: '当前没有可发送的对方',
        });
        return false;
      }

      onDeliveryUpdateRef.current?.({
        messageId: message.messageId,
        status: 'sending',
        deliveredPeers: 0,
        totalPeers: targetPeers.length,
      });
      const sessionRun = sessionRunRef.current;

      void (async () => {
        try {
          const { bytes, chunks } = chunkUtf8Content(
            message.content,
            CHUNK_SIZE
          );
          if (bytes.byteLength > MAX_MESSAGE_BYTES) {
            throw new Error('消息大小超过 8MB 限制');
          }
          const metadata: ChatMetadata = {
            protocolVersion: PROTOCOL_VERSION,
            messageId: message.messageId,
            type: message.type,
            senderName: userName,
            timestamp: message.timestamp,
            byteLength: bytes.byteLength,
            chunkSize: CHUNK_SIZE,
            totalChunks: chunks.length,
            checksum: await sha256Hex(bytes),
          };
          if (sessionRun !== sessionRunRef.current) return;

          const targets = new Map<string, SendTarget>();
          targetPeers.forEach(peer => {
            targets.set(peer.id, {
              peerId: peer.id,
              status: readyPeersRef.current.has(peer.id) ? 'pending' : 'paused',
              checksumRetries: 0,
              verificationAttempts: 0,
              sending: false,
              runId: 0,
              error: readyPeersRef.current.has(peer.id)
                ? undefined
                : '等待数据通道建立',
            });
          });
          sendQueueRef.current.set(message.messageId, {
            metadata,
            chunks,
            targets,
          });
          notifyDelivery(message.messageId);

          targets.forEach(target => {
            if (readyPeersRef.current.has(target.peerId)) {
              sendersRef.current.sendMetadata?.(metadata, target.peerId);
              armVerificationTimer(message.messageId, target.peerId);
            }
          });
        } catch (error) {
          onDeliveryUpdateRef.current?.({
            messageId: message.messageId,
            status: 'failed',
            deliveredPeers: 0,
            totalPeers: targetPeers.length,
            error: error instanceof Error ? error.message : '消息发送准备失败',
          });
        }
      })();
      return true;
    },
    [armVerificationTimer, notifyDelivery, userName]
  );

  const retryMessage = useCallback(
    (messageId: string): boolean => {
      const queueItem = sendQueueRef.current.get(messageId);
      if (!queueItem) return false;

      let retried = false;
      queueItem.targets.forEach(target => {
        if (target.status !== 'failed') return;
        retried = true;
        target.status = readyPeersRef.current.has(target.peerId)
          ? 'pending'
          : 'paused';
        target.error = readyPeersRef.current.has(target.peerId)
          ? undefined
          : '等待对方重新连接';
        target.checksumRetries = 0;
        target.verificationAttempts = 0;
        target.runId += 1;
        target.sending = false;
        if (readyPeersRef.current.has(target.peerId)) {
          sendersRef.current.sendMetadata?.(queueItem.metadata, target.peerId);
          armVerificationTimer(messageId, target.peerId);
        }
      });
      if (retried) notifyDelivery(messageId);
      return retried;
    },
    [armVerificationTimer, notifyDelivery]
  );

  const handleReset = useCallback(() => {
    sessionRunRef.current += 1;
    verificationTimersRef.current.forEach(timer => clearTimeout(timer));
    verificationTimersRef.current.clear();
    sendQueueRef.current.clear();
    receiveBuffersRef.current.clear();
    sendersRef.current = createEmptySenders();
    reset();
  }, [reset]);

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
    readyPeerCount: roomState.readyPeers.size,
    peers: roomState.peers,
    error: roomState.error,
  };

  return {
    state,
    joinRoom: join,
    sendMessage,
    retryMessage,
    leaveRoom: handleReset,
    reset: handleReset,
  };
}
