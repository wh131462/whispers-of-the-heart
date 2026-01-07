import { cn } from '@/lib/utils';
import { Timer, Hourglass, Coffee } from 'lucide-react';
import type { TimerMode } from '../types';

interface ModeTabsProps {
  activeMode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
}

const modes: {
  id: TimerMode;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'stopwatch', name: '秒表', icon: Timer },
  { id: 'countdown', name: '倒计时', icon: Hourglass },
  { id: 'pomodoro', name: '番茄钟', icon: Coffee },
];

export function ModeTabs({ activeMode, onModeChange }: ModeTabsProps) {
  return (
    <div className="flex justify-center gap-2">
      {modes.map(mode => {
        const Icon = mode.icon;
        const isActive = mode.id === activeMode;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onModeChange(mode.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2',
              'rounded-lg',
              'text-sm font-medium',
              'transition-all duration-150',
              'border',
              isActive
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{mode.name}</span>
          </button>
        );
      })}
    </div>
  );
}
