import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { DirectionPad } from '@/components/ui/mobile-controls';
import { GameBoard } from './components/GameBoard';
import { ScoreBoard } from './components/ScoreBoard';
import { GameOverModal } from './components/GameOverModal';
import { useSnake } from './hooks/useSnake';
import type { Direction } from './types';

export default function Snake() {
  const { state, reset, start, pause, resume, changeDirection } = useSnake();
  const isMobile = useIsMobile();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const cellSize = isMobile ? 15 : 20;

  // 触摸滑动控制
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const minSwipe = 30;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        const direction: Direction = dx > 0 ? 'right' : 'left';
        if (state.status === 'idle') start();
        changeDirection(direction);
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipe) {
        const direction: Direction = dy > 0 ? 'down' : 'up';
        if (state.status === 'idle') start();
        changeDirection(direction);
      }
      touchStartRef.current = null;
    },
    [state.status, start, changeDirection]
  );

  // 方向键控制
  const handleDirection = useCallback(
    (direction: Direction) => {
      if (state.status === 'idle') start();
      changeDirection(direction);
    },
    [state.status, start, changeDirection]
  );

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
        {/* 标题和分数 */}
        <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-600">
            贪吃蛇
          </h1>
          <ScoreBoard score={state.score} bestScore={state.bestScore} />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <p className="text-xs sm:text-sm text-zinc-500 hidden sm:block">
            控制蛇吃到 <span className="font-bold text-red-500">食物</span> 变长
          </p>
          <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
            {state.status === 'idle' && (
              <button
                onClick={start}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                  'bg-emerald-500 text-white',
                  'hover:bg-emerald-600 transition-colors',
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
                  'bg-emerald-500 text-white',
                  'hover:bg-emerald-600 transition-colors',
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

        {/* 游戏面板 */}
        <div
          className="relative touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <GameBoard
            snake={state.snake}
            food={state.food}
            cellSize={cellSize}
          />

          {/* 开始提示 */}
          {state.status === 'idle' && (
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center',
                'bg-black/40 backdrop-blur-sm rounded-lg'
              )}
            >
              <p className="text-white text-base sm:text-lg font-medium text-center px-4">
                <span className="hidden sm:inline">
                  按 <span className="text-emerald-400">空格</span> 或{' '}
                  <span className="text-emerald-400">方向键</span> 开始
                </span>
                <span className="sm:hidden">
                  点击 <span className="text-emerald-400">开始</span> 或
                  <span className="text-emerald-400">滑动</span> 开始
                </span>
              </p>
            </div>
          )}

          {/* 暂停提示 */}
          {state.status === 'paused' && (
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center',
                'bg-black/40 backdrop-blur-sm rounded-lg'
              )}
            >
              <p className="text-white text-xl sm:text-2xl font-bold mb-2">
                已暂停
              </p>
              <p className="text-zinc-300 text-sm">
                <span className="hidden sm:inline">
                  按 <span className="text-emerald-400">空格</span> 继续
                </span>
                <span className="sm:hidden">
                  点击 <span className="text-emerald-400">继续</span> 按钮
                </span>
              </p>
            </div>
          )}

          {/* 游戏结束弹窗 */}
          <GameOverModal
            status={state.status}
            score={state.score}
            onReset={reset}
          />
        </div>

        {/* 移动端方向控制器 */}
        {isMobile && <DirectionPad onDirection={handleDirection} />}

        {/* 操作提示 */}
        <div className="text-xs text-zinc-500 text-center">
          <p>
            {isMobile
              ? '滑动或使用方向键控制'
              : '方向键或 WASD 移动 | 空格暂停/继续'}
          </p>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
