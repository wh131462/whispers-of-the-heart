import { cn } from '@/lib/utils';
import { RotateCcw, Undo2 } from 'lucide-react';
import { GameBoard } from './components/GameBoard';
import { ScoreBoard } from './components/ScoreBoard';
import { GameOverModal } from './components/GameOverModal';
import { useGame2048 } from './hooks/useGame2048';

export default function Game2048() {
  const { state, reset, handleMove, continueGame, undo, canUndo } =
    useGame2048();

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
          <h1 className="text-4xl font-bold text-amber-600">2048</h1>
          <ScoreBoard score={state.score} bestScore={state.bestScore} />
        </div>

        {/* 操作提示 */}
        <div className="flex items-center justify-between w-full">
          <p className="text-sm text-zinc-500">
            合并方块达到 <span className="font-bold text-amber-600">2048</span>
          </p>
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
              撤销
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
          <GameBoard tiles={state.tiles} onMove={handleMove} />

          {/* 游戏结束弹窗 */}
          <GameOverModal
            status={state.status}
            score={state.score}
            onReset={reset}
            onContinue={state.status === 'won' ? continueGame : undefined}
          />
        </div>

        {/* 操作提示 */}
        <div className="text-xs text-zinc-500 text-center">
          <p>方向键或 WASD 移动 | 滑动也可以</p>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes tile-new {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes tile-merge {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-tile-new {
          animation: tile-new 0.2s ease-out forwards;
        }

        .animate-tile-merge {
          animation: tile-merge 0.2s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
