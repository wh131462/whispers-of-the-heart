// 连接状态
export type ConnectionState =
  | 'idle' // 初始状态
  | 'connecting' // 正在连接
  | 'connected' // 已连接
  | 'disconnected'; // 断开连接

// 文件传输状态
export type TransferStatus =
  | 'pending' // 等待中
  | 'transferring' // 传输中
  | 'completed' // 已完成
  | 'failed'; // 失败

// 文件传输项
export interface FileTransferItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number; // 0-100
  status: TransferStatus;
  direction: 'send' | 'receive';
  peerId: string;
  peerName: string;
  blob?: Blob; // 接收完成后的文件数据
  error?: string;
}

// 文件元数据（通过 WebRTC 传输）
export interface FileMetadata {
  fileId: string;
  name: string;
  size: number;
  type: string;
  totalChunks: number;
  senderName: string;
  [key: string]: string | number | boolean | null;
}

// 文件分块（通过 WebRTC 传输）
export interface FileChunk {
  fileId: string;
  chunkIndex: number;
  data: string; // base64 编码的数据
  isLast: boolean;
  [key: string]: string | number | boolean | null;
}

// 传输确认（通过 WebRTC 传输）
export interface TransferAck {
  fileId: string;
  accepted: boolean;
  reason: string | null;
  [key: string]: string | number | boolean | null;
}

// 传输进度（通过 WebRTC 传输）
export interface TransferProgress {
  fileId: string;
  receivedChunks: number;
}

// Peer 信息
export interface PeerInfo {
  id: string;
  name: string;
}

// 房间状态
export interface RoomState {
  connectionState: ConnectionState;
  roomCode: string | null;
  peerCount: number;
  peers: Map<string, PeerInfo>;
  error: string | null;
}
