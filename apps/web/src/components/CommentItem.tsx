import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  Reply,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Monitor,
} from 'lucide-react';
import {
  FaWindows,
  FaApple,
  FaLinux,
  FaAndroid,
  FaChrome,
  FaUbuntu,
} from 'react-icons/fa';
import { Tooltip } from 'antd';
import type { Comment } from '../types/comment';
import CommentForm from './CommentForm';
import CommentActions, { MoreActions } from './CommentActions';
import UserAvatar from './UserAvatar';
import ConfirmDialog from './ConfirmDialog';
import { MarkdownRenderer } from '@whispers/ui';
import { useAuthStore } from '../stores/useAuthStore';
import { commentApi } from '../services/commentApi';
import { useToast } from '../contexts/ToastContext';

// 操作系统信息类型
interface DeviceInfo {
  icon: React.ReactNode;
  full: string;
}

// 解析设备信息并返回图标和完整信息
const parseDeviceInfo = (deviceInfo: string): DeviceInfo => {
  if (!deviceInfo) return { icon: null, full: '' };

  const iconClass = 'h-3 w-3';

  // 操作系统映射到图标
  if (deviceInfo.includes('Windows')) {
    return { icon: <FaWindows className={iconClass} />, full: deviceInfo };
  }
  if (deviceInfo.includes('Mac OS') || deviceInfo.includes('macOS')) {
    return { icon: <FaApple className={iconClass} />, full: deviceInfo };
  }
  if (deviceInfo.includes('iOS')) {
    return { icon: <FaApple className={iconClass} />, full: deviceInfo };
  }
  if (deviceInfo.includes('Android')) {
    return { icon: <FaAndroid className={iconClass} />, full: deviceInfo };
  }
  if (deviceInfo.includes('Ubuntu')) {
    return { icon: <FaUbuntu className={iconClass} />, full: deviceInfo };
  }
  if (deviceInfo.includes('Linux')) {
    return { icon: <FaLinux className={iconClass} />, full: deviceInfo };
  }
  if (deviceInfo.includes('Chrome OS')) {
    return { icon: <FaChrome className={iconClass} />, full: deviceInfo };
  }

  // 默认图标
  return { icon: <Monitor className={iconClass} />, full: deviceInfo };
};

interface CommentItemProps {
  comment: Comment;
  onReplyAdded: () => void;
  onCommentDeleted?: () => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReplyAdded,
  onCommentDeleted,
  isReply = false,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likesCount, setLikesCount] = useState(comment.likes || 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else if (diffInDays < 7) {
      return `${diffInDays}天前`;
    } else if (diffInDays < 30) {
      return `${Math.floor(diffInDays / 7)}周前`;
    } else if (diffInDays < 365) {
      return `${Math.floor(diffInDays / 30)}个月前`;
    } else {
      return `${Math.floor(diffInDays / 365)}年前`;
    }
  };

  // 处理评论点赞
  const handleLike = async () => {
    if (!isAuthenticated) {
      addToast({
        title: '需要登录',
        description: '请先登录后再点赞',
        variant: 'destructive',
      });
      return;
    }

    if (isLiking) return;

    try {
      setIsLiking(true);
      const result = await commentApi.toggleLike(comment.id);
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (error) {
      console.error('Failed to like comment:', error);
      addToast({
        title: '操作失败',
        description: '点赞操作失败，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  // 处理删除评论
  const handleDelete = async () => {
    try {
      await commentApi.deleteComment(comment.id);
      addToast({
        title: '删除成功',
        description: '评论已删除',
        variant: 'success',
      });
      onCommentDeleted?.();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      addToast({
        title: '删除失败',
        description: '删除评论失败，请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // 检查是否为评论作者
  const isAuthor = user && comment.author && user.id === comment.author.id;
  const canEdit = Boolean(isAuthor);
  const canDelete = Boolean(isAuthor);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const replyCount = comment.replies?.length || 0;

  // 回复单元组件（扁平化展示）
  const ReplyItem: React.FC<{ reply: Comment }> = ({ reply }) => {
    const [replyLiked, setReplyLiked] = useState(reply.isLiked || false);
    const [replyLikesCount, setReplyLikesCount] = useState(reply.likes || 0);
    const [replyLiking, setReplyLiking] = useState(false);
    const [showReplyToForm, setShowReplyToForm] = useState(false);
    const [showReplyDeleteConfirm, setShowReplyDeleteConfirm] = useState(false);
    const isReplyAuthor = user && reply.author && user.id === reply.author.id;

    const handleReplyLike = async () => {
      if (!isAuthenticated) {
        addToast({
          title: '需要登录',
          description: '请先登录后再点赞',
          variant: 'destructive',
        });
        return;
      }

      if (replyLiking) return;

      try {
        setReplyLiking(true);
        const result = await commentApi.toggleLike(reply.id);
        setReplyLiked(result.liked);
        setReplyLikesCount(result.likesCount);
      } catch (error) {
        console.error('Failed to like reply:', error);
        addToast({
          title: '操作失败',
          description: '点赞操作失败，请稍后重试',
          variant: 'destructive',
        });
      } finally {
        setReplyLiking(false);
      }
    };

    const handleReplyDelete = async () => {
      try {
        await commentApi.deleteComment(reply.id);
        addToast({
          title: '删除成功',
          description: '回复已删除',
          variant: 'success',
        });
        onReplyAdded(); // 刷新评论列表
      } catch (error) {
        console.error('Failed to delete reply:', error);
        addToast({
          title: '删除失败',
          description: '删除回复失败，请稍后重试',
          variant: 'destructive',
        });
      }
    };

    return (
      <div className="reply-item py-3 border-b border-border/50 last:border-b-0">
        <div className="flex gap-3">
          <UserAvatar
            user={{
              id: reply.author?.id || '',
              username: reply.author?.username || 'Anonymous',
              avatar: reply.author?.avatar,
              bio: reply.author?.bio,
              location: reply.author?.location || reply.location,
            }}
            size={28}
            showProfileOnClick={!!reply.author}
            cardPosition="right"
          />

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground hover:text-primary cursor-pointer transition-colors">
                {reply.author?.username || 'Anonymous'}
              </span>
              {reply.replyToUsername && (
                <span className="text-xs text-muted-foreground">
                  回复{' '}
                  <span className="text-primary">@{reply.replyToUsername}</span>
                </span>
              )}
              {isReplyAuthor && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                  作者
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(reply.createdAt)}
              </span>
            </div>

            <div className="comment-body">
              <MarkdownRenderer
                content={reply.content}
                className="prose-compact text-sm"
              />
            </div>

            <div className="flex items-center gap-1 pt-1 -ml-2">
              <CommentActions
                isLiked={replyLiked}
                likesCount={replyLikesCount}
                onLike={handleReplyLike}
                isLiking={replyLiking}
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyToForm(!showReplyToForm)}
                className={`h-8 px-2 text-xs text-muted-foreground hover:text-primary ${showReplyToForm ? 'bg-accent text-primary' : ''}`}
              >
                <Reply className="h-3.5 w-3.5 mr-1" />
                回复
              </Button>

              {/* IP 属地 */}
              <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                <MapPin className="h-3 w-3" />
                {reply.location || '未知'}
              </span>

              {/* 系统信息图标 */}
              {reply.deviceInfo && (
                <Tooltip title={parseDeviceInfo(reply.deviceInfo).full}>
                  <span className="text-muted-foreground cursor-default">
                    {parseDeviceInfo(reply.deviceInfo).icon}
                  </span>
                </Tooltip>
              )}

              {/* 更多操作放最后 */}
              <MoreActions
                commentId={reply.id}
                canEdit={Boolean(isReplyAuthor)}
                canDelete={Boolean(isReplyAuthor)}
                onDelete={() => setShowReplyDeleteConfirm(true)}
              />
            </div>

            {/* 回复表单 */}
            {showReplyToForm && (
              <div className="reply-form-container mt-2">
                <CommentForm
                  postId={reply.postId}
                  parentId={reply.id}
                  onCommentAdded={() => {
                    setShowReplyToForm(false);
                    onReplyAdded();
                  }}
                  onCancel={() => setShowReplyToForm(false)}
                  placeholder={`回复 @${reply.author?.username || 'Anonymous'}...`}
                  compact
                />
              </div>
            )}

            {/* 删除回复确认弹窗 */}
            <ConfirmDialog
              isOpen={showReplyDeleteConfirm}
              onClose={() => setShowReplyDeleteConfirm(false)}
              onConfirm={handleReplyDelete}
              title="删除回复"
              description="确定要删除这条回复吗？此操作不可恢复。"
              confirmText="删除"
              cancelText="取消"
              variant="danger"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`comment-item ${isReply ? 'is-reply' : ''}`}>
      {/* 主评论区域 */}
      <div className={`comment-content group ${isReply ? 'py-3' : 'py-4'}`}>
        <div className="flex gap-3">
          {/* 头像 */}
          <UserAvatar
            user={{
              id: comment.author?.id || '',
              username: comment.author?.username || 'Anonymous',
              avatar: comment.author?.avatar,
              bio: comment.author?.bio,
              location: comment.author?.location || comment.location,
            }}
            size={isReply ? 28 : 36}
            showProfileOnClick={!!comment.author}
            cardPosition="right"
          />

          {/* 评论内容 */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* 用户信息行 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-semibold ${isReply ? 'text-sm' : 'text-base'} text-foreground hover:text-primary cursor-pointer transition-colors`}
              >
                {comment.author?.username || 'Anonymous'}
              </span>
              {isAuthor && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                  作者
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </span>
            </div>

            {/* 评论内容 - 支持Markdown */}
            <div className="comment-body">
              <MarkdownRenderer
                content={comment.content}
                className={`prose-compact ${isReply ? 'text-sm' : 'text-base'}`}
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-1 pt-1 -ml-2">
              {/* 点赞按钮 */}
              <CommentActions
                isLiked={isLiked}
                likesCount={likesCount}
                onLike={handleLike}
                isLiking={isLiking}
              />

              {/* 回复按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className={`h-8 px-2 text-xs text-muted-foreground hover:text-primary ${showReplyForm ? 'bg-accent text-primary' : ''}`}
              >
                <Reply className="h-3.5 w-3.5 mr-1" />
                回复
              </Button>

              {/* 展开/收起回复 - 只在顶级评论显示 */}
              {hasReplies && !isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                  {replyCount} 条回复
                  {showReplies ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
              )}

              {/* IP 属地 */}
              <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                <MapPin className="h-3 w-3" />
                {comment.location || '未知'}
              </span>

              {/* 系统信息图标 */}
              {comment.deviceInfo && (
                <Tooltip title={parseDeviceInfo(comment.deviceInfo).full}>
                  <span className="text-muted-foreground cursor-default">
                    {parseDeviceInfo(comment.deviceInfo).icon}
                  </span>
                </Tooltip>
              )}

              {/* 更多操作放最后 */}
              <MoreActions
                commentId={comment.id}
                canEdit={canEdit}
                canDelete={canDelete}
                onDelete={() => setShowDeleteConfirm(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 回复表单 */}
      {showReplyForm && (
        <div
          className={`reply-form-container ${isReply ? 'ml-8' : 'ml-12'} mt-2 mb-3`}
        >
          <CommentForm
            postId={comment.postId}
            parentId={comment.id}
            onCommentAdded={() => {
              setShowReplyForm(false);
              onReplyAdded();
            }}
            onCancel={() => setShowReplyForm(false)}
            placeholder={`回复 @${comment.author?.username || 'Anonymous'}...`}
            compact
          />
        </div>
      )}

      {/* 回复列表 - 抖音风格扁平化 */}
      {hasReplies && showReplies && !isReply && (
        <div className="replies-container ml-12 pl-4">
          {comment.replies!.map(reply => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </div>
      )}

      <style>{`
        .comment-item {
          position: relative;
        }

        .comment-item:not(.is-reply) {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 0.75rem;
          padding: 0 1rem;
          transition: all 0.2s ease;
        }

        .comment-item:not(.is-reply):hover {
          border-color: hsl(var(--border) / 0.8);
          box-shadow: 0 2px 8px -2px hsl(var(--foreground) / 0.05);
        }

        .comment-item.is-reply {
          border-bottom: 1px solid hsl(var(--border) / 0.5);
        }

        .comment-item.is-reply:last-child {
          border-bottom: none;
        }

        .comment-body {
          line-height: 1.6;
        }

        .comment-body .prose-compact {
          max-width: none;
        }

        .comment-body .prose-compact > *:first-child {
          margin-top: 0;
        }

        .comment-body .prose-compact > *:last-child {
          margin-bottom: 0;
        }

        .comment-body pre {
          margin: 0.5rem 0;
          padding: 0.75rem 1rem;
          background: hsl(var(--muted));
          border-radius: 0.5rem;
          font-size: 0.875rem;
          overflow-x: auto;
        }

        .comment-body code:not(pre code) {
          padding: 0.125rem 0.375rem;
          background: hsl(var(--muted));
          border-radius: 0.25rem;
          font-size: 0.875em;
        }

        .reply-form-container {
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .replies-container {
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      {/* 删除评论确认弹窗 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="删除评论"
        description="确定要删除这条评论吗？此操作不可恢复。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  );
};

export default CommentItem;
