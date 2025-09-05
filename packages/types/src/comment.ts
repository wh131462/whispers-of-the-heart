// 评论状态枚举
export enum CommentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SPAM = 'SPAM',
  DELETED = 'DELETED'
}

// 评论类型枚举
export enum CommentType {
  COMMENT = 'COMMENT',
  REPLY = 'REPLY',
  REVIEW = 'REVIEW'
}

// 基础评论接口
export interface IComment {
  id: string
  content: string
  authorId: string
  postId: string
  parentId?: string
  type: CommentType
  status: CommentStatus
  isEdited: boolean
  editHistory?: string[]
  likeCount: number
  dislikeCount: number
  replyCount: number
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

// 创建评论接口
export interface ICreateComment {
  content: string
  postId: string
  parentId?: string
  type?: CommentType
}

// 更新评论接口
export interface IUpdateComment {
  content: string
  status?: CommentStatus
}

// 评论查询接口
export interface ICommentQuery {
  postId?: string
  authorId?: string
  parentId?: string
  status?: CommentStatus
  type?: CommentType
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'likeCount'
  sortOrder?: 'asc' | 'desc'
}

// 评论统计接口
export interface ICommentStats {
  commentId: string
  likeCount: number
  dislikeCount: number
  replyCount: number
  viewCount: number
  lastActivityAt: Date
}

// 评论审核接口
export interface ICommentModeration {
  commentId: string
  moderatorId: string
  action: 'APPROVE' | 'REJECT' | 'MARK_SPAM' | 'DELETE'
  reason?: string
  moderatedAt: Date
}

// 评论举报接口
export interface ICommentReport {
  id: string
  commentId: string
  reporterId: string
  reason: string
  description?: string
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED'
  moderatorId?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}
