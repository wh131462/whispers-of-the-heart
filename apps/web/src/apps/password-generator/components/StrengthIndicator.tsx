import { cn } from '@/lib/utils';
import type { StrengthInfo } from '../types';
import { getStrengthColor } from '../utils/strength';

interface StrengthIndicatorProps {
  strength: StrengthInfo;
}

export function StrengthIndicator({ strength }: StrengthIndicatorProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">密码强度</span>
        <span
          className={cn(
            'font-medium',
            strength.level === 'weak' && 'text-red-600',
            strength.level === 'fair' && 'text-orange-600',
            strength.level === 'good' && 'text-yellow-600',
            strength.level === 'strong' && 'text-emerald-600',
            strength.level === 'excellent' && 'text-cyan-600'
          )}
        >
          {strength.label}
        </span>
      </div>

      <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            getStrengthColor(strength.level)
          )}
          style={{ width: `${strength.score}%` }}
        />
      </div>
    </div>
  );
}
