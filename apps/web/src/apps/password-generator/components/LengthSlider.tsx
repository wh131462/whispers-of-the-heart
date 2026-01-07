import { cn } from '@/lib/utils';

interface LengthSliderProps {
  length: number;
  onChange: (length: number) => void;
  min?: number;
  max?: number;
}

export function LengthSlider({
  length,
  onChange,
  min = 8,
  max = 64,
}: LengthSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600">长度</span>
        <span className="text-sm font-mono text-zinc-800">{length}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={length}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className={cn(
          'w-full h-1.5',
          'appearance-none',
          'bg-zinc-200 rounded-full',
          'cursor-pointer',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:bg-zinc-600',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:transition-transform',
          '[&::-webkit-slider-thumb]:hover:scale-110',
          '[&::-moz-range-thumb]:w-4',
          '[&::-moz-range-thumb]:h-4',
          '[&::-moz-range-thumb]:bg-zinc-600',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:cursor-pointer'
        )}
      />

      <div className="flex justify-between text-xs text-zinc-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
