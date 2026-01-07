import type { TimeFormat, CommonTimezone } from '../types';

// 格式化选项
export const timeFormats: TimeFormat[] = [
  {
    id: 'iso',
    label: 'ISO 8601',
    format: (date, timezone) => {
      return new Date(date)
        .toLocaleString('sv-SE', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        .replace(' ', 'T');
    },
  },
  {
    id: 'locale-full',
    label: '完整日期时间',
    format: (date, timezone) => {
      return new Date(date).toLocaleString('zh-CN', {
        timeZone: timezone,
        dateStyle: 'full',
        timeStyle: 'long',
      });
    },
  },
  {
    id: 'locale-short',
    label: '简短格式',
    format: (date, timezone) => {
      return new Date(date).toLocaleString('zh-CN', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    },
  },
  {
    id: 'date-only',
    label: '仅日期',
    format: (date, timezone) => {
      return new Date(date).toLocaleDateString('zh-CN', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    },
  },
  {
    id: 'time-only',
    label: '仅时间',
    format: (date, timezone) => {
      return new Date(date).toLocaleTimeString('zh-CN', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    },
  },
  {
    id: 'relative',
    label: '相对时间',
    format: date => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const absDiff = Math.abs(diff);
      const isPast = diff > 0;

      const seconds = Math.floor(absDiff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);

      let result: string;
      if (years > 0) {
        result = `${years} 年`;
      } else if (months > 0) {
        result = `${months} 个月`;
      } else if (days > 0) {
        result = `${days} 天`;
      } else if (hours > 0) {
        result = `${hours} 小时`;
      } else if (minutes > 0) {
        result = `${minutes} 分钟`;
      } else {
        result = `${seconds} 秒`;
      }

      return isPast ? `${result}前` : `${result}后`;
    },
  },
];

// 常用时区
export const commonTimezones: CommonTimezone[] = [
  { id: 'Asia/Shanghai', label: '北京时间', offset: 'UTC+8' },
  { id: 'Asia/Tokyo', label: '东京', offset: 'UTC+9' },
  { id: 'Asia/Singapore', label: '新加坡', offset: 'UTC+8' },
  { id: 'Asia/Hong_Kong', label: '香港', offset: 'UTC+8' },
  { id: 'Europe/London', label: '伦敦', offset: 'UTC+0' },
  { id: 'Europe/Paris', label: '巴黎', offset: 'UTC+1' },
  { id: 'Europe/Berlin', label: '柏林', offset: 'UTC+1' },
  { id: 'America/New_York', label: '纽约', offset: 'UTC-5' },
  { id: 'America/Los_Angeles', label: '洛杉矶', offset: 'UTC-8' },
  { id: 'America/Chicago', label: '芝加哥', offset: 'UTC-6' },
  { id: 'Pacific/Auckland', label: '奥克兰', offset: 'UTC+12' },
  { id: 'Australia/Sydney', label: '悉尼', offset: 'UTC+10' },
  { id: 'UTC', label: 'UTC', offset: 'UTC+0' },
];

// 获取本地时区
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
