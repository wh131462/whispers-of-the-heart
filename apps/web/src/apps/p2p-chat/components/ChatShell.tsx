import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ChatShellProps {
  children: ReactNode;
}

export function ChatShell({ children }: ChatShellProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-[600px]',
        'bg-white/95',
        'rounded-xl',
        'border border-zinc-200',
        'shadow-lg shadow-zinc-200/50',
        'overflow-hidden'
      )}
    >
      {children}
    </div>
  );
}
