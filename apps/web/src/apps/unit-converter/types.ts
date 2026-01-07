// 单位分类
export type UnitCategory =
  | 'length'
  | 'weight'
  | 'temperature'
  | 'area'
  | 'volume'
  | 'speed'
  | 'time'
  | 'data';

// 单位定义
export interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  toBase: (value: number) => number; // 转换为基准单位
  fromBase: (value: number) => number; // 从基准单位转换
}

// 分类定义
export interface CategoryDef {
  id: UnitCategory;
  name: string;
  icon: string;
  baseUnit: string; // 基准单位 ID
  units: UnitDef[];
}

// 转换器状态
export interface ConverterState {
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  fromValue: string;
  toValue: string;
}

// 常用转换记录
export interface ConversionPreview {
  fromUnit: string;
  toUnit: string;
  ratio: string;
}
