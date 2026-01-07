import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BitVisualizer } from '../components/BitVisualizer';
import { ProgrammerKeypad } from '../components/ProgrammerKeypad';
import { CalculatorShell } from '../components/CalculatorShell';
import { useProgrammerCalculator } from '../hooks/useProgrammerCalculator';
import { formatBinary, formatHex, isValidChar } from '../utils/programmer';
import type { NumberBase, BitWidth } from '../types';

const BASES: { id: NumberBase; label: string }[] = [
  { id: 'HEX', label: 'HEX' },
  { id: 'DEC', label: 'DEC' },
  { id: 'OCT', label: 'OCT' },
  { id: 'BIN', label: 'BIN' },
];

const BIT_WIDTHS: BitWidth[] = [8, 16, 32, 64];

export function ProgrammerMode() {
  const {
    state,
    inputChar,
    setBase,
    setBitWidth,
    inputOperator,
    calculate,
    clear,
    backspace,
    toggleBit,
    bitwiseNot,
    negate,
    getDisplayValues,
  } = useProgrammerCalculator();

  const displayValues = getDisplayValues();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const { key } = e;

      if (isValidChar(key, state.inputBase)) {
        e.preventDefault();
        inputChar(key);
        return;
      }

      switch (key) {
        case '+':
          e.preventDefault();
          inputOperator('+');
          break;
        case '-':
          e.preventDefault();
          inputOperator('-');
          break;
        case '*':
          e.preventDefault();
          inputOperator('×');
          break;
        case '/':
          e.preventDefault();
          inputOperator('÷');
          break;
        case '%':
          e.preventDefault();
          inputOperator('%');
          break;
        case '&':
          e.preventDefault();
          inputOperator('AND');
          break;
        case '|':
          e.preventDefault();
          inputOperator('OR');
          break;
        case '^':
          e.preventDefault();
          inputOperator('XOR');
          break;
        case '~':
          e.preventDefault();
          bitwiseNot();
          break;
        case '<':
          e.preventDefault();
          inputOperator('<<');
          break;
        case '>':
          e.preventDefault();
          inputOperator('>>');
          break;
        case 'Enter':
        case '=':
          e.preventDefault();
          calculate();
          break;
        case 'Escape':
          e.preventDefault();
          clear();
          break;
        case 'Backspace':
          e.preventDefault();
          backspace();
          break;
      }
    },
    [
      state.inputBase,
      inputChar,
      inputOperator,
      calculate,
      clear,
      backspace,
      bitwiseNot,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatValue = (value: string, base: NumberBase) => {
    if (base === 'BIN') return formatBinary(value);
    if (base === 'HEX') return formatHex(value);
    return value;
  };

  return (
    <CalculatorShell className="w-full max-w-md mx-auto">
      {/* 进制和位宽选择 */}
      <div className="flex items-center justify-between gap-2">
        {/* 进制选择 */}
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
          {BASES.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBase(b.id)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-mono transition-all',
                state.inputBase === b.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* 位宽选择 */}
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
          {BIT_WIDTHS.map(w => (
            <button
              key={w}
              type="button"
              onClick={() => setBitWidth(w)}
              className={cn(
                'px-2 py-1 rounded text-xs font-mono transition-all',
                state.bitWidth === w
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* 多进制显示 */}
      <div className="rounded-lg p-3 bg-neutral-950/80 border border-neutral-800/60 space-y-1">
        {state.error && (
          <div className="text-sm text-red-400 mb-2 font-mono">
            {state.error}
          </div>
        )}

        {BASES.map(b => (
          <div
            key={b.id}
            className={cn(
              'flex items-center gap-3 py-1 px-2 rounded transition-all',
              state.inputBase === b.id && 'bg-emerald-500/5'
            )}
          >
            <span
              className={cn(
                'w-8 text-xs font-mono',
                state.inputBase === b.id
                  ? 'text-emerald-400'
                  : 'text-neutral-600'
              )}
            >
              {b.label}
            </span>
            <span
              className={cn(
                'flex-1 font-mono text-right overflow-x-auto',
                state.inputBase === b.id
                  ? 'text-base text-emerald-400'
                  : 'text-sm text-neutral-500'
              )}
            >
              {formatValue(displayValues[b.id], b.id)}
            </span>
          </div>
        ))}
      </div>

      {/* 位可视化 */}
      {state.bitWidth <= 32 && (
        <div className="rounded-lg p-2 bg-neutral-950/60 border border-neutral-800/60">
          <BitVisualizer
            value={state.value}
            bitWidth={state.bitWidth}
            onToggleBit={toggleBit}
          />
        </div>
      )}

      {/* 键盘 */}
      <ProgrammerKeypad
        base={state.inputBase}
        onChar={inputChar}
        onOperator={inputOperator}
        onEquals={calculate}
        onClear={clear}
        onBackspace={backspace}
        onBitwiseNot={bitwiseNot}
        onNegate={negate}
      />
    </CalculatorShell>
  );
}
