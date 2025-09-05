// 时间格式化选项
export interface TimeFormatOptions {
  format?: 'relative' | 'absolute' | 'short' | 'long'
  locale?: string
  timezone?: string
}

// 相对时间格式化
export function formatRelativeTime(date: Date | string | number, options: TimeFormatOptions = {}): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)
  
  const { locale = 'zh-CN' } = options
  
  if (diffInSeconds < 60) {
    return '刚刚'
  }
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} 分钟前`
  }
  
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} 小时前`
  }
  
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} 天前`
  }
  
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months} 个月前`
  }
  
  const years = Math.floor(diffInSeconds / 31536000)
  return `${years} 年前`
}

// 绝对时间格式化
export function formatAbsoluteTime(date: Date | string | number, options: TimeFormatOptions = {}): string {
  const targetDate = new Date(date)
  const { format = 'short', locale = 'zh-CN' } = options
  
  if (format === 'short') {
    return targetDate.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
  
  if (format === 'long') {
    return targetDate.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  return targetDate.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 智能时间格式化
export function formatTime(date: Date | string | number, options: TimeFormatOptions = {}): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // 如果是今天，显示相对时间
  if (diffInDays === 0) {
    return formatRelativeTime(date, options)
  }
  
  // 如果是昨天，显示"昨天"
  if (diffInDays === 1) {
    return '昨天'
  }
  
  // 如果是一周内，显示星期几
  if (diffInDays < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[targetDate.getDay()]
  }
  
  // 其他情况显示绝对时间
  return formatAbsoluteTime(date, { ...options, format: 'short' })
}

// 格式化持续时间（秒数转换为可读格式）
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`
  }
  
  const hours = Math.floor(seconds / 3600)
  const remainingMinutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (remainingMinutes === 0 && remainingSeconds === 0) {
    return `${hours}小时`
  }
  
  if (remainingSeconds === 0) {
    return `${hours}小时${remainingMinutes}分钟`
  }
  
  return `${hours}小时${remainingMinutes}分${remainingSeconds}秒`
}

// 获取时间范围
export function getTimeRange(range: 'today' | 'yesterday' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)
  
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'yesterday':
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() - 1)
      end.setHours(23, 59, 59, 999)
      break
    case 'week':
      const dayOfWeek = start.getDay()
      start.setDate(start.getDate() - dayOfWeek)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() + (6 - dayOfWeek))
      end.setHours(23, 59, 59, 999)
      break
    case 'month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(11, 31)
      end.setHours(23, 59, 59, 999)
      break
  }
  
  return { start, end }
}
