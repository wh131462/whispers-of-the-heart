import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from './ui/button'
import { useToast } from '../contexts/ToastContext'
import { useAuthStore } from '../stores/useAuthStore'
import { api } from '@whispers/utils'

interface CommentFormProps {
  postId: string
  parentId?: string
  onCommentAdded: () => void
  onCancel?: () => void
  placeholder?: string
}

const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = '写下你的想法...',
}) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()
  const { isAuthenticated } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    if (!isAuthenticated) {
      addToast({
        title: '请先登录',
        description: '登录后才能发表评论',
        variant: 'warning',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await api.post('/comments', {
        content: content.trim(),
        postId,
        parentId,
      })

      setContent('')
      onCommentAdded()
      addToast({
        title: '评论成功',
        description: '您的评论已提交',
        variant: 'success',
      })
    } catch (error) {
      console.error('Failed to submit comment:', error)
      addToast({
        title: '评论失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isAuthenticated ? placeholder : '请先登录后再评论'}
        disabled={!isAuthenticated || isSubmitting}
        rows={4}
        className="w-full px-4 py-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">支持 Markdown 格式</p>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit" size="sm" disabled={!content.trim() || isSubmitting}>
            <Send className="h-4 w-4 mr-1.5" />
            {isSubmitting ? '发送中...' : '发表评论'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default CommentForm
