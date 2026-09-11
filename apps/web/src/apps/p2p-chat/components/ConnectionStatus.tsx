import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import type { ConnectionState, PeerInfo } from '../types';
import { MemberList } from './MemberList';

interface ConnectionStatusProps {
  state: ConnectionState;
  peerCount?: number;
  readyPeerCount?: number;
  relayPeerCount?: number;
  peers?: Map<string, PeerInfo>;
  currentUserName?: string;
}

const stateConfig: Record<
  ConnectionState,
  { label: string; color: string; bgColor: string }
> = {
  idle: { label: '未连接', color: 'text-zinc-500', bgColor: 'bg-zinc-100' },
  connecting: {
    label: '连接中',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  connected: {
    label: '已连接',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  disconnected: {
    label: '已断开',
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-100',
  },
};

export function ConnectionStatus({
  state,
  peerCount = 0,
  readyPeerCount = 0,
  relayPeerCount = 0,
  peers = new Map(),
  currentUserName = '',
}: ConnectionStatusProps) {
  const [showMembers, setShowMembers] = useState(false);
  const config = stateConfig[state];
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

  const memberList = Array.from(peers.values());

  return (
    <div className="relative flex items-center gap-2">
      <span
        title={state === 'connected' ? connectionDescription : undefined}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
          config.bgColor,
          config.color
        )}
      >
        <span
          className={cn('w-1.5 h-1.5 rounded-full', {
            'bg-zinc-400': state === 'idle' || state === 'disconnected',
            'bg-amber-500 animate-pulse': state === 'connecting',
            'bg-emerald-500': state === 'connected',
          })}
        />
        {config.label}
      </span>

      {state === 'connected' && (
        <button
          onClick={() => setShowMembers(!showMembers)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            'bg-blue-50 text-blue-600',
            'hover:bg-blue-100 transition-colors',
            'cursor-pointer'
          )}
        >
          <Users className="w-3 h-3" />
          {peerCount + 1}
        </button>
      )}

      {/* 成员列表弹窗 */}
      <MemberList
        open={showMembers}
        onClose={() => setShowMembers(false)}
        members={memberList}
        currentUserName={currentUserName}
      />
    </div>
  );
}
