// 连接状态
export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected';

export type MessageType = 'text' | 'image';

export type DeliveryStatus = 'sending' | 'delivered' | 'partial' | 'failed';

export type PeerDeliveryStatus =
  | 'pending'
  | 'sending'
  | 'paused'
  | 'delivered'
  | 'failed';

export interface DeliveryUpdate {
  messageId: string;
  status: DeliveryStatus;
  deliveredPeers: number;
  totalPeers: number;
  error?: string;
}

export interface OutgoingChatMessage {
  messageId: string;
  type: MessageType;
  content: string;
  timestamp: number;
}

// 接收完成并通过完整性校验的消息
export interface MessagePayload {
  messageId: string;
  type: MessageType;
  content: string;
  senderName: string;
  timestamp: number;
  peerId: string;
}

export interface ChatMetadata {
  protocolVersion: number;
  messageId: string;
  type: MessageType;
  senderName: string;
  timestamp: number;
  byteLength: number;
  chunkSize: number;
  totalChunks: number;
  checksum: string;
  [key: string]: string | number | boolean | null;
}

export interface ChatChunk {
  messageId: string;
  chunkIndex: number;
  totalChunks: number;
  byteLength: number;
  data: string;
  [key: string]: string | number | boolean | null;
}

export interface ChatAck {
  messageId: string;
  accepted: boolean;
  reason: string | null;
  nextChunkIndex: number;
  receivedChunks: number;
  receivedBytes: number;
  [key: string]: string | number | boolean | null;
}

export interface ChatProgress {
  messageId: string;
  nextChunkIndex: number;
  receivedChunks: number;
  receivedBytes: number;
  totalChunks: number;
  [key: string]: string | number | boolean | null;
}

export interface ChatFinalize {
  messageId: string;
  byteLength: number;
  totalChunks: number;
  checksum: string;
  [key: string]: string | number | boolean | null;
}

export interface ChatVerification {
  messageId: string;
  verified: boolean;
  nextChunkIndex: number;
  reason: string | null;
  retryable: boolean;
  [key: string]: string | number | boolean | null;
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  sender: 'local' | 'remote';
  senderName: string;
  peerId?: string;
  deliveryStatus?: DeliveryStatus;
  deliveredPeers?: number;
  totalPeers?: number;
  deliveryError?: string;
}

export interface PeerInfo {
  id: string;
  name: string;
}

export interface RoomState {
  connectionState: ConnectionState;
  roomCode: string | null;
  peerCount: number;
  readyPeerCount: number;
  peers: Map<string, PeerInfo>;
  error: string | null;
}
