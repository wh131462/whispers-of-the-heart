import { cn } from '@/lib/utils';

type Props = {
  onRestart: () => void;
};

export function EndPanel({ onRestart }: Props) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-50 p-6">
      <div
        className={cn(
          'w-full max-w-md rounded-xl border border-zinc-200 bg-white/95 p-6 text-center shadow-lg shadow-zinc-200/50'
        )}
      >
        <h2 className="mb-3 text-xl font-semibold text-zinc-900">测试完成</h2>
        <p className="mb-6 text-sm leading-relaxed text-zinc-600">
          感谢使用屏幕检测器。如果你发现了显示器问题，建议结合专业设备进一步确认。
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          重新开始
        </button>
      </div>
    </div>
  );
}
