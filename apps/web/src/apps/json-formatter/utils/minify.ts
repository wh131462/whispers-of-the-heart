/**
 * 压缩JSON字符串（移除空白）
 */
export function minifyJson(input: string): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

/**
 * 计算压缩比例
 */
export function getCompressionRatio(
  original: string,
  minified: string
): number {
  if (original.length === 0) return 0;
  return Math.round((1 - minified.length / original.length) * 100);
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}
