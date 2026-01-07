import { cn } from '../../../lib/utils';
import type { ButtonType } from '../types';

interface CalculatorButtonProps {
  label: string;
  sublabel?: string;
  type: ButtonType;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md';
  width?: number;
  height?: number;
  onClick: () => void;
  disabled?: boolean;
}

export function CalculatorButton({
  label,
  sublabel,
  type,
  variant = 'default',
  size = 'md',
  width = 1,
  height = 1,
  onClick,
  disabled = false,
}: CalculatorButtonProps) {
  // 简洁科技风格
  const variants = {
    default: {
      bg: 'bg-neutral-900/60',
      border: 'border-neutral-700/50',
      text: 'text-neutral-100',
      hover: 'hover:bg-neutral-800/80 hover:border-neutral-600/60',
      active: 'active:bg-neutral-700/80',
      glow: '',
    },
    secondary: {
      bg: 'bg-neutral-800/60',
      border: 'border-neutral-600/50',
      text: 'text-neutral-300',
      hover: 'hover:bg-neutral-700/70 hover:border-neutral-500/60',
      active: 'active:bg-neutral-600/70',
      glow: '',
    },
    accent: {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/40',
      text: 'text-emerald-400',
      hover: 'hover:bg-emerald-900/50 hover:border-emerald-400/60',
      active: 'active:bg-emerald-800/60',
      glow: 'hover:shadow-[0_0_12px_rgba(52,211,153,0.2)]',
    },
    primary: {
      bg: 'bg-emerald-500/90',
      border: 'border-emerald-400/60',
      text: 'text-neutral-950 font-semibold',
      hover: 'hover:bg-emerald-400',
      active: 'active:bg-emerald-600',
      glow: 'shadow-[0_0_16px_rgba(52,211,153,0.3)] hover:shadow-[0_0_24px_rgba(52,211,153,0.5)]',
    },
  };

  const v = variants[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative select-none outline-none',
        size === 'sm' ? 'h-9 sm:h-10' : 'h-12 sm:h-14',
        'rounded-lg',
        'border',
        'transition-all duration-150',
        'focus-visible:ring-1 focus-visible:ring-emerald-500/50',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        'active:scale-[0.96]',
        v.bg,
        v.border,
        v.hover,
        v.active,
        v.glow,
        {
          'col-span-1': width === 1,
          'col-span-2': width === 2,
          'row-span-1': height === 1,
          'row-span-2 h-[6.5rem] sm:h-[7.5rem]': height === 2,
        }
      )}
    >
      <span
        className={cn(
          'flex flex-col items-center justify-center h-full font-mono',
          v.text,
          'transition-colors duration-150',
          size === 'sm'
            ? 'text-xs'
            : type === 'number'
              ? 'text-lg sm:text-xl'
              : 'text-sm'
        )}
      >
        {sublabel && (
          <span className="text-[9px] opacity-40 -mb-0.5">{sublabel}</span>
        )}
        <span>{label}</span>
      </span>
    </button>
  );
}
