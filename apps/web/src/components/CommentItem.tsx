import React, { useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Reply } from 'lucide-react'
import type { Comment } from '../types/comment'
import CommentForm from './CommentForm'
import CommentActions from './CommentActions'
import { MarkdownRenderer, Avatar, AvatarImage, AvatarFallback } from '@whispers/ui'
import { useAuthStore } from '../stores/useAuthStore'
import { commentApi } from '../services/commentApi'
import { useToast } from '../contexts/ToastContext'

interface CommentItemProps {
  comment: Comment
  onReplyAdded: () => void
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReplyAdded }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likesCount, setLikesCount] = useState(comment.likes || 0)
  const [isLiking, setIsLiking] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const { addToast } = useToast()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInSeconds < 60) {
      return '刚刚'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`
    } else if (diffInDays < 7) {
      return `${diffInDays}天前`
    } else if (diffInDays < 30) {
      return `${Math.floor(diffInDays / 7)}周前`
    } else if (diffInDays < 365) {
      return `${Math.floor(diffInDays / 30)}个月前`
    } else {
      return `${Math.floor(diffInDays / 365)}年前`
    }
  }


  // 处理评论点赞
  const handleLike = async () => {
    if (!isAuthenticated) {
      addToast({
        title: '需要登录',
        description: '请先登录后再点赞',
        variant: 'destructive'
      })
      return
    }

    if (isLiking) return

    try {
      setIsLiking(true)
      const result = await commentApi.toggleLike(comment.id)
      setIsLiked(result.liked)
      setLikesCount(result.likesCount)
      
      addToast({
        title: result.liked ? '点赞成功' : '取消点赞',
        description: result.liked ? '已为该评论点赞' : '已取消点赞',
        variant: 'success'
      })
    } catch (error) {
      console.error('Failed to like comment:', error)
      addToast({
        title: '操作失败',
        description: '点赞操作失败，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsLiking(false)
    }
  }

  // 检查是否为评论作者
  const isAuthor = user && comment.author && user.id === comment.author.id
  const canEdit = Boolean(isAuthor)
  const canDelete = Boolean(isAuthor)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* 头像 */}
            <Avatar size={32}>
              <AvatarImage 
                src={comment.author?.avatar || undefined} 
                alt={comment.author?.username || 'Anonymous'}
              />
              <AvatarFallback 
                username={comment.author?.username || 'Anonymous'}
                variant="simple"
              />
            </Avatar>

            {/* 评论内容 */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author?.username || 'Anonymous'}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              
              {/* 评论内容 - 支持Markdown */}
              <MarkdownRenderer 
                content={comment.content}
                className="prose prose-sm max-w-none"
              />

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-8 px-2 text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  回复
                </Button>
                
                {/* 评论操作菜单 */}
                <CommentActions
                  commentId={comment.id}
                  isLiked={isLiked}
                  likesCount={likesCount}
                  onLike={handleLike}
                  isLiking={isLiking}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 回复表单 */}
      {showReplyForm && (
        <div className="ml-8">
          <CommentForm
            postId={comment.postId}
            parentId={comment.id}
            onCommentAdded={() => {
              setShowReplyForm(false)
              onReplyAdded()
            }}
            placeholder={`回复 @${comment.author?.username || 'Anonymous'}...`}
          />
        </div>
      )}

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentItem
