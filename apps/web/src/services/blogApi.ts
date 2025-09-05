import { useAuthStore } from '../stores/useAuthStore'

const API_BASE_URL = 'http://localhost:7777/api/v1'

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
  private getAuthHeaders() {
    const { accessToken } = useAuthStore.getState()
    return {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    }
  }

  // 点赞相关方法
  async toggleLike(postId: string): Promise<LikeResponse> {
    const response = await fetch(`${API_BASE_URL}/blog/post/${postId}/like`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  async getLikeStatus(postId: string): Promise<LikeStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/blog/post/${postId}/like-status`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  // 收藏相关方法
  async toggleFavorite(postId: string): Promise<FavoriteResponse> {
    const response = await fetch(`${API_BASE_URL}/blog/post/${postId}/favorite`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  async getFavoriteStatus(postId: string): Promise<FavoriteStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/blog/post/${postId}/favorite-status`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  async getUserFavorites(page = 1, limit = 10): Promise<FavoritesListResponse> {
    const response = await fetch(`${API_BASE_URL}/blog/user/favorites?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
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
