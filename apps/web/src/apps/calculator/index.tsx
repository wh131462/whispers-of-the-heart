import { useState } from 'react';
import { cn } from '../../lib/utils';
import { StandardMode } from './modes/StandardMode';
import { ScientificMode } from './modes/ScientificMode';
import { ProgrammerMode } from './modes/ProgrammerMode';
import type { CalculatorMode } from './types';

const MODES: { id: CalculatorMode; label: string }[] = [
  { id: 'standard', label: '标准' },
  { id: 'scientific', label: '科学' },
  { id: 'programmer', label: '程序员' },
];

export default function Calculator() {
  const [mode, setMode] = useState<CalculatorMode>('standard');

  const renderMode = () => {
    switch (mode) {
      case 'standard':
        return <StandardMode />;
      case 'scientific':
        return <ScientificMode />;
      case 'programmer':
        return <ProgrammerMode />;
      default:
        return <StandardMode />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      {/* 模式切换 */}
      <div className="flex items-center gap-0.5 p-1 rounded-lg bg-neutral-900/80 border border-neutral-800/60">
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-mono transition-all',
              mode === m.id
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-neutral-500 hover:text-neutral-300'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 计算器 */}
      <div className="w-full max-w-md">{renderMode()}</div>

      {/* 键盘提示 */}
      <div className="text-xs text-neutral-600 font-mono text-center">
        键盘：数字 &middot; 运算符 &middot; Enter = 计算 &middot; Esc = 清除
      </div>
    </div>
  );
}
