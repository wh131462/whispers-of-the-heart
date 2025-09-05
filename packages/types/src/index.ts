// 用户相关类型
export * from './user'

// 文章相关类型
export * from './post'

// 评论相关类型
export * from './comment'

// 媒体相关类型
export * from './media'

// 通用类型
export interface IPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface IApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: IPagination
}

export interface IApiError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

// 时间相关类型
export type DateString = string
export type ISODateString = string

// 文件相关类型
export interface IFileUpload {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

// 搜索相关类型
export interface ISearchQuery {
  q: string
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ISearchResult<T = any> {
  items: T[]
  total: number
  query: string
  suggestions?: string[]
  filters?: Record<string, any>
}
