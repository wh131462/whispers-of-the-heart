import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Globe, Bot, Clock, Play } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  GameSidePanel,
  type PlayerLabelConfig,
} from '@/components/game/GameSidePanel';

import GameCanvas from './components/GameCanvas';
import GameMenu from './components/GameMenu';
import { PauseMenu } from './components/GameMenu';
import GameOverModal from './components/GameOverModal';
import TouchControls, {
  type TouchInputState,
} from './components/TouchControls';
import { useSlimeSoccer } from './hooks/useSlimeSoccer';
import { useOnlineSlimeSoccer } from './hooks/useOnlineSlimeSoccer';
import type { GameMode, MatchDuration, AIDifficulty } from './types';
import { GAME_CONFIG } from './types';

// 史莱姆足球主题色
const THEME_SLIME = {
  primary: 'cyan',
  gradient: { from: 'from-cyan-400', to: 'to-blue-500' },
};

// 史莱姆足球玩家标签配置
const SLIME_PLAYER_LABELS: PlayerLabelConfig = {
  player1Label: '青色方',
  player2Label: '红色方',
  player1ColorClass: 'bg-cyan-500',
  player2ColorClass: 'bg-red-500',
};

// 生成默认用户名
function generateDefaultName() {
  return `玩家${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// 离线游戏组件
function OfflineGame() {
  const {
    gameState,
    startGame,
    resumeGame,
    restartGame,
    quitToMenu,
    setMatchDuration,
    updateTouchInput,
  } = useSlimeSoccer();
  const isMobile = useIsMobile();

  const handleStartGame = useCallback(
    (mode: GameMode, duration: MatchDuration, diff?: AIDifficulty) => {
      startGame(mode, duration, diff);
    },
    [startGame]
  );

  // 处理触摸输入
  const handleTouchInput = useCallback(
    (input: TouchInputState) => {
      // 单人模式控制右侧（玩家），双人模式控制右侧（移动端双人模式不太实用）
      updateTouchInput(input, 'right');
    },
    [updateTouchInput]
  );

  const scale = useMemo(() => {
    if (typeof window !== 'undefined') {
      const maxWidth = Math.min(window.innerWidth - 32, 800);
      return maxWidth / GAME_CONFIG.FIELD_WIDTH;
    }
    return 1;
  }, []);

  const canvasHeight = GAME_CONFIG.FIELD_HEIGHT * scale;
  const showTouchControls = isMobile && gameState.status === 'playing';

  return (
    <div
      className="relative w-full flex flex-col items-center bg-gray-900 p-4"
      style={{ minHeight: canvasHeight + 80 }}
    >
      {/* 游戏画布 */}
      <div className="relative">
        <GameCanvas gameState={gameState} scale={scale} />

        {/* 暂停层 */}
        {gameState.status === 'paused' && (
          <PauseMenu
            onResume={resumeGame}
            onRestart={restartGame}
            onQuit={quitToMenu}
            duration={gameState.matchDuration}
            onDurationChange={setMatchDuration}
          />
        )}

        {/* 游戏结束层 */}
        {gameState.status === 'ended' && (
          <GameOverModal
            winner={gameState.winner}
            leftScore={gameState.leftScore}
            rightScore={gameState.rightScore}
            onRestart={restartGame}
            onQuit={quitToMenu}
          />
        )}
      </div>

      {/* 底部提示 */}
      {gameState.status === 'playing' && !isMobile && (
        <p className="mt-4 text-gray-500 text-sm">按 ESC 暂停游戏</p>
      )}

      {/* 移动端触摸控制 - 放在画布下方 */}
      {showTouchControls && (
        <div className="mt-4 w-full">
          <TouchControls onInputChange={handleTouchInput} />
        </div>
      )}

      {/* 菜单层 - 移到外层使其覆盖整个游戏区域 */}
      {gameState.status === 'menu' && (
        <GameMenu onStartGame={handleStartGame} />
      )}
    </div>
  );
}

// 在线游戏组件
function OnlineGame({
  userName,
  onUserNameChange,
}: {
  userName: string;
  onUserNameChange: (name: string) => void;
}) {
  const {
    gameState,
    matchDuration,
    isGameStarted,
    lastChatMessage,
    onlineState,
    join,
    leaveRoom,
    requestPlayerRole,
    requestSwap,
    respondSwap,
    setMatchDuration,
    startGame,
    reset,
    sendChat,
    updateTouchInput,
  } = useOnlineSlimeSoccer({ userName });
  const isMobile = useIsMobile();

  // 处理触摸输入
  const handleTouchInput = useCallback(
    (input: TouchInputState) => {
      updateTouchInput(input);
    },
    [updateTouchInput]
  );

  const scale = useMemo(() => {
    if (typeof window !== 'undefined') {
      const maxWidth = Math.min(window.innerWidth - (isMobile ? 32 : 320), 700);
      return Math.max(0.6, maxWidth / GAME_CONFIG.FIELD_WIDTH);
    }
    return 0.8;
  }, [isMobile]);

  const canvasHeight = GAME_CONFIG.FIELD_HEIGHT * scale;
  const isConnected = onlineState.roomStatus === 'connected';
  const showTouchControls =
    isMobile &&
    isGameStarted &&
    gameState.status === 'playing' &&
    onlineState.mySide;

  // 未连接时，只显示侧边面板（居中）
  if (!isConnected) {
    return (
      <div
        className="w-full flex items-center justify-center p-4"
        style={{
          minHeight: canvasHeight + 80,
          background: `linear-gradient(135deg, ${GAME_CONFIG.FIELD_COLOR} 0%, #0d47a1 100%)`,
        }}
      >
        <div className="w-full max-w-xs">
          <GameSidePanel
            roomStatus={onlineState.roomStatus}
            roomCode={onlineState.roomCode}
            gameName="史莱姆足球"
            gamePath="slime-soccer"
            myRole={onlineState.myRole ?? 'spectator'}
            player1={
              onlineState.player1 as Parameters<
                typeof GameSidePanel
              >[0]['player1']
            }
            player2={
              onlineState.player2 as Parameters<
                typeof GameSidePanel
              >[0]['player2']
            }
            spectators={
              onlineState.spectators as Parameters<
                typeof GameSidePanel
              >[0]['spectators']
            }
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
            theme={THEME_SLIME}
            playerLabels={SLIME_PLAYER_LABELS}
          />
        </div>
      </div>
    );
  }

  // 已连接：左右分栏布局
  return (
    <div
      className={cn(
        'w-full flex bg-gray-900',
        isMobile ? 'flex-col' : 'flex-row'
      )}
      style={{ minHeight: canvasHeight + 80 }}
    >
      {/* 左侧面板 */}
      <div
        className={cn(isMobile ? 'w-full' : 'w-72 flex-shrink-0', 'p-3')}
        style={{ maxHeight: isMobile ? 'auto' : canvasHeight + 80 }}
      >
        <GameSidePanel
          roomStatus={onlineState.roomStatus}
          roomCode={onlineState.roomCode}
          gameName="史莱姆足球"
          gamePath="slime-soccer"
          myRole={onlineState.myRole ?? 'spectator'}
          player1={
            onlineState.player1 as Parameters<
              typeof GameSidePanel
            >[0]['player1']
          }
          player2={
            onlineState.player2 as Parameters<
              typeof GameSidePanel
            >[0]['player2']
          }
          spectators={
            onlineState.spectators as Parameters<
              typeof GameSidePanel
            >[0]['spectators']
          }
          userName={userName}
          pendingSwapRequest={onlineState.pendingSwapRequest}
          swapStatus={onlineState.swapStatus}
          gameReady={onlineState.gameReady}
          lastChatMessage={lastChatMessage}
          onSendChat={sendChat}
          onUserNameChange={onUserNameChange}
          onJoinRoom={join}
          onLeaveRoom={leaveRoom}
          onRequestPlayer={requestPlayerRole}
          onRequestSwap={requestSwap}
          onRespondSwap={respondSwap}
          onResetGame={reset}
          theme={THEME_SLIME}
          playerLabels={SLIME_PLAYER_LABELS}
          actionButtons={
            !isGameStarted && onlineState.myRole !== 'spectator' ? (
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  <span className="text-sm text-zinc-700">比赛时长</span>
                </div>
                <Select
                  value={String(matchDuration)}
                  onValueChange={(v: string) =>
                    setMatchDuration(Number(v) as MatchDuration)
                  }
                >
                  <SelectTrigger className="w-full h-8 text-sm bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(d => (
                      <SelectItem key={d} value={String(d)}>
                        {d} 分钟
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : undefined
          }
        />
      </div>

      {/* 右侧游戏区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <GameCanvas gameState={gameState} scale={scale} />

          {/* 开始游戏按钮 */}
          {!isGameStarted &&
            onlineState.gameReady &&
            onlineState.myRole !== 'spectator' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white text-lg font-medium rounded-lg shadow-lg transition-colors"
                >
                  <Play className="w-6 h-6" />
                  开始游戏
                </button>
              </div>
            )}

          {/* 等待对手 */}
          {!isGameStarted && !onlineState.gameReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-white text-lg">等待对手加入...</p>
              </div>
            </div>
          )}

          {/* 游戏结束 */}
          {gameState.status === 'ended' && (
            <GameOverModal
              winner={gameState.winner}
              leftScore={gameState.leftScore}
              rightScore={gameState.rightScore}
              onRestart={reset}
              onQuit={leaveRoom}
              isOnline
              myRole={onlineState.mySide}
            />
          )}
        </div>

        {/* 操作提示 */}
        {isGameStarted && onlineState.mySide && !isMobile && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              你是
              <span
                className="font-bold mx-1"
                style={{
                  color:
                    onlineState.mySide === 'left'
                      ? GAME_CONFIG.LEFT_SLIME_COLOR
                      : GAME_CONFIG.RIGHT_SLIME_COLOR,
                }}
              >
                {onlineState.mySide === 'left' ? '青色' : '红色'}
              </span>
              方 |{' '}
              {onlineState.mySide === 'left'
                ? 'W跳跃 A/D移动 S抓球'
                : '↑跳跃 ←/→移动 ↓抓球'}
            </p>
          </div>
        )}

        {/* 移动端触摸控制 - 放在画布下方 */}
        {showTouchControls && (
          <div className="mt-4 w-full">
            <TouchControls onInputChange={handleTouchInput} />
          </div>
        )}
      </div>
    </div>
  );
}

// 主组件
export default function SlimeSoccer() {
  const [activeTab, setActiveTab] = useState<'offline' | 'online'>('offline');
  const [userName, setUserName] = useState(generateDefaultName);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className={cn(
          'flex flex-col',
          'bg-gray-900',
          'rounded-xl',
          'border border-gray-700',
          'shadow-lg shadow-black/30'
        )}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-cyan-400">史莱姆足球</h1>

          {/* 离线/在线切换 */}
          <div className="flex rounded-lg overflow-hidden border border-gray-600">
            <button
              onClick={() => setActiveTab('offline')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === 'offline'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              <Globe className="w-4 h-4" />
              在线
            </button>
          </div>
        </div>

        {/* 根据标签显示不同内容 */}
        {activeTab === 'offline' ? (
          <OfflineGame />
        ) : (
          <OnlineGame userName={userName} onUserNameChange={setUserName} />
        )}
      </div>
    </div>
  );
}
