import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RotateCcw, Users, Bot, Globe } from 'lucide-react';
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
import type { GameMode, Difficulty, Player } from './types';
import { PLAYER_NAMES } from './types';

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
          gameReady={onlineState.gameReady}
          currentTurnLabel={currentTurnLabel}
          isMyTurn={onlineState.isMyTurn}
          onUserNameChange={onUserNameChange}
          onJoinRoom={join}
          onLeaveRoom={leaveRoom}
          onRequestPlayer={requestPlayerRole}
          onRequestSwap={requestSwap}
          onRespondSwap={respondSwap}
          onResetGame={reset}
          theme={THEME_EMERALD}
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
            validMoves={onlineState.isMyTurn ? gameState.validMoves : []}
            onCellClick={placePiece}
            disabled={gameState.status === 'ended' || !onlineState.isMyTurn}
            cellSize={cellSize}
          />

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
        {/* 标题和分数 */}
        <div className="flex items-center justify-between w-full gap-4">
          <h1 className="text-3xl font-bold text-emerald-700">黑白棋</h1>

          {/* 离线模式显示分数，在线模式显示切换按钮 */}
          {activeTab === 'offline' ? (
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
