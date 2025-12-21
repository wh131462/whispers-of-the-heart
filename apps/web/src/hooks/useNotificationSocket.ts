import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface Comment {
  id: string
  content: string
  isApproved: boolean
  createdAt: string
  author: {
    id: string
    username: string
    avatar?: string
  }
  post: {
    id: string
    title: string
    slug: string
  }
  ipAddress?: string
  deletedAt?: string
  isPinned?: boolean
  isEdited?: boolean
  status?: 'APPROVED' | 'PENDING' | 'DELETED'
  parent?: {
    id: string
    content: string
  }
}

interface NotificationEvent {
  type: string
  data: Comment
  timestamp: string
}

interface UseNotificationSocketOptions {
  onNewComment?: (comment: Comment) => void
  onCommentStatusChange?: (comment: Comment, action: string) => void
  onStatsUpdate?: (stats: any) => void
  enabled?: boolean
}

export function useNotificationSocket(options: UseNotificationSocketOptions = {}) {
  const { onNewComment, onCommentStatusChange, onStatsUpdate, enabled = true } = options
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [newComments, setNewComments] = useState<Comment[]>([])

  // 清除新评论通知
  const clearNewComments = useCallback(() => {
    setNewComments([])
  }, [])

  // 标记单个评论为已读
  const markAsRead = useCallback((commentId: string) => {
    setNewComments((prev) => prev.filter((c) => c.id !== commentId))
  }, [])

  useEffect(() => {
    if (!enabled) return

    // 获取 API 基础 URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7777'
    const wsUrl = apiUrl.replace('/api/v1', '')

    // 创建 Socket 连接
    const socket = io(`${wsUrl}/notifications`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })

    socketRef.current = socket

    // 连接成功
    socket.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      // 加入管理员房间
      socket.emit('joinAdmin')
    })

    // 断开连接
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    // 收到新评论
    socket.on('newComment', (event: NotificationEvent) => {
      console.log('New comment received:', event)
      setNewComments((prev) => [event.data, ...prev])
      onNewComment?.(event.data)
    })

    // 评论状态变更
    socket.on('commentStatusChange', (event: NotificationEvent & { action: string }) => {
      console.log('Comment status changed:', event)
      onCommentStatusChange?.(event.data, event.action)
    })

    // 统计更新
    socket.on('statsUpdate', (event: { data: any }) => {
      console.log('Stats updated:', event)
      onStatsUpdate?.(event.data)
    })

    // 连接错误
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })

    // 清理
    return () => {
      socket.emit('leaveAdmin')
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled, onNewComment, onCommentStatusChange, onStatsUpdate])

  return {
    isConnected,
    newComments,
    newCommentsCount: newComments.length,
    clearNewComments,
    markAsRead,
  }
}
