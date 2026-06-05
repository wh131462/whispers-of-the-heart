export type ContrastCell = {
  value: number;
  percent: number;
};

function makeCells(values: number[]): ContrastCell[] {
  return values.map(v => ({
    value: v,
    percent: (v / 255) * 100,
  }));
}

// 暗对比度：聚焦低灰度区分能力（0-40 密集采样）
// 4 行 × 10 列 = 40 个值，整体从 1 到 40 线性递增
export const CONTRAST_DARK: ContrastCell[] = makeCells(
  Array.from({ length: 40 }, (_, i) => i + 1)
);

// 亮对比度：参考 bmcx 实现，聚焦高灰度区分能力（175-254 密集采样）
// 第一行步长 8，第二行 4，第三行 2，第四行 1，越靠后越密
export const CONTRAST_LIGHT: ContrastCell[] = makeCells([
  175, 183, 191, 199, 207, 215, 223, 231, 239, 247, 215, 219, 223, 227, 231,
  235, 239, 243, 247, 251, 235, 237, 239, 241, 243, 245, 247, 249, 251, 253,
  245, 246, 247, 248, 249, 250, 251, 252, 253, 254,
]);

// 文本颜色反相：背景较亮时返回深字，反之返回浅字
export function textColorForGrayscale(value: number): string {
  return value >= 128 ? '#1f1f1f' : '#f5f5f5';
}

export function grayscaleToHex(value: number): string {
  const hex = value.toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
}
