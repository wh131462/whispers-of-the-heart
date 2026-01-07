import { cn } from '@/lib/utils';

interface CurrentTimeProps {
  currentTimestamp: {
    seconds: number;
    milliseconds: number;
  };
  formats: Array<{
    id: string;
    label: string;
    value: string;
  }>;
}

export function CurrentTime({ currentTimestamp, formats }: CurrentTimeProps) {
  return (
    <div
      className={cn(
        'p-4',
        'bg-emerald-50 rounded-lg',
        'border border-emerald-200'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-emerald-600">当前时间</span>
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-600">
          <span>秒: {currentTimestamp.seconds}</span>
          <span>毫秒: {currentTimestamp.milliseconds}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {formats.slice(0, 4).map(format => (
          <div key={format.id} className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-500">{format.label}</span>
            <span className="text-sm text-zinc-800 font-mono">
              {format.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
