import { cn } from '@/lib/utils';

interface UnitInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  label?: string;
}

export function UnitInput({
  value,
  onChange,
  placeholder = '0',
  readOnly = false,
  label,
}: UnitInputProps) {
  return (
    <div className="flex-1">
      {label && (
        <label className="block text-xs text-zinc-600 mb-1">{label}</label>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          'w-full px-3 py-2.5',
          'bg-zinc-50',
          'border border-zinc-300',
          'rounded-lg',
          'text-lg font-mono text-right',
          'outline-none',
          'transition-all duration-150',
          readOnly
            ? 'text-zinc-600 bg-zinc-100 cursor-default'
            : 'text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
          'placeholder:text-zinc-400'
        )}
      />
    </div>
  );
}
