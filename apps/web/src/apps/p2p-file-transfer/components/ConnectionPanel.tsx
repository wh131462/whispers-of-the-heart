import { useState } from 'react';
import { Loader2, ArrowRight, Copy, Check, Plus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoomState } from '../types';

interface ConnectionPanelProps {
  state: RoomState;
  userName: string;
  onUserNameChange: (name: string) => void;
  onJoinRoom: (roomCode: string) => void;
  onShowHelp?: () => void;
}

// 生成随机房间码
function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
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

  const isConnecting = state.connectionState === 'connecting';

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    onJoinRoom(code);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase());
    }
  };

  const handleCopyCode = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
      {/* 用户名输入 */}
      <div className="w-full max-w-xs">
        <label className="block text-xs text-zinc-500 mb-1.5">你的名称</label>
        <input
          type="text"
          value={userName}
          onChange={e => onUserNameChange(e.target.value)}
          placeholder="输入你的名称"
          className={cn(
            'w-full px-3 py-2 text-sm',
            'bg-zinc-50 border border-zinc-200 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'transition-all'
          )}
          disabled={isConnecting}
        />
      </div>

      {/* 房间码输入 */}
      <div className="w-full max-w-xs">
        <label className="block text-xs text-zinc-500 mb-1.5">房间码</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="输入或创建房间码"
              maxLength={6}
              className={cn(
                'w-full px-3 py-2 text-sm font-mono tracking-wider',
                'bg-zinc-50 border border-zinc-200 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                'transition-all uppercase'
              )}
              disabled={isConnecting}
            />
            {roomCode && (
              <button
                onClick={handleCopyCode}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2',
                  'p-1 rounded text-zinc-400 hover:text-zinc-600',
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
            onClick={handleCreateRoom}
            disabled={isConnecting}
            className={cn(
              'px-3 py-2',
              'bg-zinc-100 hover:bg-zinc-200 text-zinc-700',
              'rounded-lg text-sm font-medium',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="创建新房间"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {state.error && (
        <div className="w-full max-w-xs px-3 py-2 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200">
          {state.error}
        </div>
      )}

      {/* 加入按钮 */}
      <button
        onClick={handleJoinRoom}
        disabled={!roomCode.trim() || isConnecting || !userName.trim()}
        className={cn(
          'flex items-center gap-2 px-6 py-2.5',
          'bg-blue-500 hover:bg-blue-600 text-white',
          'rounded-lg text-sm font-medium',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>连接中...</span>
          </>
        ) : (
          <>
            <span>加入房间</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* 帮助提示 */}
      {onShowHelp && (
        <button
          onClick={onShowHelp}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>使用帮助</span>
        </button>
      )}
    </div>
  );
}
