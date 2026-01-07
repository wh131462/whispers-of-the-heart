import type { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

interface CalculatorShellProps {
  children: ReactNode;
  className?: string;
}

export function CalculatorShell({ children, className }: CalculatorShellProps) {
  return (
    <div className={cn('relative', className)}>
      {/* 外发光 */}
      <div
        className={cn(
          'absolute -inset-px rounded-xl',
          'bg-gradient-to-b from-emerald-500/10 to-transparent',
          'blur-sm opacity-60'
        )}
      />

      {/* 主容器 */}
      <div
        className={cn(
          'relative rounded-xl overflow-hidden',
          'bg-neutral-900/95',
          'border border-neutral-800/80',
          'p-4'
        )}
      >
        {/* 顶部光线 */}
        <div
          className={cn(
            'absolute top-0 left-1/4 right-1/4 h-px',
            'bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent'
          )}
        />

        {/* 内容 */}
        <div className="relative flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}
