import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { MoreHorizontal, Heart, Flag, Trash2, Edit, Copy } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../stores/useAuthStore';
import { commentApi } from '../services/commentApi';
import ReportCommentDialog from './ReportCommentDialog';
import type { ReportReason } from '../types/comment';

interface CommentActionsProps {
  isLiked?: boolean;
  likesCount?: number;
  onLike?: () => void;
  isLiking?: boolean;
}

const CommentActions: React.FC<CommentActionsProps> = ({
  isLiked = false,
  likesCount = 0,
  onLike,
  isLiking = false,
}) => {
  const { addToast } = useToast();

  const handleLike = async () => {
    if (!onLike || isLiking) return;

    try {
      await onLike();
    } catch (error) {
      console.error('Failed to like comment:', error);
      addToast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  return (
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
  );
};

// 更多操作菜单组件（单独导出，放在最后）
interface MoreActionsProps {
  commentId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const MoreActions: React.FC<MoreActionsProps> = ({
  commentId,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { addToast } = useToast();
  const { isAuthenticated } = useAuthStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(commentId);
    addToast({
      title: '已复制',
      description: '评论ID已复制到剪贴板',
      variant: 'success',
    });
    setShowMenu(false);
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      addToast({
        title: '需要登录',
        description: '请先登录后再举报评论',
        variant: 'warning',
      });
      setShowMenu(false);
      return;
    }
    setShowReportDialog(true);
    setShowMenu(false);
  };

  const handleReportSubmit = async (reason: ReportReason, details?: string) => {
    await commentApi.reportComment(commentId, { reason, details });
    addToast({
      title: '举报成功',
      description: '感谢您的反馈，我们会尽快处理',
      variant: 'success',
    });
  };

  return (
    <div className="relative">
      {/* 更多操作按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
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
                      onEdit();
                      setShowMenu(false);
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
                      onDelete();
                      setShowMenu(false);
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

      {/* 举报对话框 */}
      <ReportCommentDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
};

export default CommentActions;
