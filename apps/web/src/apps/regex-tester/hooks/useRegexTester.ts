import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  RegexState,
  RegexFlags,
  MatchResult,
  CommonPattern,
} from '../types';

const initialFlags: RegexFlags = {
  global: true,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
};

const initialState: RegexState = {
  pattern: '',
  flags: initialFlags,
  testString: '',
  matches: [],
  error: null,
  isValid: true,
};

export function useRegexTester() {
  const [state, setState] = useState<RegexState>(initialState);

  // 构建标志字符串
  const flagsString = useMemo(() => {
    let flags = '';
    if (state.flags.global) flags += 'g';
    if (state.flags.ignoreCase) flags += 'i';
    if (state.flags.multiline) flags += 'm';
    if (state.flags.dotAll) flags += 's';
    if (state.flags.unicode) flags += 'u';
    return flags;
  }, [state.flags]);

  // 执行匹配
  useEffect(() => {
    if (!state.pattern) {
      setState(prev => ({
        ...prev,
        matches: [],
        error: null,
        isValid: true,
      }));
      return;
    }

    try {
      const regex = new RegExp(state.pattern, flagsString);
      const matches: MatchResult[] = [];

      if (state.testString) {
        if (state.flags.global) {
          let match;
          while ((match = regex.exec(state.testString)) !== null) {
            matches.push({
              match: match[0],
              index: match.index,
              length: match[0].length,
              groups: match.slice(1),
              namedGroups: match.groups,
            });

            // 防止空字符串匹配的无限循环
            if (match[0].length === 0) {
              regex.lastIndex++;
            }
          }
        } else {
          const match = regex.exec(state.testString);
          if (match) {
            matches.push({
              match: match[0],
              index: match.index,
              length: match[0].length,
              groups: match.slice(1),
              namedGroups: match.groups,
            });
          }
        }
      }

      setState(prev => ({
        ...prev,
        matches,
        error: null,
        isValid: true,
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        matches: [],
        error: (e as Error).message,
        isValid: false,
      }));
    }
  }, [state.pattern, state.testString, flagsString, state.flags.global]);

  // 设置正则表达式
  const setPattern = useCallback((pattern: string) => {
    setState(prev => ({ ...prev, pattern }));
  }, []);

  // 设置测试字符串
  const setTestString = useCallback((testString: string) => {
    setState(prev => ({ ...prev, testString }));
  }, []);

  // 设置单个标志
  const setFlag = useCallback((flag: keyof RegexFlags, value: boolean) => {
    setState(prev => ({
      ...prev,
      flags: { ...prev.flags, [flag]: value },
    }));
  }, []);

  // 设置所有标志
  const setFlags = useCallback((flags: Partial<RegexFlags>) => {
    setState(prev => ({
      ...prev,
      flags: { ...prev.flags, ...flags },
    }));
  }, []);

  // 应用常用正则
  const applyPattern = useCallback((pattern: CommonPattern) => {
    setState(prev => ({
      ...prev,
      pattern: pattern.pattern,
      flags: { ...initialFlags, ...pattern.flags },
    }));
  }, []);

  // 清空
  const clear = useCallback(() => {
    setState(initialState);
  }, []);

  // 生成高亮文本的片段
  const highlightedSegments = useMemo(() => {
    if (!state.testString || state.matches.length === 0) {
      return [{ text: state.testString, isMatch: false }];
    }

    const segments: Array<{ text: string; isMatch: boolean; index?: number }> =
      [];
    let lastIndex = 0;

    // 按位置排序匹配结果
    const sortedMatches = [...state.matches].sort((a, b) => a.index - b.index);

    for (let i = 0; i < sortedMatches.length; i++) {
      const match = sortedMatches[i];

      // 添加匹配前的文本
      if (match.index > lastIndex) {
        segments.push({
          text: state.testString.slice(lastIndex, match.index),
          isMatch: false,
        });
      }

      // 添加匹配的文本
      segments.push({
        text: match.match,
        isMatch: true,
        index: i,
      });

      lastIndex = match.index + match.length;
    }

    // 添加最后的文本
    if (lastIndex < state.testString.length) {
      segments.push({
        text: state.testString.slice(lastIndex),
        isMatch: false,
      });
    }

    return segments;
  }, [state.testString, state.matches]);

  return {
    state,
    flagsString,
    highlightedSegments,
    setPattern,
    setTestString,
    setFlag,
    setFlags,
    applyPattern,
    clear,
  };
}
