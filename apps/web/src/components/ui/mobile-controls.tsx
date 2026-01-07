import { cn } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ArrowDown,
} from 'lucide-react';

type Direction = 'up' | 'down' | 'left' | 'right';

interface DirectionPadProps {
  onDirection: (direction: Direction) => void;
  className?: string;
}

// 方向键控制器 - 用于贪吃蛇等游戏
export function DirectionPad({ onDirection, className }: DirectionPadProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-1 w-fit', className)}>
      <div />
      <button
        className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          'bg-zinc-100 active:bg-zinc-200 transition-colors',
          'touch-manipulation select-none'
        )}
        onTouchStart={e => {
          e.preventDefault();
          onDirection('up');
        }}
      >
        <ChevronUp className="w-6 h-6 text-zinc-700" />
      </button>
      <div />

      <button
        className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          'bg-zinc-100 active:bg-zinc-200 transition-colors',
          'touch-manipulation select-none'
        )}
        onTouchStart={e => {
          e.preventDefault();
          onDirection('left');
        }}
      >
        <ChevronLeft className="w-6 h-6 text-zinc-700" />
      </button>
      <div className="w-12 h-12" />
      <button
        className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          'bg-zinc-100 active:bg-zinc-200 transition-colors',
          'touch-manipulation select-none'
        )}
        onTouchStart={e => {
          e.preventDefault();
          onDirection('right');
        }}
      >
        <ChevronRight className="w-6 h-6 text-zinc-700" />
      </button>

      <div />
      <button
        className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          'bg-zinc-100 active:bg-zinc-200 transition-colors',
          'touch-manipulation select-none'
        )}
        onTouchStart={e => {
          e.preventDefault();
          onDirection('down');
        }}
      >
        <ChevronDown className="w-6 h-6 text-zinc-700" />
      </button>
      <div />
    </div>
  );
}

interface TetrisControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onRotate: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
  onHold: () => void;
  className?: string;
}

// 俄罗斯方块专用控制器
export function TetrisControls({
  onLeft,
  onRight,
  onRotate,
  onSoftDrop,
  onHardDrop,
  onHold,
  className,
}: TetrisControlsProps) {
  return (
    <div className={cn('flex items-center justify-between w-full', className)}>
      {/* 左侧：方向控制 */}
      <div className="flex items-center gap-2">
        <button
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center',
            'bg-zinc-100 active:bg-zinc-200 transition-colors',
            'touch-manipulation select-none'
          )}
          onTouchStart={e => {
            e.preventDefault();
            onLeft();
          }}
        >
          <ChevronLeft className="w-8 h-8 text-zinc-700" />
        </button>
        <div className="flex flex-col gap-2">
          <button
            className={cn(
              'w-14 h-10 rounded-xl flex items-center justify-center',
              'bg-zinc-100 active:bg-zinc-200 transition-colors',
              'touch-manipulation select-none text-xs font-medium text-zinc-600'
            )}
            onTouchStart={e => {
              e.preventDefault();
              onSoftDrop();
            }}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <button
            className={cn(
              'w-14 h-10 rounded-xl flex items-center justify-center',
              'bg-purple-100 active:bg-purple-200 transition-colors',
              'touch-manipulation select-none text-xs font-medium text-purple-700'
            )}
            onTouchStart={e => {
              e.preventDefault();
              onHardDrop();
            }}
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
        <button
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center',
            'bg-zinc-100 active:bg-zinc-200 transition-colors',
            'touch-manipulation select-none'
          )}
          onTouchStart={e => {
            e.preventDefault();
            onRight();
          }}
        >
          <ChevronRight className="w-8 h-8 text-zinc-700" />
        </button>
      </div>

      {/* 右侧：功能按钮 */}
      <div className="flex flex-col gap-2">
        <button
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center',
            'bg-amber-100 active:bg-amber-200 transition-colors',
            'touch-manipulation select-none'
          )}
          onTouchStart={e => {
            e.preventDefault();
            onRotate();
          }}
        >
          <RotateCw className="w-6 h-6 text-amber-700" />
        </button>
        <button
          className={cn(
            'w-14 h-10 rounded-xl flex items-center justify-center',
            'bg-blue-100 active:bg-blue-200 transition-colors',
            'touch-manipulation select-none text-xs font-medium text-blue-700'
          )}
          onTouchStart={e => {
            e.preventDefault();
            onHold();
          }}
        >
          Hold
        </button>
      </div>
    </div>
  );
}
