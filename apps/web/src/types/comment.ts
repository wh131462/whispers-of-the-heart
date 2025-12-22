export interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  isApproved: boolean
  likes?: number
  isLiked?: boolean
  isEdited?: boolean
  location?: string | null     // IP 归属地，如 "北京"
  deviceInfo?: string | null   // 设备信息，如 "iPhone · iOS"
  author?: {
    id: string
    username: string
    avatar?: string | null
    bio?: string | null
    location?: string | null  // 用户最后 IP 归属地
  }
  postId: string
  // 抖音风格扁平化结构
  rootId?: string | null       // 顶级评论ID，顶级评论为 null
  replyToUsername?: string | null  // 被回复用户名（用于显示 "回复 @xxx"）
  replies?: Comment[]          // 扁平化回复列表（只有一层）
}

// 举报原因类型
export type ReportReason = 'spam' | 'abuse' | 'harassment' | 'other'

// 举报原因中文映射
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: '垃圾内容',
  abuse: '滥用/恶意内容',
  harassment: '骚扰/人身攻击',
  other: '其他',
}

// 举报评论数据
export interface ReportCommentData {
  reason: ReportReason
  details?: string
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
