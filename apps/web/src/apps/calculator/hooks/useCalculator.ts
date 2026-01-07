import { useReducer, useCallback, useMemo } from 'react';
import { evaluate } from '../utils/evaluate';
import type { CalculatorState, CalculatorAction, AngleMode } from '../types';

const initialState: CalculatorState = {
  expression: '',
  currentInput: '0',
  result: '',
  lastOperator: null,
  isResultDisplayed: false,
  error: null,
  parenthesesDepth: 0,
};

function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  switch (action.type) {
    case 'INPUT_DIGIT': {
      const { digit } = action;

      if (state.isResultDisplayed) {
        return {
          ...state,
          expression: '',
          currentInput: digit,
          result: '',
          isResultDisplayed: false,
          error: null,
        };
      }

      if (state.currentInput.replace(/[-.]/g, '').length >= 15) {
        return state;
      }

      if (state.currentInput === '0') {
        return {
          ...state,
          currentInput: digit,
          error: null,
        };
      }

      return {
        ...state,
        currentInput: state.currentInput + digit,
        error: null,
      };
    }

    case 'INPUT_DECIMAL': {
      if (state.isResultDisplayed) {
        return {
          ...state,
          expression: '',
          currentInput: '0.',
          result: '',
          isResultDisplayed: false,
          error: null,
        };
      }

      if (state.currentInput.includes('.')) {
        return state;
      }

      return {
        ...state,
        currentInput: state.currentInput + '.',
        error: null,
      };
    }

    case 'INPUT_OPERATOR': {
      const { operator } = action;
      const current = state.isResultDisplayed
        ? state.result
        : state.currentInput;

      if (state.expression === '' && current === '0' && operator !== '-') {
        return state;
      }

      let newExpression = state.expression;

      if (state.isResultDisplayed) {
        newExpression = state.result + operator;
      } else if (state.currentInput !== '' && state.currentInput !== '0') {
        newExpression = state.expression + state.currentInput + operator;
      } else if (state.expression !== '') {
        const lastChar = state.expression.slice(-1);
        if (['+', '-', '×', '÷', '^', '%'].includes(lastChar)) {
          newExpression = state.expression.slice(0, -1) + operator;
        } else {
          newExpression = state.expression + operator;
        }
      } else {
        return state;
      }

      return {
        ...state,
        expression: newExpression,
        currentInput: '0',
        lastOperator: operator,
        isResultDisplayed: false,
        error: null,
      };
    }

    case 'INPUT_PARENTHESIS': {
      const { parenthesis } = action;

      if (parenthesis === '(') {
        let newExpr: string;

        if (state.isResultDisplayed) {
          newExpr = '(';
        } else if (state.currentInput !== '0') {
          newExpr = state.expression + state.currentInput + '×(';
        } else {
          newExpr = state.expression + '(';
        }

        return {
          ...state,
          expression: newExpr,
          currentInput: '0',
          parenthesesDepth: state.parenthesesDepth + 1,
          isResultDisplayed: false,
          error: null,
        };
      } else {
        if (state.parenthesesDepth <= 0) {
          return state;
        }

        const newExpr =
          state.expression +
          (state.currentInput !== '0' ? state.currentInput : '') +
          ')';

        return {
          ...state,
          expression: newExpr,
          currentInput: '0',
          parenthesesDepth: state.parenthesesDepth - 1,
          error: null,
        };
      }
    }

    case 'INPUT_FUNCTION': {
      const { fn } = action;

      // 函数名映射为显示符号（用于表达式显示）
      const fnDisplay: Record<string, string> = {
        sqrt: '√',
        cbrt: '³√',
        sin: 'sin',
        cos: 'cos',
        tan: 'tan',
        asin: 'sin⁻¹',
        acos: 'cos⁻¹',
        atan: 'tan⁻¹',
        log: 'log',
        ln: 'ln',
        abs: 'abs',
        fact: 'fact',
        exp: 'exp',
        pow10: 'pow10',
      };
      const fnName = fnDisplay[fn] || fn;

      let newExpr: string;

      if (state.isResultDisplayed) {
        // 对已有结果应用函数
        newExpr = fnName + '(' + state.result;
        return {
          ...state,
          expression: newExpr,
          currentInput: '0',
          parenthesesDepth: 1,
          isResultDisplayed: false,
          error: null,
        };
      } else if (state.currentInput !== '0') {
        // 当前有输入，先乘以函数
        newExpr = state.expression + state.currentInput + '×' + fnName + '(';
      } else {
        // 直接添加函数
        newExpr = state.expression + fnName + '(';
      }

      return {
        ...state,
        expression: newExpr,
        currentInput: '0',
        parenthesesDepth: state.parenthesesDepth + 1,
        isResultDisplayed: false,
        error: null,
      };
    }

    case 'CALCULATE': {
      const fullExpression =
        state.expression +
        (state.currentInput !== '0' || state.expression === ''
          ? state.currentInput
          : '');

      if (!fullExpression || fullExpression === '0') {
        return state;
      }

      // 自动补全右括号
      let exprToEvaluate = fullExpression;
      for (let i = 0; i < state.parenthesesDepth; i++) {
        exprToEvaluate += ')';
      }

      try {
        const result = evaluate(exprToEvaluate);
        return {
          ...state,
          expression: exprToEvaluate + '=',
          currentInput: result,
          result: result,
          isResultDisplayed: true,
          error: null,
          parenthesesDepth: 0,
        };
      } catch (err) {
        return {
          ...state,
          error: err instanceof Error ? err.message : '计算错误',
        };
      }
    }

    case 'CLEAR':
      return { ...initialState };

    case 'CLEAR_ENTRY':
      return {
        ...state,
        currentInput: '0',
        error: null,
      };

    case 'BACKSPACE': {
      if (state.isResultDisplayed) {
        return { ...initialState };
      }

      if (state.currentInput.length > 1) {
        return {
          ...state,
          currentInput: state.currentInput.slice(0, -1),
          error: null,
        };
      }

      if (state.currentInput === '0' && state.expression.length > 0) {
        const lastChar = state.expression.slice(-1);
        let newDepth = state.parenthesesDepth;

        if (lastChar === '(') {
          newDepth = Math.max(0, newDepth - 1);
        } else if (lastChar === ')') {
          newDepth = newDepth + 1;
        }

        return {
          ...state,
          expression: state.expression.slice(0, -1),
          parenthesesDepth: newDepth,
          error: null,
        };
      }

      return {
        ...state,
        currentInput: '0',
        error: null,
      };
    }

    case 'TOGGLE_SIGN': {
      if (state.currentInput === '0') {
        return state;
      }

      const newInput = state.currentInput.startsWith('-')
        ? state.currentInput.slice(1)
        : '-' + state.currentInput;

      return {
        ...state,
        currentInput: newInput,
        error: null,
      };
    }

    case 'PERCENT': {
      const current = parseFloat(state.currentInput);
      if (isNaN(current)) return state;

      const result = (current / 100).toString();
      return {
        ...state,
        currentInput: result,
        error: null,
      };
    }

    case 'FUNCTION': {
      const { fn } = action;
      const current = state.isResultDisplayed
        ? state.result
        : state.currentInput;

      try {
        let expr: string;
        let displayExpr: string;

        if (fn === 'reciprocal') {
          expr = `1÷${current}`;
          displayExpr = `1/(${current})`;
        } else if (fn === 'square') {
          expr = `(${current})^2`;
          displayExpr = `(${current})²`;
        } else if (fn === 'fact') {
          expr = `fact(${current})`;
          displayExpr = `${current}!`;
        } else {
          expr = `${fn}(${current})`;
          displayExpr = expr;
        }

        const result = evaluate(expr);

        return {
          ...state,
          expression: displayExpr + '=',
          currentInput: result,
          result: result,
          isResultDisplayed: true,
          error: null,
        };
      } catch (err) {
        return {
          ...state,
          error: err instanceof Error ? err.message : '计算错误',
        };
      }
    }

    case 'CONSTANT': {
      const { constant } = action;
      const value = constant === 'π' ? Math.PI.toString() : Math.E.toString();

      if (state.isResultDisplayed) {
        return {
          ...state,
          expression: '',
          currentInput: value,
          isResultDisplayed: false,
          error: null,
        };
      }

      if (state.currentInput !== '0') {
        return {
          ...state,
          expression: state.expression + state.currentInput + '×',
          currentInput: value,
          error: null,
        };
      }

      return {
        ...state,
        currentInput: value,
        error: null,
      };
    }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

export function useCalculator(_angleMode: AngleMode = 'DEG') {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);

  const inputDigit = useCallback((digit: string) => {
    dispatch({ type: 'INPUT_DIGIT', digit });
  }, []);

  const inputDecimal = useCallback(() => {
    dispatch({ type: 'INPUT_DECIMAL' });
  }, []);

  const inputOperator = useCallback((operator: string) => {
    dispatch({ type: 'INPUT_OPERATOR', operator });
  }, []);

  const inputParenthesis = useCallback((paren: '(' | ')') => {
    dispatch({ type: 'INPUT_PARENTHESIS', parenthesis: paren });
  }, []);

  const inputFunction = useCallback((fn: string) => {
    dispatch({ type: 'INPUT_FUNCTION', fn });
  }, []);

  const calculate = useCallback(() => {
    dispatch({ type: 'CALCULATE' });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const clearEntry = useCallback(() => {
    dispatch({ type: 'CLEAR_ENTRY' });
  }, []);

  const backspace = useCallback(() => {
    dispatch({ type: 'BACKSPACE' });
  }, []);

  const toggleSign = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIGN' });
  }, []);

  const percent = useCallback(() => {
    dispatch({ type: 'PERCENT' });
  }, []);

  const applyFunction = useCallback((fn: string) => {
    dispatch({ type: 'FUNCTION', fn });
  }, []);

  const inputConstant = useCallback((constant: string) => {
    dispatch({ type: 'CONSTANT', constant });
  }, []);

  // 表达式行：显示正在构建的表达式
  const displayExpression = useMemo(() => {
    if (state.isResultDisplayed) {
      return state.expression;
    }
    // 构建中的表达式 + 当前输入
    const currentPart = state.currentInput !== '0' ? state.currentInput : '';
    return state.expression + currentPart || '';
  }, [state.expression, state.currentInput, state.isResultDisplayed]);

  // 主显示值：当前输入的数字或计算结果
  const displayValue = state.currentInput;

  return {
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
    clearEntry,
    backspace,
    toggleSign,
    percent,
    applyFunction,
    inputConstant,
  };
}
