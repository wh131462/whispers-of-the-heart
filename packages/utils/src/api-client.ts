import { apiClient, setAuthToken, removeAuthToken } from './request'

/**
 * 统一的 API 客户端配置
 * 提供拦截器、自动 token 管理等功能
 */

// Token 存储键
const TOKEN_KEYS = {
  WEB: 'auth_token',
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
}

// 全局错误处理器
type ErrorHandler = (error: Error, status?: number) => void
let globalErrorHandler: ErrorHandler | null = null

/**
 * 设置全局错误处理器
 */
export function setGlobalErrorHandler(handler: ErrorHandler) {
  globalErrorHandler = handler
}

/**
 * 初始化 API 客户端
 * 自动从 localStorage 加载 token
 */
export function initializeApiClient(tokenKey: string = TOKEN_KEYS.WEB) {
  if (typeof window === 'undefined') return

  // 尝试从多个可能的 key 加载 token
  const possibleKeys = [tokenKey, TOKEN_KEYS.WEB, TOKEN_KEYS.ACCESS]

  for (const key of possibleKeys) {
    const token = localStorage.getItem(key)
    if (token) {
      setAuthToken(token)
      console.log(`[API Client] Token loaded from ${key}`)
      break
    }
  }

  // 监听 token 变化
  setupTokenSync()

  // 监听未授权事件
  setupUnauthorizedHandler()
}

/**
 * 设置 token 同步
 * 当一个应用更新 token 时,同步到其他应用
 */
function setupTokenSync() {
  if (typeof window === 'undefined') return

  window.addEventListener('storage', (e) => {
    // 监听 token 变化
    if (e.key && Object.values(TOKEN_KEYS).includes(e.key)) {
      if (e.newValue) {
        setAuthToken(e.newValue)
        console.log(`[API Client] Token synced from ${e.key}`)
      } else {
        removeAuthToken()
        console.log(`[API Client] Token removed from ${e.key}`)
      }
    }
  })
}

/**
 * 设置未授权处理器
 * 当收到 401 响应时,清除 token 并触发登出
 */
function setupUnauthorizedHandler() {
  if (typeof window === 'undefined') return

  window.addEventListener('auth:unauthorized', () => {
    console.log('[API Client] Unauthorized, clearing tokens')
    clearAllTokens()

    // 触发全局错误处理
    if (globalErrorHandler) {
      globalErrorHandler(new Error('未授权,请重新登录'), 401)
    }

    // 重定向到登录页
    const currentPath = window.location.pathname
    if (!currentPath.includes('/login')) {
      window.location.href = '/login?redirect=' + encodeURIComponent(currentPath)
    }
  })
}

/**
 * 清除所有 token
 */
export function clearAllTokens() {
  if (typeof window === 'undefined') return

  Object.values(TOKEN_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
  removeAuthToken()
}

/**
 * 设置 token 到所有存储位置
 * 确保 web 和 admin 应用都能访问
 */
export function setTokenToAll(token: string) {
  if (typeof window === 'undefined') return

  // 设置到所有可能的 key
  localStorage.setItem(TOKEN_KEYS.WEB, token)
  localStorage.setItem(TOKEN_KEYS.ACCESS, token)

  // 设置到 API 客户端
  setAuthToken(token)
}

/**
 * 获取当前 token
 */
export function getCurrentToken(): string | null {
  if (typeof window === 'undefined') return null

  // 尝试从多个位置获取
  for (const key of Object.values(TOKEN_KEYS)) {
    const token = localStorage.getItem(key)
    if (token) return token
  }

  return null
}

/**
 * 检查是否已认证
 */
export function isAuthenticated(): boolean {
  return getCurrentToken() !== null
}

/**
 * 创建带有自动重试的请求
 */
export async function requestWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error as Error

      // 如果是 401 错误,不重试
      if (error instanceof Error && error.message.includes('401')) {
        throw error
      }

      // 最后一次重试失败,抛出错误
      if (i === maxRetries - 1) {
        throw error
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }

  throw lastError
}

/**
 * 批量请求
 */
export async function batchRequest<T>(
  requests: Array<() => Promise<T>>,
  concurrency: number = 5
): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<void>[] = []

  for (const request of requests) {
    const promise = request().then(result => {
      results.push(result)
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise), 1)
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * 导出配置好的 API 客户端
 */
export { apiClient, setAuthToken, removeAuthToken, TOKEN_KEYS }

/**
 * 导出便捷方法
 */
export const apiUtils = {
  initialize: initializeApiClient,
  setToken: setTokenToAll,
  clearTokens: clearAllTokens,
  getCurrentToken,
  isAuthenticated,
  setErrorHandler: setGlobalErrorHandler,
  requestWithRetry,
  batchRequest,
}

