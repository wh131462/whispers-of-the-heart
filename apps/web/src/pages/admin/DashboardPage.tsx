import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, MessageSquare, Eye, Users, Tag, Loader2 } from 'lucide-react'
import { blogApi } from '@whispers/utils'

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalComments: number
  pendingComments: number
  totalViews: number
  totalUsers: number
  totalTags: number
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await blogApi.getDashboard()
        if (response.data?.success) {
          setStats(response.data.data)
        } else {
          setError('获取统计数据失败')
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
        setError('获取统计数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
        {error}
      </div>
    )
  }

  const statCards = [
    {
      title: '文章总数',
      value: stats?.totalPosts || 0,
      icon: FileText,
      color: 'bg-blue-500',
      subtext: `已发布 ${stats?.publishedPosts || 0} / 草稿 ${stats?.draftPosts || 0}`,
    },
    {
      title: '评论总数',
      value: stats?.totalComments || 0,
      icon: MessageSquare,
      color: 'bg-green-500',
      subtext: `待审核 ${stats?.pendingComments || 0}`,
    },
    {
      title: '总浏览量',
      value: stats?.totalViews || 0,
      icon: Eye,
      color: 'bg-purple-500',
      subtext: '累计浏览',
    },
    {
      title: '用户数量',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-orange-500',
      subtext: '注册用户',
    },
    {
      title: '标签数量',
      value: stats?.totalTags || 0,
      icon: Tag,
      color: 'bg-pink-500',
      subtext: '文章标签',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">仪表盘</h1>
        <p className="text-muted-foreground mt-1">欢迎回来！这是您的博客概览。</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-card rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-2">{card.subtext}</p>
            </div>
          )
        })}
      </div>

      {/* 快捷操作 */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/admin/posts/new"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            写新文章
          </Link>
          <Link
            to="/admin/comments"
            className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            审核评论
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
