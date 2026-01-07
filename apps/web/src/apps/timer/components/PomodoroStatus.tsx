import { cn } from '@/lib/utils';
import type { PomodoroPhase } from '../types';

interface PomodoroStatusProps {
  phase: PomodoroPhase;
  currentSession: number;
  totalSessions: number;
}

const phaseLabels: Record<PomodoroPhase, string> = {
  work: '专注工作',
  shortBreak: '短休息',
  longBreak: '长休息',
};

const phaseColors: Record<PomodoroPhase, string> = {
  work: 'text-emerald-400',
  shortBreak: 'text-cyan-400',
  longBreak: 'text-violet-400',
};

export function PomodoroStatus({
  phase,
  currentSession,
  totalSessions,
}: PomodoroStatusProps) {
  return (
    <div className="text-center space-y-2">
      <div
        className={cn(
          'text-lg font-medium',
          'transition-colors duration-300',
          phaseColors[phase]
        )}
      >
        {phaseLabels[phase]}
      </div>
      <div className="text-sm text-neutral-500">
        第 {currentSession} 轮 · 已完成 {totalSessions} 个番茄
      </div>
    </div>
  );
}
