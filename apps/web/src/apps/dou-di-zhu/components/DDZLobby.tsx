import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LogIn,
  Loader2,
  LogOut,
  Crown,
  Check,
  Copy,
  CheckCheck,
  Pencil,
} from 'lucide-react';
import type { TrysteroRoomState } from '@whispers/hooks';
import type { SeatIndex, SeatInfo } from '../types/online';

type DDZLobbyProps = {
  roomState: TrysteroRoomState;
  isHost: boolean;
  mySeat: SeatIndex | null;
  seats: (SeatInfo | null)[];
  userName: string;
  onUserNameChange: (name: string) => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
  onRequestSeat: (name: string) => void;
};

const SEAT_LABELS = ['座位一（房主）', '座位二', '座位三'] as const;

export function DDZLobby({
  roomState,
  isHost,
  mySeat,
  seats,
  userName,
  onUserNameChange,
  onJoinRoom,
  onLeaveRoom,
  onToggleReady,
  onRequestSeat,
}: DDZLobbyProps) {
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const isConnected = roomState.status === 'connected';
  const isConnecting = roomState.status === 'connecting';

  const handleJoin = () => {
    const code = roomCode.trim();
    if (code) onJoinRoom(code);
  };

  const handleCopyCode = async () => {
    if (roomState.roomCode) {
      await navigator.clipboard.writeText(roomState.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 未连接 —— 显示昵称 + 加入/创建房间
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-5 py-8">
        <h3 className="text-lg font-bold text-yellow-400 tracking-wide">
          联机对战
        </h3>

        {/* 昵称设置 */}
        <div className="flex flex-col items-center gap-1.5 w-full max-w-xs">
          <span className="text-white/50 text-xs">昵称</span>
          {editingName ? (
            <div className="flex gap-2 w-full">
              <input
                autoFocus
                value={userName}
                onChange={e => onUserNameChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && userName.trim())
                    setEditingName(false);
                }}
                onBlur={() => {
                  if (userName.trim()) setEditingName(false);
                }}
                maxLength={12}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-lg text-sm text-center',
                  'bg-white/10 text-white placeholder:text-white/40',
                  'border border-yellow-400/60',
                  'outline-none transition-colors'
                )}
              />
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg',
                'bg-white/5 border border-white/15',
                'hover:bg-white/10 transition-colors group'
              )}
            >
              <span className="text-white font-medium text-sm">{userName}</span>
              <Pencil className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
            </button>
          )}
        </div>

        {/* 房间号输入 */}
        <div className="flex flex-col items-center gap-1.5 w-full max-w-xs">
          <span className="text-white/50 text-xs">房间号</span>
          <div className="flex gap-2 w-full">
            <input
              value={roomCode}
              onChange={e => setRoomCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="输入房间号..."
              className={cn(
                'flex-1 px-4 py-2 rounded-lg text-sm',
                'bg-white/10 text-white placeholder:text-white/40',
                'border border-white/20 focus:border-yellow-400/60',
                'outline-none transition-colors'
              )}
              disabled={isConnecting}
            />
            <button
              onClick={handleJoin}
              disabled={!roomCode.trim() || !userName.trim() || isConnecting}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900',
                'hover:from-yellow-300 hover:to-amber-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all active:scale-95'
              )}
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <p className="text-white/40 text-xs text-center max-w-xs">
          输入房间号加入房间，如果房间不存在则自动创建
        </p>
        {roomState.error && (
          <p className="text-red-400 text-xs">{roomState.error}</p>
        )}
      </div>
    );
  }

  // 已连接 —— 显示座位和准备状态
  const notSeated = mySeat === null;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* 房间号 */}
      <div className="flex items-center gap-2">
        <span className="text-white/50 text-xs">房间号:</span>
        <span className="text-yellow-400 font-mono font-bold text-sm">
          {roomState.roomCode}
        </span>
        <button
          onClick={handleCopyCode}
          className="text-white/40 hover:text-white/80 transition-colors"
          title="复制房间号"
        >
          {copied ? (
            <CheckCheck className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 未入座时显示昵称设置 */}
      {notSeated && (
        <div className="flex flex-col items-center gap-1.5 w-full max-w-xs">
          <span className="text-white/50 text-xs">设置昵称后入座</span>
          {editingName ? (
            <div className="flex gap-2 w-full">
              <input
                autoFocus
                value={userName}
                onChange={e => onUserNameChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && userName.trim())
                    setEditingName(false);
                }}
                onBlur={() => {
                  if (userName.trim()) setEditingName(false);
                }}
                maxLength={12}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-lg text-sm text-center',
                  'bg-white/10 text-white placeholder:text-white/40',
                  'border border-yellow-400/60',
                  'outline-none transition-colors'
                )}
              />
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg',
                'bg-white/5 border border-white/15',
                'hover:bg-white/10 transition-colors group'
              )}
            >
              <span className="text-white font-medium text-sm">{userName}</span>
              <Pencil className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
            </button>
          )}
        </div>
      )}

      {/* 三个座位 */}
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {seats.map((seat, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl',
              'border transition-all duration-200',
              seat
                ? seat.ready
                  ? 'bg-green-500/10 border-green-400/40'
                  : 'bg-white/5 border-white/20'
                : 'bg-white/5 border-dashed border-white/15',
              mySeat === i && 'ring-1 ring-yellow-400/50'
            )}
          >
            {/* 头像 */}
            <div
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center',
                'text-sm font-bold',
                seat
                  ? i === 0
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                    : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'
                  : 'bg-white/10 text-white/30'
              )}
            >
              {seat ? (
                i === 0 ? (
                  <Crown className="w-4 h-4" />
                ) : (
                  seat.name.slice(0, 1)
                )
              ) : (
                <span className="text-xs">?</span>
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-sm font-medium truncate">
                  {seat?.name ?? SEAT_LABELS[i]}
                </span>
                {mySeat === i && (
                  <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
                    我
                  </span>
                )}
              </div>
              {seat && (
                <span
                  className={cn(
                    'text-[10px]',
                    seat.ready ? 'text-green-400' : 'text-white/40'
                  )}
                >
                  {seat.ready ? '已准备' : '未准备'}
                </span>
              )}
              {!seat && (
                <span className="text-[10px] text-white/30">等待加入...</span>
              )}
            </div>

            {/* 准备状态图标 */}
            {seat?.ready && <Check className="w-4 h-4 text-green-400" />}
            {seat && !seat.connected && (
              <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                断线
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 mt-2">
        {notSeated && (
          <button
            onClick={() => onRequestSeat(userName)}
            disabled={!userName.trim()}
            className={cn(
              'px-6 py-2 rounded-full text-sm font-medium',
              'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900',
              'hover:from-yellow-300 hover:to-amber-400',
              'shadow-lg shadow-amber-500/30 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all'
            )}
          >
            <LogIn className="w-4 h-4 inline mr-1" />
            入座
          </button>
        )}
        {mySeat !== null && (
          <button
            onClick={onToggleReady}
            className={cn(
              'px-6 py-2 rounded-full text-sm font-medium',
              'transition-all active:scale-95',
              seats[mySeat]?.ready
                ? 'bg-white/15 text-white/80 border border-white/20 hover:bg-white/25'
                : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:from-green-300 hover:to-emerald-400'
            )}
          >
            {seats[mySeat]?.ready ? '取消准备' : '准备'}
          </button>
        )}
        <button
          onClick={onLeaveRoom}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium',
            'bg-white/10 text-white/70 border border-white/20',
            'hover:bg-white/20 hover:text-white transition-all active:scale-95'
          )}
        >
          <LogOut className="w-4 h-4 inline mr-1" />
          离开
        </button>
      </div>

      {/* 提示 */}
      <p className="text-white/40 text-xs text-center">
        {notSeated
          ? '设置好昵称后点击"入座"加入游戏'
          : isHost
            ? '你是房主，所有玩家准备后游戏自动开始'
            : '等待所有玩家准备...'}
      </p>
    </div>
  );
}
