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
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  // 输入框的值（即时更新，不触发重新渲染）
  const [inputValue, setInputValue] = useState(searchParams.get('search') || '')
  // 实际用于 API 请求的搜索词
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '')
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || '')
  const [showBackTop, setShowBackTop] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  // 用于跟踪输入法组合状态（拼音输入）
  const isComposingRef = useRef(false)
  // 用于存储最新的筛选参数
  const filtersRef = useRef({ search: searchParams.get('search') || '', tag: searchParams.get('tag') || '' })

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

  // 获取文章列表 - 不依赖搜索词状态，使用 ref
  const fetchPosts = useCallback(async (pageNum: number, isInitial = false, search?: string, tag?: string) => {
    // 使用传入的参数或 ref 中的值
    const currentSearch = search ?? filtersRef.current.search
    const currentTag = tag ?? filtersRef.current.tag

    try {
      if (isInitial) {
        setIsSearching(true)
      } else {
        setLoadingMore(true)
      }

      const params: Record<string, unknown> = {
        page: pageNum,
        limit: PAGE_SIZE,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      // 如果有搜索词或标签筛选，使用 search 端点
      const hasFilters = currentSearch || currentTag
      if (currentSearch) {
        params.q = currentSearch
      }

      if (currentTag) {
        params.tag = currentTag
      }

      // 使用搜索端点支持标签筛选
      const endpoint = hasFilters ? '/blog/search' : '/blog'
      const response = await api.get(endpoint, { params })

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
      setIsInitialLoad(false)
      setIsSearching(false)
      setLoadingMore(false)
    }
  }, [])

  // 初始加载 - 只在组件挂载时执行一次
  useEffect(() => {
    fetchPosts(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 搜索词或标签变化时重新加载
  useEffect(() => {
    // 更新 ref
    filtersRef.current = { search: debouncedSearch, tag: activeTag }
    // 重置页码并重新加载
    setPage(1)
    fetchPosts(1, true, debouncedSearch, activeTag)
  }, [debouncedSearch, activeTag, fetchPosts])

  // 无限滚动
  useEffect(() => {
    if (isInitialLoad) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isSearching) {
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
  }, [isInitialLoad, hasMore, loadingMore, isSearching])

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

  // 防抖搜索 - 输入值变化后 300ms 触发搜索
  useEffect(() => {
    // 如果正在输入拼音，不触发搜索
    if (isComposingRef.current) {
      return
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue)
      // 更新 URL 参数（不触发页面刷新，只是同步状态）
      const newParams = new URLSearchParams()
      if (inputValue) newParams.set('search', inputValue)
      if (activeTag) newParams.set('tag', activeTag)
      setSearchParams(newParams, { replace: true })
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, activeTag, setSearchParams])

  // 搜索输入处理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // 输入法组合开始（拼音输入开始）
  const handleCompositionStart = () => {
    isComposingRef.current = true
  }

  // 输入法组合结束（拼音输入结束）
  const handleCompositionEnd = () => {
    isComposingRef.current = false
  }

  // 标签筛选
  const handleTagClick = (tagSlug: string) => {
    if (activeTag === tagSlug) {
      setActiveTag('')
    } else {
      setActiveTag(tagSlug)
    }
  }

  // 清除筛选
  const handleClearFilters = () => {
    setInputValue('')
    setDebouncedSearch('')
    setActiveTag('')
    setSearchParams({}, { replace: true })
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

  const hasFilters = debouncedSearch || activeTag
  const groupedPosts = groupPostsByYear(posts)
  const years = Object.keys(groupedPosts).sort((a, b) => Number(b) - Number(a))

  // 只在初次加载时显示全页加载状态
  if (isInitialLoad) {
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
            value={inputValue}
            onChange={handleSearchChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className="pl-10 pr-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
          />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue('')
                setDebouncedSearch('')
                const newParams = new URLSearchParams()
                if (activeTag) newParams.set('tag', activeTag)
                setSearchParams(newParams, { replace: true })
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
          {/* 搜索中的加载指示器 */}
          {isSearching && (
            <div className="flex items-center justify-center py-8 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground text-sm">搜索中...</span>
            </div>
          )}
          {!isSearching && posts.length > 0 ? (
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
          ) : !isSearching ? (
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
          ) : null}
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
