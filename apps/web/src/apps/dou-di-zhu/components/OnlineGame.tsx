import { cn } from '@/lib/utils';
import type { SeatIndex } from '../types/online';
import type { Player, Role, GamePhase } from '../types';
import { useOnlineDDZ } from '../hooks/useOnlineDDZ';
import { CardView } from './CardView';
import { GameControls } from './GameControls';
import { HandCards } from './HandCards';
import { PlayArea } from './PlayArea';
import { PlayerInfo } from './PlayerInfo';
import { DDZLobby } from './DDZLobby';

type OnlineGameProps = {
  userName: string;
  onUserNameChange: (name: string) => void;
};

export function OnlineGame({ userName, onUserNameChange }: OnlineGameProps) {
  const {
    roomState,
    isHost,
    mySeat,
    seats,
    phase,
    message,
    viewState,
    selectedCards,
    joinRoom,
    leaveRoom,
    requestSeat,
    toggleReady,
    bid,
    playCards,
    pass,
    hint,
    toggleCard,
    startNewRound,
  } = useOnlineDDZ({ appId: 'dou-di-zhu', userName });

  const isConnected = roomState.status === 'connected';
  const inGame =
    phase === 'bidding' || phase === 'playing' || phase === 'finished';

  // 未进入游戏 —— 显示大厅
  if (!isConnected || !inGame) {
    return (
      <div className="w-full max-w-5xl mx-auto p-1 sm:p-2 md:p-4">
        <div
          className={cn(
            'relative flex flex-col',
            'rounded-2xl',
            'border-4 border-amber-900/60',
            'shadow-2xl',
            'bg-gradient-to-b from-green-800 via-green-700 to-green-800'
          )}
        >
          <div className="absolute inset-0 rounded-2xl opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] pointer-events-none" />
          <div className="relative">
            <DDZLobby
              roomState={roomState}
              isHost={isHost}
              mySeat={mySeat}
              seats={seats}
              userName={userName}
              onUserNameChange={onUserNameChange}
              onJoinRoom={joinRoom}
              onLeaveRoom={leaveRoom}
              onToggleReady={toggleReady}
              onRequestSeat={requestSeat}
            />
          </div>
        </div>
      </div>
    );
  }

  // ──── 座位视角旋转 ────
  // 我在底部，左边是下家，右边是上家
  const mySeatIdx = mySeat ?? 0;
  const leftSeat = ((mySeatIdx + 1) % 3) as SeatIndex;
  const rightSeat = ((mySeatIdx + 2) % 3) as SeatIndex;

  // 构造虚拟 Player 对象复用 PlayerInfo 组件
  const buildPlayer = (seatIdx: SeatIndex): Player => ({
    id: seatIdx,
    name: seats[seatIdx]?.name ?? `玩家${seatIdx + 1}`,
    role:
      viewState?.landlordSeat === seatIdx
        ? ('landlord' as Role)
        : viewState?.landlordSeat !== null
          ? ('farmer' as Role)
          : null,
    cards:
      seatIdx === mySeatIdx
        ? (viewState?.myCards ?? [])
        : Array.from(
            { length: viewState?.cardCounts[seatIdx] ?? 0 },
            (_, i) => ({
              id: `ph-${seatIdx}-${i}`,
              suit: null,
              rank: '3' as const,
              value: 0,
            })
          ),
    isAI: false,
  });

  const playerBottom = buildPlayer(mySeatIdx);
  const playerLeft = buildPlayer(leftSeat);
  const playerRight = buildPlayer(rightSeat);

  const isBidding = phase === 'bidding';
  const isPlaying = phase === 'playing';
  const isFinished = phase === 'finished';
  const isMyTurn = viewState?.currentPlayer === mySeatIdx;
  const canPass =
    isPlaying &&
    isMyTurn &&
    viewState?.lastCombo !== null &&
    viewState?.lastPlayer !== mySeatIdx;
  const showCards = isBidding || isPlaying || isFinished;
  const showPlayArea = isPlaying || isFinished;

  // 出牌区映射：viewState 中的 seat 索引映射到 left/right/bottom
  const lastPlayedLeft = viewState?.lastPlayedCards[leftSeat] ?? [];
  const lastPlayedRight = viewState?.lastPlayedCards[rightSeat] ?? [];
  const lastPlayedBottom = viewState?.lastPlayedCards[mySeatIdx] ?? [];

  const bottomCards = viewState?.bottomCards ?? [];
  const landlordDecided = viewState?.landlordSeat !== null;
  const bombCount = viewState?.bombCount ?? 0;

  // GamePhase 映射（在 inGame 条件之后 phase 不会是 'waiting'）
  const gamePhase = phase as GamePhase;

  return (
    <div className="w-full max-w-5xl mx-auto p-1 sm:p-2 md:p-4">
      <div
        className={cn(
          'relative flex flex-col',
          'rounded-2xl',
          'border-4 border-amber-900/60',
          'shadow-2xl',
          'bg-gradient-to-b from-green-800 via-green-700 to-green-800'
        )}
      >
        <div className="absolute inset-0 rounded-2xl opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] pointer-events-none" />

        {/* 顶部: 底牌 / 炸弹 */}
        <div className="relative flex items-center justify-center gap-4 pt-3 pb-1 px-4 min-h-[56px]">
          <h2
            className={cn(
              'text-xl font-bold text-yellow-400/90 tracking-wider absolute',
              'transition-opacity duration-300',
              showCards ? 'opacity-0 pointer-events-none' : 'opacity-100'
            )}
          >
            联机斗地主
          </h2>
          <div
            className={cn(
              'flex items-center gap-4 transition-opacity duration-300',
              landlordDecided ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 font-medium">底牌</span>
              <div className="flex gap-1">
                {bottomCards.length > 0
                  ? bottomCards.map(c => (
                      <CardView key={c.id} card={c} size="sm" />
                    ))
                  : [0, 1, 2].map(i => (
                      <CardView
                        key={i}
                        card={{
                          id: `ph-${i}`,
                          suit: null,
                          rank: 'jokerSmall',
                          value: 0,
                        }}
                        size="sm"
                        faceDown
                      />
                    ))}
              </div>
            </div>
            {bombCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-500/20 px-3 py-1 rounded-full border border-red-400/30">
                <span className="text-red-300 text-xs">&#x1f4a3;</span>
                <span className="text-red-300 text-xs font-bold">
                  &times;{bombCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 消息提示 */}
        <div className="relative flex justify-center px-4 py-1 min-h-[36px]">
          <div
            className={cn(
              'text-center py-1.5 px-5 rounded-full text-sm max-w-xs',
              viewState?.winner
                ? 'bg-yellow-400/20 text-yellow-300 font-bold border border-yellow-400/30'
                : 'text-white/70'
            )}
          >
            {message}
          </div>
        </div>

        {/* 对手 + 出牌区 */}
        <div className="relative grid grid-cols-[80px_1fr_80px] sm:grid-cols-[120px_1fr_120px] md:grid-cols-[160px_1fr_160px] gap-1 px-2 md:px-4 py-2 min-h-[200px]">
          {/* 左侧对手 */}
          <div className="flex flex-col items-center gap-2 justify-start pt-2 overflow-hidden">
            <PlayerInfo
              player={playerLeft}
              isCurrentTurn={viewState?.currentPlayer === leftSeat}
              compact
              disconnected={
                seats[leftSeat] ? !seats[leftSeat]!.connected : false
              }
            />
            <div
              className={cn(
                'flex justify-center transition-opacity duration-300',
                showCards ? 'opacity-100' : 'opacity-0'
              )}
            >
              <HandCards cards={playerLeft.cards} selectedCards={[]} faceDown />
            </div>
          </div>

          {/* 中心出牌区 */}
          <div className="flex flex-col items-center justify-center gap-2 min-h-[140px] overflow-hidden">
            <div className="flex items-center justify-center gap-4 sm:gap-8 min-h-[60px]">
              {showPlayArea && (
                <>
                  <PlayArea
                    cards={lastPlayedLeft}
                    label={
                      lastPlayedLeft.length === 0 && isPlaying
                        ? '不出'
                        : undefined
                    }
                  />
                  <PlayArea
                    cards={lastPlayedRight}
                    label={
                      lastPlayedRight.length === 0 && isPlaying
                        ? '不出'
                        : undefined
                    }
                  />
                </>
              )}
            </div>
            <div className="flex items-center justify-center min-h-[60px]">
              {showPlayArea && lastPlayedBottom.length > 0 && (
                <PlayArea cards={lastPlayedBottom} />
              )}
            </div>
          </div>

          {/* 右侧对手 */}
          <div className="flex flex-col items-center gap-2 justify-start pt-2 overflow-hidden">
            <PlayerInfo
              player={playerRight}
              isCurrentTurn={viewState?.currentPlayer === rightSeat}
              compact
              disconnected={
                seats[rightSeat] ? !seats[rightSeat]!.connected : false
              }
            />
            <div
              className={cn(
                'flex justify-center transition-opacity duration-300',
                showCards ? 'opacity-100' : 'opacity-0'
              )}
            >
              <HandCards
                cards={playerRight.cards}
                selectedCards={[]}
                faceDown
              />
            </div>
          </div>
        </div>

        <div className="relative mx-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* 玩家区域 */}
        <div className="relative flex flex-col items-center gap-2 px-2 sm:px-4 pt-3 pb-4">
          <PlayerInfo player={playerBottom} isCurrentTurn={isMyTurn ?? false} />

          {/* 操作按钮 */}
          <div className="min-h-[40px] flex items-center">
            {isFinished ? (
              <div className="flex gap-3">
                {isHost && (
                  <button
                    onClick={startNewRound}
                    className={cn(
                      'px-8 py-2.5 rounded-full text-base font-bold',
                      'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900',
                      'hover:from-yellow-300 hover:to-amber-400',
                      'shadow-lg shadow-amber-500/30 active:scale-95'
                    )}
                  >
                    再来一局
                  </button>
                )}
                <button
                  onClick={leaveRoom}
                  className={cn(
                    'px-5 py-2.5 rounded-full text-sm font-medium',
                    'bg-white/15 text-white/80 border border-white/20',
                    'hover:bg-white/25 active:scale-95'
                  )}
                >
                  离开房间
                </button>
              </div>
            ) : (
              <GameControls
                phase={gamePhase}
                isPlayerTurn={isMyTurn ?? false}
                canPass={canPass}
                isBidding={isBidding}
                isPlayerBidding={
                  isBidding && viewState?.bidding.currentBidder === mySeatIdx
                }
                onPlay={playCards}
                onPass={pass}
                onHint={hint}
                onBid={b => bid(b ? 'bid' : 'pass')}
                onStart={() => {}}
              />
            )}
          </div>

          {/* 手牌 */}
          <div
            className={cn(
              'w-full flex justify-center pt-4 pb-2 min-h-[92px]',
              'transition-opacity duration-300',
              showCards ? 'opacity-100' : 'opacity-0'
            )}
          >
            <HandCards
              cards={viewState?.myCards ?? []}
              selectedCards={selectedCards}
              interactive={isPlaying && (isMyTurn ?? false)}
              onToggle={toggleCard}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
