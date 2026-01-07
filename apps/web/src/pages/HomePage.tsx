import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  ArrowRight,
  ArrowDown,
  Loader2,
  User,
  Github,
  Mail,
  Calendar,
  Eye,
  Heart,
  Tag,
  BookOpen,
  Feather,
} from 'lucide-react';
import { api } from '@whispers/utils';
import { FallingPattern } from '@whispers/ui';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  published: boolean;
  coverImage?: string | null;
  category: string | null;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  postTags: Array<{
    id: string;
    postId: string;
    tagId: string;
    tag: {
      id: string;
      name: string;
      slug: string;
      color?: string | null;
    };
  }>;
  _count?: {
    postComments: number;
    postLikes: number;
  };
}

interface SiteConfig {
  siteName: string;
  siteDescription?: string;
  siteLogo?: string | null;
  ownerName?: string | null;
  ownerAvatar?: string | null;
  contactEmail?: string | null;
  socialLinks?: {
    github?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
  };
}

interface TagWithCount {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

const PAGE_SIZE = 8;

// 打字机效果 Hook
const useTypewriter = (text: string, speed = 100, delay = 500) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setIsTyping(true);

    const startTimeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, delay]);

  return { displayText, isTyping };
};

// 文章时间线项
const TimelinePost: React.FC<{ post: Post; isFirst?: boolean }> = ({
  post,
  isFirst: _isFirst,
}) => {
  const date = new Date(post.createdAt);
  const monthDay = date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="group relative pl-8 pb-8 last:pb-0">
      {/* 时间线 */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border group-last:bg-gradient-to-b group-last:from-border group-last:to-transparent" />

      {/* 时间点 */}
      <div className="absolute left-0 top-1 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-primary bg-background group-hover:bg-primary group-hover:scale-125 transition-all" />

      {/* 日期标签 */}
      <time className="text-xs text-muted-foreground font-mono mb-2 block">
        {monthDay}
      </time>

      {/* 文章内容 */}
      <Link to={`/posts/${post.slug}`} className="block">
        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-tight">
          {post.title}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {post.excerpt ||
            post.content.replace(/<[^>]*>/g, '').substring(0, 120)}
          ...
        </p>

        {/* 元信息 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {post.postTags && post.postTags.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {post.postTags[0].tag.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {post.views || 0}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {post._count?.postLikes || post.likes || 0}
          </span>
        </div>
      </Link>
    </article>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [_tags, setTags] = useState<TagWithCount[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 打字机效果 - 使用博主名称，如果没有则回退到网站名称
  const { displayText, isTyping } = useTypewriter(
    siteConfig?.ownerName || siteConfig?.siteName || 'Whispers of the Heart',
    80,
    300
  );

  // 获取站点配置和标签
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [configResponse, tagsResponse] = await Promise.all([
          api.get('/site-config'),
          api.get('/blog/tags'),
        ]);

        if (configResponse.data?.success && configResponse.data?.data) {
          setSiteConfig(configResponse.data.data);
        }
        if (tagsResponse.data?.success && tagsResponse.data?.data) {
          setTags(tagsResponse.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      }
    };

    fetchInitialData();
  }, []);

  // 获取文章列表
  const fetchPosts = useCallback(async (pageNum: number, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await api.get('/blog', {
        params: {
          page: pageNum,
          limit: PAGE_SIZE,
          sort: 'createdAt',
          order: 'desc',
        },
      });

      if (response.data?.success && response.data?.data) {
        const { items, totalPages } = response.data.data;

        if (isInitial) {
          setPosts(items || []);
        } else {
          setPosts(prev => [...prev, ...(items || [])]);
        }

        setHasMore(pageNum < totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  // 无限滚动
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore]);

  // 加载更多
  useEffect(() => {
    if (page > 1) {
      fetchPosts(page);
    }
  }, [page, fetchPosts]);

  // 按年份分组文章
  const groupPostsByYear = (posts: Post[]) => {
    const groups: { [year: string]: Post[] } = {};
    posts.forEach(post => {
      const year = new Date(post.createdAt).getFullYear().toString();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(post);
    });
    return groups;
  };

  // 平滑滚动到内容区域
  const scrollToContent = () => {
    const contentSection = document.getElementById('content-section');
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">加载中...</span>
        </div>
      </div>
    );
  }

  const groupedPosts = groupPostsByYear(posts);
  const years = Object.keys(groupedPosts).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="min-h-screen">
      {/* ==================== Hero 区域 ==================== */}
      <section className="relative min-h-screen flex items-center justify-center -mt-16 overflow-hidden">
        {/* 下落图案背景 */}
        <FallingPattern
          className="absolute inset-0 z-0"
          color="hsl(var(--primary))"
          backgroundColor="hsl(var(--background))"
          duration={120}
          blurIntensity="0.8em"
        />

        {/* 渐变遮罩层 - 确保内容可读性 */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

        {/* 内容 */}
        <div className="relative z-10 text-center px-4 py-16 max-w-3xl mx-auto">
          {/* 博主头像 */}
          <div className="mb-8">
            {siteConfig?.ownerAvatar ? (
              <img
                src={siteConfig.ownerAvatar}
                alt={siteConfig?.ownerName || '博主头像'}
                className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-background shadow-lg transition-transform duration-500 hover:rotate-[360deg] select-none"
                draggable="false"
              />
            ) : (
              <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-lg transition-transform duration-500 hover:rotate-[360deg] select-none">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* 标题 - 打字机效果 */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 text-foreground min-h-[1.2em]">
            {displayText}
            {isTyping && (
              <span className="inline-block w-[3px] h-[0.9em] bg-primary ml-1 animate-blink align-middle" />
            )}
          </h1>

          {/* 站点描述 */}
          <div className="mb-10 min-h-[4em]">
            <p className="max-w-2xl mx-auto text-center text-lg md:text-xl text-muted-foreground font-serif">
              {siteConfig?.siteDescription || '记录生活的点滴，分享技术的思考'}
            </p>
          </div>

          {/* 社交链接 */}
          <div className="flex items-center justify-center gap-3 mb-12">
            {siteConfig?.socialLinks?.github && (
              <a
                href={siteConfig.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-card/80 hover:bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                title="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            )}
            {siteConfig?.contactEmail && (
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="p-3 rounded-full bg-card/80 hover:bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                title="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            )}
          </div>

          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="rounded-full px-8"
              onClick={scrollToContent}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              阅读文章
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8"
              onClick={() => navigate('/about')}
            >
              <Feather className="mr-2 h-4 w-4" />
              关于我
            </Button>
          </div>

          {/* 滚动提示 */}
          <button
            onClick={scrollToContent}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="text-xs">向下滚动</span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ==================== 内容区域 ==================== */}
      <section id="content-section" className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* 左侧：时间线文章列表 */}
            <main className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-serif font-bold text-foreground">
                    文章时间线
                  </h2>
                </div>
                <Link
                  to="/posts"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  查看全部 <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {posts.length > 0 ? (
                <div className="space-y-10">
                  {years.map(year => (
                    <div key={year}>
                      {/* 年份标题 */}
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl font-bold text-primary font-mono">
                          {year}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">
                          {groupedPosts[year].length} 篇
                        </span>
                      </div>

                      {/* 文章列表 */}
                      <div className="ml-4">
                        {groupedPosts[year].map((post, index) => (
                          <TimelinePost
                            key={post.id}
                            post={post}
                            isFirst={index === 0}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* 加载更多 */}
                  <div ref={loadMoreRef} className="flex justify-center py-6">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>加载更多...</span>
                      </div>
                    )}
                    {!hasMore && posts.length > 0 && (
                      <p className="text-muted-foreground text-sm">
                        — 已经到底了 —
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Feather className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>还没有文章，敬请期待...</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
