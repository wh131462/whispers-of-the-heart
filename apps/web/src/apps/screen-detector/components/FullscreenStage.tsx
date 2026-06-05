import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  isFakeFullscreen: boolean;
  children: ReactNode;
};

export const FullscreenStage = forwardRef<HTMLDivElement, Props>(
  function FullscreenStage({ isFakeFullscreen, children }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex-1 overflow-hidden bg-zinc-900',
          isFakeFullscreen && 'fixed inset-0 z-50'
        )}
      >
        {children}
      </div>
    );
  }
);
