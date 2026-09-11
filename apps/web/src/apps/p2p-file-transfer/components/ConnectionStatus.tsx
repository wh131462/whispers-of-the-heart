import { Users, Loader2, WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectionState, PeerInfo } from '../types';

interface ConnectionStatusProps {
  state: ConnectionState;
  peerCount: number;
  readyPeerCount: number;
  relayPeerCount: number;
  peers: Map<string, PeerInfo>;
  currentUserName: string;
}

export function ConnectionStatus({
  state,
  peerCount,
  readyPeerCount,
  relayPeerCount,
  peers,
  currentUserName,
}: ConnectionStatusProps) {
  const peerNames = Array.from(peers.values())
    .map(p => p.name)
    .join('、');

  if (state === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 text-amber-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs">连接中...</span>
      </div>
    );
  }

  if (state === 'disconnected') {
    return (
      <div className="flex items-center gap-1.5 text-red-500">
        <WifiOff className="w-3.5 h-3.5" />
        <span className="text-xs">已断开</span>
      </div>
    );
  }

  if (state === 'connected') {
    const connectionDescription =
      peerCount === 0
        ? '已加入房间，等待对方加入'
        : readyPeerCount === 0
          ? '已加入房间，正在建立数据通道'
          : relayPeerCount === 0
            ? '连接方式：WebRTC 直连'
            : readyPeerCount > relayPeerCount
              ? '连接方式：部分成员 WebRTC 直连，部分成员服务器中转'
              : '连接方式：服务器中转';
    const memberDescription =
      peerCount > 0
        ? `在线: ${currentUserName}（你）、${peerNames}`
        : `仅你在线: ${currentUserName}`;

    return (
      <div
        className={cn(
          'flex items-center gap-1.5',
          peerCount > 0 ? 'text-green-600' : 'text-zinc-400'
        )}
        title={`${connectionDescription}\n${memberDescription}`}
      >
        {peerCount > 0 ? (
          <Wifi className="w-3.5 h-3.5" />
        ) : (
          <Users className="w-3.5 h-3.5" />
        )}
        <span className="text-xs">
          {peerCount > 0 ? `${peerCount + 1} 人在线` : '等待连接'}
        </span>
      </div>
    );
  }

  return null;
}
