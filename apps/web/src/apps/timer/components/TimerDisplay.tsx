import { cn } from '@/lib/utils';
import { formatTime } from '../utils/formatTime';

interface TimerDisplayProps {
  time: number;
  showMilliseconds?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent' | 'warning';
}

export function TimerDisplay({
  time,
  showMilliseconds = true,
  size = 'lg',
  variant = 'default',
}: TimerDisplayProps) {
  const formattedTime = formatTime(time, showMilliseconds);

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl sm:text-7xl',
  };

  const variantClasses = {
    default: 'text-zinc-800',
    accent: 'text-zinc-900',
    warning: 'text-amber-600',
  };

  return (
    <div className="text-center py-8">
      <span
        className={cn(
          'font-mono font-bold tracking-tight',
          'transition-all duration-300',
          sizeClasses[size],
          variantClasses[variant]
        )}
      >
        {formattedTime}
      </span>
    </div>
  );
}
