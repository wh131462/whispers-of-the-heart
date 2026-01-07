import { cn } from '@/lib/utils';

type ScoreBoardProps = {
  score: number;
  bestScore: number;
};

export function ScoreBoard({ score, bestScore }: ScoreBoardProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex flex-col items-center px-4 py-2 rounded-lg',
          'bg-emerald-100 border border-emerald-200'
        )}
      >
        <span className="text-xs text-emerald-600 font-medium">分数</span>
        <span className="text-xl font-bold text-emerald-700">{score}</span>
      </div>
      <div
        className={cn(
          'flex flex-col items-center px-4 py-2 rounded-lg',
          'bg-zinc-100 border border-zinc-200'
        )}
      >
        <span className="text-xs text-zinc-500 font-medium">最高</span>
        <span className="text-xl font-bold text-zinc-700">{bestScore}</span>
      </div>
    </div>
  );
}
