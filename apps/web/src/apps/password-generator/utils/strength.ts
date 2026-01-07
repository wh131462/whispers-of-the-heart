import type { StrengthLevel, StrengthInfo, PasswordOptions } from '../types';

/**
 * 计算密码强度
 */
export function calculateStrength(
  password: string,
  _options: PasswordOptions
): StrengthInfo {
  if (!password) {
    return { level: 'weak', score: 0, label: '无密码' };
  }

  let score = 0;

  // 长度分数 (最高40分)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (password.length >= 24) score += 10;

  // 字符类型分数 (每种15分，最高60分)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password);

  if (hasLower) score += 15;
  if (hasUpper) score += 15;
  if (hasNumber) score += 15;
  if (hasSymbol) score += 15;

  // 熵值加分
  const uniqueChars = new Set(password).size;
  const uniqueRatio = uniqueChars / password.length;
  if (uniqueRatio > 0.8) score += 10;
  else if (uniqueRatio > 0.6) score += 5;

  // 重复字符扣分
  const repeats = password.length - uniqueChars;
  if (repeats > password.length / 2) score -= 10;

  // 确保分数在 0-100 范围内
  score = Math.max(0, Math.min(100, score));

  // 根据分数确定等级
  let level: StrengthLevel;
  let label: string;

  if (score < 20) {
    level = 'weak';
    label = '弱';
  } else if (score < 40) {
    level = 'fair';
    label = '一般';
  } else if (score < 60) {
    level = 'good';
    label = '良好';
  } else if (score < 80) {
    level = 'strong';
    label = '强';
  } else {
    level = 'excellent';
    label = '非常强';
  }

  return { level, score, label };
}

/**
 * 获取强度对应的颜色
 */
export function getStrengthColor(level: StrengthLevel): string {
  switch (level) {
    case 'weak':
      return 'bg-red-500';
    case 'fair':
      return 'bg-orange-500';
    case 'good':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-emerald-500';
    case 'excellent':
      return 'bg-cyan-500';
  }
}
