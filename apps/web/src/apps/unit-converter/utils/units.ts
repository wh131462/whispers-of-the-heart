import type { CategoryDef, UnitCategory } from '../types';

// 长度单位 (基准: 米)
const lengthUnits: CategoryDef = {
  id: 'length',
  name: '长度',
  icon: 'Ruler',
  baseUnit: 'm',
  units: [
    {
      id: 'mm',
      name: '毫米',
      symbol: 'mm',
      toBase: v => v / 1000,
      fromBase: v => v * 1000,
    },
    {
      id: 'cm',
      name: '厘米',
      symbol: 'cm',
      toBase: v => v / 100,
      fromBase: v => v * 100,
    },
    { id: 'm', name: '米', symbol: 'm', toBase: v => v, fromBase: v => v },
    {
      id: 'km',
      name: '千米',
      symbol: 'km',
      toBase: v => v * 1000,
      fromBase: v => v / 1000,
    },
    {
      id: 'in',
      name: '英寸',
      symbol: 'in',
      toBase: v => v * 0.0254,
      fromBase: v => v / 0.0254,
    },
    {
      id: 'ft',
      name: '英尺',
      symbol: 'ft',
      toBase: v => v * 0.3048,
      fromBase: v => v / 0.3048,
    },
    {
      id: 'yd',
      name: '码',
      symbol: 'yd',
      toBase: v => v * 0.9144,
      fromBase: v => v / 0.9144,
    },
    {
      id: 'mi',
      name: '英里',
      symbol: 'mi',
      toBase: v => v * 1609.344,
      fromBase: v => v / 1609.344,
    },
    {
      id: 'nm',
      name: '海里',
      symbol: 'nm',
      toBase: v => v * 1852,
      fromBase: v => v / 1852,
    },
  ],
};

// 重量单位 (基准: 千克)
const weightUnits: CategoryDef = {
  id: 'weight',
  name: '重量',
  icon: 'Scale',
  baseUnit: 'kg',
  units: [
    {
      id: 'mg',
      name: '毫克',
      symbol: 'mg',
      toBase: v => v / 1000000,
      fromBase: v => v * 1000000,
    },
    {
      id: 'g',
      name: '克',
      symbol: 'g',
      toBase: v => v / 1000,
      fromBase: v => v * 1000,
    },
    { id: 'kg', name: '千克', symbol: 'kg', toBase: v => v, fromBase: v => v },
    {
      id: 't',
      name: '吨',
      symbol: 't',
      toBase: v => v * 1000,
      fromBase: v => v / 1000,
    },
    {
      id: 'oz',
      name: '盎司',
      symbol: 'oz',
      toBase: v => v * 0.0283495,
      fromBase: v => v / 0.0283495,
    },
    {
      id: 'lb',
      name: '磅',
      symbol: 'lb',
      toBase: v => v * 0.453592,
      fromBase: v => v / 0.453592,
    },
    {
      id: 'st',
      name: '英石',
      symbol: 'st',
      toBase: v => v * 6.35029,
      fromBase: v => v / 6.35029,
    },
  ],
};

// 温度单位 (特殊处理)
const temperatureUnits: CategoryDef = {
  id: 'temperature',
  name: '温度',
  icon: 'Thermometer',
  baseUnit: 'c',
  units: [
    { id: 'c', name: '摄氏度', symbol: '°C', toBase: v => v, fromBase: v => v },
    {
      id: 'f',
      name: '华氏度',
      symbol: '°F',
      toBase: v => ((v - 32) * 5) / 9,
      fromBase: v => (v * 9) / 5 + 32,
    },
    {
      id: 'k',
      name: '开尔文',
      symbol: 'K',
      toBase: v => v - 273.15,
      fromBase: v => v + 273.15,
    },
  ],
};

// 面积单位 (基准: 平方米)
const areaUnits: CategoryDef = {
  id: 'area',
  name: '面积',
  icon: 'Square',
  baseUnit: 'm2',
  units: [
    {
      id: 'mm2',
      name: '平方毫米',
      symbol: 'mm²',
      toBase: v => v / 1000000,
      fromBase: v => v * 1000000,
    },
    {
      id: 'cm2',
      name: '平方厘米',
      symbol: 'cm²',
      toBase: v => v / 10000,
      fromBase: v => v * 10000,
    },
    {
      id: 'm2',
      name: '平方米',
      symbol: 'm²',
      toBase: v => v,
      fromBase: v => v,
    },
    {
      id: 'km2',
      name: '平方千米',
      symbol: 'km²',
      toBase: v => v * 1000000,
      fromBase: v => v / 1000000,
    },
    {
      id: 'ha',
      name: '公顷',
      symbol: 'ha',
      toBase: v => v * 10000,
      fromBase: v => v / 10000,
    },
    {
      id: 'acre',
      name: '英亩',
      symbol: 'acre',
      toBase: v => v * 4046.86,
      fromBase: v => v / 4046.86,
    },
    {
      id: 'in2',
      name: '平方英寸',
      symbol: 'in²',
      toBase: v => v * 0.00064516,
      fromBase: v => v / 0.00064516,
    },
    {
      id: 'ft2',
      name: '平方英尺',
      symbol: 'ft²',
      toBase: v => v * 0.092903,
      fromBase: v => v / 0.092903,
    },
  ],
};

// 体积单位 (基准: 升)
const volumeUnits: CategoryDef = {
  id: 'volume',
  name: '体积',
  icon: 'Box',
  baseUnit: 'l',
  units: [
    {
      id: 'ml',
      name: '毫升',
      symbol: 'mL',
      toBase: v => v / 1000,
      fromBase: v => v * 1000,
    },
    { id: 'l', name: '升', symbol: 'L', toBase: v => v, fromBase: v => v },
    {
      id: 'm3',
      name: '立方米',
      symbol: 'm³',
      toBase: v => v * 1000,
      fromBase: v => v / 1000,
    },
    {
      id: 'gal',
      name: '加仑(美)',
      symbol: 'gal',
      toBase: v => v * 3.78541,
      fromBase: v => v / 3.78541,
    },
    {
      id: 'qt',
      name: '夸脱',
      symbol: 'qt',
      toBase: v => v * 0.946353,
      fromBase: v => v / 0.946353,
    },
    {
      id: 'pt',
      name: '品脱',
      symbol: 'pt',
      toBase: v => v * 0.473176,
      fromBase: v => v / 0.473176,
    },
    {
      id: 'cup',
      name: '杯',
      symbol: 'cup',
      toBase: v => v * 0.236588,
      fromBase: v => v / 0.236588,
    },
    {
      id: 'floz',
      name: '液盎司',
      symbol: 'fl oz',
      toBase: v => v * 0.0295735,
      fromBase: v => v / 0.0295735,
    },
  ],
};

// 速度单位 (基准: 米/秒)
const speedUnits: CategoryDef = {
  id: 'speed',
  name: '速度',
  icon: 'Gauge',
  baseUnit: 'ms',
  units: [
    {
      id: 'ms',
      name: '米/秒',
      symbol: 'm/s',
      toBase: v => v,
      fromBase: v => v,
    },
    {
      id: 'kmh',
      name: '千米/时',
      symbol: 'km/h',
      toBase: v => v / 3.6,
      fromBase: v => v * 3.6,
    },
    {
      id: 'mph',
      name: '英里/时',
      symbol: 'mph',
      toBase: v => v * 0.44704,
      fromBase: v => v / 0.44704,
    },
    {
      id: 'knot',
      name: '节',
      symbol: 'kn',
      toBase: v => v * 0.514444,
      fromBase: v => v / 0.514444,
    },
    {
      id: 'fts',
      name: '英尺/秒',
      symbol: 'ft/s',
      toBase: v => v * 0.3048,
      fromBase: v => v / 0.3048,
    },
    {
      id: 'mach',
      name: '马赫',
      symbol: 'Mach',
      toBase: v => v * 343,
      fromBase: v => v / 343,
    },
  ],
};

// 时间单位 (基准: 秒)
const timeUnits: CategoryDef = {
  id: 'time',
  name: '时间',
  icon: 'Clock',
  baseUnit: 's',
  units: [
    {
      id: 'ms',
      name: '毫秒',
      symbol: 'ms',
      toBase: v => v / 1000,
      fromBase: v => v * 1000,
    },
    { id: 's', name: '秒', symbol: 's', toBase: v => v, fromBase: v => v },
    {
      id: 'min',
      name: '分钟',
      symbol: 'min',
      toBase: v => v * 60,
      fromBase: v => v / 60,
    },
    {
      id: 'h',
      name: '小时',
      symbol: 'h',
      toBase: v => v * 3600,
      fromBase: v => v / 3600,
    },
    {
      id: 'd',
      name: '天',
      symbol: 'd',
      toBase: v => v * 86400,
      fromBase: v => v / 86400,
    },
    {
      id: 'wk',
      name: '周',
      symbol: 'wk',
      toBase: v => v * 604800,
      fromBase: v => v / 604800,
    },
    {
      id: 'mo',
      name: '月(30天)',
      symbol: 'mo',
      toBase: v => v * 2592000,
      fromBase: v => v / 2592000,
    },
    {
      id: 'yr',
      name: '年(365天)',
      symbol: 'yr',
      toBase: v => v * 31536000,
      fromBase: v => v / 31536000,
    },
  ],
};

// 数据单位 (基准: 字节)
const dataUnits: CategoryDef = {
  id: 'data',
  name: '数据',
  icon: 'HardDrive',
  baseUnit: 'b',
  units: [
    {
      id: 'bit',
      name: '比特',
      symbol: 'bit',
      toBase: v => v / 8,
      fromBase: v => v * 8,
    },
    { id: 'b', name: '字节', symbol: 'B', toBase: v => v, fromBase: v => v },
    {
      id: 'kb',
      name: '千字节',
      symbol: 'KB',
      toBase: v => v * 1024,
      fromBase: v => v / 1024,
    },
    {
      id: 'mb',
      name: '兆字节',
      symbol: 'MB',
      toBase: v => v * 1048576,
      fromBase: v => v / 1048576,
    },
    {
      id: 'gb',
      name: '吉字节',
      symbol: 'GB',
      toBase: v => v * 1073741824,
      fromBase: v => v / 1073741824,
    },
    {
      id: 'tb',
      name: '太字节',
      symbol: 'TB',
      toBase: v => v * 1099511627776,
      fromBase: v => v / 1099511627776,
    },
    {
      id: 'pb',
      name: '拍字节',
      symbol: 'PB',
      toBase: v => v * 1125899906842624,
      fromBase: v => v / 1125899906842624,
    },
  ],
};

// 所有分类
export const categories: CategoryDef[] = [
  lengthUnits,
  weightUnits,
  temperatureUnits,
  areaUnits,
  volumeUnits,
  speedUnits,
  timeUnits,
  dataUnits,
];

// 根据分类ID获取分类
export function getCategoryById(id: UnitCategory): CategoryDef | undefined {
  return categories.find(c => c.id === id);
}

// 根据分类和单位ID获取单位
export function getUnitById(categoryId: UnitCategory, unitId: string) {
  const category = getCategoryById(categoryId);
  return category?.units.find(u => u.id === unitId);
}
