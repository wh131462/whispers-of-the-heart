import IP2Region from 'ip2region';

// IP2Region 实例（单例）
let ip2region: IP2Region | null = null;

// 初始化标志
let initialized = false;
let initError: Error | null = null;

/**
 * 初始化 IP2Region
 */
function initIP2Region(): void {
  if (initialized) return;

  try {
    ip2region = new IP2Region();
    initialized = true;
  } catch (error) {
    initError = error as Error;
    initialized = true;
    console.warn('[IP2Region] 初始化失败:', error);
  }
}

export interface IPLocation {
  country: string;   // 国家
  province: string;  // 省份
  city: string;      // 城市
  isp: string;       // 运营商
  formatted: string; // 格式化输出，如 "北京" 或 "广东广州"
}

/**
 * 解析 IP 地址获取归属地信息
 * @param ip IP 地址
 * @returns 归属地信息，解析失败返回 null
 */
export function parseIPLocation(ip: string | null | undefined): IPLocation | null {
  if (!ip || ip === 'unknown' || ip === '::1' || ip === '127.0.0.1') {
    return null;
  }

  // 处理 IPv6 格式的本地地址
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  // 内网 IP 直接返回
  if (isPrivateIP(ip)) {
    return {
      country: '中国',
      province: '',
      city: '内网',
      isp: '',
      formatted: '内网',
    };
  }

  // 延迟初始化
  initIP2Region();

  if (initError || !ip2region) {
    return null;
  }

  try {
    const result = ip2region.search(ip);

    if (!result) {
      return null;
    }

    // ip2region.search() 返回对象: { country, province, city, isp }
    const { country, province, city, isp } = result;

    // 格式化显示
    const formatted = formatLocation(country || '', province || '', city || '');

    return {
      country: country || '',
      province: province || '',
      city: city || '',
      isp: isp || '',
      formatted,
    };
  } catch {
    return null;
  }
}

/**
 * 格式化地理位置显示
 */
function formatLocation(country: string, province: string, city: string): string {
  // 清理 "0" 占位符
  province = province === '0' ? '' : province;
  city = city === '0' ? '' : city;

  // 非中国 IP，显示国家
  if (country && country !== '中国' && country !== '0') {
    return country;
  }

  // 直辖市：北京、上海、天津、重庆
  const municipalities = ['北京', '上海', '天津', '重庆'];
  if (municipalities.some(m => province?.includes(m))) {
    return province.replace('市', '');
  }

  // 省份 + 城市
  if (province && city) {
    // 如果城市名包含省份名，只显示城市
    if (city.includes(province.replace('省', ''))) {
      return city.replace('市', '');
    }
    // 简化显示：省份简称 + 城市
    const shortProvince = province.replace('省', '').replace('自治区', '').replace('壮族', '').replace('回族', '').replace('维吾尔', '');
    const shortCity = city.replace('市', '');
    return `${shortProvince}${shortCity}`;
  }

  // 只有省份
  if (province) {
    return province.replace('省', '').replace('自治区', '');
  }

  return '';
}

/**
 * 判断是否为内网 IP
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);

  if (parts.length !== 4) {
    return false;
  }

  // 10.0.0.0 - 10.255.255.255
  if (parts[0] === 10) return true;

  // 172.16.0.0 - 172.31.255.255
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0 - 192.168.255.255
  if (parts[0] === 192 && parts[1] === 168) return true;

  return false;
}
