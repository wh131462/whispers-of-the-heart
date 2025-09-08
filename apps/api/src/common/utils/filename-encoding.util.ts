/**
 * 文件名编码处理工具
 * 修复多种场景下的中文文件名乱码问题
 */

/**
 * 修复文件名编码问题
 * @param filename 原始文件名
 * @returns 修复后的文件名
 */
export function fixFilenameEncoding(filename: string): string {
  if (!filename) return filename;

  try {
    // 检查是否包含乱码字符
    if (filename.includes('�')) {
      // 包含替换字符，尝试重新解码
      return Buffer.from(filename, 'latin1').toString('utf8');
    }

    // 检查是否是错误的 latin1 编码
    const utf8Test = Buffer.from(filename, 'latin1').toString('utf8');
    // 如果转换后的字符串看起来更像正常的中文，则使用转换后的
    if (containsChinese(utf8Test) && !containsChinese(filename)) {
      return utf8Test;
    }

    // 尝试不同的编码方式
    const encodings = ['utf8', 'gbk', 'gb2312'];
    for (const encoding of encodings) {
      try {
        const decoded = Buffer.from(filename, 'latin1').toString(encoding as BufferEncoding);
        if (decoded !== filename && containsChinese(decoded)) {
          return decoded;
        }
      } catch (e) {
        // 忽略编码错误，继续尝试下一个
        continue;
      }
    }

    return filename;
  } catch (error) {
    console.warn('Failed to fix filename encoding:', error);
    return filename;
  }
}

/**
 * 检查字符串是否包含中文字符
 * @param str 要检查的字符串
 * @returns 是否包含中文
 */
export function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fff]/.test(str);
}

/**
 * 安全的文件名处理，移除特殊字符
 * @param filename 文件名
 * @returns 安全的文件名
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return filename;

  // 先修复编码
  const fixed = fixFilenameEncoding(filename);

  // 移除或替换不安全的字符，但保留中文
  return fixed
    .replace(/[<>:"/\\|?*]/g, '_') // 替换Windows不允许的字符
    .replace(/\s+/g, '_') // 替换空格
    .replace(/_{2,}/g, '_') // 合并多个下划线
    .replace(/^_+|_+$/g, ''); // 移除开头和结尾的下划线
}

/**
 * 生成唯一的文件名，保持原始扩展名
 * @param originalName 原始文件名
 * @param timestamp 时间戳（可选）
 * @returns 唯一的文件名
 */
export function generateUniqueFilename(originalName: string, timestamp?: number): string {
  const fixed = fixFilenameEncoding(originalName);
  const ext = getFileExtension(fixed);
  const nameWithoutExt = getFilenameWithoutExtension(fixed);
  const uniqueSuffix = (timestamp || Date.now()) + '-' + Math.round(Math.random() * 1E9);
  
  // 安全化文件名，移除特殊字符但保留中文
  const safeName = nameWithoutExt
    .replace(/[<>:"/\\|?*]/g, '_') // 替换不安全字符
    .replace(/\s+/g, '_') // 替换空格
    .replace(/_{2,}/g, '_') // 合并多个下划线
    .replace(/^_+|_+$/g, ''); // 移除开头和结尾的下划线
  
  return `${uniqueSuffix}-${safeName}${ext}`;
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 扩展名（包含点）
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex);
}

/**
 * 获取不包含扩展名的文件名
 * @param filename 文件名
 * @returns 不包含扩展名的文件名
 */
export function getFilenameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
}

/**
 * 验证文件名是否有效
 * @param filename 文件名
 * @returns 是否有效
 */
export function isValidFilename(filename: string): boolean {
  if (!filename || filename.trim().length === 0) return false;
  
  // 检查是否包含不允许的字符
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(filename)) return false;
  
  // 检查是否是保留名称（Windows）
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(filename)) return false;
  
  return true;
}
