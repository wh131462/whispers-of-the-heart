import { cn } from '@/lib/utils';

interface TextAreaProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  label?: string;
  rows?: number;
}

export function TextArea({
  value,
  onChange,
  placeholder,
  readOnly,
  label,
  rows = 6,
}: TextAreaProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-medium text-zinc-600">{label}</label>
      )}
      <textarea
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        rows={rows}
        spellCheck={false}
        className={cn(
          'w-full p-3',
          'bg-zinc-50 rounded-lg',
          'border border-zinc-300',
          'text-zinc-800 text-sm font-mono',
          'placeholder:text-zinc-400',
          'focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
          'resize-none',
          'transition-colors',
          readOnly && 'bg-zinc-100 cursor-default',
          'scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent'
        )}
      />
    </div>
  );
}
