// 请求配置接口
export interface RequestConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  withCredentials?: boolean
}

// 请求选项接口
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  signal?: AbortSignal
  params?: Record<string, any>
}

// 响应接口
export interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
  ok: boolean
}

// 错误接口
export interface ApiError {
  message: string
  status?: number
  statusText?: string
  data?: any
}

// 环境变量接口
export interface EnvConfig {
  VITE_API_URL?: string
  VITE_WEB_URL?: string
  VITE_ADMIN_URL?: string
  NODE_ENV?: string
}

// 获取环境变量
function getEnv(): EnvConfig {
  // 前端环境 (浏览器)
  if (typeof window !== 'undefined') {
    try {
      return (import.meta as any)?.env || {}
    } catch (error) {
      return {}
    }
  }
  
  // 后端环境 (Node.js)
  if (typeof process !== 'undefined') {
    return process.env as EnvConfig
  }
  
  return {}
}

// 获取API基础URL
function getApiBaseUrl(): string {
  const env = getEnv()
  
  // 优先使用环境变量配置的API URL
  if (env.VITE_API_URL) {
    return env.VITE_API_URL
  }
  
  // 如果没有配置，根据环境判断
  const isDev = env.NODE_ENV === 'development' || 
                (typeof window !== 'undefined' && env.NODE_ENV !== 'production')
  
  if (isDev) {
    return 'http://localhost:7777'
  }
  
  return 'https://api.whispers.local'
}

// 获取完整URL（支持相对路径和绝对路径）
export function getFullUrl(url: string, baseUrl?: string): string {
  // 如果是完整的URL（包含协议），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 如果是相对路径，拼接基础URL
  const base = baseUrl || getApiBaseUrl()

  // 确保URL以/开头，base不以/结尾
  const cleanBase = base.replace(/\/$/, '')
  const cleanUrl = url.startsWith('/') ? url : `/${url}`
  const apiAttr = "/api/v1";// 中缀补充
  return `${cleanBase}${apiAttr}${cleanUrl}`
}

// 默认配置
const defaultConfig: RequestConfig = {
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
}

// 创建请求实例
export class ApiClient {
  private config: RequestConfig

  constructor(config: RequestConfig = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // 设置默认配置
  setConfig(config: Partial<RequestConfig>) {
    this.config = { ...this.config, ...config }
  }

  // 设置认证头
  setAuthToken(token: string) {
    this.config.headers = {
      ...this.config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  // 移除认证头
  removeAuthToken() {
    if (this.config.headers) {
      delete this.config.headers.Authorization
    }
  }

  // 基础请求方法
  async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, timeout, signal, params } = options

    // 处理查询参数
    let finalUrl = url
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString
      }
    }

    // 构建完整 URL - 支持完整URL和相对路径
    const fullUrl = getFullUrl(finalUrl, this.config.baseURL)
    
    // 合并请求头
    const requestHeaders = {
      ...this.config.headers,
      ...headers,
    }

    // 创建请求配置
    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: this.config.withCredentials ? 'include' : 'same-origin',
      signal,
    }

    // 添加请求体
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        // 删除Content-Type头，让浏览器自动设置
        if (requestConfig.headers && 'Content-Type' in requestConfig.headers) {
          delete (requestConfig.headers as any)['Content-Type']
        }
        requestConfig.body = body
      } else if (typeof body === 'string') {
        // body已经是字符串，直接使用
        requestConfig.body = body
      } else {
        // body是对象，需要JSON编码
        requestConfig.body = JSON.stringify(body)
      }
    }

    // 创建超时控制器
    let timeoutId: NodeJS.Timeout | undefined
    if (timeout || this.config.timeout) {
      const controller = new AbortController()
      timeoutId = setTimeout(() => controller.abort(), timeout || this.config.timeout)
      requestConfig.signal = controller.signal
    }

    try {
      const response = await fetch(fullUrl, requestConfig)
      
      // 清理超时定时器
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // 检查响应状态
      if (!response.ok) {
        // 尝试解析错误响应
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            if (errorData.message) {
              // 如果message是数组，取第一个元素
              if (Array.isArray(errorData.message)) {
                errorMessage = errorData.message[0]
              } else {
                errorMessage = errorData.message
              }
            }
          }
        } catch (parseError) {
          // 如果解析失败，使用默认错误信息
          console.warn('Failed to parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      // 解析响应数据
      let data: T
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text() as T
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        ok: response.ok,
      }
    } catch (error) {
      // 清理超时定时器
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('请求超时')
        }
        throw error
      }
      
      throw new Error('网络请求失败')
    }
  }

  // GET 请求
  async get<T = any>(url: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(url, { ...options, method: 'GET' })
  }

  // POST 请求
  async post<T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(url, { ...options, method: 'POST', body: data })
  }

  // PUT 请求
  async put<T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(url, { ...options, method: 'PUT', body: data })
  }

  // DELETE 请求
  async delete<T = any>(url: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  }

  // PATCH 请求
  async patch<T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(url, { ...options, method: 'PATCH', body: data })
  }

  // 设置认证token
  setToken(token: string) {
    this.setAuthToken(token)
  }

  // 清除认证token
  clearToken() {
    this.removeAuthToken()
  }

  // 从localStorage自动获取token
  setTokenFromStorage(storageKey: string = 'admin_token') {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = window.localStorage.getItem(storageKey)
      if (token) {
        this.setAuthToken(token)
      }
    }
  }
}

// 创建默认实例
export const apiClient = new ApiClient()

// 便捷方法
export const api = {
  get: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    apiClient.get<T>(url, options),
  post: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient.post<T>(url, data, options),
  put: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient.put<T>(url, data, options),
  delete: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    apiClient.delete<T>(url, options),
  patch: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient.patch<T>(url, data, options),
}

// 便捷的request函数，用于向后兼容
export const request = async <T = any>(
  url: string,
  options: RequestOptions & { params?: Record<string, any> } = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> => {
  try {
    // 处理查询参数
    if (options.params) {
      const searchParams = new URLSearchParams()
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString
      }
      delete options.params
    }

    const response = await apiClient.request<T>(url, options)
    
    // 检查响应格式，适配API响应格式
    if (response.data && typeof response.data === 'object') {
      const apiResponse = response.data as any
      if ('success' in apiResponse) {
        return apiResponse
      }
    }
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error('Request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '请求失败',
    }
  }
}

// 设置全局API客户端的认证token
export const setAuthToken = (token: string) => {
  apiClient.setAuthToken(token)
}

// 移除全局API客户端的认证token
export const removeAuthToken = () => {
  apiClient.removeAuthToken()
}

// 从localStorage设置token
export const setTokenFromStorage = (storageKey: string = 'auth_token') => {
  apiClient.setTokenFromStorage(storageKey)
}

// 创建新的API客户端实例
export const createApiClient = (config?: RequestConfig) => {
  return new ApiClient(config)
}

// 获取环境信息的工具函数
export const getEnvironment = () => {
  const env = getEnv()
  return {
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    apiUrl: env.VITE_API_URL,
    webUrl: env.VITE_WEB_URL,
    adminUrl: env.VITE_ADMIN_URL,
  }
}
