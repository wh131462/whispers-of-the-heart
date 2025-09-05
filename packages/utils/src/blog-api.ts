/**
 * 博客API服务
 * 封装所有博客相关的API调用
 */

import { ApiClient } from './request'

// 博客相关类型定义
export interface Post {
  id: string
  title: string
  content: string
  excerpt?: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  category?: string
  coverImage?: string
  views: number
  likes: number
  comments: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  authorId: string
  author: {
    id: string
    username: string
    avatar?: string
  }
  tags: string[]
}

export interface CreatePostDto {
  title: string
  content: string
  excerpt?: string
  category?: string
  coverImage?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  tags?: string[]
}

export interface UpdatePostDto {
  title?: string
  content?: string
  excerpt?: string
  category?: string
  coverImage?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  tags?: string[]
}

export interface PostListResponse {
  items: Post[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface LoginDto {
  username?: string
  email?: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    username: string
    email: string
    role: string
    avatar?: string
  }
  access_token: string
  refresh_token: string
}

// 创建博客API客户端
class BlogApiService {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
    // 自动从localStorage获取token（仅在浏览器环境）
    if (typeof window !== 'undefined') {
      this.client.setTokenFromStorage()
    }
  }

  // 设置认证token
  setToken(token: string) {
    this.client.setToken(token)
  }

  // 清除认证token
  clearToken() {
    this.client.clearToken()
  }

  // 认证相关API
  async login(credentials: LoginDto): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await this.client.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', credentials)
      
      // 适配API响应格式
      if (response.data && response.data.success && response.data.data) {
        const apiData = response.data.data as any
        return {
          success: true,
          data: {
            user: apiData.user,
            access_token: apiData.accessToken,
            refresh_token: apiData.refreshToken,
          },
          message: response.data.message,
        }
      }
      
      // 如果API返回失败，返回错误信息
      return {
        success: false,
        data: null as any,
        message: response.data?.message || '登录失败',
      }
    } catch (error) {
      console.error('Login API error:', error)
      return {
        success: false,
        data: null as any,
        message: error instanceof Error ? error.message : '网络请求失败',
      }
    }
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.post<ApiResponse<{ message: string }>>('/api/v1/auth/logout')
    return response.data
  }

  // 获取当前用户信息
  async getProfile(): Promise<ApiResponse<{
    id: string
    username: string
    email: string
    role: string
    avatar?: string
    bio?: string
    createdAt: string
    updatedAt: string
  }>> {
    const response = await this.client.get<ApiResponse<{
      id: string
      username: string
      email: string
      role: string
      avatar?: string
      bio?: string
      createdAt: string
      updatedAt: string
    }>>('/api/v1/auth/profile')
    return response.data
  }

  // 博客文章相关API
  async getPosts(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    category?: string
  }): Promise<ApiResponse<PostListResponse>> {
    try {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.search) searchParams.append('search', params.search)
      if (params?.status) searchParams.append('status', params.status)
      if (params?.category) searchParams.append('category', params.category)

      const url = `/api/v1/blog${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const response = await this.client.get<ApiResponse<PostListResponse>>(url)
      return response.data
    } catch (error) {
      console.error('getPosts error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取文章列表失败',
        data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 }
      }
    }
  }

  async getPost(id: string): Promise<ApiResponse<Post>> {
    try {
      const response = await this.client.get<ApiResponse<Post>>(`/api/v1/blog/post/${id}`)
      return response.data
    } catch (error) {
      console.error('getPost error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取文章详情失败',
        data: {} as Post
      }
    }
  }

  async getPostBySlug(slug: string): Promise<ApiResponse<Post>> {
    const response = await this.client.get<ApiResponse<Post>>(`/api/v1/blog/slug/${slug}`)
    return response.data
  }

  async createPost(postData: CreatePostDto): Promise<ApiResponse<Post>> {
    const response = await this.client.post<ApiResponse<Post>>('/api/v1/blog', postData)
    return response.data
  }

  async updatePost(id: string, postData: UpdatePostDto): Promise<ApiResponse<Post>> {
    const response = await this.client.patch<ApiResponse<Post>>(`/api/v1/blog/post/${id}`, postData)
    return response.data
  }

  async deletePost(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.delete<ApiResponse<{ message: string }>>(`/api/v1/blog/post/${id}`)
    return response.data
  }

  // 分类相关API
  async getCategories(): Promise<ApiResponse<string[]>> {
    const response = await this.client.get<ApiResponse<string[]>>('/api/v1/blog/categories')
    return response.data
  }

  // 标签相关API
  async getTags(): Promise<ApiResponse<Array<{ id: string; name: string; slug: string; color?: string }>>> {
    const response = await this.client.get<ApiResponse<Array<{ id: string; name: string; slug: string; color?: string }>>>('/api/v1/blog/tags')
    return response.data
  }

  // 搜索API
  async search(query: string): Promise<ApiResponse<Array<{
    id: string
    type: 'post' | 'video' | 'audio'
    title: string
    excerpt?: string
    slug: string
    publishedAt?: string
  }>>> {
    const response = await this.client.get<ApiResponse<Array<{
      id: string
      type: 'post' | 'video' | 'audio'
      title: string
      excerpt?: string
      slug: string
      publishedAt?: string
    }>>>(`/api/v1/search?q=${encodeURIComponent(query)}`)
    return response.data
  }
}

// 创建单例实例
export const blogApi = new BlogApiService()

// 类型已经在上面定义了，不需要重复导出
