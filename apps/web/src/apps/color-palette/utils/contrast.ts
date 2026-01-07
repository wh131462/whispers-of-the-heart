import type { RGB, ContrastResult } from '../types';

/**
 * 计算相对亮度 (WCAG 2.1)
 */
export function getLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 计算对比度比率 (WCAG 2.1)
 */
export function getContrastRatio(rgb1: RGB, rgb2: RGB): number {
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 检查WCAG对比度合规性
 */
export function checkContrast(rgb1: RGB, rgb2: RGB): ContrastResult {
  const ratio = getContrastRatio(rgb1, rgb2);

  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5, // AA级别 - 正常文本
    aaa: ratio >= 7, // AAA级别 - 正常文本
    aaLarge: ratio >= 3, // AA级别 - 大文本
    aaaLarge: ratio >= 4.5, // AAA级别 - 大文本
  };
}

/**
 * 获取对比度等级标签
 */
export function getContrastLevel(ratio: number): string {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return '不合格';
}

/**
 * 根据背景色确定前景色（黑或白）
 */
export function getContrastingColor(rgb: RGB): 'black' | 'white' {
  const luminance = getLuminance(rgb);
  return luminance > 0.179 ? 'black' : 'white';
}
