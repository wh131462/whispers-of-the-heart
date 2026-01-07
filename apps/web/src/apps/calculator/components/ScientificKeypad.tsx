import { CalculatorButton } from './CalculatorButton';
import type { AngleMode } from '../types';

interface ScientificKeypadProps {
  angleMode: AngleMode;
  onAngleModeToggle: () => void;
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onOperator: (op: string) => void;
  onEquals: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onToggleSign: () => void;
  onFunction: (fn: string) => void;
  onConstant: (c: string) => void;
  onParenthesis: (p: '(' | ')') => void;
}

export function ScientificKeypad({
  angleMode,
  onAngleModeToggle,
  onDigit,
  onDecimal,
  onOperator,
  onEquals,
  onClear,
  onBackspace,
  onToggleSign,
  onFunction,
  onConstant,
  onParenthesis,
}: ScientificKeypadProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* 科学函数区 - 5列布局 */}
      <div className="grid grid-cols-5 gap-1">
        {/* 第1行：括号、幂运算、根号 */}
        <CalculatorButton
          label="("
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onParenthesis('(')}
        />
        <CalculatorButton
          label=")"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onParenthesis(')')}
        />
        <CalculatorButton
          label="x²"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('square')}
        />
        <CalculatorButton
          label="xʸ"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onOperator('^')}
        />
        <CalculatorButton
          label="√"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('sqrt')}
        />

        {/* 第2行：三角函数 + 立方根 */}
        <CalculatorButton
          label="sin"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('sin')}
        />
        <CalculatorButton
          label="cos"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('cos')}
        />
        <CalculatorButton
          label="tan"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('tan')}
        />
        <CalculatorButton
          label="³√"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('cbrt')}
        />
        <CalculatorButton
          label="n!"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('fact')}
        />

        {/* 第3行：反三角函数 + 对数 */}
        <CalculatorButton
          label="sin⁻¹"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('asin')}
        />
        <CalculatorButton
          label="cos⁻¹"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('acos')}
        />
        <CalculatorButton
          label="tan⁻¹"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('atan')}
        />
        <CalculatorButton
          label="log"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('log')}
        />
        <CalculatorButton
          label="ln"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('ln')}
        />

        {/* 第4行：常数、绝对值、指数 */}
        <CalculatorButton
          label="π"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onConstant('π')}
        />
        <CalculatorButton
          label="e"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onConstant('e')}
        />
        <CalculatorButton
          label="|x|"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('abs')}
        />
        <CalculatorButton
          label="eˣ"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('exp')}
        />
        <CalculatorButton
          label="10ˣ"
          type="function"
          variant="secondary"
          size="sm"
          onClick={() => onFunction('pow10')}
        />
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-neutral-800/60" />

      {/* 标准键盘区 - 4列布局 */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* 第1行 */}
        <CalculatorButton
          label="AC"
          type="action"
          variant="secondary"
          onClick={onClear}
        />
        <CalculatorButton
          label="⌫"
          type="action"
          variant="secondary"
          onClick={onBackspace}
        />
        <CalculatorButton
          label={angleMode}
          type="mode"
          variant="secondary"
          onClick={onAngleModeToggle}
        />
        <CalculatorButton
          label="÷"
          type="operator"
          variant="accent"
          onClick={() => onOperator('÷')}
        />

        {/* 第2行 */}
        <CalculatorButton
          label="7"
          type="number"
          onClick={() => onDigit('7')}
        />
        <CalculatorButton
          label="8"
          type="number"
          onClick={() => onDigit('8')}
        />
        <CalculatorButton
          label="9"
          type="number"
          onClick={() => onDigit('9')}
        />
        <CalculatorButton
          label="×"
          type="operator"
          variant="accent"
          onClick={() => onOperator('×')}
        />

        {/* 第3行 */}
        <CalculatorButton
          label="4"
          type="number"
          onClick={() => onDigit('4')}
        />
        <CalculatorButton
          label="5"
          type="number"
          onClick={() => onDigit('5')}
        />
        <CalculatorButton
          label="6"
          type="number"
          onClick={() => onDigit('6')}
        />
        <CalculatorButton
          label="-"
          type="operator"
          variant="accent"
          onClick={() => onOperator('-')}
        />

        {/* 第4行 */}
        <CalculatorButton
          label="1"
          type="number"
          onClick={() => onDigit('1')}
        />
        <CalculatorButton
          label="2"
          type="number"
          onClick={() => onDigit('2')}
        />
        <CalculatorButton
          label="3"
          type="number"
          onClick={() => onDigit('3')}
        />
        <CalculatorButton
          label="+"
          type="operator"
          variant="accent"
          onClick={() => onOperator('+')}
        />

        {/* 第5行 */}
        <CalculatorButton
          label="±"
          type="function"
          variant="secondary"
          onClick={onToggleSign}
        />
        <CalculatorButton
          label="0"
          type="number"
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
    </div>
  );
}
