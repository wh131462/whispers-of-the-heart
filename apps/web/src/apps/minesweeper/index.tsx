import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { GameBoard } from './components/GameBoard';
import { GameHeader } from './components/GameHeader';
import { DifficultySelector } from './components/DifficultySelector';
import { GameOverModal } from './components/GameOverModal';
import { useMinesweeper } from './hooks/useMinesweeper';

export default function Minesweeper() {
  const {
    state,
    remainingMines,
    setDifficulty,
    reset,
    reveal,
    toggleFlag,
    chord,
  } = useMinesweeper();
  const isMobile = useIsMobile();

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
        {/* 难度选择 */}
        <DifficultySelector
          difficulty={state.difficulty}
          onChange={setDifficulty}
        />

        {/* 游戏头部 */}
        <GameHeader
          remainingMines={remainingMines}
          timeElapsed={state.timeElapsed}
          status={state.status}
          onReset={reset}
        />

        {/* 游戏面板 */}
        <div className="overflow-x-auto">
          <GameBoard
            board={state.board}
            status={state.status}
            onCellClick={reveal}
            onCellRightClick={toggleFlag}
            onCellDoubleClick={chord}
          />
        </div>

        {/* 操作提示 */}
        <div className="text-xs text-neutral-500 text-center">
          <p>
            {isMobile
              ? '点击揭开 | 长按标记'
              : '左键揭开 | 右键标记 | 双击快速揭开'}
          </p>
        </div>

        {/* 游戏结束弹窗 */}
        <GameOverModal
          status={state.status}
          timeElapsed={state.timeElapsed}
          onPlayAgain={reset}
        />
      </div>
    </div>
  );
}
