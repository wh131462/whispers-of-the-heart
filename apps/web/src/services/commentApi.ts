import type { CreateCommentData, CommentResponse, CommentListResponse } from '../types/comment'
import { useAuthStore } from '../stores/useAuthStore'

const API_BASE_URL = 'http://localhost:7777/api/v1'

export interface LikeResponse {
  liked: boolean
  likesCount: number
}

export interface LikeStatusResponse {
  liked: boolean
  likesCount: number
}

export class CommentApiService {
  private getAuthHeaders() {
    const { accessToken } = useAuthStore.getState()
    return {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    }
  }

  // 获取文章评论
  async getPostComments(postId: string, page = 1, limit = 10): Promise<CommentListResponse> {
    const response = await fetch(
      `${API_BASE_URL}/comments/post/${postId}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // 创建评论
  async createComment(commentData: CreateCommentData): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...commentData,
        authorId: 'anonymous', // 暂时使用匿名用户ID
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // 评论点赞相关方法
  async toggleLike(commentId: string): Promise<LikeResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  async getLikeStatus(commentId: string): Promise<LikeStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/like-status`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }
}

export const commentApi = new CommentApiService()
