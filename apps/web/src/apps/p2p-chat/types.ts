// 连接状态
export type ConnectionState =
  | 'idle' // 初始状态
  | 'connecting' // 正在连接
  | 'connected' // 已连接
  | 'disconnected'; // 断开连接

// 消息内容类型
export type MessageType = 'text' | 'image';

// 消息负载（通过 WebRTC 传输）
export interface MessagePayload {
  type: string; // 'text' | 'image'
  content: string;
  senderName: string;
  timestamp: number;
  [key: string]: string | number; // 满足 trystero DataPayload 约束
}

// 消息类型
export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  sender: 'local' | 'remote';
  senderName: string;
  peerId?: string;
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
