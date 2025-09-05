import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { MessageCircle, Loader2 } from 'lucide-react'
import type { Comment } from '../types/comment'
import { commentApi } from '../services/commentApi'
import CommentItem from './CommentItem'
import { useAuthStore } from '../stores/useAuthStore'

interface CommentListProps {
  postId: string
  onCommentCountChange?: (count: number) => void
}

const CommentList: React.FC<CommentListProps> = ({ postId, onCommentCountChange }) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const { accessToken } = useAuthStore()

  const loadComments = async (pageNum = 1, append = false) => {
    try {
      setLoading(true)
      const response = await commentApi.getPostComments(postId, pageNum, 10)
      
      if (response.success && response.data) {
        const newComments = response.data.items
        setComments(prev => append ? [...prev, ...newComments] : newComments)
        setHasMore(response.data.hasNext)
        setTotal(response.data.total)
        
        // 通知父组件评论数量变化
        if (onCommentCountChange && !append) {
          onCommentCountChange(response.data.total)
        }
      } else {
        console.error('Failed to load comments:', response.message)
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments(1, false)
  }, [postId])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadComments(nextPage, true)
  }

  const handleCommentAdded = () => {
    // 重新加载第一页评论
    loadComments(1, false)
  }


  if (loading && comments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">加载评论中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 评论统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            评论 ({total})
          </CardTitle>
        </CardHeader>
      </Card>

      {/* 评论列表 */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReplyAdded={handleCommentAdded}
            />
          ))}

          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                加载更多评论
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无评论</h3>
            <p className="text-muted-foreground">成为第一个评论的人吧！</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CommentList
