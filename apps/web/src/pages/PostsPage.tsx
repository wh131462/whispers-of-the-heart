import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Search,
  Calendar,
  Eye,
  Heart,
  Tag,
  Loader2,
  Feather,
  X,
  Archive,
  ArrowUp
} from 'lucide-react'
import { api } from '@whispers/utils'

interface Post {
  id: string
  title: string
  content: string
  excerpt: string | null
  slug: string
  published: boolean
  coverImage?: string | null
  category: string | null
  views: number
  likes: number
  comments: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    avatar?: string
  }
  postTags: Array<{
    id: string
    postId: string
    tagId: string
    tag: {
      id: string
      name: string
      slug: string
      color?: string | null
    }
  }>
  _count?: {
    postComments: number
    postLikes: number
  }
}

interface TagWithCount {
  id: string
  name: string
  slug: string
  postCount: number
}

const PAGE_SIZE = 12

// 时间线文章项
const TimelinePost: React.FC<{ post: Post }> = ({ post }) => {
  const date = new Date(post.createdAt)
  const monthDay = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })

  return (
    <article className="group relative pl-8 pb-6 last:pb-0">
      {/* 时间线 */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border group-last:bg-gradient-to-b group-last:from-border group-last:to-transparent" />

      {/* 时间点 */}
      <div className="absolute left-0 top-1.5 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-primary bg-background group-hover:bg-primary group-hover:scale-125 transition-all" />

      {/* 日期标签 */}
      <time className="text-xs text-muted-foreground font-mono mb-1.5 block">
        {monthDay}
      </time>

      {/* 文章内容 */}
      <Link to={`/posts/${post.slug}`} className="block">
        <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors leading-snug">
          {post.title}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2">
          {post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
        </p>

        {/* 元信息 */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
  )
}

const PostsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || '')
  const [showBackTop, setShowBackTop] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 获取标签列表
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.get('/blog/tags')
        if (response.data?.success && response.data?.data) {
          setTags(response.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      }
    }
    fetchTags()
  }, [])

  // 获取文章列表
  const fetchPosts = useCallback(async (pageNum: number, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const params: Record<string, unknown> = {
        page: pageNum,
        limit: PAGE_SIZE,
        sort: 'createdAt',
        order: 'desc'
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      if (activeTag) {
        params.tag = activeTag
      }

      const response = await api.get('/blog', { params })

      if (response.data?.success && response.data?.data) {
        const { items, totalPages, total: totalCount } = response.data.data

        if (isInitial) {
          setPosts(items || [])
        } else {
          setPosts(prev => [...prev, ...(items || [])])
        }

        setTotal(totalCount || 0)
        setHasMore(pageNum < totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchTerm, activeTag])

  // 初始加载
  useEffect(() => {
    setPage(1)
    fetchPosts(1, true)
  }, [fetchPosts])

  // 无限滚动
  useEffect(() => {
    if (loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage(prev => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current = observer

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, loadingMore])

  // 加载更多
  useEffect(() => {
    if (page > 1) {
      fetchPosts(page)
    }
  }, [page, fetchPosts])

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 搜索处理（防抖）
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (value) {
        setSearchParams({ search: value })
      } else {
        searchParams.delete('search')
        setSearchParams(searchParams)
      }
    }, 500)
  }

  // 标签筛选
  const handleTagClick = (tagSlug: string) => {
    if (activeTag === tagSlug) {
      setActiveTag('')
      searchParams.delete('tag')
    } else {
      setActiveTag(tagSlug)
      searchParams.set('tag', tagSlug)
    }
    setSearchParams(searchParams)
  }

  // 清除筛选
  const handleClearFilters = () => {
    setSearchTerm('')
    setActiveTag('')
    setSearchParams({})
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
  }

  // 返回顶部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 按年份分组文章
  const groupPostsByYear = (posts: Post[]) => {
    const groups: { [year: string]: Post[] } = {}
    posts.forEach(post => {
      const year = new Date(post.createdAt).getFullYear().toString()
      if (!groups[year]) {
        groups[year] = []
      }
      groups[year].push(post)
    })
    return groups
  }

  // 计算归档统计
  const getArchiveStats = () => {
    const stats: { [year: string]: number } = {}
    posts.forEach(post => {
      const year = new Date(post.createdAt).getFullYear().toString()
      stats[year] = (stats[year] || 0) + 1
    })
    return Object.entries(stats).sort((a, b) => Number(b[0]) - Number(a[0]))
  }

  const hasFilters = searchTerm || activeTag
  const groupedPosts = groupPostsByYear(posts)
  const years = Object.keys(groupedPosts).sort((a, b) => Number(b) - Number(a))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* 页面标题 */}
      <header className="text-center mb-10">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-3">
          文章归档
        </h1>
        <p className="text-muted-foreground">
          共 {total} 篇文章，记录点滴思考
        </p>
      </header>

      {/* 搜索栏 */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="搜索文章..."
            defaultValue={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('')
                searchParams.delete('search')
                setSearchParams(searchParams)
                if (searchInputRef.current) {
                  searchInputRef.current.value = ''
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 标签筛选 */}
      {tags.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {tags.slice(0, 15).map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.slug)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  activeTag === tag.slug
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {tag.name}
                <span className="ml-1 text-xs opacity-70">({tag.postCount})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 筛选状态 */}
      {hasFilters && (
        <div className="flex items-center justify-center gap-2 mb-8 text-sm text-muted-foreground">
          <span>
            找到 <strong className="text-foreground">{total}</strong> 篇相关文章
          </span>
          <button
            onClick={handleClearFilters}
            className="text-primary hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            清除筛选
          </button>
        </div>
      )}

      {/* 主体内容 */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* 左侧：文章时间线 */}
        <main className="flex-1 min-w-0">
          {posts.length > 0 ? (
            <div className="space-y-8">
              {years.map(year => (
                <div key={year}>
                  {/* 年份标题 */}
                  <div className="flex items-center gap-3 mb-5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold text-primary font-mono">{year}</span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">
                      {groupedPosts[year].length} 篇
                    </span>
                  </div>

                  {/* 文章列表 */}
                  <div className="ml-2">
                    {groupedPosts[year].map((post) => (
                      <TimelinePost key={post.id} post={post} />
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
                  <p className="text-muted-foreground text-sm">— 已经到底了 —</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Feather className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">
                {hasFilters ? '没有找到匹配的文章' : '还没有文章'}
              </p>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  清除筛选条件
                </Button>
              )}
            </div>
          )}
        </main>

        {/* 右侧：侧边栏 */}
        <aside className="w-full lg:w-56 flex-shrink-0 space-y-8">
          {/* 归档统计 */}
          {getArchiveStats().length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Archive className="h-4 w-4" />
                归档
              </h3>
              <div className="space-y-2">
                {getArchiveStats().map(([year, count]) => (
                  <div
                    key={year}
                    className="flex items-center justify-between text-sm text-muted-foreground"
                  >
                    <span className="font-mono">{year} 年</span>
                    <span>{count} 篇</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 标签云 */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                标签
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 20).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.slug)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      activeTag === tag.slug
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* 返回顶部 */}
      {showBackTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          title="返回顶部"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

export default PostsPage
