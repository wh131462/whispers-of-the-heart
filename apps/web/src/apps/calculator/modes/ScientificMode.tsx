import { useState, useEffect, useCallback } from 'react';
import { Display } from '../components/Display';
import { ScientificKeypad } from '../components/ScientificKeypad';
import { CalculatorShell } from '../components/CalculatorShell';
import { useCalculator } from '../hooks/useCalculator';
import type { AngleMode } from '../types';

export function ScientificMode() {
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');

  const {
    state,
    displayValue,
    displayExpression,
    inputDigit,
    inputDecimal,
    inputOperator,
    inputParenthesis,
    inputFunction,
    calculate,
    clear,
    backspace,
    toggleSign,
    applyFunction,
    inputConstant,
  } = useCalculator(angleMode);

  const handleAngleModeToggle = () => {
    setAngleMode(prev => (prev === 'DEG' ? 'RAD' : 'DEG'));
  };

  const handleFunction = (fn: string) => {
    // 后置函数（对当前值立即操作）
    const immediateOps = ['square', 'fact'];

    if (immediateOps.includes(fn)) {
      applyFunction(fn);
    } else {
      // 前置函数（添加到表达式，等待输入参数）
      inputFunction(fn);
    }
  };

  // 键盘支持
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const { key } = e;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        inputDigit(key);
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
        case 'x':
        case 'X':
          e.preventDefault();
          inputOperator('×');
          break;
        case '/':
          e.preventDefault();
          inputOperator('÷');
          break;
        case '^':
          e.preventDefault();
          inputOperator('^');
          break;
        case '.':
        case ',':
          e.preventDefault();
          inputDecimal();
          break;
        case '(':
          e.preventDefault();
          inputParenthesis('(');
          break;
        case ')':
          e.preventDefault();
          inputParenthesis(')');
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
        case 'p':
        case 'P':
          e.preventDefault();
          inputConstant('π');
          break;
      }
    },
    [
      inputDigit,
      inputOperator,
      inputDecimal,
      inputParenthesis,
      calculate,
      clear,
      backspace,
      inputConstant,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <CalculatorShell className="w-full max-w-sm mx-auto">
      <Display
        expression={displayExpression}
        value={displayValue}
        error={state.error}
      />
      <ScientificKeypad
        angleMode={angleMode}
        onAngleModeToggle={handleAngleModeToggle}
        onDigit={inputDigit}
        onDecimal={inputDecimal}
        onOperator={inputOperator}
        onEquals={calculate}
        onClear={clear}
        onBackspace={backspace}
        onToggleSign={toggleSign}
        onFunction={handleFunction}
        onConstant={inputConstant}
        onParenthesis={inputParenthesis}
      />
    </CalculatorShell>
  );
}
