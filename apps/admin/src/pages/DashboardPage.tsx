import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import ProtectedPage from '../components/ProtectedPage'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Image, 
  Eye,
  ThumbsUp,
  MessageCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  Plus,
  Edit,
  Settings,
  UserPlus,
  Upload
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

interface DashboardStats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  totalMedia: number
  userGrowth: string
  postGrowth: string
  recentPosts: Array<{
    id: string
    title: string
    views: number
    likes: number
    comments: number
    createdAt: string
  }>
  recentComments: Array<{
    id: string
    content: string
    author: string | {
      id: string
      username: string
      avatar?: string
    }
    postTitle: string
    createdAt: string
  }>
  monthlyStats: Array<{
    month: string
    posts: number
  }>
  categoryStats: Array<{
    name: string
    count: number
  }>
  lastUpdated: string
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalMedia: 0,
    userGrowth: '0%',
    postGrowth: '0%',
    recentPosts: [],
    recentComments: [],
    monthlyStats: [],
    categoryStats: [],
    lastUpdated: ''
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const token = localStorage.getItem('admin_token')
      const statsResponse = await fetch('http://localhost:7777/api/v1/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (statsResponse.ok) {
        const response = await statsResponse.json()
        if (response.success && response.data) {
          setStats(response.data)
        } else {
          console.error('API returned error:', response.message)
          // 不设置 mock 数据，保持空状态
          setStats({
            totalUsers: 0,
            totalPosts: 0,
            totalComments: 0,
            totalMedia: 0,
            userGrowth: '0%',
            postGrowth: '0%',
            recentPosts: [],
            recentComments: [],
            monthlyStats: [],
            categoryStats: [],
            lastUpdated: ''
          })
        }
      } else {
        console.error('Failed to fetch dashboard data:', statsResponse.status, statsResponse.statusText)
        // 不设置 mock 数据，保持空状态
        setStats({
          totalUsers: 0,
          totalPosts: 0,
          totalComments: 0,
          totalMedia: 0,
          userGrowth: '0%',
          postGrowth: '0%',
          recentPosts: [],
          recentComments: [],
          monthlyStats: [],
          categoryStats: [],
          lastUpdated: ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // 不设置 mock 数据，保持空状态
      setStats({
        totalUsers: 0,
        totalPosts: 0,
        totalComments: 0,
        totalMedia: 0,
        userGrowth: '0%',
        postGrowth: '0%',
        recentPosts: [],
        recentComments: [],
        monthlyStats: [],
        categoryStats: [],
        lastUpdated: ''
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">加载中...</div>
      </div>
    )
  }

  // 如果没有数据，显示空状态
  if (!stats.lastUpdated && !loading) {
    return (
      <ProtectedPage>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
              <p className="text-gray-600">系统概览和统计信息</p>
            </div>
            <Button 
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
          </div>
          
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg text-gray-500 mb-2">暂无数据</div>
              <p className="text-sm text-gray-400 mb-4">请确保 API 服务正在运行并已正确配置</p>
              <Button 
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                重新加载
              </Button>
            </div>
          </div>
        </div>
      </ProtectedPage>
    )
  }

  // 图表颜色配置
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedPage>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
            <p className="text-gray-600">系统概览和统计信息</p>
            {stats.lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">
                最后更新：{formatDate(stats.lastUpdated)}
              </p>
            )}
          </div>
          <Button 
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stats.userGrowth.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stats.userGrowth}
                </span> 较上月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总文章数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stats.postGrowth.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stats.postGrowth}
                </span> 较上月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总评论数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+15%</span> 较上月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总媒体数</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMedia}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+5%</span> 较上月
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>快速操作</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => window.location.href = '/admin/posts/new'}
              >
                <Plus className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">新建文章</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200"
                onClick={() => window.location.href = '/admin/posts'}
              >
                <Edit className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">管理文章</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200"
                onClick={() => window.location.href = '/admin/comments'}
              >
                <MessageSquare className="h-6 w-6 text-purple-600" />
                <span className="text-sm font-medium">管理评论</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 hover:border-orange-200"
                onClick={() => window.location.href = '/admin/users'}
              >
                <UserPlus className="h-6 w-6 text-orange-600" />
                <span className="text-sm font-medium">管理用户</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-pink-50 hover:border-pink-200"
                onClick={() => window.location.href = '/admin/media'}
              >
                <Upload className="h-6 w-6 text-pink-600" />
                <span className="text-sm font-medium">媒体管理</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 hover:border-gray-200"
                onClick={() => window.location.href = '/admin/settings'}
              >
                <Settings className="h-6 w-6 text-gray-600" />
                <span className="text-sm font-medium">系统设置</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-indigo-50 hover:border-indigo-200"
                onClick={() => window.location.href = '/admin/users'}
              >
                <Users className="h-6 w-6 text-indigo-600" />
                <span className="text-sm font-medium">用户统计</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-200"
                onClick={() => fetchDashboardData(true)}
              >
                <RefreshCw className={`h-6 w-6 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">刷新数据</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 月度文章趋势 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>月度文章趋势</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="posts" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 分类分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>文章分类分布</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={stats.categoryStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.categoryStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近文章和评论 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 最近文章 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>最近文章</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{post.title}</h4>
                      <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  查看所有文章
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 最近评论 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>最近评论</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentComments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-2">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">
                            {typeof comment.author === 'string' ? comment.author : comment.author?.username || '未知用户'}
                          </span> 评论于 {comment.postTitle}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(comment.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  查看所有评论
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedPage>
  )
}

export default DashboardPage
