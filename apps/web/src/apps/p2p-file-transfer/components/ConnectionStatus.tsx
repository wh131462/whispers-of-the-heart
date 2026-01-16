import { Users, Loader2, WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectionState, PeerInfo } from '../types';

interface ConnectionStatusProps {
  state: ConnectionState;
  peerCount: number;
  peers: Map<string, PeerInfo>;
  currentUserName: string;
}

export function ConnectionStatus({
  state,
  peerCount,
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
    return (
      <div
        className={cn(
          'flex items-center gap-1.5',
          peerCount > 0 ? 'text-green-600' : 'text-zinc-400'
        )}
        title={
          peerCount > 0
            ? `在线: ${currentUserName}（你）、${peerNames}`
            : `仅你在线: ${currentUserName}`
        }
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
