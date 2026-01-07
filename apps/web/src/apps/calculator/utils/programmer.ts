/**
 * 程序员计算器工具函数
 */

import type { NumberBase, BitWidth } from '../types';

/**
 * 将数值转换为指定进制的字符串
 */
export function toBase(value: bigint, base: NumberBase): string {
  if (value === 0n) return '0';

  const isNegative = value < 0n;
  const absValue = isNegative ? -value : value;

  let result: string;
  switch (base) {
    case 'HEX':
      result = absValue.toString(16).toUpperCase();
      break;
    case 'DEC':
      result = absValue.toString(10);
      break;
    case 'OCT':
      result = absValue.toString(8);
      break;
    case 'BIN':
      result = absValue.toString(2);
      break;
    default:
      result = absValue.toString(10);
  }

  return isNegative ? '-' + result : result;
}

/**
 * 从指定进制的字符串解析为 bigint
 */
export function fromBase(value: string, base: NumberBase): bigint {
  if (!value || value === '' || value === '-') return 0n;

  const isNegative = value.startsWith('-');
  const absValue = isNegative ? value.slice(1) : value;

  let result: bigint;
  switch (base) {
    case 'HEX':
      result = BigInt('0x' + (absValue || '0'));
      break;
    case 'DEC':
      result = BigInt(absValue || '0');
      break;
    case 'OCT':
      result = BigInt('0o' + (absValue || '0'));
      break;
    case 'BIN':
      result = BigInt('0b' + (absValue || '0'));
      break;
    default:
      result = BigInt(absValue || '0');
  }

  return isNegative ? -result : result;
}

/**
 * 根据位宽限制数值范围（有符号）
 */
export function clampToBitWidth(value: bigint, bitWidth: BitWidth): bigint {
  const max = (1n << BigInt(bitWidth - 1)) - 1n;
  const min = -(1n << BigInt(bitWidth - 1));

  if (value > max) {
    // 溢出处理：wrap around
    const range = 1n << BigInt(bitWidth);
    return ((value - min) % range) + min;
  }
  if (value < min) {
    const range = 1n << BigInt(bitWidth);
    return max - ((min - value - 1n) % range);
  }

  return value;
}

/**
 * 位运算
 */
export function bitwiseAnd(a: bigint, b: bigint): bigint {
  return a & b;
}

export function bitwiseOr(a: bigint, b: bigint): bigint {
  return a | b;
}

export function bitwiseXor(a: bigint, b: bigint): bigint {
  return a ^ b;
}

export function bitwiseNot(value: bigint, bitWidth: BitWidth): bigint {
  const mask = (1n << BigInt(bitWidth)) - 1n;
  return ~value & mask;
}

export function leftShift(value: bigint, bits: bigint): bigint {
  return value << bits;
}

export function rightShift(value: bigint, bits: bigint): bigint {
  return value >> bits;
}

/**
 * 获取数值的二进制位数组（用于可视化）
 */
export function getBits(value: bigint, bitWidth: BitWidth): boolean[] {
  const bits: boolean[] = [];
  const mask = 1n;

  for (let i = 0; i < bitWidth; i++) {
    bits.unshift(((value >> BigInt(i)) & mask) === 1n);
  }

  return bits;
}

/**
 * 根据位数组设置数值
 */
export function setBits(bits: boolean[]): bigint {
  let value = 0n;

  for (let i = 0; i < bits.length; i++) {
    if (bits[i]) {
      value |= 1n << BigInt(bits.length - 1 - i);
    }
  }

  return value;
}

/**
 * 切换指定位
 */
export function toggleBit(
  value: bigint,
  bitIndex: number,
  bitWidth: BitWidth
): bigint {
  const mask = 1n << BigInt(bitWidth - 1 - bitIndex);
  return value ^ mask;
}

/**
 * 格式化二进制显示（每4位一组）
 */
export function formatBinary(value: string): string {
  const reversed = value.split('').reverse();
  const groups: string[] = [];

  for (let i = 0; i < reversed.length; i += 4) {
    groups.push(
      reversed
        .slice(i, i + 4)
        .reverse()
        .join('')
    );
  }

  return groups.reverse().join(' ');
}

/**
 * 格式化十六进制显示（每2位一组）
 */
export function formatHex(value: string): string {
  if (value.length <= 2) return value;

  const reversed = value.split('').reverse();
  const groups: string[] = [];

  for (let i = 0; i < reversed.length; i += 2) {
    groups.push(
      reversed
        .slice(i, i + 2)
        .reverse()
        .join('')
    );
  }

  return groups.reverse().join(' ');
}

/**
 * 验证输入字符是否对当前进制有效
 */
export function isValidChar(char: string, base: NumberBase): boolean {
  switch (base) {
    case 'BIN':
      return /^[01]$/.test(char);
    case 'OCT':
      return /^[0-7]$/.test(char);
    case 'DEC':
      return /^[0-9]$/.test(char);
    case 'HEX':
      return /^[0-9A-Fa-f]$/.test(char);
    default:
      return false;
  }
}
