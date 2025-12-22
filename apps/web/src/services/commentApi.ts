import type { CreateCommentData, CommentResponse, CommentListResponse, ReportCommentData } from '../types/comment'
import { useAuthStore } from '../stores/useAuthStore'
import { api, setAuthToken, removeAuthToken } from '@whispers/utils'

export interface LikeResponse {
  liked: boolean
  likesCount: number
}

export interface LikeStatusResponse {
  liked: boolean
  likesCount: number
}

export class CommentApiService {
  private setAuthIfAvailable() {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      setAuthToken(accessToken)
    } else {
      removeAuthToken()
    }
  }

  // 获取文章评论
  async getPostComments(postId: string, page = 1, limit = 10): Promise<CommentListResponse> {
    this.setAuthIfAvailable()
    const response = await api.get(`/comments/post/${postId}`, {
      params: { page, limit }
    })
    return response.data
  }

  // 创建评论
  async createComment(commentData: CreateCommentData): Promise<CommentResponse> {
    this.setAuthIfAvailable()
    const response = await api.post('/comments', {
      ...commentData,
      authorId: 'anonymous', // 暂时使用匿名用户ID
    })
    return response.data
  }

  // 评论点赞相关方法
  async toggleLike(commentId: string): Promise<LikeResponse> {
    this.setAuthIfAvailable()
    const response = await api.post(`/comments/${commentId}/like`)
    return response.data.data
  }

  async getLikeStatus(commentId: string): Promise<LikeStatusResponse> {
    this.setAuthIfAvailable()
    const response = await api.get(`/comments/${commentId}/like-status`)
    return response.data.data
  }

  // 举报评论
  async reportComment(commentId: string, data: ReportCommentData): Promise<{ message: string; reportId: string }> {
    this.setAuthIfAvailable()
    const response = await api.post(`/comments/${commentId}/report`, data)
    return response.data.data
  }
}

export const commentApi = new CommentApiService()
