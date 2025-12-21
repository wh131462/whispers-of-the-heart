import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { MessageCircle, Loader2, RefreshCw, TrendingUp, Clock } from 'lucide-react'
import type { Comment } from '../types/comment'
import { commentApi } from '../services/commentApi'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'

type SortType = 'latest' | 'popular'

interface CommentListProps {
  postId: string
  onCommentCountChange?: (count: number) => void
}

const CommentList: React.FC<CommentListProps> = ({ postId, onCommentCountChange }) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState<SortType>('latest')

  const loadComments = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

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
      setLoadingMore(false)
    }
  }, [postId, onCommentCountChange])

  useEffect(() => {
    loadComments(1, false)
  }, [loadComments])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadComments(nextPage, true)
  }

  const handleCommentAdded = () => {
    setPage(1)
    loadComments(1, false)
  }

  const handleRefresh = () => {
    setPage(1)
    loadComments(1, false)
  }

  // 按热度排序（点赞数 + 回复数）
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'popular') {
      const scoreA = (a.likes || 0) + (a.replies?.length || 0)
      const scoreB = (b.likes || 0) + (b.replies?.length || 0)
      return scoreB - scoreA
    }
    // 默认按时间排序（API已经按时间排序）
    return 0
  })

  return (
    <div className="comment-section">
      {/* 评论区头部 */}
      <div className="comment-section-header">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">评论区</h3>
              <p className="text-sm text-muted-foreground">
                {total > 0 ? `共 ${total} 条评论` : '暂无评论'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 排序选项 */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
              <Button
                variant={sortBy === 'latest' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('latest')}
                className="h-8 text-xs"
              >
                <Clock className="h-3.5 w-3.5 mr-1" />
                最新
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('popular')}
                className="h-8 text-xs"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                热门
              </Button>
            </div>

            {/* 刷新按钮 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              className="h-8 w-8"
              title="刷新评论"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* 评论输入框 */}
        <div className="comment-form-wrapper mb-8">
          <CommentForm
            postId={postId}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      </div>

      {/* 分隔线 */}
      {(comments.length > 0 || loading) && (
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-background text-xs text-muted-foreground">
              {loading ? '加载中...' : `${total} 条评论`}
            </span>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && comments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">加载评论中...</p>
        </div>
      )}

      {/* 评论列表 */}
      {!loading && comments.length > 0 && (
        <div className="space-y-4">
          {sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReplyAdded={handleCommentAdded}
            />
          ))}

          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="min-w-[140px]"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    加载中...
                  </>
                ) : (
                  '加载更多评论'
                )}
              </Button>
            </div>
          )}

          {/* 已加载完所有评论 */}
          {!hasMore && comments.length > 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">已加载全部评论</p>
            </div>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!loading && comments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">暂无评论</h4>
          <p className="text-muted-foreground text-center max-w-[240px]">
            成为第一个评论的人，分享你的想法吧！
          </p>
        </div>
      )}

      <style>{`
        .comment-section {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 1rem;
          padding: 1.5rem;
        }

        @media (max-width: 640px) {
          .comment-section {
            padding: 1rem;
            border-radius: 0.75rem;
          }
        }

        .comment-form-wrapper {
          background: hsl(var(--muted) / 0.3);
          border-radius: 0.75rem;
          padding: 1rem;
        }
      `}</style>
    </div>
  )
}

export default CommentList
