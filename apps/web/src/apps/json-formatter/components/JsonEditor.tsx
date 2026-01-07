import { cn } from '@/lib/utils';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  placeholder?: string;
}

export function JsonEditor({
  value,
  onChange,
  error,
  placeholder = '在此粘贴或输入 JSON...',
}: JsonEditorProps) {
  return (
    <div className="relative flex-1 min-h-0">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className={cn(
          'w-full h-full min-h-[300px] p-4',
          'bg-zinc-50 rounded-lg',
          'border transition-colors',
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
          'text-zinc-800 text-sm font-mono',
          'placeholder:text-zinc-400',
          'focus:outline-none',
          'resize-none',
          'scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent'
        )}
      />

      {/* 行号指示（简化版） */}
      <div className="absolute top-4 right-4 text-xs text-zinc-500 font-mono">
        {value.split('\n').length} 行
      </div>
    </div>
  );
}
