import { cn } from '@/lib/utils';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { GameBoard } from './components/GameBoard';
import { PiecePreview } from './components/PiecePreview';
import { useTetris } from './hooks/useTetris';

export default function Tetris() {
  const { state, start, pause, resume, reset } = useTetris();

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
          <h1 className="text-3xl font-bold text-purple-600">俄罗斯方块</h1>
          <div className="flex items-center gap-2">
            {state.status === 'idle' && (
              <button
                onClick={start}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                  'bg-purple-500 text-white',
                  'hover:bg-purple-600 transition-colors',
                  'text-sm font-medium'
                )}
              >
                <Play className="w-4 h-4" />
                开始
              </button>
            )}
            {state.status === 'playing' && (
              <button
                onClick={pause}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                  'bg-zinc-100 text-zinc-700',
                  'hover:bg-zinc-200 transition-colors',
                  'text-sm font-medium'
                )}
              >
                <Pause className="w-4 h-4" />
                暂停
              </button>
            )}
            {state.status === 'paused' && (
              <button
                onClick={resume}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                  'bg-purple-500 text-white',
                  'hover:bg-purple-600 transition-colors',
                  'text-sm font-medium'
                )}
              >
                <Play className="w-4 h-4" />
                继续
              </button>
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
              重置
            </button>
          </div>
        </div>

        {/* 游戏区域 */}
        <div className="flex gap-4">
          {/* 左侧信息面板 */}
          <div className="flex flex-col gap-3">
            <PiecePreview type={state.holdPiece} label="暂存" />

            <div className="bg-zinc-100 rounded-lg p-3 border border-zinc-200">
              <div className="text-xs text-zinc-500 mb-1">分数</div>
              <div className="text-xl font-bold text-purple-600">
                {state.score}
              </div>
            </div>

            <div className="bg-zinc-100 rounded-lg p-3 border border-zinc-200">
              <div className="text-xs text-zinc-500 mb-1">等级</div>
              <div className="text-xl font-bold text-zinc-700">
                {state.level}
              </div>
            </div>

            <div className="bg-zinc-100 rounded-lg p-3 border border-zinc-200">
              <div className="text-xs text-zinc-500 mb-1">行数</div>
              <div className="text-xl font-bold text-zinc-700">
                {state.lines}
              </div>
            </div>
          </div>

          {/* 游戏面板 */}
          <div className="relative">
            <GameBoard board={state.board} currentPiece={state.currentPiece} />

            {/* 开始提示 */}
            {state.status === 'idle' && (
              <div
                className={cn(
                  'absolute inset-0 flex flex-col items-center justify-center',
                  'bg-black/50 backdrop-blur-sm rounded-lg'
                )}
              >
                <p className="text-white text-lg font-medium mb-2">
                  俄罗斯方块
                </p>
                <p className="text-zinc-300 text-sm">
                  按 <span className="text-purple-400">空格</span> 开始
                </p>
              </div>
            )}

            {/* 暂停提示 */}
            {state.status === 'paused' && (
              <div
                className={cn(
                  'absolute inset-0 flex flex-col items-center justify-center',
                  'bg-black/50 backdrop-blur-sm rounded-lg'
                )}
              >
                <p className="text-white text-2xl font-bold mb-2">已暂停</p>
                <p className="text-zinc-300 text-sm">
                  按 <span className="text-purple-400">空格</span> 继续
                </p>
              </div>
            )}

            {/* 游戏结束 */}
            {state.status === 'lost' && (
              <div
                className={cn(
                  'absolute inset-0 flex flex-col items-center justify-center',
                  'bg-black/60 backdrop-blur-sm rounded-lg',
                  'animate-fade-in'
                )}
              >
                <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
                <p className="text-lg text-zinc-300 mb-1">
                  分数:{' '}
                  <span className="font-bold text-purple-400">
                    {state.score}
                  </span>
                </p>
                <p className="text-sm text-zinc-400 mb-4">
                  等级 {state.level} | {state.lines} 行
                </p>
                <button
                  onClick={reset}
                  className={cn(
                    'px-6 py-2 rounded-lg',
                    'bg-purple-500 text-white font-medium',
                    'hover:bg-purple-600 transition-colors',
                    'shadow-lg shadow-purple-500/30'
                  )}
                >
                  再来一局
                </button>
              </div>
            )}
          </div>

          {/* 右侧信息面板 */}
          <div className="flex flex-col gap-3">
            <PiecePreview type={state.nextPiece} label="下一个" />
          </div>
        </div>

        {/* 操作提示 */}
        <div className="text-xs text-zinc-500 text-center space-y-0.5">
          <p>← → 移动 | ↑ 旋转 | ↓ 软降</p>
          <p>空格 硬降 | C 暂存 | ESC 暂停</p>
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
