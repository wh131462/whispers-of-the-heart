import { cn } from '@/lib/utils';

interface ScoreBoardProps {
  score: number;
  bestScore: number;
}

function ScoreCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center px-4 py-2 rounded-lg min-w-[80px]',
        highlight ? 'bg-amber-500' : 'bg-zinc-600',
        'text-white'
      )}
    >
      <span className="text-xs uppercase tracking-wide opacity-80">
        {label}
      </span>
      <span className="text-xl font-bold">{value}</span>
    </div>
  );
}

export function ScoreBoard({ score, bestScore }: ScoreBoardProps) {
  return (
    <div className="flex gap-2">
      <ScoreCard label="分数" value={score} highlight />
      <ScoreCard label="最高" value={bestScore} />
    </div>
  );
}
