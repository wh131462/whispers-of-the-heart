import { cn } from '@/lib/utils';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { TetrisControls } from '@/components/ui/mobile-controls';
import { GameBoard } from './components/GameBoard';
import { PiecePreview } from './components/PiecePreview';
import { useTetris } from './hooks/useTetris';

export default function Tetris() {
  const isMobile = useIsMobile();
  const cellSize = isMobile ? 16 : 24;
  const {
    state,
    start,
    pause,
    resume,
    reset,
    moveLeft,
    moveRight,
    moveDown,
    hardDrop,
    rotate,
    hold,
  } = useTetris();

  return (
    <div className="w-full max-w-fit mx-auto p-2 sm:p-4">
      <div
        className={cn(
          'flex flex-col items-center gap-3 sm:gap-4 p-3 sm:p-4',
          'bg-white/95',
          'rounded-xl',
          'border border-zinc-200',
          'shadow-lg shadow-zinc-200/50'
        )}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-600">
            俄罗斯方块
          </h1>
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
        <div className={cn('flex', isMobile ? 'gap-2' : 'gap-4')}>
          {/* 左侧信息面板 - 桌面端 */}
          {!isMobile && (
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
          )}

          {/* 游戏面板 */}
          <div className="relative">
            <GameBoard
              board={state.board}
              currentPiece={state.currentPiece}
              cellSize={cellSize}
            />

            {/* 开始提示 */}
            {state.status === 'idle' && (
              <div
                className={cn(
                  'absolute inset-0 flex flex-col items-center justify-center',
                  'bg-black/50 backdrop-blur-sm rounded-lg'
                )}
              >
                <p className="text-white text-base sm:text-lg font-medium mb-2">
                  俄罗斯方块
                </p>
                <p className="text-zinc-300 text-sm">
                  <span className="hidden sm:inline">
                    按 <span className="text-purple-400">空格</span> 开始
                  </span>
                  <span className="sm:hidden">
                    点击 <span className="text-purple-400">开始</span> 按钮
                  </span>
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
                <p className="text-white text-xl sm:text-2xl font-bold mb-2">
                  已暂停
                </p>
                <p className="text-zinc-300 text-sm">
                  <span className="hidden sm:inline">
                    按 <span className="text-purple-400">空格</span> 继续
                  </span>
                  <span className="sm:hidden">
                    点击 <span className="text-purple-400">继续</span> 按钮
                  </span>
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
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  游戏结束
                </h2>
                <p className="text-base sm:text-lg text-zinc-300 mb-1">
                  分数:{' '}
                  <span className="font-bold text-purple-400">
                    {state.score}
                  </span>
                </p>
                <p className="text-xs sm:text-sm text-zinc-400 mb-4">
                  等级 {state.level} | {state.lines} 行
                </p>
                <button
                  onClick={reset}
                  className={cn(
                    'px-4 sm:px-6 py-2 rounded-lg',
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
          <div className={cn('flex flex-col', isMobile ? 'gap-2' : 'gap-3')}>
            <PiecePreview type={state.nextPiece} label="下一个" />
            {/* 移动端显示暂存 */}
            {isMobile && <PiecePreview type={state.holdPiece} label="暂存" />}
          </div>
        </div>

        {/* 移动端分数信息 */}
        {isMobile && (
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="text-center">
              <div className="text-xs text-zinc-500">分数</div>
              <div className="text-lg font-bold text-purple-600">
                {state.score}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-zinc-500">等级</div>
              <div className="text-lg font-bold text-zinc-700">
                {state.level}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-zinc-500">行数</div>
              <div className="text-lg font-bold text-zinc-700">
                {state.lines}
              </div>
            </div>
          </div>
        )}

        {/* 移动端控制器 */}
        {isMobile && state.status === 'playing' && (
          <div className="w-full">
            <TetrisControls
              onLeft={moveLeft}
              onRight={moveRight}
              onRotate={() => rotate()}
              onSoftDrop={moveDown}
              onHardDrop={hardDrop}
              onHold={hold}
            />
          </div>
        )}

        {/* 操作提示 */}
        <div className="text-xs text-zinc-500 text-center space-y-0.5">
          {isMobile ? (
            <p>使用下方按钮控制</p>
          ) : (
            <>
              <p>← → 移动 | ↑ 旋转 | ↓ 软降</p>
              <p>空格 硬降 | C 暂存 | ESC 暂停</p>
            </>
          )}
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
