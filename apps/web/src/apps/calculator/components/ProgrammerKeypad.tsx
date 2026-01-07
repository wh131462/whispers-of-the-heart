import { CalculatorButton } from './CalculatorButton';
import type { NumberBase } from '../types';

interface ProgrammerKeypadProps {
  base: NumberBase;
  onChar: (char: string) => void;
  onOperator: (op: string) => void;
  onEquals: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onBitwiseNot: () => void;
  onNegate: () => void;
}

export function ProgrammerKeypad({
  base,
  onChar,
  onOperator,
  onEquals,
  onClear,
  onBackspace,
  onBitwiseNot,
  onNegate,
}: ProgrammerKeypadProps) {
  const isHexEnabled = base === 'HEX';
  const isDecEnabled = base === 'DEC' || base === 'HEX';
  const isOctEnabled = base === 'OCT' || isDecEnabled;

  return (
    <div className="flex flex-col gap-2">
      {/* 位运算区域 */}
      <div className="grid grid-cols-4 gap-1.5">
        <CalculatorButton
          label="AND"
          type="operator"
          variant="secondary"
          onClick={() => onOperator('AND')}
        />
        <CalculatorButton
          label="OR"
          type="operator"
          variant="secondary"
          onClick={() => onOperator('OR')}
        />
        <CalculatorButton
          label="XOR"
          type="operator"
          variant="secondary"
          onClick={() => onOperator('XOR')}
        />
        <CalculatorButton
          label="NOT"
          type="operator"
          variant="secondary"
          onClick={onBitwiseNot}
        />
        <CalculatorButton
          label="&lt;&lt;"
          type="operator"
          variant="secondary"
          onClick={() => onOperator('<<')}
        />
        <CalculatorButton
          label="&gt;&gt;"
          type="operator"
          variant="secondary"
          onClick={() => onOperator('>>')}
        />
        <CalculatorButton
          label="MOD"
          type="operator"
          variant="secondary"
          onClick={() => onOperator('%')}
        />
        <CalculatorButton
          label="±"
          type="function"
          variant="secondary"
          onClick={onNegate}
        />
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-neutral-800/60" />

      {/* 主键盘 - 4列布局 */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* 第1行 */}
        <CalculatorButton
          label="AC"
          type="action"
          variant="secondary"
          onClick={onClear}
        />
        <CalculatorButton
          label="D"
          type="number"
          onClick={() => onChar('D')}
          disabled={!isHexEnabled}
        />
        <CalculatorButton
          label="E"
          type="number"
          onClick={() => onChar('E')}
          disabled={!isHexEnabled}
        />
        <CalculatorButton
          label="F"
          type="number"
          onClick={() => onChar('F')}
          disabled={!isHexEnabled}
        />

        {/* 第2行 */}
        <CalculatorButton
          label="⌫"
          type="action"
          variant="secondary"
          onClick={onBackspace}
        />
        <CalculatorButton
          label="A"
          type="number"
          onClick={() => onChar('A')}
          disabled={!isHexEnabled}
        />
        <CalculatorButton
          label="B"
          type="number"
          onClick={() => onChar('B')}
          disabled={!isHexEnabled}
        />
        <CalculatorButton
          label="C"
          type="number"
          onClick={() => onChar('C')}
          disabled={!isHexEnabled}
        />

        {/* 第3行 */}
        <CalculatorButton
          label="÷"
          type="operator"
          variant="accent"
          onClick={() => onOperator('÷')}
        />
        <CalculatorButton
          label="7"
          type="number"
          onClick={() => onChar('7')}
          disabled={!isOctEnabled}
        />
        <CalculatorButton
          label="8"
          type="number"
          onClick={() => onChar('8')}
          disabled={!isDecEnabled}
        />
        <CalculatorButton
          label="9"
          type="number"
          onClick={() => onChar('9')}
          disabled={!isDecEnabled}
        />

        {/* 第4行 */}
        <CalculatorButton
          label="×"
          type="operator"
          variant="accent"
          onClick={() => onOperator('×')}
        />
        <CalculatorButton
          label="4"
          type="number"
          onClick={() => onChar('4')}
          disabled={!isOctEnabled}
        />
        <CalculatorButton
          label="5"
          type="number"
          onClick={() => onChar('5')}
          disabled={!isOctEnabled}
        />
        <CalculatorButton
          label="6"
          type="number"
          onClick={() => onChar('6')}
          disabled={!isOctEnabled}
        />

        {/* 第5行 */}
        <CalculatorButton
          label="-"
          type="operator"
          variant="accent"
          onClick={() => onOperator('-')}
        />
        <CalculatorButton label="1" type="number" onClick={() => onChar('1')} />
        <CalculatorButton
          label="2"
          type="number"
          onClick={() => onChar('2')}
          disabled={base === 'BIN'}
        />
        <CalculatorButton
          label="3"
          type="number"
          onClick={() => onChar('3')}
          disabled={base === 'BIN'}
        />

        {/* 第6行 */}
        <CalculatorButton
          label="+"
          type="operator"
          variant="accent"
          onClick={() => onOperator('+')}
        />
        <CalculatorButton
          label="0"
          type="number"
          width={2}
          onClick={() => onChar('0')}
        />
        <CalculatorButton
          label="="
          type="action"
          variant="primary"
          onClick={onEquals}
        />
      </div>
    </div>
  );
}
