import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Tag,
  Share2,
  Bookmark,
  ArrowLeft,
  FileX,
  Home,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { MarkdownRenderer } from '@whispers/ui';
import CommentList from '../components/CommentList';
import LoginDialog from '../components/LoginDialog';
import ShareDialog from '../components/ShareDialog';
import { blogApi } from '../services/blogApi';
import { useAuthStore } from '../stores/useAuthStore';
import { useToast } from '../contexts/ToastContext';
import { api, getMediaUrl } from '@whispers/utils';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  coverImage?: string | null;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  isRepost?: boolean;
  sourceUrl?: string | null;
  sourceAuthor?: string | null;
  sourceName?: string | null;
  author: {
    id: string;
    username: string;
    avatar?: string | null;
  };
  postTags: Array<{
    id: string;
    tag: {
      id: string;
      name: string;
      slug: string;
      color?: string | null;
    };
  }>;
  _count: {
    postComments: number;
    postLikes: number;
  };
}

const PostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'like' | 'bookmark' | null
  >(null);
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  // 监听登录状态变化，重新获取点赞和收藏状态
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (isAuthenticated && post) {
        try {
          const [likeStatus, favoriteStatus] = await Promise.all([
            blogApi.getLikeStatus(post.id),
            blogApi.getFavoriteStatus(post.id),
          ]);
          setIsLiked(likeStatus.liked);
          setIsBookmarked(favoriteStatus.favorited);
        } catch (_error) {
          // ignore error
        }
      } else if (!isAuthenticated) {
        // 用户退出登录时重置状态
        setIsLiked(false);
        setIsBookmarked(false);
      }
    };

    fetchUserStatus();
  }, [isAuthenticated, post?.id]);

  const fetchPost = async (slug: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/blog/slug/${slug}`);

      if (response.data?.success && response.data?.data) {
        const postData = response.data.data;
        setPost(postData);
        setCommentCount(postData._count?.postComments || 0);
        setLikesCount(postData._count?.postLikes || 0);

        if (isAuthenticated) {
          try {
            const [likeStatus, favoriteStatus] = await Promise.all([
              blogApi.getLikeStatus(postData.id),
              blogApi.getFavoriteStatus(postData.id),
            ]);
            setIsLiked(likeStatus.liked);
            setIsBookmarked(favoriteStatus.favorited);
          } catch (_error) {
            setIsLiked(false);
            setIsBookmarked(false);
          }
        }
      } else {
        setPost(null);
      }
    } catch (_error) {
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      setPendingAction('like');
      setShowLoginDialog(true);
      return;
    }

    if (!post || isLikeLoading) return;

    try {
      setIsLikeLoading(true);
      const result = await blogApi.toggleLike(post.id);
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);

      addToast({
        title: result.liked ? '点赞成功' : '取消点赞',
        variant: 'success',
      });
    } catch (_error) {
      addToast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setPendingAction('bookmark');
      setShowLoginDialog(true);
      return;
    }

    if (!post || isFavoriteLoading) return;

    try {
      setIsFavoriteLoading(true);
      const result = await blogApi.toggleFavorite(post.id);
      setIsBookmarked(result.favorited);

      addToast({
        title: result.favorited ? '收藏成功' : '取消收藏',
        variant: 'success',
      });
    } catch (_error) {
      addToast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleShare = () => {
    if (!post) return;
    setShowShareDialog(true);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-0 py-12 sm:py-20">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-0 py-12 sm:py-20 text-center">
        <FileX className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-muted-foreground" />
        <h1 className="text-xl sm:text-2xl font-serif mb-3 sm:mb-4">
          文章未找到
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
          抱歉，您访问的文章不存在或已被删除。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>
          <Link to="/posts">
            <Button className="w-full sm:w-auto">
              <FileText className="w-4 h-4 mr-2" />
              浏览文章
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article>
      {/* Hero 封面区域 - 全宽贴顶 */}
      {post.coverImage ? (
        <div className="relative w-screen -ml-[50vw] left-1/2 -mt-8 mb-8 md:mb-12">
          {/* 封面图 */}
          <div className="relative h-[280px] sm:h-[360px] md:h-[450px] lg:h-[520px] overflow-hidden">
            <img
              src={getMediaUrl(post.coverImage)}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            {/* 底部渐变遮罩 - 保持通透 */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 via-40% to-transparent" />
          </div>

          {/* 返回按钮 - 左上角 */}
          <Link
            to="/posts"
            className="absolute top-4 left-4 sm:top-6 sm:left-6 inline-flex items-center text-sm text-white/80 hover:text-white bg-black/20 hover:bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Link>

          {/* 封面标识 - 右上角 */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <span className="px-2 py-1 text-xs font-medium bg-black/20 backdrop-blur-sm rounded text-white/80">
              封面
            </span>
          </div>

          {/* 标题和元信息叠加在底部 */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-6 sm:pb-8">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight mb-3 md:mb-4 text-foreground drop-shadow-sm">
                {post.title}
                {post.isRepost && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-300 backdrop-blur-sm ml-3 align-middle">
                    <ExternalLink className="h-3 w-3" />
                    转载
                  </span>
                )}
              </h1>

              {/* 元信息 */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-2 ring-background/50">
                    {post.author.avatar ? (
                      <img
                        src={getMediaUrl(post.author.avatar)}
                        alt={post.author.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium text-primary">
                        {post.author.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span>{post.author.username}</span>
                </div>

                <span className="text-muted-foreground/50 hidden sm:inline">
                  ·
                </span>

                <div className="relative flex items-center gap-1 group/time">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>
                    {new Date(post.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {/* 更新时间气泡提示 */}
                  {post.updatedAt !== post.createdAt && (
                    <>
                      <span className="absolute -top-1 -right-2 size-[6px] bg-primary rounded-full" />
                      <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-popover border rounded-md shadow-md text-xs whitespace-nowrap opacity-0 invisible group-hover/time:opacity-100 group-hover/time:visible transition-all z-10">
                        更新于{' '}
                        {new Date(post.updatedAt).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </div>
                    </>
                  )}
                </div>

                <span className="text-muted-foreground/50 hidden sm:inline">
                  ·
                </span>

                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{post.views} 阅读</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 无封面时的普通头部 */
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-0 mb-4 md:mb-12">
          <Link
            to="/posts"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 md:mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回文章列表
          </Link>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight mb-4 md:mb-6">
            {post.title}
            {post.isRepost && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 ml-3 align-middle">
                <ExternalLink className="h-3 w-3" />
                转载
              </span>
            )}
          </h1>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {post.author.avatar ? (
                  <img
                    src={getMediaUrl(post.author.avatar)}
                    alt={post.author.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-primary">
                    {post.author.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span>{post.author.username}</span>
            </div>

            <span className="text-muted-foreground/50 hidden sm:inline">·</span>

            <div className="relative flex items-center gap-1 group/time">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>
                {new Date(post.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {post.updatedAt !== post.createdAt && (
                <>
                  <span className="absolute -top-1 -right-2 size-[6px] bg-primary rounded-full" />
                  <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-popover border rounded-md shadow-md text-xs whitespace-nowrap opacity-0 invisible group-hover/time:opacity-100 group-hover/time:visible transition-all z-10">
                    更新于{' '}
                    {new Date(post.updatedAt).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </div>
                </>
              )}
            </div>

            <span className="text-muted-foreground/50 hidden sm:inline">·</span>

            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{post.views} 阅读</span>
            </div>
          </div>
        </div>
      )}

      {/* 正文区域 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-0">
        {/* 标签 */}
        {post.postTags && post.postTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.postTags.map(postTag => (
              <span
                key={postTag.id}
                className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs bg-secondary/50 text-secondary-foreground"
              >
                <Tag className="h-3 w-3 mr-1" />
                {postTag.tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 文章内容 */}
        <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none mb-8 md:mb-12 overflow-x-auto">
          <MarkdownRenderer content={post.content} className="prose-article" />
        </div>

        {/* 转载来源信息 */}
        {post.isRepost &&
          (post.sourceName || post.sourceAuthor || post.sourceUrl) && (
            <div className="border border-border/60 rounded-lg px-5 py-4 mb-8 md:mb-12 bg-muted/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="font-medium">转载声明</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                本文转载自
                {post.sourceName && (
                  <span className="font-medium text-foreground">
                    {post.sourceName}
                  </span>
                )}
                {post.sourceAuthor && (
                  <span>
                    {post.sourceName ? '，' : ''}作者{' '}
                    <span className="font-medium text-foreground">
                      {post.sourceAuthor}
                    </span>
                  </span>
                )}
                。原文内容版权归原作者所有。
              </p>
              {post.sourceUrl && (
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                >
                  查看原文
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

        {/* 操作栏 */}
        <div className="flex items-center justify-between py-4 border-y mb-8 md:mb-12">
          <div className="flex items-center gap-2">
            <Button
              variant={isLiked ? 'default' : 'ghost'}
              size="sm"
              onClick={handleLike}
              disabled={isLikeLoading}
            >
              <Heart
                className={`h-4 w-4 mr-1.5 ${isLiked ? 'fill-current' : ''}`}
              />
              {likesCount}
            </Button>

            <Button
              variant={isBookmarked ? 'default' : 'ghost'}
              size="sm"
              onClick={handleBookmark}
              disabled={isFavoriteLoading}
            >
              <Bookmark
                className={`h-4 w-4 mr-1.5 ${isBookmarked ? 'fill-current' : ''}`}
              />
              收藏
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1.5" />
              分享
            </Button>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount} 评论</span>
          </div>
        </div>

        {/* 评论区 */}
        <section id="comments">
          <CommentList
            postId={post.id}
            onCommentCountChange={setCommentCount}
          />
        </section>

        {/* 登录弹窗 */}
        <LoginDialog
          isOpen={showLoginDialog}
          onClose={() => {
            setShowLoginDialog(false);
            setPendingAction(null);
          }}
          title={
            pendingAction === 'like'
              ? '需要登录才能点赞'
              : pendingAction === 'bookmark'
                ? '需要登录才能收藏'
                : '需要登录'
          }
          description="登录后即可进行此操作"
        />

        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          title={post.title}
          url={window.location.href}
          description={post.excerpt || undefined}
        />
      </div>
    </article>
  );
};

export default PostDetailPage;
