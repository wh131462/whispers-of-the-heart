import { cn } from '@/lib/utils';
import { TimestampInput } from './components/TimestampInput';
import { DateTimeInput } from './components/DateTimeInput';
import { CurrentTime } from './components/CurrentTime';
import { FormatResults } from './components/FormatResults';
import { TimezoneSelector } from './components/TimezoneSelector';
import { useTimestamp } from './hooks/useTimestamp';

export default function TimestampConverter() {
  const {
    state,
    currentTimestamp,
    currentTimeFormats,
    resultFormats,
    setTimestamp,
    setUnit,
    setTimezone,
    setFromDatetime,
    setNow,
  } = useTimestamp();

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        className={cn(
          'flex flex-col gap-4 p-5',
          'bg-white/95',
          'rounded-xl',
          'border border-zinc-200',
          'shadow-lg shadow-zinc-200/50'
        )}
      >
        {/* 当前时间显示 */}
        <CurrentTime
          currentTimestamp={currentTimestamp}
          formats={currentTimeFormats}
        />

        {/* 分隔线 */}
        <div className="h-px bg-zinc-200" />

        {/* 时间戳输入 */}
        <TimestampInput
          value={state.timestamp}
          unit={state.unit}
          error={state.error}
          onChange={setTimestamp}
          onUnitChange={setUnit}
          onNow={setNow}
        />

        {/* 日期时间输入 */}
        <DateTimeInput value={state.datetime} onChange={setFromDatetime} />

        {/* 时区选择 */}
        <TimezoneSelector value={state.timezone} onChange={setTimezone} />

        {/* 转换结果 */}
        <FormatResults formats={resultFormats} />
      </div>
    </div>
  );
}
