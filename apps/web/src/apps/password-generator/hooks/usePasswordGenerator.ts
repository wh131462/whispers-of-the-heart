import { useState, useCallback, useMemo } from 'react';
import type { PasswordOptions } from '../types';
import { generatePassword } from '../utils/generate';
import { calculateStrength } from '../utils/strength';

const defaultOptions: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

export function usePasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>(defaultOptions);
  const [password, setPassword] = useState<string>(() =>
    generatePassword(defaultOptions)
  );
  const [copied, setCopied] = useState(false);

  // 计算强度
  const strength = useMemo(
    () => calculateStrength(password, options),
    [password, options]
  );

  // 生成新密码
  const regenerate = useCallback(() => {
    setPassword(generatePassword(options));
    setCopied(false);
  }, [options]);

  // 更新选项
  const updateOptions = useCallback(
    (newOptions: Partial<PasswordOptions>) => {
      const updated = { ...options, ...newOptions };

      // 确保至少有一种字符类型被选中
      if (
        !updated.uppercase &&
        !updated.lowercase &&
        !updated.numbers &&
        !updated.symbols
      ) {
        updated.lowercase = true;
      }

      setOptions(updated);
      setPassword(generatePassword(updated));
      setCopied(false);
    },
    [options]
  );

  // 设置长度
  const setLength = useCallback(
    (length: number) => {
      updateOptions({ length: Math.max(8, Math.min(128, length)) });
    },
    [updateOptions]
  );

  // 复制到剪贴板
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败时静默处理
    }
  }, [password]);

  return {
    password,
    options,
    strength,
    copied,
    regenerate,
    updateOptions,
    setLength,
    copyToClipboard,
  };
}
