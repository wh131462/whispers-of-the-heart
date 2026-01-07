import { cn } from '@/lib/utils';

type NumberPadProps = {
  onNumberClick: (num: number) => void;
  onClear: () => void;
  isNoteMode: boolean;
  disabled?: boolean;
  buttonSize?: number;
};

export function NumberPad({
  onNumberClick,
  onClear,
  isNoteMode,
  disabled,
  buttonSize = 40,
}: NumberPadProps) {
  const isSmall = buttonSize < 36;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-9 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => onNumberClick(num)}
            disabled={disabled}
            className={cn(
              'rounded-lg font-semibold',
              isSmall ? 'text-base' : 'text-lg',
              'transition-colors',
              isNoteMode
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            style={{ width: buttonSize, height: buttonSize }}
          >
            {num}
          </button>
        ))}
      </div>
      <button
        onClick={onClear}
        disabled={disabled}
        className={cn(
          'w-full py-2 rounded-lg font-medium',
          isSmall ? 'text-sm py-1.5' : '',
          'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        清除
      </button>
    </div>
  );
}
