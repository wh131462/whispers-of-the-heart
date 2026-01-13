import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RotateCcw, Users, Bot, Globe, Clock, Undo2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Board } from './components/Board';
import { GameOverModal } from './components/GameOverModal';
import { GameSidePanel, THEME_EMERALD } from '@/components/game/GameSidePanel';
import { useReversi } from './hooks/useReversi';
import { useOnlineReversi } from './hooks/useOnlineReversi';
import type { GameMode, Difficulty, Player, TimeLimit } from './types';
import { PLAYER_NAMES } from './types';

// 时间限制选项
const TIME_LIMIT_OPTIONS: { value: TimeLimit; label: string }[] = [
  { value: 0, label: '不限时' },
  { value: 30, label: '30秒' },
  { value: 60, label: '60秒' },
];

const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

// 生成默认用户名
function generateDefaultName() {
  return `玩家${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function ScoreBoard({
  blackCount,
  whiteCount,
}: {
  blackCount: number;
  whiteCount: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg">
        <div className="w-5 h-5 rounded-full bg-zinc-800 shadow-sm" />
        <span className="font-bold text-zinc-700">{blackCount}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg">
        <div className="w-5 h-5 rounded-full bg-white border border-zinc-300 shadow-sm" />
        <span className="font-bold text-zinc-700">{whiteCount}</span>
      </div>
    </div>
  );
}

function PlayerIndicator({
  currentPlayer,
  mode,
  validMovesCount,
  isMyTurn,
  myColor,
}: {
  currentPlayer: Player;
  mode: GameMode;
  validMovesCount: number;
  isMyTurn?: boolean;
  myColor?: Player | null;
}) {
  const isThinking = mode === 'pve' && currentPlayer === 'white';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-500">当前:</span>
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            'w-5 h-5 rounded-full shadow-sm',
            currentPlayer === 'black'
              ? 'bg-zinc-800'
              : 'bg-white border border-zinc-300'
          )}
        />
        <span className="font-medium text-zinc-700">
          {PLAYER_NAMES[currentPlayer]}
          {isThinking && ' (AI思考中...)'}
          {mode === 'online' && isMyTurn && ' (你的回合)'}
          {mode === 'online' && !isMyTurn && myColor && ' (等待对手...)'}
        </span>
      </div>
      {!isThinking && mode !== 'online' && validMovesCount > 0 && (
        <span className="text-xs text-emerald-600">
          ({validMovesCount}个可落子位置)
        </span>
      )}
      {mode === 'online' && isMyTurn && validMovesCount > 0 && (
        <span className="text-xs text-emerald-600">
          ({validMovesCount}个可落子位置)
        </span>
      )}
    </div>
  );
}

function OfflineGame() {
  const { state, reset, setMode, setDifficulty, placePiece } = useReversi();
  const isMobile = useIsMobile();

  const cellSize = isMobile ? 36 : 48;

  return (
    <>
      {/* 当前玩家 */}
      <div className="flex items-center justify-between w-full">
        <PlayerIndicator
          currentPlayer={state.currentPlayer}
          mode={state.mode}
          validMovesCount={state.validMoves.length}
        />
      </div>

      {/* 模式和难度选择 */}
      <div className="flex items-center justify-between w-full flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">模式:</span>
          <div className="flex rounded-lg overflow-hidden border border-zinc-200">
            <button
              onClick={() => setMode('pve')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors',
                state.mode === 'pve'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
              )}
            >
              <Bot className="w-4 h-4" />
              人机
            </button>
            <button
              onClick={() => setMode('pvp')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors',
                state.mode === 'pvp'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
              )}
            >
              <Users className="w-4 h-4" />
              双人
            </button>
          </div>
        </div>

        {state.mode === 'pve' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">难度:</span>
            <Select
              value={state.difficulty}
              onValueChange={v => setDifficulty(v as Difficulty)}
            >
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DIFFICULTY_NAMES).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <button
          onClick={reset}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
            'bg-zinc-100 text-zinc-700',
            'hover:bg-zinc-200 transition-colors',
            'text-sm font-medium'
          )}
        >
          <RotateCcw className="w-4 h-4" />
          新游戏
        </button>
      </div>

      {/* 游戏面板 */}
      <div className="relative">
        <Board
          board={state.board}
          validMoves={state.validMoves}
          onCellClick={placePiece}
          disabled={
            state.status === 'ended' ||
            (state.mode === 'pve' && state.currentPlayer === 'white')
          }
          cellSize={cellSize}
        />

        {/* 游戏结束弹窗 */}
        <GameOverModal
          isOpen={state.status === 'ended'}
          winner={state.winner}
          blackCount={state.blackCount}
          whiteCount={state.whiteCount}
          onReset={reset}
        />
      </div>
    </>
  );
}

function OnlineGame({
  userName,
  onUserNameChange,
}: {
  userName: string;
  onUserNameChange: (name: string) => void;
}) {
  const {
    gameState,
    onlineState,
    placePiece,
    reset,
    join,
    leaveRoom,
    requestPlayerRole,
    requestSwap,
    respondSwap,
    // 新功能
    timeLimit,
    timeLeft,
    canUndo,
    undoRequest,
    undoStatus,
    lastChatMessage,
    isGameStarted,
    setTimeLimit,
    startGame,
    sendChat,
    requestUndo,
    respondUndo,
  } = useOnlineReversi({ userName });
  const isMobile = useIsMobile();

  const cellSize = isMobile ? 36 : 48;
  const isConnected = onlineState.roomStatus === 'connected';

  // 构建回合提示
  const currentTurnLabel =
    gameState.currentPlayer === 'black' ? '黑棋' : '白棋';

  // 未连接时，只显示侧边面板（居中）
  if (!isConnected) {
    return (
      <div className="w-full max-w-xs mx-auto">
        <GameSidePanel
          roomStatus={onlineState.roomStatus}
          roomCode={onlineState.roomCode}
          myRole={onlineState.myRole}
          player1={onlineState.player1}
          player2={onlineState.player2}
          spectators={onlineState.spectators}
          userName={userName}
          pendingSwapRequest={onlineState.pendingSwapRequest}
          swapStatus={onlineState.swapStatus}
          gameReady={onlineState.gameReady}
          onUserNameChange={onUserNameChange}
          onJoinRoom={join}
          onLeaveRoom={leaveRoom}
          onRequestPlayer={requestPlayerRole}
          onRequestSwap={requestSwap}
          onRespondSwap={respondSwap}
          theme={THEME_EMERALD}
        />
      </div>
    );
  }

  // 已连接：左右分栏布局
  return (
    <div className={cn('flex gap-4', isMobile ? 'flex-col' : 'flex-row')}>
      {/* 左侧：信息面板 */}
      <div className={cn(isMobile ? 'w-full' : 'w-64 flex-shrink-0')}>
        <GameSidePanel
          roomStatus={onlineState.roomStatus}
          roomCode={onlineState.roomCode}
          myRole={onlineState.myRole}
          player1={onlineState.player1}
          player2={onlineState.player2}
          spectators={onlineState.spectators}
          userName={userName}
          pendingSwapRequest={onlineState.pendingSwapRequest}
          swapStatus={onlineState.swapStatus}
          gameReady={onlineState.gameReady}
          currentTurnLabel={currentTurnLabel}
          isMyTurn={onlineState.isMyTurn}
          lastChatMessage={lastChatMessage}
          onSendChat={sendChat}
          onUserNameChange={onUserNameChange}
          onJoinRoom={join}
          onLeaveRoom={leaveRoom}
          onRequestPlayer={requestPlayerRole}
          onRequestSwap={requestSwap}
          onRespondSwap={respondSwap}
          onResetGame={reset}
          theme={THEME_EMERALD}
          actionButtons={
            <>
              {/* 倒计时显示 */}
              {isGameStarted && timeLimit > 0 && (
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-600">剩余时间</span>
                    </div>
                    <span
                      className={cn(
                        'text-lg font-bold',
                        timeLeft <= 10 ? 'text-red-500' : 'text-zinc-700'
                      )}
                    >
                      {timeLeft}s
                    </span>
                  </div>
                </div>
              )}

              {/* 悔棋按钮 */}
              {isGameStarted && gameState.status !== 'ended' && (
                <button
                  onClick={requestUndo}
                  disabled={!canUndo}
                  className={cn(
                    'w-full flex items-center justify-center gap-1.5 py-2 rounded-lg',
                    'bg-zinc-100 text-zinc-700',
                    'hover:bg-zinc-200 transition-colors',
                    'text-sm font-medium',
                    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-100'
                  )}
                >
                  <Undo2 className="w-4 h-4" />
                  悔棋
                </button>
              )}
            </>
          }
        />
      </div>

      {/* 右侧：棋盘区域 */}
      <div className="flex flex-col items-center gap-3">
        {/* 分数 */}
        <ScoreBoard
          blackCount={gameState.blackCount}
          whiteCount={gameState.whiteCount}
        />

        {/* 游戏面板 */}
        <div className="relative">
          <Board
            board={gameState.board}
            validMoves={
              onlineState.isMyTurn && isGameStarted ? gameState.validMoves : []
            }
            onCellClick={placePiece}
            disabled={
              gameState.status === 'ended' ||
              !onlineState.isMyTurn ||
              !isGameStarted
            }
            cellSize={cellSize}
          />

          {/* 悔棋请求弹窗 */}
          {undoRequest && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-10">
              <div className="bg-white p-4 rounded-lg shadow-lg max-w-[200px]">
                <p className="text-sm text-zinc-800 mb-3 text-center">
                  <span className="font-medium">{undoRequest.fromName}</span>{' '}
                  请求悔棋
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondUndo(true)}
                    className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                  >
                    同意
                  </button>
                  <button
                    onClick={() => respondUndo(false)}
                    className="flex-1 py-2 bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-300"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 悔棋状态提示 */}
          {undoStatus && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <div
                className={cn(
                  'px-4 py-2 rounded-lg shadow-lg text-sm font-medium',
                  undoStatus === 'waiting' && 'bg-emerald-500 text-white',
                  undoStatus === 'accepted' && 'bg-green-500 text-white',
                  undoStatus === 'rejected' && 'bg-red-500 text-white'
                )}
              >
                {undoStatus === 'waiting' && '等待对方响应...'}
                {undoStatus === 'accepted' && '悔棋请求已同意'}
                {undoStatus === 'rejected' && '悔棋请求被拒绝'}
              </div>
            </div>
          )}

          {/* 开始游戏按钮（绝对定位在棋盘上） */}
          {onlineState.gameReady && !isGameStarted && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4 rounded-lg">
              {/* 时间限制设置 */}
              <div className="flex items-center gap-2 bg-white/95 px-4 py-2 rounded-lg shadow">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-zinc-700">每步时间:</span>
                <Select
                  value={String(timeLimit)}
                  onValueChange={v => setTimeLimit(Number(v) as TimeLimit)}
                >
                  <SelectTrigger className="w-24 h-8 text-sm bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_LIMIT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={startGame}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-base font-medium shadow-lg"
              >
                开始游戏
              </button>
            </div>
          )}

          {/* 游戏结束弹窗 */}
          <GameOverModal
            isOpen={gameState.status === 'ended'}
            winner={gameState.winner}
            blackCount={gameState.blackCount}
            whiteCount={gameState.whiteCount}
            onReset={reset}
          />
        </div>

        {/* 操作提示 */}
        <div className="text-xs text-zinc-500 text-center">
          <p>点击绿色提示位置落子</p>
        </div>
      </div>
    </div>
  );
}

export default function Reversi() {
  const [activeTab, setActiveTab] = useState<'offline' | 'online'>('offline');
  const [userName, setUserName] = useState(generateDefaultName);
  const { state } = useReversi();
  const isMobile = useIsMobile();

  return (
    <div className="w-full max-w-fit mx-auto p-4">
      <div
        className={cn(
          'flex flex-col items-center gap-4 p-4',
          'bg-white/95',
          'rounded-xl',
          'border border-zinc-200',
          'shadow-lg shadow-zinc-200/50'
        )}
      >
        {/* 标题和切换按钮 */}
        <div className="flex items-center justify-between w-full gap-4">
          <h1 className="text-3xl font-bold text-emerald-700">黑白棋</h1>

          {/* 桌面端：离线模式显示分数 */}
          {activeTab === 'offline' && !isMobile ? (
            <ScoreBoard
              blackCount={state.blackCount}
              whiteCount={state.whiteCount}
            />
          ) : null}

          {/* 离线/在线切换 */}
          <div className="flex rounded-lg overflow-hidden border border-zinc-200">
            <button
              onClick={() => setActiveTab('offline')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === 'offline'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
              )}
            >
              <Bot className="w-4 h-4" />
              离线
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === 'online'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
              )}
            >
              <Globe className="w-4 h-4" />
              在线
            </button>
          </div>
        </div>

        {/* 移动端：离线模式分数单独一行 */}
        {activeTab === 'offline' && isMobile ? (
          <ScoreBoard
            blackCount={state.blackCount}
            whiteCount={state.whiteCount}
          />
        ) : null}

        {/* 根据标签显示不同内容 */}
        {activeTab === 'offline' ? (
          <>
            <OfflineGame />
            {/* 离线模式操作提示 */}
            <div className="text-xs text-zinc-500 text-center">
              <p>点击绿色提示位置落子</p>
            </div>
          </>
        ) : (
          <OnlineGame userName={userName} onUserNameChange={setUserName} />
        )}
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
