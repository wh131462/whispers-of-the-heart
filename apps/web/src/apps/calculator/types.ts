// 计算器模式
export type CalculatorMode = 'standard' | 'scientific' | 'programmer';

// 按键类型
export type ButtonType =
  | 'number'
  | 'operator'
  | 'function'
  | 'action'
  | 'memory'
  | 'mode';

// 按键定义
export interface ButtonDef {
  id: string;
  label: string;
  sublabel?: string;
  type: ButtonType;
  value: string;
  width?: number; // 相对宽度，默认 1
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

// 计算器状态
export interface CalculatorState {
  // 当前显示的表达式
  expression: string;
  // 当前输入的数字
  currentInput: string;
  // 计算结果
  result: string;
  // 上一个运算符
  lastOperator: string | null;
  // 是否刚完成计算
  isResultDisplayed: boolean;
  // 是否有错误
  error: string | null;
  // 括号深度
  parenthesesDepth: number;
}

// 计算器操作
export type CalculatorAction =
  | { type: 'INPUT_DIGIT'; digit: string }
  | { type: 'INPUT_DECIMAL' }
  | { type: 'INPUT_OPERATOR'; operator: string }
  | { type: 'INPUT_PARENTHESIS'; parenthesis: '(' | ')' }
  | { type: 'INPUT_FUNCTION'; fn: string }
  | { type: 'CALCULATE' }
  | { type: 'CLEAR' }
  | { type: 'CLEAR_ENTRY' }
  | { type: 'BACKSPACE' }
  | { type: 'TOGGLE_SIGN' }
  | { type: 'PERCENT' }
  | { type: 'FUNCTION'; fn: string }
  | { type: 'CONSTANT'; constant: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' };

// 历史记录项
export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  mode: CalculatorMode;
}

// 程序员模式 - 进制
export type NumberBase = 'HEX' | 'DEC' | 'OCT' | 'BIN';

// 程序员模式 - 位宽
export type BitWidth = 8 | 16 | 32 | 64;

// 科学计算器 - 角度模式
export type AngleMode = 'DEG' | 'RAD';
