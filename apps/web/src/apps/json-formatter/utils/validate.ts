import type { JsonStats } from '../types';

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  errorPosition?: {
    line: number;
    column: number;
  };
  stats: JsonStats | null;
}

/**
 * 验证JSON字符串
 */
export function validateJson(input: string): ValidationResult {
  if (!input.trim()) {
    return {
      isValid: false,
      error: null,
      stats: null,
    };
  }

  try {
    const parsed = JSON.parse(input);
    const stats = analyzeJson(parsed);

    return {
      isValid: true,
      error: null,
      stats,
    };
  } catch (e) {
    const error = e as SyntaxError;
    const errorInfo = parseErrorPosition(error.message, input);

    return {
      isValid: false,
      error: error.message,
      errorPosition: errorInfo,
      stats: null,
    };
  }
}

/**
 * 分析JSON结构统计
 */
function analyzeJson(obj: unknown, depth = 0): JsonStats {
  const stats: JsonStats = {
    keys: 0,
    arrays: 0,
    objects: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    depth: depth,
  };

  function traverse(value: unknown, currentDepth: number) {
    stats.depth = Math.max(stats.depth, currentDepth);

    if (value === null) {
      stats.nulls++;
      return;
    }

    if (Array.isArray(value)) {
      stats.arrays++;
      value.forEach(item => traverse(item, currentDepth + 1));
      return;
    }

    switch (typeof value) {
      case 'object': {
        stats.objects++;
        const entries = Object.entries(value as Record<string, unknown>);
        stats.keys += entries.length;
        entries.forEach(([, v]) => traverse(v, currentDepth + 1));
        break;
      }
      case 'string':
        stats.strings++;
        break;
      case 'number':
        stats.numbers++;
        break;
      case 'boolean':
        stats.booleans++;
        break;
    }
  }

  traverse(obj, depth);
  return stats;
}

/**
 * 解析错误位置
 */
function parseErrorPosition(
  errorMessage: string,
  input: string
): { line: number; column: number } | undefined {
  // 尝试从错误消息中提取位置信息
  const posMatch = errorMessage.match(/position\s+(\d+)/i);
  if (posMatch) {
    const position = parseInt(posMatch[1], 10);
    return getLineAndColumn(input, position);
  }

  const lineMatch = errorMessage.match(/line\s+(\d+)/i);
  const colMatch = errorMessage.match(/column\s+(\d+)/i);
  if (lineMatch && colMatch) {
    return {
      line: parseInt(lineMatch[1], 10),
      column: parseInt(colMatch[1], 10),
    };
  }

  return undefined;
}

/**
 * 根据字符位置计算行列号
 */
function getLineAndColumn(
  input: string,
  position: number
): { line: number; column: number } {
  const lines = input.substring(0, position).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}
