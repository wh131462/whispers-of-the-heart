import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Users,
  LogIn,
  Loader2,
  User,
  Hash,
  Copy,
  Check,
  Shuffle,
} from 'lucide-react';
import type { RoomState } from '../types';

// 生成随机房间码
function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

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
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = () => {
    setRoomCode(generateRoomCode());
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      // 优先使用 Clipboard API
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomCode);
      } else {
        // Fallback: 使用 execCommand（兼容非 HTTPS）
        const textarea = document.createElement('textarea');
        textarea.value = roomCode;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败，静默处理
    }
  };

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

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="输入房间码"
                className="pl-9 pr-10 text-center text-lg font-mono tracking-[0.3em] uppercase"
                maxLength={8}
                autoFocus
              />
              {roomCode && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md',
                    'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100',
                    'transition-colors'
                  )}
                  title="复制房间码"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleGenerateCode}
              className={cn(
                'p-2.5 rounded-xl',
                'bg-zinc-100 hover:bg-zinc-200 text-zinc-600',
                'transition-colors'
              )}
              title="随机生成房间码"
            >
              <Shuffle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-zinc-400 text-center">
            输入相同房间码或点击骰子随机生成
          </p>
        </div>

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
