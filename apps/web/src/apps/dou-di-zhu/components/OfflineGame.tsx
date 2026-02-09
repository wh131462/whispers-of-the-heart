import { cn } from '@/lib/utils';
import { CardView } from './CardView';
import { GameControls } from './GameControls';
import { HandCards } from './HandCards';
import { PlayArea } from './PlayArea';
import { PlayerInfo } from './PlayerInfo';
import { useGame } from '../hooks/useGame';

export function OfflineGame() {
  const { state, startGame, playerBid, toggleCard, playCards, pass, hint } =
    useGame();
  const {
    phase,
    players,
    bottomCards,
    currentPlayer,
    lastPlayer,
    selectedCards,
    lastPlayedCards,
    message,
    bidding,
    winner,
    bombCount,
  } = state;

  const isPlaying = phase === 'playing';
  const isBidding = phase === 'bidding';
  const isPlayerTurn = currentPlayer === 0;
  const canPass =
    isPlaying && isPlayerTurn && state.lastCombo !== null && lastPlayer !== 0;
  const isFinished = phase === 'finished';
  const showCards = isPlaying || isBidding || isFinished;
  const showPlayArea = isPlaying || isFinished;

  return (
    <div className="w-full max-w-5xl mx-auto p-1 sm:p-2 md:p-4">
      {/* 牌桌 */}
      <div
        className={cn(
          'relative flex flex-col',
          'rounded-2xl',
          'border-4 border-amber-900/60',
          'shadow-2xl',
          'bg-gradient-to-b from-green-800 via-green-700 to-green-800'
        )}
      >
        {/* 桌面纹理 */}
        <div className="absolute inset-0 rounded-2xl opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] pointer-events-none" />

        {/* 顶部: 标题 / 底牌 / 炸弹 — 固定高度 */}
        <div className="relative flex items-center justify-center gap-4 pt-3 pb-1 px-4 min-h-[56px]">
          <h2
            className={cn(
              'text-xl font-bold text-yellow-400/90 tracking-wider absolute',
              'transition-opacity duration-300',
              showCards ? 'opacity-0 pointer-events-none' : 'opacity-100'
            )}
          >
            斗地主
          </h2>
          <div
            className={cn(
              'flex items-center gap-4 transition-opacity duration-300',
              bidding.landlordIndex !== null ? 'opacity-100' : 'opacity-0'
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

        {/* 消息提示 — 固定高度 */}
        <div className="relative flex justify-center px-4 py-1 min-h-[36px]">
          <div
            className={cn(
              'text-center py-1.5 px-5 rounded-full text-sm max-w-xs',
              winner
                ? 'bg-yellow-400/20 text-yellow-300 font-bold border border-yellow-400/30'
                : 'text-white/70'
            )}
          >
            {message}
          </div>
        </div>

        {/* 对手 + 出牌区 — 始终渲染，固定结构 */}
        <div className="relative grid grid-cols-[80px_1fr_80px] sm:grid-cols-[120px_1fr_120px] md:grid-cols-[160px_1fr_160px] gap-1 px-2 md:px-4 py-2 min-h-[200px]">
          {/* 左侧 AI */}
          <div className="flex flex-col items-center gap-2 justify-start pt-2 overflow-hidden">
            <PlayerInfo
              player={players[1]}
              isCurrentTurn={currentPlayer === 1}
              compact
            />
            <div
              className={cn(
                'flex justify-center transition-opacity duration-300',
                showCards ? 'opacity-100' : 'opacity-0'
              )}
            >
              <HandCards cards={players[1].cards} selectedCards={[]} faceDown />
            </div>
          </div>

          {/* 中心出牌区 */}
          <div className="flex flex-col items-center justify-center gap-2 min-h-[140px] overflow-hidden">
            {/* AI 出牌行 */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 min-h-[60px]">
              {showPlayArea && (
                <>
                  <PlayArea
                    cards={lastPlayedCards[1]}
                    label={
                      lastPlayedCards[1].length === 0 && isPlaying
                        ? '不出'
                        : undefined
                    }
                  />
                  <PlayArea
                    cards={lastPlayedCards[2]}
                    label={
                      lastPlayedCards[2].length === 0 && isPlaying
                        ? '不出'
                        : undefined
                    }
                  />
                </>
              )}
            </div>
            {/* 玩家出牌行 */}
            <div className="flex items-center justify-center min-h-[60px]">
              {showPlayArea && lastPlayedCards[0].length > 0 && (
                <PlayArea cards={lastPlayedCards[0]} />
              )}
            </div>
          </div>

          {/* 右侧 AI */}
          <div className="flex flex-col items-center gap-2 justify-start pt-2 overflow-hidden">
            <PlayerInfo
              player={players[2]}
              isCurrentTurn={currentPlayer === 2}
              compact
            />
            <div
              className={cn(
                'flex justify-center transition-opacity duration-300',
                showCards ? 'opacity-100' : 'opacity-0'
              )}
            >
              <HandCards cards={players[2].cards} selectedCards={[]} faceDown />
            </div>
          </div>
        </div>

        {/* 分隔装饰线 */}
        <div className="relative mx-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* 玩家区域 — 始终渲染 */}
        <div className="relative flex flex-col items-center gap-2 px-2 sm:px-4 pt-3 pb-4">
          {/* 玩家信息 */}
          <PlayerInfo player={players[0]} isCurrentTurn={currentPlayer === 0} />

          {/* 操作按钮 — 固定占位 */}
          <div className="min-h-[40px] flex items-center">
            <GameControls
              phase={phase}
              isPlayerTurn={isPlayerTurn}
              canPass={canPass}
              isBidding={isBidding}
              isPlayerBidding={isBidding && bidding.currentBidder === 0}
              onPlay={playCards}
              onPass={pass}
              onHint={hint}
              onBid={bid => playerBid(bid ? 'bid' : 'pass')}
              onStart={startGame}
            />
          </div>

          {/* 手牌 — 始终占位 */}
          <div
            className={cn(
              'w-full flex justify-center pt-4 pb-2 min-h-[92px]',
              'transition-opacity duration-300',
              showCards ? 'opacity-100' : 'opacity-0'
            )}
          >
            <HandCards
              cards={players[0].cards}
              selectedCards={selectedCards}
              interactive={isPlaying && isPlayerTurn}
              onToggle={toggleCard}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
