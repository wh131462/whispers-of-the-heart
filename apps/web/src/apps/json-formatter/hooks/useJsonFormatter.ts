import { useState, useCallback, useMemo } from 'react';
import type { JsonState, ViewMode, IndentSize, TreeNode } from '../types';
import { formatJson } from '../utils/format';
import { validateJson } from '../utils/validate';
import { minifyJson } from '../utils/minify';

const initialState: JsonState = {
  input: '',
  output: '',
  error: null,
  viewMode: 'code',
  indentSize: 2,
  isValid: false,
  stats: null,
};

const SAMPLE_JSON = `{
  "name": "whispers",
  "version": "1.0.0",
  "features": ["calculator", "timer", "json-formatter"],
  "config": {
    "theme": "dark",
    "language": "zh-CN"
  }
}`;

export function useJsonFormatter() {
  const [state, setState] = useState<JsonState>(initialState);
  const [copied, setCopied] = useState(false);

  // 更新输入并验证
  const setInput = useCallback((input: string) => {
    const validation = validateJson(input);

    setState(prev => ({
      ...prev,
      input,
      isValid: validation.isValid,
      error: validation.error,
      stats: validation.stats,
      output: validation.isValid ? formatJson(input, prev.indentSize) : '',
    }));
  }, []);

  // 格式化
  const format = useCallback(() => {
    if (!state.input.trim()) return;

    try {
      const formatted = formatJson(state.input, state.indentSize);
      setState(prev => ({
        ...prev,
        input: formatted,
        output: formatted,
        error: null,
        isValid: true,
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        error: (e as Error).message,
        isValid: false,
      }));
    }
  }, [state.input, state.indentSize]);

  // 压缩
  const minify = useCallback(() => {
    if (!state.input.trim()) return;

    try {
      const minified = minifyJson(state.input);
      setState(prev => ({
        ...prev,
        input: minified,
        output: minified,
        error: null,
        isValid: true,
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        error: (e as Error).message,
        isValid: false,
      }));
    }
  }, [state.input]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async () => {
    if (!state.input) return;

    try {
      await navigator.clipboard.writeText(state.input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败时静默处理
    }
  }, [state.input]);

  // 清空
  const clear = useCallback(() => {
    setState(initialState);
  }, []);

  // 加载示例
  const loadSample = useCallback(() => {
    setInput(SAMPLE_JSON);
  }, [setInput]);

  // 设置视图模式
  const setViewMode = useCallback((viewMode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode }));
  }, []);

  // 设置缩进大小
  const setIndentSize = useCallback((indentSize: IndentSize) => {
    setState(prev => {
      if (prev.isValid && prev.input) {
        try {
          const formatted = formatJson(prev.input, indentSize);
          return { ...prev, indentSize, input: formatted, output: formatted };
        } catch {
          return { ...prev, indentSize };
        }
      }
      return { ...prev, indentSize };
    });
  }, []);

  // 构建树形结构
  const treeData = useMemo((): TreeNode | null => {
    if (!state.isValid || !state.input) return null;

    try {
      const parsed = JSON.parse(state.input);
      return buildTree('root', parsed);
    } catch {
      return null;
    }
  }, [state.input, state.isValid]);

  return {
    state,
    copied,
    treeData,
    setInput,
    format,
    minify,
    copyToClipboard,
    clear,
    loadSample,
    setViewMode,
    setIndentSize,
  };
}

/**
 * 构建树形节点
 */
function buildTree(key: string, value: unknown): TreeNode {
  if (value === null) {
    return { key, value, type: 'null' };
  }

  if (Array.isArray(value)) {
    return {
      key,
      value,
      type: 'array',
      children: value.map((item, index) => buildTree(String(index), item)),
      expanded: true,
    };
  }

  switch (typeof value) {
    case 'object':
      return {
        key,
        value,
        type: 'object',
        children: Object.entries(value as Record<string, unknown>).map(
          ([k, v]) => buildTree(k, v)
        ),
        expanded: true,
      };
    case 'string':
      return { key, value, type: 'string' };
    case 'number':
      return { key, value, type: 'number' };
    case 'boolean':
      return { key, value, type: 'boolean' };
    default:
      return { key, value, type: 'null' };
  }
}
