import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TimerShellProps {
  children: ReactNode;
  className?: string;
}

export function TimerShell({ children, className }: TimerShellProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-6',
        'bg-white/95',
        'rounded-xl',
        'border border-zinc-200',
        'shadow-lg shadow-zinc-200/50',
        className
      )}
    >
      {children}
    </div>
  );
}
