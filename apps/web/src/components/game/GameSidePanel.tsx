import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Users,
  LogIn,
  Loader2,
  User,
  LogOut,
  Eye,
  Crown,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  Check,
  X,
  RotateCcw,
  Gamepad2,
  Copy,
  CheckCheck,
  MessageCircle,
  Send,
} from 'lucide-react';
import type {
  PlayerRole,
  OnlinePlayer,
  PendingSwapRequest,
  SwapStatus,
} from '@whispers/hooks';

export interface ChatMessage {
  from: string;
  fromName: string;
  content: string;
  timestamp: number;
}

export interface GameSidePanelTheme {
  primary: string; // e.g., 'amber' or 'emerald'
  gradient: {
    from: string;
    to: string;
  };
}

export const THEME_AMBER: GameSidePanelTheme = {
  primary: 'amber',
  gradient: { from: 'from-amber-400', to: 'to-orange-500' },
};

export const THEME_EMERALD: GameSidePanelTheme = {
  primary: 'emerald',
  gradient: { from: 'from-emerald-400', to: 'to-teal-500' },
};

interface PlayerInfo {
  player?: OnlinePlayer;
  colorLabel: string; // e.g., '黑棋' or '白棋'
  colorClass: string; // e.g., 'bg-zinc-800' or 'bg-white border border-zinc-300'
  isMe: boolean;
  role: PlayerRole;
}

interface GameSidePanelProps {
  // 连接状态
  roomStatus: 'idle' | 'connecting' | 'connected' | 'disconnected';
  roomCode: string | null;

  // 游戏信息
  gameName: string; // 游戏名称，用于邀请文案
  gamePath: string; // 游戏路径，如 'gomoku', 'reversi'

  // 玩家信息
  myRole: PlayerRole;
  player1?: OnlinePlayer;
  player2?: OnlinePlayer;
  spectators: OnlinePlayer[];

  // 用户信息
  userName: string;
  onUserNameChange: (name: string) => void;

  // 游戏状态
  pendingSwapRequest?: PendingSwapRequest | null;
  swapStatus?: SwapStatus; // 交换状态提示
  gameReady?: boolean;
  currentTurnLabel?: string; // e.g., '黑棋回合' or '白棋回合'
  isMyTurn?: boolean;

  // 聊天功能
  lastChatMessage?: ChatMessage | null;
  onSendChat?: (content: string) => void;

  // 行动回调
  onJoinRoom: (roomCode: string) => void;
  onLeaveRoom: () => void;
  onRequestPlayer: () => void;
  onRequestSwap?: (targetRole: PlayerRole) => void;
  onRespondSwap?: (approved: boolean) => void;
  onResetGame?: () => void;

  // 主题
  theme?: GameSidePanelTheme;

  // 扩展内容
  actionButtons?: React.ReactNode;
}

export function GameSidePanel({
  roomStatus,
  roomCode,
  gameName,
  gamePath,
  myRole,
  player1,
  player2,
  spectators,
  userName,
  pendingSwapRequest,
  swapStatus,
  gameReady,
  currentTurnLabel,
  isMyTurn,
  lastChatMessage,
  onSendChat,
  onUserNameChange,
  onJoinRoom,
  onLeaveRoom,
  onRequestPlayer,
  onRequestSwap,
  onRespondSwap,
  onResetGame,
  theme = THEME_AMBER,
  actionButtons,
}: GameSidePanelProps) {
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [spectatorsExpanded, setSpectatorsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  // 聊天状态
  const [showChatInput, setShowChatInput] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);

  // 气泡位置状态
  const [bubblePosition, setBubblePosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const playerCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 计算气泡位置
  const updateBubblePosition = useCallback(() => {
    if (!lastChatMessage) {
      setBubblePosition(null);
      return;
    }
    // 确定气泡应该显示在哪个玩家卡片旁边
    const targetRole =
      lastChatMessage.from === '__self__'
        ? myRole // 自己发的消息，显示在自己的卡片旁
        : myRole === 'player1'
          ? 'player2'
          : 'player1'; // 对方发的消息，显示在对方的卡片旁

    const cardEl = playerCardRefs.current.get(targetRole);
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      setBubblePosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
    }
  }, [lastChatMessage, myRole]);

  // 监听消息变化更新气泡位置
  useEffect(() => {
    updateBubblePosition();
    // 窗口滚动或调整大小时更新位置
    window.addEventListener('scroll', updateBubblePosition, true);
    window.addEventListener('resize', updateBubblePosition);
    return () => {
      window.removeEventListener('scroll', updateBubblePosition, true);
      window.removeEventListener('resize', updateBubblePosition);
    };
  }, [updateBubblePosition]);

  // 自动聚焦聊天输入框
  useEffect(() => {
    if (showChatInput && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [showChatInput]);

  const handleSendChat = () => {
    if (chatInput.trim() && onSendChat) {
      onSendChat(chatInput.trim());
      setChatInput('');
      setShowChatInput(false);
    }
  };

  const handleJoin = () => {
    const code = inputRoomCode.trim();
    if (code && userName.trim()) {
      onJoinRoom(code);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  const handleCopyRoomCode = async () => {
    if (roomCode) {
      // 生成邀请链接
      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/apps/${gamePath}?inviteRoom=${roomCode}`;

      // 生成友好的邀请文案
      const inviteText = `${userName} 邀请你一起玩${gameName}！
点击链接加入对局吧~
${inviteUrl}

或者手动加入房间，房间号为 ${roomCode}`;

      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const themeClasses = {
    gradientBg: `bg-gradient-to-br ${theme.gradient.from} ${theme.gradient.to}`,
    gradientBgLight: `bg-gradient-to-r from-${theme.primary}-50 to-${theme.primary === 'amber' ? 'orange' : 'teal'}-50`,
    border: `border-${theme.primary}-100`,
    borderFocus: `focus:border-${theme.primary}-400 focus:ring-${theme.primary}-400/20`,
    text: `text-${theme.primary}-700`,
    textLight: `text-${theme.primary}-600`,
    textLighter: `text-${theme.primary}-600/70`,
    buttonBg: `bg-gradient-to-r from-${theme.primary}-500 to-${theme.primary === 'amber' ? 'orange' : 'teal'}-500`,
    buttonHover: `hover:from-${theme.primary}-600 hover:to-${theme.primary === 'amber' ? 'orange' : 'teal'}-600`,
    crownColor: `text-${theme.primary}-500`,
    swapHover: `hover:text-${theme.primary}-500`,
    bgLight: `bg-${theme.primary}-50`,
    bgLighter: `bg-${theme.primary}-100`,
    textPrimary: `text-${theme.primary}-700`,
    textSecondary: `text-${theme.primary}-600`,
  };

  // 未连接状态 - 显示加入房间界面
  if (roomStatus === 'idle' || roomStatus === 'disconnected') {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center gap-4 p-6 flex-1 justify-center">
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
              themeClasses.gradientBg
            )}
          >
            <Users className="w-7 h-7 text-white" />
          </div>

          <div className="text-center">
            <h2 className="text-lg font-bold text-zinc-800 mb-1">在线对战</h2>
            <p className="text-xs text-zinc-500">输入相同房间码与好友对战</p>
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
              value={inputRoomCode}
              onChange={e => setInputRoomCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="ROOM"
              className={cn(
                'text-center text-2xl font-bold tracking-[0.3em] uppercase h-14',
                theme.primary === 'amber'
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 placeholder:text-amber-300'
                  : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 placeholder:text-emerald-300',
                'placeholder:font-normal placeholder:tracking-[0.2em]'
              )}
            />

            <button
              onClick={handleJoin}
              disabled={!inputRoomCode.trim() || !userName.trim()}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
                'text-white font-medium',
                'transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shadow-md hover:shadow-lg text-sm',
                themeClasses.gradientBg,
                theme.primary === 'amber'
                  ? 'hover:from-amber-600 hover:to-orange-600'
                  : 'hover:from-emerald-600 hover:to-teal-600'
              )}
            >
              <LogIn className="w-4 h-4" />
              加入房间
            </button>
          </div>

          {roomStatus === 'disconnected' && (
            <p className="text-xs text-red-500">连接已断开</p>
          )}
        </div>
      </div>
    );
  }

  // 连接中
  if (roomStatus === 'connecting') {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-4 p-6 flex-1">
          <Loader2
            className={cn(
              'w-10 h-10 animate-spin',
              theme.primary === 'amber' ? 'text-amber-500' : 'text-emerald-500'
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-700">正在加入房间...</p>
            <p className="text-xs text-zinc-500 mt-1">
              房间码: <span className="font-mono">{roomCode}</span>
            </p>
          </div>
          <p className="text-xs text-zinc-400">等待其他玩家加入</p>
        </div>
      </div>
    );
  }

  // 已连接 - 显示房间信息面板
  const players: PlayerInfo[] = [
    {
      player: player1,
      colorLabel: '黑棋',
      colorClass: 'bg-zinc-800',
      isMe: myRole === 'player1',
      role: 'player1',
    },
    {
      player: player2,
      colorLabel: '白棋',
      colorClass: 'bg-white border border-zinc-300',
      isMe: myRole === 'player2',
      role: 'player2',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* 房间信息头部 */}
      <div
        className={cn(
          'flex items-center justify-between p-3 border-b',
          theme.primary === 'amber'
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100'
            : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center shadow-sm',
              themeClasses.gradientBg
            )}
          >
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <p
              className={cn(
                'text-[10px] uppercase tracking-wider',
                theme.primary === 'amber'
                  ? 'text-amber-600/70'
                  : 'text-emerald-600/70'
              )}
            >
              房间号
            </p>
            <div className="flex items-center gap-1.5">
              <p
                className={cn(
                  'text-base font-bold font-mono tracking-[0.2em]',
                  theme.primary === 'amber'
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                )}
              >
                {roomCode}
              </p>
              <button
                onClick={handleCopyRoomCode}
                className="p-0.5 rounded hover:bg-white/50 transition-colors"
                title="复制邀请信息"
              >
                {copied ? (
                  <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy
                    className={cn(
                      'w-3.5 h-3.5',
                      theme.primary === 'amber'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    )}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          离开
        </button>
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3">
          {/* 交换请求提示（收到的请求） */}
          {pendingSwapRequest && (
            <div
              className={cn(
                'p-3 rounded-lg border',
                theme.primary === 'amber'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              )}
            >
              <p
                className={cn(
                  'text-xs mb-2',
                  theme.primary === 'amber'
                    ? 'text-amber-800'
                    : 'text-emerald-800'
                )}
              >
                <span className="font-medium">
                  {pendingSwapRequest.fromName}
                </span>{' '}
                请求与你交换位置
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onRespondSwap?.(true)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  同意
                </button>
                <button
                  onClick={() => onRespondSwap?.(false)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs bg-zinc-200 text-zinc-700 hover:bg-zinc-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                  拒绝
                </button>
              </div>
            </div>
          )}

          {/* 交换状态提示（发起的请求） */}
          {swapStatus && (
            <div
              className={cn(
                'p-3 rounded-lg text-center text-sm font-medium',
                swapStatus === 'waiting' &&
                  (theme.primary === 'amber'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'),
                swapStatus === 'accepted' && 'bg-green-100 text-green-700',
                swapStatus === 'rejected' && 'bg-red-100 text-red-700'
              )}
            >
              {swapStatus === 'waiting' && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  等待对方响应交换请求...
                </div>
              )}
              {swapStatus === 'accepted' && (
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  交换请求已同意
                </div>
              )}
              {swapStatus === 'rejected' && (
                <div className="flex items-center justify-center gap-2">
                  <X className="w-4 h-4" />
                  交换请求被拒绝
                </div>
              )}
            </div>
          )}

          {/* 玩家卡片 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 px-1">对战玩家</p>
            {players.map(({ player, colorLabel, colorClass, isMe, role }) => (
              <div
                key={role}
                ref={el => {
                  if (el) playerCardRefs.current.set(role, el);
                }}
                className={cn(
                  'relative flex items-center gap-3 p-3 rounded-lg transition-all',
                  player
                    ? 'bg-white border border-zinc-100 shadow-sm'
                    : 'bg-zinc-50 border border-dashed border-zinc-200',
                  isMe &&
                    player &&
                    (theme.primary === 'amber'
                      ? 'ring-2 ring-amber-200'
                      : 'ring-2 ring-emerald-200')
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full shadow-sm flex-shrink-0',
                    colorClass
                  )}
                />
                <div className="flex-1 min-w-0">
                  {player ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-zinc-700 truncate">
                        {player.name}
                      </span>
                      {isMe && (
                        <Crown
                          className={cn(
                            'w-3.5 h-3.5 flex-shrink-0',
                            theme.primary === 'amber'
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          )}
                        />
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">
                      等待玩家加入...
                    </span>
                  )}
                  <p className="text-[10px] text-zinc-400">{colorLabel}</p>
                </div>
                {/* 聊天按钮 - 只在"我"的卡片上显示 */}
                {player && isMe && onSendChat && (
                  <button
                    onClick={() => setShowChatInput(!showChatInput)}
                    className={cn(
                      'p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors',
                      theme.primary === 'amber'
                        ? 'hover:text-amber-500'
                        : 'hover:text-emerald-500'
                    )}
                    title="发送消息"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
                {/* 交换按钮 - 在对手卡片上显示 */}
                {player && !isMe && myRole !== 'spectator' && (
                  <button
                    onClick={() => onRequestSwap?.(role)}
                    className={cn(
                      'p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors',
                      theme.primary === 'amber'
                        ? 'hover:text-amber-500'
                        : 'hover:text-emerald-500'
                    )}
                    title="请求交换"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                )}
                {/* 聊天输入框 - 悬浮在卡片下方 */}
                {player && isMe && showChatInput && (
                  <div className="absolute left-10 top-full mt-2 flex items-center gap-1 bg-white p-1.5 rounded-lg shadow-lg border border-zinc-200 z-30">
                    {/* 输入框小三角 - 指向上方 */}
                    <div className="absolute bottom-full left-4 border-8 border-transparent border-b-white" />
                    <input
                      ref={chatInputRef}
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                      placeholder="输入消息..."
                      className={cn(
                        'w-28 px-2 py-1 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-1',
                        theme.primary === 'amber'
                          ? 'focus:ring-amber-500'
                          : 'focus:ring-emerald-500'
                      )}
                      maxLength={50}
                    />
                    <button
                      onClick={handleSendChat}
                      className={cn(
                        'p-1 text-white rounded',
                        theme.primary === 'amber'
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-emerald-500 hover:bg-emerald-600'
                      )}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowChatInput(false)}
                      className="p-1 bg-zinc-100 text-zinc-500 rounded hover:bg-zinc-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 观战列表（可折叠） */}
          {spectators.length > 0 && (
            <div className="border border-zinc-100 rounded-lg overflow-hidden">
              <button
                onClick={() => setSpectatorsExpanded(!spectatorsExpanded)}
                className="w-full flex items-center justify-between p-2.5 bg-zinc-50 hover:bg-zinc-100 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Eye className="w-3.5 h-3.5" />
                  <span>观战中 ({spectators.length})</span>
                </div>
                {spectatorsExpanded ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>
              {spectatorsExpanded && (
                <div className="p-2 bg-white">
                  <div className="flex flex-wrap gap-1.5">
                    {spectators.map(s => (
                      <div
                        key={s.peerId}
                        className="flex items-center gap-1 px-2 py-1 bg-zinc-100 rounded-full text-xs text-zinc-600"
                      >
                        <Eye className="w-3 h-3 text-zinc-400" />
                        <span>{s.name}</span>
                        {myRole !== 'spectator' && (
                          <button
                            onClick={() => onRequestSwap?.('spectator')}
                            className={cn(
                              'p-0.5 rounded-full hover:bg-zinc-200 text-zinc-400 transition-colors',
                              theme.primary === 'amber'
                                ? 'hover:text-amber-500'
                                : 'hover:text-emerald-500'
                            )}
                            title="请求交换"
                          >
                            <ArrowLeftRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 游戏状态提示 */}
          {!gameReady && (
            <div
              className={cn(
                'text-center py-3 text-xs rounded-lg',
                theme.primary === 'amber'
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-emerald-600 bg-emerald-50'
              )}
            >
              等待另一位玩家加入...
            </div>
          )}

          {/* 回合提示 */}
          {gameReady && currentTurnLabel && (
            <div
              className={cn(
                'flex items-center justify-center gap-2 py-3 rounded-lg',
                isMyTurn
                  ? theme.primary === 'amber'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                  : 'bg-zinc-100 text-zinc-600'
              )}
            >
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  isMyTurn
                    ? theme.primary === 'amber'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500 animate-pulse'
                    : 'bg-zinc-400'
                )}
              />
              <span className="text-sm font-medium">
                {currentTurnLabel}
                {isMyTurn ? ' - 你的回合' : ' - 等待对手'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="p-3 border-t border-zinc-100 space-y-2 bg-zinc-50/50">
        {/* 观战者加入按钮 */}
        {myRole === 'spectator' && (!player1 || !player2) && (
          <button
            onClick={onRequestPlayer}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              theme.primary === 'amber'
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            )}
          >
            <Gamepad2 className="w-4 h-4" />
            参与对战
          </button>
        )}

        {/* 观战者请求换位 */}
        {myRole === 'spectator' && gameReady && (
          <div className="flex gap-2">
            {player1 && (
              <button
                onClick={() => onRequestSwap?.('player1')}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                换黑棋
              </button>
            )}
            {player2 && (
              <button
                onClick={() => onRequestSwap?.('player2')}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                换白棋
              </button>
            )}
          </div>
        )}

        {/* 自定义操作按钮 */}
        {actionButtons}

        {/* 新游戏按钮 */}
        {myRole !== 'spectator' && gameReady && onResetGame && (
          <button
            onClick={onResetGame}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            新游戏
          </button>
        )}

        {/* 我的状态 */}
        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-zinc-500">
          {myRole === 'spectator' ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>你正在观战</span>
            </>
          ) : (
            <>
              <Gamepad2
                className={cn(
                  'w-3.5 h-3.5',
                  theme.primary === 'amber'
                    ? 'text-amber-500'
                    : 'text-emerald-500'
                )}
              />
              <span
                className={
                  theme.primary === 'amber'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }
              >
                你是{myRole === 'player1' ? '黑棋' : '白棋'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 聊天气泡 - 使用 Portal 渲染到 body */}
      {lastChatMessage &&
        !showChatInput &&
        bubblePosition &&
        createPortal(
          <div
            className="fixed z-50 px-3 py-2 rounded-lg shadow-lg max-w-[200px] animate-fade-in bg-white text-zinc-800 border border-zinc-200"
            style={{
              top: bubblePosition.top,
              left: bubblePosition.left,
              transform: 'translateY(-50%)',
            }}
          >
            {/* 小三角指向左侧 - 使用旋转方块实现带阴影效果 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-[6px] w-3 h-3 bg-white border-l border-b border-zinc-200 rotate-45"
              style={{ boxShadow: '-2px 2px 3px rgba(0,0,0,0.05)' }}
            />
            <p className="text-sm break-words">{lastChatMessage.content}</p>
          </div>,
          document.body
        )}
    </div>
  );
}
