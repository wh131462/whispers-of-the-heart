import { useReducer, useCallback } from 'react';
import type { NumberBase, BitWidth } from '../types';
import {
  toBase,
  fromBase,
  clampToBitWidth,
  bitwiseAnd,
  bitwiseOr,
  bitwiseXor,
  bitwiseNot,
  leftShift,
  rightShift,
  isValidChar,
} from '../utils/programmer';

interface ProgrammerState {
  value: bigint;
  inputBase: NumberBase;
  bitWidth: BitWidth;
  currentInput: string;
  lastOperator: string | null;
  pendingValue: bigint | null;
  error: string | null;
  isResultDisplayed: boolean;
}

type ProgrammerAction =
  | { type: 'INPUT_CHAR'; char: string }
  | { type: 'SET_BASE'; base: NumberBase }
  | { type: 'SET_BIT_WIDTH'; bitWidth: BitWidth }
  | { type: 'OPERATOR'; operator: string }
  | { type: 'CALCULATE' }
  | { type: 'CLEAR' }
  | { type: 'BACKSPACE' }
  | { type: 'TOGGLE_BIT'; bitIndex: number }
  | { type: 'BITWISE_NOT' }
  | { type: 'NEGATE' };

const initialState: ProgrammerState = {
  value: 0n,
  inputBase: 'DEC',
  bitWidth: 64,
  currentInput: '0',
  lastOperator: null,
  pendingValue: null,
  error: null,
  isResultDisplayed: false,
};

function programmerReducer(
  state: ProgrammerState,
  action: ProgrammerAction
): ProgrammerState {
  switch (action.type) {
    case 'INPUT_CHAR': {
      const { char } = action;

      if (!isValidChar(char, state.inputBase)) {
        return state;
      }

      if (state.isResultDisplayed) {
        const newValue = fromBase(char, state.inputBase);
        return {
          ...state,
          currentInput: char,
          value: clampToBitWidth(newValue, state.bitWidth),
          isResultDisplayed: false,
          error: null,
        };
      }

      // 限制输入长度
      const maxLen =
        state.inputBase === 'BIN'
          ? state.bitWidth
          : state.inputBase === 'HEX'
            ? state.bitWidth / 4
            : 20;

      if (state.currentInput.length >= maxLen) {
        return state;
      }

      const newInput =
        state.currentInput === '0' ? char : state.currentInput + char;
      const newValue = fromBase(newInput, state.inputBase);

      return {
        ...state,
        currentInput: newInput,
        value: clampToBitWidth(newValue, state.bitWidth),
        error: null,
      };
    }

    case 'SET_BASE': {
      const { base } = action;
      // 转换当前值到新进制显示
      const newInput = toBase(state.value, base);

      return {
        ...state,
        inputBase: base,
        currentInput: newInput,
      };
    }

    case 'SET_BIT_WIDTH': {
      const { bitWidth } = action;
      const newValue = clampToBitWidth(state.value, bitWidth);
      const newInput = toBase(newValue, state.inputBase);

      return {
        ...state,
        bitWidth,
        value: newValue,
        currentInput: newInput,
      };
    }

    case 'OPERATOR': {
      const { operator } = action;

      return {
        ...state,
        pendingValue: state.value,
        lastOperator: operator,
        currentInput: '0',
        value: 0n,
        isResultDisplayed: false,
        error: null,
      };
    }

    case 'CALCULATE': {
      if (state.pendingValue === null || state.lastOperator === null) {
        return state;
      }

      let result: bigint;

      try {
        switch (state.lastOperator) {
          case '+':
            result = state.pendingValue + state.value;
            break;
          case '-':
            result = state.pendingValue - state.value;
            break;
          case '×':
            result = state.pendingValue * state.value;
            break;
          case '÷':
            if (state.value === 0n) {
              return { ...state, error: '除数不能为零' };
            }
            result = state.pendingValue / state.value;
            break;
          case '%':
            if (state.value === 0n) {
              return { ...state, error: '除数不能为零' };
            }
            result = state.pendingValue % state.value;
            break;
          case 'AND':
            result = bitwiseAnd(state.pendingValue, state.value);
            break;
          case 'OR':
            result = bitwiseOr(state.pendingValue, state.value);
            break;
          case 'XOR':
            result = bitwiseXor(state.pendingValue, state.value);
            break;
          case '<<':
            result = leftShift(state.pendingValue, state.value);
            break;
          case '>>':
            result = rightShift(state.pendingValue, state.value);
            break;
          default:
            return state;
        }

        result = clampToBitWidth(result, state.bitWidth);
        const newInput = toBase(result, state.inputBase);

        return {
          ...state,
          value: result,
          currentInput: newInput,
          pendingValue: null,
          lastOperator: null,
          isResultDisplayed: true,
          error: null,
        };
      } catch {
        return { ...state, error: '计算错误' };
      }
    }

    case 'CLEAR':
      return {
        ...initialState,
        inputBase: state.inputBase,
        bitWidth: state.bitWidth,
      };

    case 'BACKSPACE': {
      if (state.isResultDisplayed) {
        return {
          ...state,
          currentInput: '0',
          value: 0n,
          isResultDisplayed: false,
        };
      }

      if (state.currentInput.length <= 1) {
        return {
          ...state,
          currentInput: '0',
          value: 0n,
        };
      }

      const newInput = state.currentInput.slice(0, -1);
      const newValue = fromBase(newInput, state.inputBase);

      return {
        ...state,
        currentInput: newInput,
        value: clampToBitWidth(newValue, state.bitWidth),
      };
    }

    case 'TOGGLE_BIT': {
      const { bitIndex } = action;
      const mask = 1n << BigInt(state.bitWidth - 1 - bitIndex);
      const newValue = state.value ^ mask;
      const clampedValue = clampToBitWidth(newValue, state.bitWidth);
      const newInput = toBase(clampedValue, state.inputBase);

      return {
        ...state,
        value: clampedValue,
        currentInput: newInput,
        isResultDisplayed: false,
      };
    }

    case 'BITWISE_NOT': {
      const result = bitwiseNot(state.value, state.bitWidth);
      const newInput = toBase(result, state.inputBase);

      return {
        ...state,
        value: result,
        currentInput: newInput,
        isResultDisplayed: true,
      };
    }

    case 'NEGATE': {
      const result = clampToBitWidth(-state.value, state.bitWidth);
      const newInput = toBase(result, state.inputBase);

      return {
        ...state,
        value: result,
        currentInput: newInput,
        isResultDisplayed: true,
      };
    }

    default:
      return state;
  }
}

export function useProgrammerCalculator() {
  const [state, dispatch] = useReducer(programmerReducer, initialState);

  const inputChar = useCallback((char: string) => {
    dispatch({ type: 'INPUT_CHAR', char: char.toUpperCase() });
  }, []);

  const setBase = useCallback((base: NumberBase) => {
    dispatch({ type: 'SET_BASE', base });
  }, []);

  const setBitWidth = useCallback((bitWidth: BitWidth) => {
    dispatch({ type: 'SET_BIT_WIDTH', bitWidth });
  }, []);

  const inputOperator = useCallback((operator: string) => {
    dispatch({ type: 'OPERATOR', operator });
  }, []);

  const calculate = useCallback(() => {
    dispatch({ type: 'CALCULATE' });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const backspace = useCallback(() => {
    dispatch({ type: 'BACKSPACE' });
  }, []);

  const toggleBit = useCallback((bitIndex: number) => {
    dispatch({ type: 'TOGGLE_BIT', bitIndex });
  }, []);

  const bitwiseNotOp = useCallback(() => {
    dispatch({ type: 'BITWISE_NOT' });
  }, []);

  const negate = useCallback(() => {
    dispatch({ type: 'NEGATE' });
  }, []);

  // 获取所有进制的显示值
  const getDisplayValues = useCallback(() => {
    return {
      HEX: toBase(state.value, 'HEX'),
      DEC: toBase(state.value, 'DEC'),
      OCT: toBase(state.value, 'OCT'),
      BIN: toBase(state.value, 'BIN'),
    };
  }, [state.value]);

  return {
    state,
    inputChar,
    setBase,
    setBitWidth,
    inputOperator,
    calculate,
    clear,
    backspace,
    toggleBit,
    bitwiseNot: bitwiseNotOp,
    negate,
    getDisplayValues,
  };
}
