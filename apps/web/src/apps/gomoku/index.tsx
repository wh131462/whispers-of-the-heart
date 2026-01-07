import { cn } from '@/lib/utils';
import { RotateCcw, Undo2, Users, Bot } from 'lucide-react';
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
import { useGomoku } from './hooks/useGomoku';
import type { GameMode, Difficulty, Player } from './types';
import { PLAYER_NAMES } from './types';

const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

function PlayerIndicator({
  currentPlayer,
  mode,
}: {
  currentPlayer: Player;
  mode: GameMode;
}) {
  const isPlayerTurn = mode === 'pvp' || currentPlayer === 'black';

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
          {mode === 'pve' && !isPlayerTurn && ' (AI思考中...)'}
        </span>
      </div>
    </div>
  );
}

export default function Gomoku() {
  const { state, reset, setMode, setDifficulty, makeMove, undo, canUndo } =
    useGomoku();
  const isMobile = useIsMobile();

  const cellSize = isMobile ? 20 : 28;

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
        {/* 标题 */}
        <div className="flex items-center justify-between w-full gap-4">
          <h1 className="text-3xl font-bold text-amber-700">五子棋</h1>
          <PlayerIndicator
            currentPlayer={state.currentPlayer}
            mode={state.mode}
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
                    ? 'bg-amber-500 text-white'
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
                    ? 'bg-amber-500 text-white'
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

          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                'bg-zinc-100 text-zinc-700',
                'hover:bg-zinc-200 transition-colors',
                'text-sm font-medium',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-100'
              )}
            >
              <Undo2 className="w-4 h-4" />
              悔棋
            </button>
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
        </div>

        {/* 游戏面板 */}
        <div className="relative">
          <Board
            board={state.board}
            lastMove={state.lastMove}
            winningLine={state.winningLine}
            onCellClick={makeMove}
            disabled={
              state.status === 'won' ||
              (state.mode === 'pve' && state.currentPlayer === 'white')
            }
            cellSize={cellSize}
          />

          {/* 游戏结束弹窗 */}
          <GameOverModal
            status={state.status}
            winner={state.winner}
            onReset={reset}
          />
        </div>

        {/* 操作提示 */}
        <div className="text-xs text-zinc-500 text-center">
          <p>点击交叉点落子</p>
        </div>
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
