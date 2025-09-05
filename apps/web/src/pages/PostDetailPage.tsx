import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Eye, Heart, MessageCircle, Tag, Share2, Bookmark, ArrowLeft, FileX, Home, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { MarkdownRenderer } from '@whispers/ui'
import CommentForm from '../components/CommentForm'
import CommentList from '../components/CommentList'
import LoginDialog from '../components/LoginDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import { blogApi } from '../services/blogApi'
import { useAuthStore } from '../stores/useAuthStore'
import { useToast } from '../contexts/ToastContext'

interface Post {
  id: string
  title: string
  content: string
  excerpt: string | null
  status: string
  category: string | null
  coverImage?: string | null
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  comments: number
  author: {
    id: string
    username: string
    avatar?: string | null
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
      createdAt: string
      updatedAt: string
    }
  }>
  _count: {
    postComments: number
    postLikes: number
  }
}


const PostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentRefreshKey, setCommentRefreshKey] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [likesCount, setLikesCount] = useState(0)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'like' | 'bookmark' | null>(null)
  const { isAuthenticated } = useAuthStore()
  const { addToast } = useToast()

  useEffect(() => {
    if (slug) {
      fetchPost(slug)
    }
  }, [slug])

  const fetchPost = async (slug: string) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:7777/api/v1/blog/slug/${slug}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setPost(result.data)
          setCommentCount(result.data._count?.postComments || 0)
          setLikesCount(result.data.likes || 0)
          
          // 如果用户已登录，获取点赞和收藏状态
          if (isAuthenticated) {
            try {
              const [likeStatus, favoriteStatus] = await Promise.all([
                blogApi.getLikeStatus(result.data.id),
                blogApi.getFavoriteStatus(result.data.id)
              ])
              setIsLiked(likeStatus.liked)
              setIsBookmarked(favoriteStatus.favorited)
            } catch (error) {
              console.error('Failed to fetch like/favorite status:', error)
              // 如果获取状态失败，重置为默认值
              setIsLiked(false)
              setIsBookmarked(false)
            }
          } else {
            // 如果用户未登录，重置状态
            setIsLiked(false)
            setIsBookmarked(false)
          }
        } else {
          throw new Error(result.message || '获取文章失败')
        }
      } else if (response.status === 404) {
        // 文章不存在
        setPost(null)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to fetch post:', error)
      // API请求失败，不设置post，让页面显示"文章未找到"
      setPost(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <FileX className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">文章未找到</h1>
          <p className="text-muted-foreground mb-6">抱歉，您访问的文章不存在或已被删除。</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Link>
            <Link 
              to="/posts" 
              className="inline-flex items-center px-4 py-2 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              浏览文章
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      setPendingAction('like')
      setShowConfirmDialog(true)
      return
    }

    if (!post || isLikeLoading) return

    try {
      setIsLikeLoading(true)
      const result = await blogApi.toggleLike(post.id)
      setIsLiked(result.liked)
      setLikesCount(result.likesCount)
      
      addToast({
        title: result.liked ? '点赞成功' : '取消点赞',
        description: result.liked ? '感谢您的支持！' : '已取消点赞',
        variant: 'success'
      })
    } catch (error) {
      console.error('Failed to toggle like:', error)
      addToast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsLikeLoading(false)
    }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setPendingAction('bookmark')
      setShowConfirmDialog(true)
      return
    }

    if (!post || isFavoriteLoading) return

    try {
      setIsFavoriteLoading(true)
      const result = await blogApi.toggleFavorite(post.id)
      setIsBookmarked(result.favorited)
      
      addToast({
        title: result.favorited ? '收藏成功' : '取消收藏',
        description: result.favorited ? '文章已添加到收藏' : '已取消收藏',
        variant: 'success'
      })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      addToast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  const handleShare = async () => {
    if (!post) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: window.location.href,
        })
        addToast({
          title: '分享成功',
          description: '感谢您的分享！',
          variant: 'success'
        })
      } else {
        // 降级到复制链接
        await blogApi.sharePost(post.id, 'copy')
        addToast({
          title: '链接已复制',
          description: '文章链接已复制到剪贴板',
          variant: 'success'
        })
      }
    } catch (error) {
      console.error('Failed to share:', error)
      // 如果分享失败，尝试复制链接
      try {
        await blogApi.sharePost(post.id, 'copy')
        addToast({
          title: '链接已复制',
          description: '文章链接已复制到剪贴板',
          variant: 'success'
        })
      } catch (copyError) {
        console.error('Failed to copy link:', copyError)
        addToast({
          title: '分享失败',
          description: '请手动复制链接',
          variant: 'destructive'
        })
      }
    }
  }

  const handleConfirmLogin = () => {
    setShowLoginDialog(true)
  }

  const getConfirmDialogProps = () => {
    if (pendingAction === 'like') {
      return {
        title: '需要登录才能点赞',
        description: '登录后即可为喜欢的文章点赞，是否前往登录页面？',
        confirmText: '前往登录',
        variant: 'default' as const
      }
    } else if (pendingAction === 'bookmark') {
      return {
        title: '需要登录才能收藏',
        description: '登录后即可收藏喜欢的文章，是否前往登录页面？',
        confirmText: '前往登录',
        variant: 'bookmark' as const
      }
    }
    return {
      title: '需要登录',
      description: '请先登录后再进行此操作',
      confirmText: '前往登录',
      variant: 'default' as const
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 返回按钮 */}
      <div>
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Link>
      </div>

      {/* 文章头部 */}
      <div className="space-y-6">
        {/* 分类标签 */}
        {post.category && (
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
              {post.category}
            </span>
          </div>
        )}

        {/* 文章标题 */}
        <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
          {post.title}
        </h1>

        {/* 文章摘要 */}
        {post.excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* 文章元信息 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            {/* 作者信息 */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                {post.author.avatar ? (
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.username}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-primary">
                    {post.author.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span>作者：{post.author.username}</span>
            </div>
            
            {/* 发布时间 */}
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
            
            {/* 阅读量 */}
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{post.views} 次阅读</span>
            </div>
          </div>

          {/* 文章统计 */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{likesCount} 次点赞</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{commentCount} 条评论</span>
            </div>
          </div>
        </div>
      </div>

      {/* 特色图片 */}
      {post.coverImage && (
        <div className="aspect-video overflow-hidden rounded-lg">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 文章内容 */}
      <div className="prose prose-lg max-w-none">
        <MarkdownRenderer 
          content={post.content}
          className="prose prose-lg max-w-none"
        />
      </div>

      {/* 文章操作区域 */}
      <div className="space-y-6">
        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-muted/30 rounded-lg border">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-foreground">喜欢这篇文章？</h3>
            <p className="text-sm text-muted-foreground">支持作者，分享给更多人</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant={isLiked ? 'default' : 'outline'}
              size="lg"
              onClick={handleLike}
              disabled={isLikeLoading || !isAuthenticated}
              className="min-w-[100px]"
            >
              <Heart className={`h-5 w-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {isLikeLoading ? '...' : `${likesCount} 点赞`}
            </Button>

            <Button
              variant={isBookmarked ? 'default' : 'outline'}
              size="lg"
              onClick={handleBookmark}
              disabled={isFavoriteLoading || !isAuthenticated}
              className="min-w-[100px]"
            >
              <Bookmark className={`h-5 w-5 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
              {isFavoriteLoading ? '...' : '收藏'}
            </Button>

            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleShare}
              className="min-w-[100px]"
            >
              <Share2 className="h-5 w-5 mr-2" />
              分享
            </Button>
          </div>
        </div>

        {/* CC授权说明 */}
        <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">CC</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                知识共享许可协议
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                本文采用 <a 
                  href="https://creativecommons.org/licenses/by-nc-sa/4.0/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:no-underline font-medium"
                >
                  CC BY-NC-SA 4.0
                </a> 许可协议。您可以自由地：
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <li>• <strong>分享</strong> — 在任何媒介以任何形式复制、发行本作品</li>
                <li>• <strong>演绎</strong> — 修改、转换或以本作品为基础进行创作</li>
                <li>• <strong>署名</strong> — 您必须给出适当的署名，提供指向本许可协议的链接</li>
                <li>• <strong>非商业性使用</strong> — 您不得将本作品用于商业目的</li>
                <li>• <strong>相同方式共享</strong> — 如果您修改、转换或以本作品为基础进行创作，您必须基于与原先许可协议相同的许可协议分发您贡献的作品</li>
              </ul>
            </div>
          </div>
        </div>
      </div>


      {/* 标签 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">标签</h3>
        {post.postTags && post.postTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {post.postTags.map((postTag) => (
              <span
                key={postTag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary text-secondary-foreground"
                style={{ 
                  backgroundColor: postTag.tag.color ? `${postTag.tag.color}20` : undefined,
                  color: postTag.tag.color || undefined
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {postTag.tag.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无标签</p>
        )}
      </div>


      {/* 评论区域 */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold">评论</h2>
        
        {/* 评论表单 */}
        <CommentForm 
          postId={post.id} 
          onCommentAdded={() => {
            // 触发评论列表刷新
            setCommentRefreshKey(prev => prev + 1)
            // 增加评论数量
            setCommentCount(prev => prev + 1)
          }}
        />
        
        {/* 评论列表 */}
        <CommentList 
          key={commentRefreshKey} 
          postId={post.id} 
          onCommentCountChange={setCommentCount}
        />
      </div>

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
          setShowConfirmDialog(false)
          setPendingAction(null)
        }}
        onConfirm={handleConfirmLogin}
        {...getConfirmDialogProps()}
      />
    </div>
  )
}

export default PostDetailPage

