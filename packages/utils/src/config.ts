/**
 * 环境配置工具
 * 用于读取和管理不同环境的配置
 */

export interface AppConfig {
  // 应用信息
  appName: string
  webUrl: string
  apiUrl: string

  // 端口配置
  apiPort: number
  webPort: number

  // 其他配置
  corsOrigins: string[]
  enableRegistration: boolean
  enableComments: boolean
  enableLikes: boolean
  enableEmailVerification: boolean
}

/**
 * 从环境变量读取配置
 */
export function getConfig(): AppConfig {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    // 应用信息
    appName: process.env.APP_NAME || 'Whispers of the Heart',
    webUrl: process.env.WEB_URL || (isProduction ? 'https://whispers.local' : 'http://localhost:8888'),
    apiUrl: process.env.API_URL || (isProduction ? 'https://api.whispers.local' : 'http://localhost:7777'),

    // 端口配置
    apiPort: parseInt(process.env.API_PORT || '7777'),
    webPort: parseInt(process.env.WEB_PORT || '8888'),

    // 其他配置
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      isProduction ? 'https://whispers.local' : 'http://localhost:8888',
    ],
    enableRegistration: process.env.ENABLE_REGISTRATION === 'true',
    enableComments: process.env.ENABLE_COMMENTS === 'true',
    enableLikes: process.env.ENABLE_LIKES === 'true',
    enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  }
}

/**
 * 获取API基础URL
 */
export function getApiUrl(): string {
  return getConfig().apiUrl
}

/**
 * 获取Web URL
 */
export function getWebUrl(): string {
  return getConfig().webUrl
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}
