export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface Color {
  hex: string;
  rgb: RGB;
  hsl: HSL;
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl';

export interface PaletteColor {
  color: Color;
  name?: string;
}

export interface ContrastResult {
  ratio: number;
  aa: boolean;
  aaa: boolean;
  aaLarge: boolean;
  aaaLarge: boolean;
}
