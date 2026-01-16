import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TransferShellProps {
  children: ReactNode;
}

export function TransferShell({ children }: TransferShellProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-[500px]',
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
