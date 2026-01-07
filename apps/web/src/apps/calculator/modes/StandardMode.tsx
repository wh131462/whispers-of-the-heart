import { useEffect, useCallback } from 'react';
import { Display } from '../components/Display';
import { StandardKeypad } from '../components/StandardKeypad';
import { CalculatorShell } from '../components/CalculatorShell';
import { useCalculator } from '../hooks/useCalculator';

export function StandardMode() {
  const {
    state,
    displayValue,
    displayExpression,
    inputDigit,
    inputDecimal,
    inputOperator,
    calculate,
    clear,
    clearEntry,
    backspace,
    toggleSign,
    percent,
  } = useCalculator();

  // 键盘支持
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 忽略组合键
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const { key } = e;

      // 数字
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        inputDigit(key);
        return;
      }

      // 运算符
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
        case 'x':
        case 'X':
          e.preventDefault();
          inputOperator('×');
          break;
        case '/':
          e.preventDefault();
          inputOperator('÷');
          break;
        case '.':
        case ',':
          e.preventDefault();
          inputDecimal();
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
        case 'Delete':
          e.preventDefault();
          clearEntry();
          break;
        case '%':
          e.preventDefault();
          percent();
          break;
      }
    },
    [
      inputDigit,
      inputOperator,
      inputDecimal,
      calculate,
      clear,
      backspace,
      clearEntry,
      percent,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <CalculatorShell className="w-full max-w-xs mx-auto">
      <Display
        expression={displayExpression}
        value={displayValue}
        error={state.error}
      />
      <StandardKeypad
        onDigit={inputDigit}
        onDecimal={inputDecimal}
        onOperator={inputOperator}
        onEquals={calculate}
        onClear={clear}
        onToggleSign={toggleSign}
        onPercent={percent}
      />
    </CalculatorShell>
  );
}
