/**
 * 格式化时间为 HH:MM:SS.ms 格式
 */
export function formatTime(ms: number, showMs = true): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(hours.toString().padStart(2, '0'));
  }

  parts.push(minutes.toString().padStart(2, '0'));
  parts.push(seconds.toString().padStart(2, '0'));

  let result = parts.join(':');

  if (showMs) {
    result += '.' + milliseconds.toString().padStart(2, '0');
  }

  return result;
}

/**
 * 格式化时间为简短格式 (用于显示剩余时间)
 */
export function formatTimeShort(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 解析时间字符串为毫秒
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);

  if (parts.length === 3) {
    // HH:MM:SS
    return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  } else if (parts.length === 2) {
    // MM:SS
    return (parts[0] * 60 + parts[1]) * 1000;
  } else if (parts.length === 1) {
    // SS
    return parts[0] * 1000;
  }

  return 0;
}

/**
 * 分钟转换为毫秒
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}
