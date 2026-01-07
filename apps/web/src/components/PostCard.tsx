import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Tag,
  Bookmark,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './ui/card';
import { Button } from './ui/button';
import LoginDialog from './LoginDialog';
import ConfirmDialog from './ConfirmDialog';
import { blogApi } from '../services/blogApi';
import { useAuthStore } from '../stores/useAuthStore';
import { useToast } from '../contexts/ToastContext';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    excerpt: string | null;
    coverImage?: string | null;
    category: string | null;
    slug: string;
    createdAt: string;
    views: number;
    likes: number;
    comments: number;
    postTags: Array<{
      id: string;
      postId: string;
      tagId: string;
      tag: {
        id: string;
        name: string;
        slug: string;
        color?: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>;
  };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'like' | 'bookmark' | null
  >(null);
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setPendingAction('like');
      setShowConfirmDialog(true);
      return;
    }

    if (isLikeLoading) return;

    try {
      setIsLikeLoading(true);
      const result = await blogApi.toggleLike(post.id);
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);

      addToast({
        title: result.liked ? '点赞成功' : '取消点赞',
        description: result.liked ? '感谢您的支持！' : '已取消点赞',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to toggle like:', error);
      addToast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setPendingAction('bookmark');
      setShowConfirmDialog(true);
      return;
    }

    if (isFavoriteLoading) return;

    try {
      setIsFavoriteLoading(true);
      const result = await blogApi.toggleFavorite(post.id);
      setIsBookmarked(result.favorited);

      addToast({
        title: result.favorited ? '收藏成功' : '取消收藏',
        description: result.favorited ? '文章已添加到收藏' : '已取消收藏',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      addToast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleConfirmLogin = () => {
    setShowLoginDialog(true);
  };

  const getConfirmDialogProps = () => {
    if (pendingAction === 'like') {
      return {
        title: '需要登录才能点赞',
        description: '登录后即可为喜欢的文章点赞，是否前往登录页面？',
        confirmText: '前往登录',
        variant: 'default' as const,
      };
    } else if (pendingAction === 'bookmark') {
      return {
        title: '需要登录才能收藏',
        description: '登录后即可收藏喜欢的文章，是否前往登录页面？',
        confirmText: '前往登录',
        variant: 'bookmark' as const,
      };
    }
    return {
      title: '需要登录',
      description: '请先登录后再进行此操作',
      confirmText: '前往登录',
      variant: 'default' as const,
    };
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-fit max-h-96 flex flex-col">
      {/* 文章封面图 */}
      {post.coverImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <CardHeader>
        {/* 分类标签 */}
        {post.category && (
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {post.category}
            </span>
          </div>
        )}

        {/* 文章标题 */}
        <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
          <Link to={`/posts/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </CardTitle>

        {/* 文章摘要 */}
        <CardDescription className="line-clamp-3 text-muted-foreground">
          {post.excerpt}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* 标签 */}
        <div className="mb-4">
          {post.postTags && post.postTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {post.postTags.slice(0, 3).map(postTag => (
                <span
                  key={postTag.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground"
                  style={{
                    backgroundColor: postTag.tag.color
                      ? `${postTag.tag.color}20`
                      : undefined,
                    color: postTag.tag.color || undefined,
                  }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {postTag.tag.name}
                </span>
              ))}
              {post.postTags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{post.postTags.length - 3}
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">暂无标签</div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
        {/* 左侧信息 */}
        <div className="flex items-center space-x-4">
          {/* 发布时间 */}
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        {/* 右侧统计和操作 */}
        <div className="flex items-center space-x-2">
          {/* 浏览量 */}
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span className="text-sm">{post.views}</span>
          </div>

          {/* 点赞按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLikeLoading || !isAuthenticated}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <Heart
              className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current text-red-500' : ''}`}
            />
            <span className="text-sm">
              {isLikeLoading ? '...' : likesCount}
            </span>
          </Button>

          {/* 收藏按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={isFavoriteLoading || !isAuthenticated}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <Bookmark
              className={`w-4 h-4 mr-1 ${isBookmarked ? 'fill-current text-yellow-500' : ''}`}
            />
          </Button>

          {/* 评论数 */}
          <div className="flex items-center space-x-1 text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{post.comments}</span>
          </div>
        </div>
      </CardFooter>

      {/* 登录对话框 */}
      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        title="需要登录"
        description="请先登录后再进行点赞或收藏操作"
      />

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmLogin}
        {...getConfirmDialogProps()}
      />
    </Card>
  );
};

export default PostCard;
