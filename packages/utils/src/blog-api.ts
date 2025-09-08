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

// 分类相关类型定义
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  postCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryDto {
  name: string
  slug?: string
  description?: string
  color?: string
}

export interface UpdateCategoryDto {
  name?: string
  slug?: string
  description?: string
  color?: string
}

// 标签相关类型定义
export interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  postCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateTagDto {
  name: string
  slug?: string
  description?: string
  color?: string
}

export interface UpdateTagDto {
  name?: string
  slug?: string
  description?: string
  color?: string
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
      const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
      
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
    const response = await this.client.post<ApiResponse<{ message: string }>>('/auth/logout')
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
    }>>('/auth/profile')
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

      const url = `/blog${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
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
      const response = await this.client.get<ApiResponse<Post>>(`/blog/post/${id}`)
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

  // 专门用于编辑的方法，不增加访问量
  async getPostForEdit(id: string): Promise<ApiResponse<Post>> {
    try {
      const response = await this.client.get<ApiResponse<Post>>(`/blog/post/${id}/edit`)
      return response.data
    } catch (error) {
      console.error('getPostForEdit error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取编辑文章详情失败',
        data: {} as Post
      }
    }
  }

  async getPostBySlug(slug: string): Promise<ApiResponse<Post>> {
    const response = await this.client.get<ApiResponse<Post>>(`/blog/slug/${slug}`)
    return response.data
  }

  async createPost(postData: CreatePostDto): Promise<ApiResponse<Post>> {
    const response = await this.client.post<ApiResponse<Post>>('/blog', postData)
    return response.data
  }

  async updatePost(id: string, postData: UpdatePostDto): Promise<ApiResponse<Post>> {
    const response = await this.client.patch<ApiResponse<Post>>(`/blog/post/${id}`, postData)
    return response.data
  }

  async deletePost(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.delete<ApiResponse<{ message: string }>>(`/blog/post/${id}`)
    return response.data
  }

  // 分类相关API
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await this.client.get<ApiResponse<Category[]>>('/admin/categories')
    return response.data
  }

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    const response = await this.client.get<ApiResponse<Category>>(`/admin/categories/${id}`)
    return response.data
  }

  async createCategory(categoryData: CreateCategoryDto): Promise<ApiResponse<Category>> {
    const response = await this.client.post<ApiResponse<Category>>('/admin/categories', categoryData)
    return response.data
  }

  async updateCategory(id: string, categoryData: UpdateCategoryDto): Promise<ApiResponse<Category>> {
    const response = await this.client.patch<ApiResponse<Category>>(`/admin/categories/${id}`, categoryData)
    return response.data
  }

  async deleteCategory(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.delete<ApiResponse<{ message: string }>>(`/admin/categories/${id}`)
    return response.data
  }

  async getCategoryPosts(id: string, page: number = 1, limit: number = 10): Promise<ApiResponse<PostListResponse>> {
    const response = await this.client.get<ApiResponse<PostListResponse>>(`/admin/categories/${id}/posts?page=${page}&limit=${limit}`)
    return response.data
  }

  // 标签相关API
  async getTags(): Promise<ApiResponse<Tag[]>> {
    const response = await this.client.get<ApiResponse<Tag[]>>('/admin/tags')
    return response.data
  }

  async getTagById(id: string): Promise<ApiResponse<Tag>> {
    const response = await this.client.get<ApiResponse<Tag>>(`/admin/tags/${id}`)
    return response.data
  }

  async createTag(tagData: CreateTagDto): Promise<ApiResponse<Tag>> {
    const response = await this.client.post<ApiResponse<Tag>>('/admin/tags', tagData)
    return response.data
  }

  async updateTag(id: string, tagData: UpdateTagDto): Promise<ApiResponse<Tag>> {
    const response = await this.client.patch<ApiResponse<Tag>>(`/admin/tags/${id}`, tagData)
    return response.data
  }

  async deleteTag(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.delete<ApiResponse<{ message: string }>>(`/admin/tags/${id}`)
    return response.data
  }

  async getTagPosts(id: string, page: number = 1, limit: number = 10): Promise<ApiResponse<PostListResponse>> {
    const response = await this.client.get<ApiResponse<PostListResponse>>(`/admin/tags/${id}/posts?page=${page}&limit=${limit}`)
    return response.data
  }

  // 获取简单的分类和标签列表（用于下拉选择）
  async getCategoryNames(): Promise<ApiResponse<string[]>> {
    const response = await this.client.get<ApiResponse<string[]>>('/blog/categories')
    return response.data
  }

  async getTagNames(): Promise<ApiResponse<Array<{ id: string; name: string; slug: string; color?: string }>>> {
    const response = await this.client.get<ApiResponse<Array<{ id: string; name: string; slug: string; color?: string }>>>('/blog/tags')
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
    }>>>(`/search?q=${encodeURIComponent(query)}`)
    return response.data
  }

  // 点赞相关API
  async toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    try {
      const response = await this.client.post<ApiResponse<{ liked: boolean; likesCount: number }>>(`/blog/post/${postId}/like`)
      return response.data.data
    } catch (error) {
      console.error('toggleLike error:', error)
      throw error
    }
  }

  async getLikeStatus(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    try {
      const response = await this.client.get<ApiResponse<{ liked: boolean; likesCount: number }>>(`/blog/post/${postId}/like-status`)
      return response.data.data
    } catch (error) {
      console.error('getLikeStatus error:', error)
      throw error
    }
  }

  // 收藏相关API
  async toggleFavorite(postId: string): Promise<{ favorited: boolean }> {
    try {
      const response = await this.client.post<ApiResponse<{ favorited: boolean }>>(`/blog/post/${postId}/favorite`)
      return response.data.data
    } catch (error) {
      console.error('toggleFavorite error:', error)
      throw error
    }
  }

  async getFavoriteStatus(postId: string): Promise<{ favorited: boolean }> {
    try {
      const response = await this.client.get<ApiResponse<{ favorited: boolean }>>(`/blog/post/${postId}/favorite-status`)
      return response.data.data
    } catch (error) {
      console.error('getFavoriteStatus error:', error)
      throw error
    }
  }

  // 分享API
  async sharePost(postId: string, type: 'copy' | 'native'): Promise<void> {
    try {
      if (type === 'copy') {
        // 复制链接到剪贴板
        const url = `${window.location.origin}/posts/${postId}`
        await navigator.clipboard.writeText(url)
      }
    } catch (error) {
      console.error('sharePost error:', error)
      throw error
    }
  }
}

// 创建单例实例
export const blogApi = new BlogApiService()

// 类型已经在上面定义了，不需要重复导出
