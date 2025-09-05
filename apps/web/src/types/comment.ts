export interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  isApproved: boolean
  likes?: number
  isLiked?: boolean
  author?: {
    id: string
    username: string
    avatar?: string | null
  }
  postId: string
  parentId?: string | null
  replies?: Comment[]
}

export interface CreateCommentData {
  content: string
  postId: string
  parentId?: string
}

export interface CommentResponse {
  success: boolean
  message: string
  data: Comment
}

export interface CommentListResponse {
  success: boolean
  message: string
  data: {
    items: Comment[]
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
