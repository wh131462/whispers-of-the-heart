import type { CommonPattern } from '../types';

export const commonPatterns: CommonPattern[] = [
  {
    id: 'email',
    name: '邮箱',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    description: '匹配邮箱地址',
    flags: { global: true, ignoreCase: true },
  },
  {
    id: 'phone-cn',
    name: '中国手机号',
    pattern: '1[3-9]\\d{9}',
    description: '匹配中国大陆手机号',
    flags: { global: true },
  },
  {
    id: 'url',
    name: 'URL',
    pattern: "https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]+",
    description: '匹配 HTTP/HTTPS URL',
    flags: { global: true, ignoreCase: true },
  },
  {
    id: 'ipv4',
    name: 'IPv4地址',
    pattern:
      '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    description: '匹配 IPv4 地址',
    flags: { global: true },
  },
  {
    id: 'date-iso',
    name: 'ISO日期',
    pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])',
    description: '匹配 YYYY-MM-DD 格式日期',
    flags: { global: true },
  },
  {
    id: 'time-24h',
    name: '24小时时间',
    pattern: '(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?',
    description: '匹配 HH:MM 或 HH:MM:SS 格式',
    flags: { global: true },
  },
  {
    id: 'hex-color',
    name: '十六进制颜色',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    description: '匹配 #RGB 或 #RRGGBB',
    flags: { global: true, ignoreCase: true },
  },
  {
    id: 'chinese',
    name: '中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    description: '匹配中文字符',
    flags: { global: true },
  },
  {
    id: 'id-card-cn',
    name: '中国身份证',
    pattern:
      '[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]',
    description: '匹配18位身份证号',
    flags: { global: true },
  },
  {
    id: 'html-tag',
    name: 'HTML标签',
    pattern: '<([a-z][a-z0-9]*)\\b[^>]*>.*?<\\/\\1>',
    description: '匹配成对的HTML标签',
    flags: { global: true, ignoreCase: true, dotAll: true },
  },
  {
    id: 'number',
    name: '数字',
    pattern: '-?\\d+(?:\\.\\d+)?',
    description: '匹配整数或小数',
    flags: { global: true },
  },
  {
    id: 'word',
    name: '英文单词',
    pattern: '\\b[a-zA-Z]+\\b',
    description: '匹配英文单词',
    flags: { global: true },
  },
];
