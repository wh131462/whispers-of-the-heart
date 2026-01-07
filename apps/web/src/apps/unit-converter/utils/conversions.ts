import type { UnitDef, ConversionPreview, UnitCategory } from '../types';
import { getUnitById, getCategoryById } from './units';

/**
 * 转换值
 */
export function convert(value: number, from: UnitDef, to: UnitDef): number {
  const baseValue = from.toBase(value);
  return to.fromBase(baseValue);
}

/**
 * 转换字符串值，处理精度
 */
export function convertString(
  value: string,
  categoryId: UnitCategory,
  fromUnitId: string,
  toUnitId: string
): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '';

  const fromUnit = getUnitById(categoryId, fromUnitId);
  const toUnit = getUnitById(categoryId, toUnitId);

  if (!fromUnit || !toUnit) return '';

  const result = convert(num, fromUnit, toUnit);

  // 格式化结果
  return formatResult(result);
}

/**
 * 格式化结果，智能处理精度
 */
export function formatResult(value: number): string {
  if (!isFinite(value)) return 'Error';

  const absValue = Math.abs(value);

  // 非常大或非常小的数使用科学计数法
  if (absValue >= 1e12 || (absValue < 1e-10 && absValue !== 0)) {
    return value.toExponential(6);
  }

  // 整数直接返回
  if (Number.isInteger(value) && absValue < 1e15) {
    return value.toLocaleString('en-US');
  }

  // 小数根据大小决定精度
  let precision: number;
  if (absValue >= 1000) {
    precision = 2;
  } else if (absValue >= 1) {
    precision = 6;
  } else if (absValue >= 0.001) {
    precision = 8;
  } else {
    precision = 10;
  }

  const formatted = parseFloat(value.toPrecision(precision));
  return formatted.toLocaleString('en-US', {
    maximumFractionDigits: 10,
  });
}

/**
 * 获取常用转换预览
 */
export function getConversionPreviews(
  categoryId: UnitCategory,
  fromUnitId: string,
  value: number = 1
): ConversionPreview[] {
  const category = getCategoryById(categoryId);
  if (!category) return [];

  const fromUnit = getUnitById(categoryId, fromUnitId);
  if (!fromUnit) return [];

  return category.units
    .filter(u => u.id !== fromUnitId)
    .slice(0, 5) // 最多显示5个
    .map(toUnit => {
      const result = convert(value, fromUnit, toUnit);
      return {
        fromUnit: fromUnit.symbol,
        toUnit: toUnit.symbol,
        ratio: `${formatResult(value)} ${fromUnit.symbol} = ${formatResult(result)} ${toUnit.symbol}`,
      };
    });
}
