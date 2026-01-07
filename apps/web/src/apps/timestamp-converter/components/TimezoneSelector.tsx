import { cn } from '@/lib/utils';
import { commonTimezones } from '../utils/formats';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
}

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-zinc-600">时区</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'w-full px-3 py-2.5',
          'bg-zinc-50 rounded-lg',
          'border border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
          'text-zinc-800 text-sm',
          'focus:outline-none transition-colors',
          'appearance-none cursor-pointer',
          '[&>option]:bg-white'
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1rem',
        }}
      >
        {commonTimezones.map(tz => (
          <option key={tz.id} value={tz.id}>
            {tz.label} ({tz.offset})
          </option>
        ))}
      </select>
    </div>
  );
}
