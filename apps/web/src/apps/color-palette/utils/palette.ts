import type { Color, HSL } from '../types';
import { createColorFromHsl } from './convert';

/**
 * 生成互补色
 */
export function getComplementary(color: Color): Color {
  const hsl: HSL = {
    h: (color.hsl.h + 180) % 360,
    s: color.hsl.s,
    l: color.hsl.l,
  };
  return createColorFromHsl(hsl);
}

/**
 * 生成三等分色
 */
export function getTriadic(color: Color): Color[] {
  return [
    color,
    createColorFromHsl({
      h: (color.hsl.h + 120) % 360,
      s: color.hsl.s,
      l: color.hsl.l,
    }),
    createColorFromHsl({
      h: (color.hsl.h + 240) % 360,
      s: color.hsl.s,
      l: color.hsl.l,
    }),
  ];
}

/**
 * 生成类似色
 */
export function getAnalogous(color: Color, angle = 30): Color[] {
  return [
    createColorFromHsl({
      h: (color.hsl.h - angle + 360) % 360,
      s: color.hsl.s,
      l: color.hsl.l,
    }),
    color,
    createColorFromHsl({
      h: (color.hsl.h + angle) % 360,
      s: color.hsl.s,
      l: color.hsl.l,
    }),
  ];
}

/**
 * 生成分裂互补色
 */
export function getSplitComplementary(color: Color): Color[] {
  return [
    color,
    createColorFromHsl({
      h: (color.hsl.h + 150) % 360,
      s: color.hsl.s,
      l: color.hsl.l,
    }),
    createColorFromHsl({
      h: (color.hsl.h + 210) % 360,
      s: color.hsl.s,
      l: color.hsl.l,
    }),
  ];
}

/**
 * 生成四等分色
 */
export function getTetradic(color: Color): Color[] {
  return [
    color,
    createColorFromHsl({
      h: (color.hsl.h + 90) % 360,
      s: color.hsl.s,
      l: color.hsl.l,
    }),
    createColorFromHsl({
      h: (color.hsl.h + 180) % 360,
      s: color.hsl.s,
      l: color.hsl.l,
    }),
    createColorFromHsl({
      h: (color.hsl.h + 270) % 360,
      s: color.hsl.s,
      l: color.hsl.l,
    }),
  ];
}

/**
 * 生成单色调色板（不同明度）
 */
export function getMonochromatic(color: Color, count = 5): Color[] {
  const colors: Color[] = [];
  const step = 100 / (count + 1);

  for (let i = 1; i <= count; i++) {
    colors.push(
      createColorFromHsl({
        h: color.hsl.h,
        s: color.hsl.s,
        l: Math.round(step * i),
      })
    );
  }

  return colors;
}

/**
 * 生成渐变色
 */
export function getGradientColors(
  startColor: Color,
  endColor: Color,
  steps = 5
): Color[] {
  const colors: Color[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const hsl: HSL = {
      h: Math.round(
        startColor.hsl.h + (endColor.hsl.h - startColor.hsl.h) * ratio
      ),
      s: Math.round(
        startColor.hsl.s + (endColor.hsl.s - startColor.hsl.s) * ratio
      ),
      l: Math.round(
        startColor.hsl.l + (endColor.hsl.l - startColor.hsl.l) * ratio
      ),
    };
    colors.push(createColorFromHsl(hsl));
  }

  return colors;
}

/**
 * 调整颜色亮度
 */
export function adjustLightness(color: Color, amount: number): Color {
  return createColorFromHsl({
    h: color.hsl.h,
    s: color.hsl.s,
    l: Math.max(0, Math.min(100, color.hsl.l + amount)),
  });
}

/**
 * 调整颜色饱和度
 */
export function adjustSaturation(color: Color, amount: number): Color {
  return createColorFromHsl({
    h: color.hsl.h,
    s: Math.max(0, Math.min(100, color.hsl.s + amount)),
    l: color.hsl.l,
  });
}
