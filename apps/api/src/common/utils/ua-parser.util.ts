import { UAParser, IResult } from 'ua-parser-js';

export interface DeviceInfo {
  device: string;      // 设备类型，如 "iPhone", "Android", "Desktop"
  os: string;          // 操作系统，如 "iOS 17", "Windows 11"
  browser: string;     // 浏览器，如 "Chrome 120"
  formatted: string;   // 格式化输出，如 "iPhone · iOS"
}

/**
 * 解析 User-Agent 获取设备信息
 */
export function parseUserAgent(userAgent: string | null | undefined): DeviceInfo | null {
  if (!userAgent || userAgent === 'unknown') {
    return null;
  }

  try {
    const parser = new UAParser(userAgent);
    const result: IResult = parser.getResult();

    const device = getDeviceName(result);
    const os = getOSName(result);
    const browser = getBrowserName(result);
    const formatted = formatDeviceInfo(device, os);

    return {
      device,
      os,
      browser,
      formatted,
    };
  } catch {
    return null;
  }
}

/**
 * 获取设备名称
 */
function getDeviceName(result: IResult): string {
  // 优先使用设备型号
  if (result.device.model) {
    return result.device.model;
  }

  // 根据设备类型判断
  if (result.device.type === 'mobile') {
    // 尝试从 OS 判断移动设备
    if (result.os.name === 'iOS') return 'iPhone';
    if (result.os.name === 'Android') return 'Android';
    return 'Mobile';
  }

  if (result.device.type === 'tablet') {
    if (result.os.name === 'iOS') return 'iPad';
    return 'Tablet';
  }

  // 桌面设备
  if (result.os.name === 'Mac OS') return 'Mac';
  if (result.os.name === 'Windows') return 'Windows';
  if (result.os.name === 'Linux') return 'Linux';

  return 'Desktop';
}

/**
 * 获取操作系统名称
 */
function getOSName(result: IResult): string {
  if (!result.os.name) return '';

  const name = result.os.name;
  const version = result.os.version;

  // 简化版本号
  if (version) {
    const majorVersion = version.split('.')[0];
    return `${name} ${majorVersion}`;
  }

  return name;
}

/**
 * 获取浏览器名称
 */
function getBrowserName(result: IResult): string {
  if (!result.browser.name) return '';

  const name = result.browser.name;
  const version = result.browser.version;

  if (version) {
    const majorVersion = version.split('.')[0];
    return `${name} ${majorVersion}`;
  }

  return name;
}

/**
 * 格式化设备信息输出
 * 输出格式：设备 · 系统 或 仅设备
 */
function formatDeviceInfo(device: string, os: string): string {
  if (!os || device === os.split(' ')[0]) {
    // 如果没有系统信息，或设备名和系统名重复，只显示设备
    return device;
  }

  // 简化系统名称显示
  const simpleOS = os.replace(/\s+\d+$/, ''); // 移除版本号

  // 如果设备和系统相同（如 Windows/Windows），只显示一个
  if (device === simpleOS) {
    return device;
  }

  return `${device} · ${simpleOS}`;
}
