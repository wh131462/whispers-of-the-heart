import { cn } from '@/lib/utils';
import type { Difficulty } from '../types';
import { DIFFICULTIES } from '../types';

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

export function DifficultySelector({
  difficulty,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            difficulty === d
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800'
          )}
        >
          {DIFFICULTIES[d].label}
        </button>
      ))}
    </div>
  );
}
