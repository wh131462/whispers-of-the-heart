import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DateTimeInputProps {
  value: Date | null;
  onChange: (date: Date) => void;
}

export function DateTimeInput({ value, onChange }: DateTimeInputProps) {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  // 同步外部值
  useEffect(() => {
    if (value) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      const seconds = String(value.getSeconds()).padStart(2, '0');

      setDateStr(`${year}-${month}-${day}`);
      setTimeStr(`${hours}:${minutes}:${seconds}`);
    }
  }, [value]);

  const handleDateChange = useCallback(
    (newDateStr: string) => {
      setDateStr(newDateStr);
      if (newDateStr && timeStr) {
        const date = new Date(`${newDateStr}T${timeStr}`);
        if (!isNaN(date.getTime())) {
          onChange(date);
        }
      }
    },
    [timeStr, onChange]
  );

  const handleTimeChange = useCallback(
    (newTimeStr: string) => {
      setTimeStr(newTimeStr);
      if (dateStr && newTimeStr) {
        const date = new Date(`${dateStr}T${newTimeStr}`);
        if (!isNaN(date.getTime())) {
          onChange(date);
        }
      }
    },
    [dateStr, onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-zinc-600">日期时间</label>
      <div className="flex gap-2">
        <input
          type="date"
          value={dateStr}
          onChange={e => handleDateChange(e.target.value)}
          className={cn(
            'flex-1 px-3 py-2.5',
            'bg-zinc-50 rounded-lg',
            'border border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
            'text-zinc-800 text-sm',
            'focus:outline-none transition-colors'
          )}
        />
        <input
          type="time"
          value={timeStr}
          onChange={e => handleTimeChange(e.target.value)}
          step="1"
          className={cn(
            'flex-1 px-3 py-2.5',
            'bg-zinc-50 rounded-lg',
            'border border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
            'text-zinc-800 text-sm',
            'focus:outline-none transition-colors'
          )}
        />
      </div>
    </div>
  );
}
