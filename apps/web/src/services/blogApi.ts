import { useAuthStore } from '../stores/useAuthStore'
import { api, setAuthToken, removeAuthToken } from '@whispers/utils'

export interface LikeResponse {
  liked: boolean
  likesCount: number
}

export interface FavoriteResponse {
  favorited: boolean
}

export interface LikeStatusResponse {
  liked: boolean
}

export interface FavoriteStatusResponse {
  favorited: boolean
}

export interface FavoritesListResponse {
  items: any[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export class BlogApiService {
  private setAuthIfAvailable() {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      setAuthToken(accessToken)
    } else {
      removeAuthToken()
    }
  }

  // 点赞相关方法
  async toggleLike(postId: string): Promise<LikeResponse> {
    this.setAuthIfAvailable()
    const response = await api.post(`/blog/post/${postId}/like`)
    return response.data.data
  }

  async getLikeStatus(postId: string): Promise<LikeStatusResponse> {
    this.setAuthIfAvailable()
    const response = await api.get(`/blog/post/${postId}/like-status`)
    return response.data.data
  }

  // 收藏相关方法
  async toggleFavorite(postId: string): Promise<FavoriteResponse> {
    this.setAuthIfAvailable()
    const response = await api.post(`/blog/post/${postId}/favorite`)
    return response.data.data
  }

  async getFavoriteStatus(postId: string): Promise<FavoriteStatusResponse> {
    this.setAuthIfAvailable()
    const response = await api.get(`/blog/post/${postId}/favorite-status`)
    return response.data.data
  }

  async getUserFavorites(page = 1, limit = 10): Promise<FavoritesListResponse> {
    this.setAuthIfAvailable()
    const response = await api.get('/blog/user/favorites', {
      params: { page, limit }
    })
    return response.data.data
  }

  // 分享相关方法
  async sharePost(postId: string, platform: 'copy' | 'twitter' | 'facebook' | 'weibo' = 'copy'): Promise<void> {
    const postUrl = `${window.location.origin}/posts/${postId}`
    
    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(postUrl)
        break
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('分享一篇文章')}&url=${encodeURIComponent(postUrl)}`
        window.open(twitterUrl, '_blank')
        break
      case 'facebook':
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`
        window.open(facebookUrl, '_blank')
        break
      case 'weibo':
        const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent('分享一篇文章')}`
        window.open(weiboUrl, '_blank')
        break
      default:
        await navigator.clipboard.writeText(postUrl)
    }
  }
}

export const blogApi = new BlogApiService()
