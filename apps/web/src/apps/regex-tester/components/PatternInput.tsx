import { cn } from '@/lib/utils';

interface PatternInputProps {
  pattern: string;
  flags: string;
  error: string | null;
  onChange: (pattern: string) => void;
}

export function PatternInput({
  pattern,
  flags,
  error,
  onChange,
}: PatternInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-zinc-600">正则表达式</label>
      <div
        className={cn(
          'flex items-center',
          'bg-zinc-50 rounded-lg',
          'border transition-colors',
          error
            ? 'border-red-400'
            : 'border-zinc-300 focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-200'
        )}
      >
        <span className="pl-3 text-zinc-500 font-mono">/</span>
        <input
          type="text"
          value={pattern}
          onChange={e => onChange(e.target.value)}
          placeholder="输入正则表达式..."
          spellCheck={false}
          className={cn(
            'flex-1 px-1 py-2.5',
            'bg-transparent',
            'text-zinc-800 text-sm font-mono',
            'placeholder:text-zinc-400',
            'focus:outline-none'
          )}
        />
        <span className="pr-3 text-zinc-500 font-mono">/{flags}</span>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
