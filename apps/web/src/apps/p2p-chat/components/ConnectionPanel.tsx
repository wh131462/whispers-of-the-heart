import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Users, LogIn, Loader2, User } from 'lucide-react';
import type { RoomState } from '../types';

interface ConnectionPanelProps {
  state: RoomState;
  userName: string;
  onUserNameChange: (name: string) => void;
  onJoinRoom: (roomCode: string) => void;
  onShowHelp: () => void;
}

export function ConnectionPanel({
  state,
  userName,
  onUserNameChange,
  onJoinRoom,
  onShowHelp,
}: ConnectionPanelProps) {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = () => {
    const code = roomCode.trim();
    if (code && userName.trim()) {
      onJoinRoom(code);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  // 连接中
  if (state.connectionState === 'connecting') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-700">正在加入房间...</p>
          <p className="text-xs text-zinc-500 mt-1">
            房间码: <span className="font-mono">{state.roomCode}</span>
          </p>
        </div>
        <p className="text-xs text-zinc-400">等待其他用户加入</p>
      </div>
    );
  }

  // 初始状态：输入房间码和用户名
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
        <Users className="w-8 h-8 text-white" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-zinc-800 mb-2">加入聊天房间</h2>
        <p className="text-sm text-zinc-500">输入相同的房间码即可与好友连接</p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            value={userName}
            onChange={e => onUserNameChange(e.target.value)}
            placeholder="你的昵称"
            className="pl-9 text-sm"
            maxLength={20}
          />
        </div>

        <Input
          value={roomCode}
          onChange={e => setRoomCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="房间码"
          className="text-center text-lg font-mono tracking-widest"
          autoFocus
        />

        <button
          onClick={handleJoin}
          disabled={!roomCode.trim() || !userName.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
            'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium',
            'hover:from-amber-600 hover:to-orange-600 transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'shadow-md hover:shadow-lg'
          )}
        >
          <LogIn className="w-5 h-5" />
          加入房间
        </button>
      </div>

      <button
        onClick={onShowHelp}
        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors underline underline-offset-2"
      >
        如何使用?
      </button>
    </div>
  );
}
