import type { PasswordOptions } from '../types';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * 生成密码
 */
export function generatePassword(options: PasswordOptions): string {
  let charset = '';
  const requiredChars: string[] = [];

  if (options.uppercase) {
    let chars = UPPERCASE;
    if (options.excludeAmbiguous) {
      chars = chars.replace(/[OI]/g, '');
    }
    charset += chars;
    requiredChars.push(getRandomChar(chars));
  }

  if (options.lowercase) {
    let chars = LOWERCASE;
    if (options.excludeAmbiguous) {
      chars = chars.replace(/[l]/g, '');
    }
    charset += chars;
    requiredChars.push(getRandomChar(chars));
  }

  if (options.numbers) {
    let chars = NUMBERS;
    if (options.excludeAmbiguous) {
      chars = chars.replace(/[01]/g, '');
    }
    charset += chars;
    requiredChars.push(getRandomChar(chars));
  }

  if (options.symbols) {
    charset += SYMBOLS;
    requiredChars.push(getRandomChar(SYMBOLS));
  }

  // 如果没有选择任何字符集，默认使用小写字母
  if (charset.length === 0) {
    charset = LOWERCASE;
  }

  // 生成剩余的随机字符
  const remainingLength = Math.max(0, options.length - requiredChars.length);
  const randomChars: string[] = [];

  for (let i = 0; i < remainingLength; i++) {
    randomChars.push(getRandomChar(charset));
  }

  // 合并并打乱
  const allChars = [...requiredChars, ...randomChars];
  return shuffle(allChars).join('');
}

/**
 * 获取随机字符
 */
function getRandomChar(charset: string): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return charset[array[0] % charset.length];
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const j = array[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
