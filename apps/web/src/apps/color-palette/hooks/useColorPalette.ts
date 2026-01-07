import { useState, useCallback, useMemo } from 'react';
import type { Color, ColorFormat } from '../types';
import {
  createColor,
  createColorFromRgb,
  createColorFromHsl,
  isValidHex,
  formatColor,
} from '../utils/convert';
import { checkContrast, getContrastingColor } from '../utils/contrast';
import {
  getComplementary,
  getTriadic,
  getAnalogous,
  getSplitComplementary,
  getTetradic,
  getMonochromatic,
} from '../utils/palette';

const DEFAULT_COLOR = '#10B981'; // emerald-500

export function useColorPalette() {
  const [color, setColor] = useState<Color>(createColor(DEFAULT_COLOR));
  const [compareColor, setCompareColor] = useState<Color>(
    createColor('#FFFFFF')
  );
  const [format, setFormat] = useState<ColorFormat>('hex');
  const [history, setHistory] = useState<Color[]>([]);
  const [copied, setCopied] = useState(false);

  // 设置主颜色
  const setMainColor = useCallback((newColor: Color) => {
    setColor(prev => {
      // 添加到历史记录（去重）
      if (prev.hex !== newColor.hex) {
        setHistory(h => {
          const filtered = h.filter(c => c.hex !== prev.hex);
          return [prev, ...filtered].slice(0, 10);
        });
      }
      return newColor;
    });
  }, []);

  // 从HEX设置颜色
  const setColorFromHex = useCallback(
    (hex: string) => {
      if (isValidHex(hex)) {
        setMainColor(createColor(hex));
      }
    },
    [setMainColor]
  );

  // 从RGB设置颜色
  const setColorFromRgb = useCallback(
    (r: number, g: number, b: number) => {
      setMainColor(createColorFromRgb({ r, g, b }));
    },
    [setMainColor]
  );

  // 从HSL设置颜色
  const setColorFromHsl = useCallback(
    (h: number, s: number, l: number) => {
      setMainColor(createColorFromHsl({ h, s, l }));
    },
    [setMainColor]
  );

  // 复制颜色值
  const copyColor = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatColor(color, format));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败时静默处理
    }
  }, [color, format]);

  // 生成随机颜色
  const randomColor = useCallback(() => {
    const hex =
      '#' +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0');
    setMainColor(createColor(hex));
  }, [setMainColor]);

  // 对比度结果
  const contrastResult = useMemo(() => {
    return checkContrast(color.rgb, compareColor.rgb);
  }, [color, compareColor]);

  // 调色板方案
  const palettes = useMemo(() => {
    return {
      complementary: [color, getComplementary(color)],
      triadic: getTriadic(color),
      analogous: getAnalogous(color),
      splitComplementary: getSplitComplementary(color),
      tetradic: getTetradic(color),
      monochromatic: getMonochromatic(color),
    };
  }, [color]);

  // 获取对比文字颜色
  const textColor = useMemo(() => {
    return getContrastingColor(color.rgb);
  }, [color]);

  // 格式化的颜色值
  const formattedValues = useMemo(() => {
    return {
      hex: formatColor(color, 'hex'),
      rgb: formatColor(color, 'rgb'),
      hsl: formatColor(color, 'hsl'),
    };
  }, [color]);

  return {
    color,
    compareColor,
    format,
    history,
    copied,
    contrastResult,
    palettes,
    textColor,
    formattedValues,
    setColorFromHex,
    setColorFromRgb,
    setColorFromHsl,
    setMainColor,
    setCompareColor,
    setFormat,
    copyColor,
    randomColor,
  };
}
