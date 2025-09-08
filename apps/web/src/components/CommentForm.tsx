import React, { useState, useCallback } from 'react'
import { CommentEditor } from '@whispers/ui'
import { MessageCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { api } from '@whispers/utils'

interface CommentFormProps {
  postId: string
  parentId?: string
  onCommentAdded: () => void
  placeholder?: string
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  postId, 
  parentId, 
  onCommentAdded, 
  placeholder = "写下你的评论..." 
}) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()

  // 使用 useCallback 稳定 onChange 函数引用
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

  const handleSubmit = async () => {
    if (!content.trim()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await api.post('/comments', {
        content: content.trim(),
        postId,
        parentId,
        authorId: 'anonymous', // 暂时使用匿名用户ID
      })

      onCommentAdded()
      addToast({
        title: '评论成功',
        description: '您的评论已提交，等待审核',
        variant: 'success'
      })
      // 不需要手动清空 content，CommentEditor 会自动清空
    } catch (error) {
      console.error('Failed to submit comment:', error)
      addToast({
        title: '评论失败',
        description: '请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 移除取消功能，评论编辑器不需要取消按钮

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">
          {parentId ? '回复评论' : '发表评论'}
        </h3>
      </div>
      
      {/* 使用 CommentEditor 替代原来的表单 */}
      <CommentEditor
        content={content}
        onChange={handleContentChange}
        placeholder={placeholder}
        onSubmit={handleSubmit}
        submitting={isSubmitting}
        autoHeight={true}
        clearOnSubmit={true}
        className="w-full"
      />
    </div>
  )
}

export default CommentForm