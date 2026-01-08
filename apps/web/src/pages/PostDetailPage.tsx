import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import {
  FilePreviewModal,
  type PreviewFileLink,
} from '@eternalheart/react-file-preview';
import '@eternalheart/react-file-preview/style.css';

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

  // 文件预览状态
  const [previewFiles, setPreviewFiles] = useState<PreviewFileLink[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 根据 URL 获取文件类型
  const getMimeType = useCallback((url: string): string => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      // 图片
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
      bmp: 'image/bmp',
      // 视频
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      // 音频
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      wma: 'audio/x-ms-wma',
      // 文档
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      md: 'text/markdown',
      json: 'application/json',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }, []);

  // 收集内容中的所有媒体文件
  const collectMediaFiles = useCallback((): PreviewFileLink[] => {
    const files: PreviewFileLink[] = [];
    if (!contentRef.current) return files;

    // 收集图片
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img, index) => {
      files.push({
        id: `img-${index}`,
        name: img.alt || `图片 ${index + 1}`,
        url: img.src,
        type: getMimeType(img.src),
      });
    });

    // 收集视频
    const videos = contentRef.current.querySelectorAll('video');
    videos.forEach((video, index) => {
      const src = video.src || video.querySelector('source')?.src;
      if (src) {
        files.push({
          id: `video-${index}`,
          name: `视频 ${index + 1}`,
          url: src,
          type: getMimeType(src),
        });
      }
    });

    // 收集音频
    const audios = contentRef.current.querySelectorAll('audio');
    audios.forEach((audio, index) => {
      const src = audio.src || audio.querySelector('source')?.src;
      if (src) {
        files.push({
          id: `audio-${index}`,
          name: `音频 ${index + 1}`,
          url: src,
          type: getMimeType(src),
        });
      }
    });

    // 收集指向媒体文件的链接
    const links = contentRef.current.querySelectorAll('a[href]');
    const mediaExtensions =
      /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg|mov|mp3|wav|flac|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;
    links.forEach((link, index) => {
      const href = (link as HTMLAnchorElement).href;
      if (mediaExtensions.test(href)) {
        // 避免重复添加已经作为 img/video/audio 收集的文件
        if (!files.find(f => f.url === href)) {
          files.push({
            id: `link-${index}`,
            name: link.textContent || `文件 ${index + 1}`,
            url: href,
            type: getMimeType(href),
          });
        }
      }
    });

    return files;
  }, [getMimeType]);

  // 处理内容区域的点击
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;

      // 处理图片点击
      if (target.tagName === 'IMG') {
        e.preventDefault();
        const img = target as HTMLImageElement;
        const files = collectMediaFiles();
        const clickedIndex = files.findIndex(f => f.url === img.src);
        setPreviewFiles(files);
        setPreviewIndex(clickedIndex >= 0 ? clickedIndex : 0);
        setIsPreviewOpen(true);
        return;
      }

      // 处理视频点击
      if (target.tagName === 'VIDEO' || target.closest('video')) {
        e.preventDefault();
        const video = (
          target.tagName === 'VIDEO' ? target : target.closest('video')
        ) as HTMLVideoElement;
        const src = video.src || video.querySelector('source')?.src;
        if (src) {
          const files = collectMediaFiles();
          const clickedIndex = files.findIndex(f => f.url === src);
          setPreviewFiles(files);
          setPreviewIndex(clickedIndex >= 0 ? clickedIndex : 0);
          setIsPreviewOpen(true);
        }
        return;
      }

      // 处理音频点击
      if (target.tagName === 'AUDIO' || target.closest('audio')) {
        e.preventDefault();
        const audio = (
          target.tagName === 'AUDIO' ? target : target.closest('audio')
        ) as HTMLAudioElement;
        const src = audio.src || audio.querySelector('source')?.src;
        if (src) {
          const files = collectMediaFiles();
          const clickedIndex = files.findIndex(f => f.url === src);
          setPreviewFiles(files);
          setPreviewIndex(clickedIndex >= 0 ? clickedIndex : 0);
          setIsPreviewOpen(true);
        }
        return;
      }

      // 处理媒体文件链接点击
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      if (link) {
        const href = link.href;
        const mediaExtensions =
          /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg|mov|mp3|wav|flac|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;
        if (mediaExtensions.test(href)) {
          e.preventDefault();
          const files = collectMediaFiles();
          const clickedIndex = files.findIndex(f => f.url === href);
          setPreviewFiles(files);
          setPreviewIndex(clickedIndex >= 0 ? clickedIndex : 0);
          setIsPreviewOpen(true);
        }
      }
    },
    [collectMediaFiles]
  );

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
        } catch (error) {
          console.error('Failed to fetch user status:', error);
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
        setLikesCount(postData.likes || 0);

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
    } catch (error) {
      console.error('Failed to fetch post:', error);
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
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* 返回链接 */}
      <Link
        to="/posts"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 md:mb-8"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        返回文章列表
      </Link>

      {/* 文章头部 */}
      <header className="mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight mb-4 md:mb-6">
          {post.title}
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
            {/* 更新时间气泡提示 */}
            {post.updatedAt !== post.createdAt && (
              <>
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-primary rounded-full" />
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

        {/* 标签 */}
        {post.postTags && post.postTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
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
      </header>

      {/* 封面图 */}
      {post.coverImage && (
        <figure className="mb-8 md:mb-12 -mx-4 sm:mx-0">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full sm:rounded-lg object-cover max-h-[300px] sm:max-h-[400px] md:max-h-[500px]"
          />
        </figure>
      )}

      {/* 文章内容 */}
      <div
        ref={contentRef}
        onClick={handleContentClick}
        className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none mb-8 md:mb-12 overflow-x-auto [&_img]:cursor-pointer [&_img]:transition-opacity [&_img:hover]:opacity-90 [&_video]:cursor-pointer [&_audio]:cursor-pointer"
      >
        <MarkdownRenderer content={post.content} className="prose-article" />
      </div>

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
        <CommentList postId={post.id} onCommentCountChange={setCommentCount} />
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

      {/* 文件预览 */}
      <FilePreviewModal
        files={previewFiles}
        currentIndex={previewIndex}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onNavigate={setPreviewIndex}
      />
    </article>
  );
};

export default PostDetailPage;
