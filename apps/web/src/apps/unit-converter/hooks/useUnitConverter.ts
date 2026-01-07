import { useState, useCallback, useMemo } from 'react';
import type { UnitCategory, ConverterState } from '../types';
import { getCategoryById } from '../utils/units';
import { convertString, getConversionPreviews } from '../utils/conversions';

const initialState: ConverterState = {
  category: 'length',
  fromUnit: 'cm',
  toUnit: 'm',
  fromValue: '100',
  toValue: '',
};

export function useUnitConverter() {
  const [state, setState] = useState<ConverterState>(initialState);

  // 获取当前分类
  const currentCategory = useMemo(
    () => getCategoryById(state.category),
    [state.category]
  );

  // 计算转换结果
  const result = useMemo(() => {
    if (!state.fromValue) return '';
    return convertString(
      state.fromValue,
      state.category,
      state.fromUnit,
      state.toUnit
    );
  }, [state.fromValue, state.category, state.fromUnit, state.toUnit]);

  // 常用转换预览
  const previews = useMemo(() => {
    const value = parseFloat(state.fromValue) || 1;
    return getConversionPreviews(state.category, state.fromUnit, value);
  }, [state.category, state.fromUnit, state.fromValue]);

  // 切换分类
  const setCategory = useCallback((category: UnitCategory) => {
    const cat = getCategoryById(category);
    if (!cat) return;

    // 切换分类时重置单位为前两个
    const units = cat.units;
    setState(prev => ({
      ...prev,
      category,
      fromUnit: units[0]?.id || '',
      toUnit: units[1]?.id || units[0]?.id || '',
      fromValue: '1',
    }));
  }, []);

  // 设置源单位
  const setFromUnit = useCallback((unitId: string) => {
    setState(prev => ({
      ...prev,
      fromUnit: unitId,
      // 如果目标单位相同，自动交换
      toUnit: prev.toUnit === unitId ? prev.fromUnit : prev.toUnit,
    }));
  }, []);

  // 设置目标单位
  const setToUnit = useCallback((unitId: string) => {
    setState(prev => ({
      ...prev,
      toUnit: unitId,
      // 如果源单位相同，自动交换
      fromUnit: prev.fromUnit === unitId ? prev.toUnit : prev.fromUnit,
    }));
  }, []);

  // 设置输入值
  const setFromValue = useCallback((value: string) => {
    // 只允许数字和小数点
    if (value && !/^-?\d*\.?\d*$/.test(value)) return;
    setState(prev => ({ ...prev, fromValue: value }));
  }, []);

  // 交换单位
  const swapUnits = useCallback(() => {
    setState(prev => ({
      ...prev,
      fromUnit: prev.toUnit,
      toUnit: prev.fromUnit,
      fromValue: result || prev.fromValue,
    }));
  }, [result]);

  // 清空
  const clear = useCallback(() => {
    setState(prev => ({ ...prev, fromValue: '' }));
  }, []);

  return {
    state,
    result,
    currentCategory,
    previews,
    setCategory,
    setFromUnit,
    setToUnit,
    setFromValue,
    swapUnits,
    clear,
  };
}
