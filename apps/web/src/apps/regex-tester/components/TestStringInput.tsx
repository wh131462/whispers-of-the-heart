import { cn } from '@/lib/utils';

interface TestStringInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TestStringInput({ value, onChange }: TestStringInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-zinc-600">测试字符串</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="输入要测试的字符串..."
        rows={4}
        spellCheck={false}
        className={cn(
          'w-full p-3',
          'bg-zinc-50 rounded-lg',
          'border border-zinc-300',
          'text-zinc-800 text-sm font-mono',
          'placeholder:text-zinc-400',
          'focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
          'resize-none transition-colors',
          'scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent'
        )}
      />
    </div>
  );
}
