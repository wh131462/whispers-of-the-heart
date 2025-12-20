// 字符串截断选项
export interface TruncateOptions {
  length: number
  suffix?: string
  preserveWords?: boolean
}

// 截断字符串
export function truncate(str: string, options: TruncateOptions): string {
  const { length, suffix = '...', preserveWords = true } = options
  
  if (str.length <= length) {
    return str
  }
  
  if (preserveWords) {
    const truncated = str.substring(0, length)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    
    if (lastSpaceIndex > 0) {
      return truncated.substring(0, lastSpaceIndex) + suffix
    }
  }
  
  return str.substring(0, length) + suffix
}

// 生成随机字符串
export function randomString(length: number, charset?: string): string {
  const chars = charset || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

// 生成 slug（URL 友好的字符串）
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 将空格和下划线替换为连字符
    .replace(/^-+|-+$/g, '') // 移除首尾连字符
}

// 首字母大写
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// 每个单词首字母大写
export function titleCase(str: string): string {
  if (!str) return str
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ')
}

// 驼峰命名转连字符命名
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

// 连字符命名转驼峰命名
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

// 连字符命名转帕斯卡命名
export function kebabToPascal(str: string): string {
  const camel = kebabToCamel(str)
  return capitalize(camel)
}

// 帕斯卡命名转连字符命名
export function pascalToKebab(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化数字（添加千分位分隔符）
export function formatNumber(num: number, locale: string = 'zh-CN'): string {
  return num.toLocaleString(locale)
}

// 格式化百分比
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

// 掩码敏感信息
export function maskSensitiveInfo(str: string, type: 'email' | 'phone' | 'id' | 'custom' = 'custom'): string {
  if (!str) return str
  
  switch (type) {
    case 'email':
      const [username, domain] = str.split('@')
      if (username.length <= 2) return str
      return `${username.charAt(0)}***@${domain}`
    
    case 'phone':
      if (str.length < 7) return str
      return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    
    case 'id':
      if (str.length < 6) return str
      return str.replace(/(\d{3})\d+(\d{3})/, '$1***$2')
    
    default:
      if (str.length <= 2) return str
      return str.charAt(0) + '*'.repeat(str.length - 2) + str.charAt(str.length - 1)
  }
}

// 检查字符串是否为空或只包含空白字符
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0
}

// 检查字符串是否为有效的邮箱地址
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 检查字符串是否为有效的手机号码（中国大陆）
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 检查字符串是否为有效的身份证号码（中国大陆）
export function isValidIdCard(idCard: string): boolean {
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return idCardRegex.test(idCard)
}

/**
 * 移除 Markdown 格式，只保留纯文本
 * 用于生成摘要、搜索索引等场景
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return ''

  let text = markdown

  // 移除代码块（需要先处理，避免内部内容被其他规则影响）
  text = text.replace(/```[\s\S]*?```/g, '')
  text = text.replace(/`([^`]+)`/g, '$1')

  // 移除 HTML 标签
  text = text.replace(/<[^>]*>/g, '')

  // 移除图片 ![alt](url) 或 ![alt](url "title")
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')

  // 移除链接但保留文本 [text](url) 或 [text](url "title")
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // 移除引用链接 [text][ref]
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')

  // 移除引用链接定义 [ref]: url
  text = text.replace(/^\[[^\]]+\]:\s*.+$/gm, '')

  // 移除标题标记 # ## ### 等
  text = text.replace(/^#{1,6}\s+/gm, '')

  // 移除粗体 **text** 或 __text__
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')

  // 移除斜体 *text* 或 _text_（需要在粗体之后处理）
  text = text.replace(/\*([^*]+)\*/g, '$1')
  text = text.replace(/_([^_]+)_/g, '$1')

  // 移除删除线 ~~text~~
  text = text.replace(/~~([^~]+)~~/g, '$1')

  // 移除水平分割线 --- *** ___
  text = text.replace(/^[-*_]{3,}\s*$/gm, '')

  // 移除引用标记 >
  text = text.replace(/^>\s?/gm, '')

  // 移除无序列表标记 - * +
  text = text.replace(/^[\s]*[-*+]\s+/gm, '')

  // 移除有序列表标记 1. 2. 等
  text = text.replace(/^[\s]*\d+\.\s+/gm, '')

  // 移除任务列表标记 [ ] [x]
  text = text.replace(/\[[ xX]\]\s*/g, '')

  // 移除表格分隔符
  text = text.replace(/\|/g, ' ')
  text = text.replace(/^[\s]*[-:]+[\s]*$/gm, '')

  // 移除脚注 [^1] 及其定义
  text = text.replace(/\[\^[^\]]+\]/g, '')

  // 移除高亮 ==text==
  text = text.replace(/==([^=]+)==/g, '$1')

  // 移除上标 ^text^
  text = text.replace(/\^([^^]+)\^/g, '$1')

  // 移除下标 ~text~
  text = text.replace(/~([^~]+)~/g, '$1')

  // 清理多余的空白字符
  text = text.replace(/\n{3,}/g, '\n\n') // 多个连续换行变成两个
  text = text.replace(/[ \t]+/g, ' ') // 多个空格变成一个
  text = text.trim()

  return text
}

/**
 * 从 Markdown 生成摘要
 * @param markdown Markdown 内容
 * @param maxLength 最大长度，默认 200
 * @param suffix 后缀，默认 '...'
 */
export function generateExcerpt(markdown: string, maxLength: number = 200, suffix: string = '...'): string {
  const plainText = stripMarkdown(markdown)

  if (plainText.length <= maxLength) {
    return plainText
  }

  // 尝试在句子结束处截断
  const truncated = plainText.substring(0, maxLength)
  const sentenceEnd = truncated.lastIndexOf('。')
  const periodEnd = truncated.lastIndexOf('.')
  const questionEnd = truncated.lastIndexOf('？')
  const exclamationEnd = truncated.lastIndexOf('！')

  const lastEnd = Math.max(sentenceEnd, periodEnd, questionEnd, exclamationEnd)

  if (lastEnd > maxLength * 0.5) {
    return truncated.substring(0, lastEnd + 1)
  }

  // 尝试在单词/空格处截断
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + suffix
  }

  return truncated + suffix
}
