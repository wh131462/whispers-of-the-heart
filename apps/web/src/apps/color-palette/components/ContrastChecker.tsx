import { cn } from '@/lib/utils';
import type { Color, ContrastResult } from '../types';
import { getContrastLevel } from '../utils/contrast';

interface ContrastCheckerProps {
  foreground: Color;
  background: Color;
  result: ContrastResult;
  onBackgroundChange: (color: Color) => void;
}

export function ContrastChecker({
  foreground,
  background,
  result,
}: ContrastCheckerProps) {
  const level = getContrastLevel(result.ratio);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-600">对比度检查</label>
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded',
            result.aa
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          )}
        >
          {level}
        </span>
      </div>

      {/* 预览 */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: background.hex }}
      >
        <p style={{ color: foreground.hex }} className="text-lg font-medium">
          示例文本 Sample Text
        </p>
        <p style={{ color: foreground.hex }} className="text-sm">
          小号文本 Small text
        </p>
      </div>

      {/* 对比度值 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-600">对比度比率</span>
        <span className="font-mono text-zinc-800">{result.ratio}:1</span>
      </div>

      {/* WCAG 等级 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div
          className={cn(
            'p-2 rounded',
            result.aa ? 'bg-emerald-100' : 'bg-zinc-100'
          )}
        >
          <span className={result.aa ? 'text-emerald-700' : 'text-zinc-500'}>
            AA 正常文本 {result.aa ? '✓' : '✗'}
          </span>
        </div>
        <div
          className={cn(
            'p-2 rounded',
            result.aaa ? 'bg-emerald-100' : 'bg-zinc-100'
          )}
        >
          <span className={result.aaa ? 'text-emerald-700' : 'text-zinc-500'}>
            AAA 正常文本 {result.aaa ? '✓' : '✗'}
          </span>
        </div>
        <div
          className={cn(
            'p-2 rounded',
            result.aaLarge ? 'bg-emerald-100' : 'bg-zinc-100'
          )}
        >
          <span
            className={result.aaLarge ? 'text-emerald-700' : 'text-zinc-500'}
          >
            AA 大文本 {result.aaLarge ? '✓' : '✗'}
          </span>
        </div>
        <div
          className={cn(
            'p-2 rounded',
            result.aaaLarge ? 'bg-emerald-100' : 'bg-zinc-100'
          )}
        >
          <span
            className={result.aaaLarge ? 'text-emerald-700' : 'text-zinc-500'}
          >
            AAA 大文本 {result.aaaLarge ? '✓' : '✗'}
          </span>
        </div>
      </div>
    </div>
  );
}
