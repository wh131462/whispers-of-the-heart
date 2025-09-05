import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { MoreHorizontal, Heart, Flag, Trash2, Edit, Copy } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface CommentActionsProps {
  commentId: string
  isLiked?: boolean
  likesCount?: number
  onLike?: () => void
  onEdit?: () => void
  onDelete?: () => void
  isLiking?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

const CommentActions: React.FC<CommentActionsProps> = ({
  commentId,
  isLiked = false,
  likesCount = 0,
  onLike,
  onEdit,
  onDelete,
  isLiking = false,
  canEdit = false,
  canDelete = false
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const { addToast } = useToast()

  const handleLike = async () => {
    if (!onLike || isLiking) return
    
    try {
      await onLike()
    } catch (error) {
      console.error('Failed to like comment:', error)
      addToast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive'
      })
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(commentId)
    addToast({
      title: '已复制',
      description: '评论ID已复制到剪贴板',
      variant: 'success'
    })
    setShowMenu(false)
  }

  const handleReport = () => {
    addToast({
      title: '举报功能',
      description: '举报功能正在开发中',
      variant: 'default'
    })
    setShowMenu(false)
  }

  return (
    <div className="relative">
      {/* 点赞按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={isLiking}
        className={`h-8 px-2 text-xs ${
          isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
        }`}
      >
        <Heart className={`h-3 w-3 mr-1 ${isLiked ? 'fill-current' : ''}`} />
        {isLiking ? '...' : likesCount}
      </Button>

      {/* 更多操作按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="h-8 px-2 text-xs"
      >
        <MoreHorizontal className="h-3 w-3" />
      </Button>

      {/* 操作菜单 */}
      {showMenu && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          
          {/* 菜单内容 */}
          <Card className="absolute right-0 top-8 z-20 w-48 shadow-lg">
            <CardContent className="p-1">
              <div className="space-y-1">
                {/* 复制评论ID */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="w-full justify-start h-8 px-3 text-xs"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  复制评论ID
                </Button>

                {/* 举报 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReport}
                  className="w-full justify-start h-8 px-3 text-xs"
                >
                  <Flag className="h-3 w-3 mr-2" />
                  举报
                </Button>

                {/* 编辑（仅作者可见） */}
                {canEdit && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onEdit()
                      setShowMenu(false)
                    }}
                    className="w-full justify-start h-8 px-3 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    编辑
                  </Button>
                )}

                {/* 删除（仅作者可见） */}
                {canDelete && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDelete()
                      setShowMenu(false)
                    }}
                    className="w-full justify-start h-8 px-3 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    删除
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default CommentActions
