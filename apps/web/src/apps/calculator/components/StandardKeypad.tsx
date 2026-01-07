import { CalculatorButton } from './CalculatorButton';

interface StandardKeypadProps {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onOperator: (op: string) => void;
  onEquals: () => void;
  onClear: () => void;
  onToggleSign: () => void;
  onPercent: () => void;
}

export function StandardKeypad({
  onDigit,
  onDecimal,
  onOperator,
  onEquals,
  onClear,
  onToggleSign,
  onPercent,
}: StandardKeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {/* 第一行：AC, C, ⌫, ÷ */}
      <CalculatorButton
        label="AC"
        type="action"
        variant="secondary"
        onClick={onClear}
      />
      <CalculatorButton
        label="±"
        type="function"
        variant="secondary"
        onClick={onToggleSign}
      />
      <CalculatorButton
        label="%"
        type="function"
        variant="secondary"
        onClick={onPercent}
      />
      <CalculatorButton
        label="÷"
        type="operator"
        variant="accent"
        onClick={() => onOperator('÷')}
      />

      {/* 第二行：7, 8, 9, × */}
      <CalculatorButton label="7" type="number" onClick={() => onDigit('7')} />
      <CalculatorButton label="8" type="number" onClick={() => onDigit('8')} />
      <CalculatorButton label="9" type="number" onClick={() => onDigit('9')} />
      <CalculatorButton
        label="×"
        type="operator"
        variant="accent"
        onClick={() => onOperator('×')}
      />

      {/* 第三行：4, 5, 6, - */}
      <CalculatorButton label="4" type="number" onClick={() => onDigit('4')} />
      <CalculatorButton label="5" type="number" onClick={() => onDigit('5')} />
      <CalculatorButton label="6" type="number" onClick={() => onDigit('6')} />
      <CalculatorButton
        label="-"
        type="operator"
        variant="accent"
        onClick={() => onOperator('-')}
      />

      {/* 第四行：1, 2, 3, + */}
      <CalculatorButton label="1" type="number" onClick={() => onDigit('1')} />
      <CalculatorButton label="2" type="number" onClick={() => onDigit('2')} />
      <CalculatorButton label="3" type="number" onClick={() => onDigit('3')} />
      <CalculatorButton
        label="+"
        type="operator"
        variant="accent"
        onClick={() => onOperator('+')}
      />

      {/* 第五行：0(占2格), ., = */}
      <CalculatorButton
        label="0"
        type="number"
        width={2}
        onClick={() => onDigit('0')}
      />
      <CalculatorButton label="." type="number" onClick={onDecimal} />
      <CalculatorButton
        label="="
        type="action"
        variant="primary"
        onClick={onEquals}
      />
    </div>
  );
}
