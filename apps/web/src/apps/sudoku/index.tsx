import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RotateCcw, Lightbulb, PencilLine } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFireworks } from '@/components/ui/confetti';
import { Board } from './components/Board';
import { NumberPad } from './components/NumberPad';
import { useSudoku } from './hooks/useSudoku';
import type { Difficulty } from './types';
import { DIFFICULTY_NAMES, MAX_MISTAKES } from './types';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function Sudoku() {
  const {
    state,
    reset,
    selectCell,
    setNumber,
    clearCell,
    toggleNoteMode,
    getHint,
  } = useSudoku();
  const { fire } = useFireworks();

  const isWon = state.status === 'won' && state.mistakes < MAX_MISTAKES;
  const isLost = state.status === 'won' && state.mistakes >= MAX_MISTAKES;

  useEffect(() => {
    if (isWon) {
      fire();
    }
  }, [isWon, fire]);

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
        {/* 标题和状态 */}
        <div className="flex items-center justify-between w-full gap-4">
          <h1 className="text-3xl font-bold text-blue-700">数独</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-zinc-500">错误: </span>
              <span
                className={cn(
                  'font-bold',
                  state.mistakes > 0 ? 'text-red-500' : 'text-zinc-700'
                )}
              >
                {state.mistakes}/{MAX_MISTAKES}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-zinc-500">时间: </span>
              <span className="font-bold text-zinc-700">
                {formatTime(state.time)}
              </span>
            </div>
          </div>
        </div>

        {/* 难度选择和操作按钮 */}
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">难度:</span>
            <Select
              value={state.difficulty}
              onValueChange={v => reset(v as Difficulty)}
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

          <div className="flex items-center gap-2">
            <button
              onClick={toggleNoteMode}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                'text-sm font-medium transition-colors',
                state.isNoteMode
                  ? 'bg-amber-500 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              )}
            >
              <PencilLine className="w-4 h-4" />
              笔记
            </button>
            <button
              onClick={getHint}
              disabled={state.status !== 'playing'}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                'bg-zinc-100 text-zinc-700',
                'hover:bg-zinc-200 transition-colors',
                'text-sm font-medium',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Lightbulb className="w-4 h-4" />
              提示
            </button>
            <button
              onClick={() => reset()}
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
            selectedCell={state.selectedCell}
            onCellClick={selectCell}
          />

          {/* 胜利弹窗 */}
          {isWon && (
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center',
                'bg-black/60 backdrop-blur-sm rounded-lg',
                'animate-fade-in z-20'
              )}
            >
              <h2 className="text-2xl font-bold text-white mb-2">恭喜完成!</h2>
              <p className="text-lg text-zinc-300 mb-4">
                用时:{' '}
                <span className="font-bold text-blue-400">
                  {formatTime(state.time)}
                </span>
              </p>
              <button
                onClick={() => reset()}
                className={cn(
                  'px-6 py-2 rounded-lg',
                  'bg-blue-500 text-white font-medium',
                  'hover:bg-blue-600 transition-colors',
                  'shadow-lg shadow-blue-500/30'
                )}
              >
                再来一局
              </button>
            </div>
          )}

          {/* 失败弹窗 */}
          {isLost && (
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center',
                'bg-black/60 backdrop-blur-sm rounded-lg',
                'animate-fade-in z-20'
              )}
            >
              <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
              <p className="text-lg text-zinc-300 mb-4">错误次数已达上限</p>
              <button
                onClick={() => reset()}
                className={cn(
                  'px-6 py-2 rounded-lg',
                  'bg-blue-500 text-white font-medium',
                  'hover:bg-blue-600 transition-colors',
                  'shadow-lg shadow-blue-500/30'
                )}
              >
                再来一局
              </button>
            </div>
          )}
        </div>

        {/* 数字面板 */}
        <NumberPad
          onNumberClick={setNumber}
          onClear={clearCell}
          isNoteMode={state.isNoteMode}
          disabled={state.status !== 'playing'}
        />

        {/* 操作提示 */}
        <div className="text-xs text-zinc-500 text-center space-y-0.5">
          <p>点击格子选中 | 数字键填写 | N键切换笔记</p>
          <p>方向键移动 | Delete清除</p>
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
