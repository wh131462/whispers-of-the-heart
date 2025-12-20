import React, { useState, useEffect, useCallback } from 'react'
import { Button, Input } from '@whispers/ui'
import {
  Search,
  Check,
  X,
  Trash2,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Pin,
  PinOff,
  RotateCcw,
  AlertTriangle,
  Flag,
  Archive,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { api } from '@whispers/utils'
import { useToastContext } from '../../contexts/ToastContext'

interface Comment {
  id: string
  content: string
  isApproved: boolean
  ipAddress?: string
  createdAt: string
  deletedAt?: string
  isPinned?: boolean
  isEdited?: boolean
  status?: 'APPROVED' | 'PENDING' | 'DELETED'
  author: {
    id: string
    username: string
    avatar?: string
  }
  post: {
    id: string
    title: string
    slug: string
  }
  parent?: {
    id: string
    content: string
  }
}

interface CommentReport {
  id: string
  reason: string
  details?: string
  status: string
  createdAt: string
  comment: {
    id: string
    content: string
    author: {
      id: string
      username: string
    }
    post: {
      id: string
      title: string
      slug: string
    }
  }
  reporter: {
    id: string
    username: string
  }
}

interface CommentStats {
  totalComments: number
  pendingComments: number
  approvedComments: number
  deletedComments: number
  pendingReports: number
}

type TabType = 'all' | 'pending' | 'approved' | 'trash' | 'reports'

const CommentManagementPage: React.FC = () => {
  const { success, error: showError } = useToastContext()

  // State
  const [comments, setComments] = useState<Comment[]>([])
  const [reports, setReports] = useState<CommentReport[]>([])
  const [stats, setStats] = useState<CommentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reportStatus, setReportStatus] = useState<'pending' | 'resolved' | 'dismissed'>('pending')

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/comments/stats')
      if (response.data?.success) {
        setStats(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  // Effect to fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Effect to fetch data based on active tab - use primitive values only
  useEffect(() => {
    let isCancelled = false

    // 切换 tab 时立即清空列表，避免显示旧数据
    setComments([])
    setReports([])

    const fetchData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'trash') {
          const response = await api.get('/admin/comments/trash', {
            params: { page, limit: 20 }
          })
          if (!isCancelled && response.data?.success) {
            setComments(response.data.data.items || [])
            setTotalPages(response.data.data.totalPages || 1)
          }
        } else if (activeTab === 'reports') {
          const response = await api.get('/admin/comments/reports', {
            params: { page, limit: 20, status: reportStatus }
          })
          if (!isCancelled && response.data?.success) {
            setReports(response.data.data.items || [])
            setTotalPages(response.data.data.totalPages || 1)
          }
        } else {
          const params: Record<string, unknown> = { page, limit: 20 }
          if (activeTab === 'pending') {
            params.status = 'PENDING'
          } else if (activeTab === 'approved') {
            params.status = 'APPROVED'
          }
          if (searchTerm.trim()) {
            params.search = searchTerm.trim()
          }
          const response = await api.get('/admin/comments', { params })
          if (!isCancelled && response.data?.success) {
            setComments(response.data.data.items || [])
            setTotalPages(response.data.data.totalPages || 1)
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch data:', err)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [activeTab, page, reportStatus, searchTerm])

  // Comment actions
  const handleApprove = async (commentId: string) => {
    try {
      await api.patch(`/admin/comments/${commentId}/approve`)
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, isApproved: true, status: 'APPROVED' } : c
      ))
      fetchStats()
      success('评论已通过')
    } catch (err) {
      showError('操作失败')
    }
  }

  const handleReject = async (commentId: string) => {
    try {
      await api.patch(`/admin/comments/${commentId}/reject`)
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, isApproved: false, status: 'PENDING' } : c
      ))
      fetchStats()
      success('评论已拒绝')
    } catch (err) {
      showError('操作失败')
    }
  }

  const handleSoftDelete = async (commentId: string) => {
    if (!confirm('确定要将这条评论移至回收站吗？')) return

    try {
      await api.patch(`/admin/comments/${commentId}/soft-delete`)
      setComments(prev => prev.filter(c => c.id !== commentId))
      fetchStats()
      success('评论已移至回收站')
    } catch (err) {
      showError('删除失败')
    }
  }

  const handleRestore = async (commentId: string) => {
    try {
      await api.patch(`/admin/comments/${commentId}/restore`)
      setComments(prev => prev.filter(c => c.id !== commentId))
      fetchStats()
      success('评论已恢复')
    } catch (err) {
      showError('恢复失败')
    }
  }

  const handlePermanentDelete = async (commentId: string) => {
    if (!confirm('确定要永久删除这条评论吗？此操作不可恢复！')) return

    try {
      await api.delete(`/admin/comments/${commentId}/permanent`)
      setComments(prev => prev.filter(c => c.id !== commentId))
      fetchStats()
      success('评论已永久删除')
    } catch (err) {
      showError('删除失败')
    }
  }

  const handleTogglePin = async (commentId: string, isPinned: boolean) => {
    try {
      await api.patch(`/admin/comments/${commentId}/pin`)
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, isPinned: !isPinned } : c
      ))
      success(isPinned ? '已取消置顶' : '已置顶')
    } catch (err) {
      showError('操作失败')
    }
  }

  const handleBatchApprove = async () => {
    const pendingIds = comments.filter(c => !c.isApproved && !c.deletedAt).map(c => c.id)
    if (pendingIds.length === 0) {
      showError('没有待审核的评论')
      return
    }

    try {
      await api.post('/admin/comments/batch-approve', { ids: pendingIds })
      setComments(prev => prev.map(c => ({ ...c, isApproved: true, status: 'APPROVED' as const })))
      fetchStats()
      success(`已批准 ${pendingIds.length} 条评论`)
    } catch (err) {
      showError('批量操作失败')
    }
  }

  // Report actions
  const handleResolveReport = async (reportId: string, action: 'resolve' | 'dismiss', deleteComment = false) => {
    try {
      await api.patch(`/admin/comments/reports/${reportId}`, { action, deleteComment })
      setReports(prev => prev.filter(r => r.id !== reportId))
      fetchStats()
      success(action === 'resolve' ? '举报已处理' : '举报已驳回')
    } catch (err) {
      showError('处理失败')
    }
  }

  const getReasonText = (reason: string) => {
    const reasons: Record<string, string> = {
      spam: '垃圾内容',
      abuse: '滥用/恶意内容',
      harassment: '骚扰/人身攻击',
      other: '其他'
    }
    return reasons[reason] || reason
  }

  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.author.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && comments.length === 0 && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">评论管理</h1>
          <p className="text-muted-foreground mt-1">审核和管理用户评论</p>
        </div>
        {activeTab !== 'trash' && activeTab !== 'reports' && (
          <Button onClick={handleBatchApprove} variant="outline">
            <Check className="h-4 w-4 mr-2" />
            批量通过
          </Button>
        )}
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总评论</p>
                <p className="text-xl font-bold text-foreground">{stats.totalComments}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">待审核</p>
                <p className="text-xl font-bold text-foreground">{stats.pendingComments}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已通过</p>
                <p className="text-xl font-bold text-foreground">{stats.approvedComments}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <Archive className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">回收站</p>
                <p className="text-xl font-bold text-foreground">{stats.deletedComments}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Flag className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">待处理举报</p>
                <p className="text-xl font-bold text-foreground">{stats.pendingReports}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 标签页导航 */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {activeTab !== 'reports' && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索评论内容或用户名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'approved', 'trash', 'reports'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab === 'all' && '全部'}
                {tab === 'pending' && (
                  <>
                    待审核
                    {stats && stats.pendingComments > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                        {stats.pendingComments}
                      </span>
                    )}
                  </>
                )}
                {tab === 'approved' && '已通过'}
                {tab === 'trash' && (
                  <>
                    <Archive className="h-4 w-4" />
                    回收站
                  </>
                )}
                {tab === 'reports' && (
                  <>
                    <Flag className="h-4 w-4" />
                    举报
                    {stats && stats.pendingReports > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                        {stats.pendingReports}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 举报状态筛选 */}
        {activeTab === 'reports' && (
          <div className="mt-4 flex gap-2">
            {(['pending', 'resolved', 'dismissed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => { setReportStatus(status); setPage(1); }}
                className={`px-3 py-1.5 rounded text-sm ${
                  reportStatus === status
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {status === 'pending' && '待处理'}
                {status === 'resolved' && '已处理'}
                {status === 'dismissed' && '已驳回'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 评论列表 */}
      {activeTab !== 'reports' && (
        <div className="bg-card rounded-lg shadow divide-y divide-border">
          {filteredComments.map((comment) => (
            <div key={comment.id} className="p-4 hover:bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* 用户信息 */}
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                      {comment.author.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground">{comment.author.username}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString('zh-CN')}
                    </span>

                    {/* 状态标签 */}
                    {comment.isPinned && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Pin className="h-3 w-3 mr-1" />
                        置顶
                      </span>
                    )}
                    {comment.isEdited && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        已编辑
                      </span>
                    )}
                    {activeTab === 'trash' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400">
                        已删除
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        comment.isApproved
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {comment.isApproved ? '已通过' : '待审核'}
                      </span>
                    )}
                  </div>

                  {/* 评论内容 */}
                  <p className="text-foreground mb-2">{comment.content}</p>

                  {/* 关联文章 */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>评论于：</span>
                    <a
                      href={`/posts/${comment.post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-primary hover:underline flex items-center"
                    >
                      {comment.post.title}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>

                  {/* 回复的父评论 */}
                  {comment.parent && (
                    <div className="mt-2 pl-4 border-l-2 border-border">
                      <p className="text-sm text-muted-foreground">
                        回复：{comment.parent.content.substring(0, 50)}...
                      </p>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center space-x-2 ml-4">
                  {activeTab === 'trash' ? (
                    // 回收站操作
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(comment.id)}
                        title="恢复"
                        className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePermanentDelete(comment.id)}
                        title="永久删除"
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    // 正常操作
                    <>
                      {/* 置顶按钮 */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePin(comment.id, !!comment.isPinned)}
                        title={comment.isPinned ? '取消置顶' : '置顶'}
                        className={comment.isPinned ? 'text-purple-600' : 'text-muted-foreground'}
                      >
                        {comment.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </Button>

                      {!comment.isApproved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(comment.id)}
                          title="通过"
                          className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {comment.isApproved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(comment.id)}
                          title="取消通过"
                          className="text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSoftDelete(comment.id)}
                        title="移至回收站"
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 空状态 */}
          {filteredComments.length === 0 && (
            <div className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {activeTab === 'trash' ? '回收站为空' :
                 searchTerm || activeTab !== 'all' ? '没有找到匹配的评论' : '暂无评论'}
              </h3>
              <p className="text-muted-foreground">
                {activeTab === 'trash' ? '已删除的评论会显示在这里' :
                 searchTerm || activeTab !== 'all' ? '尝试调整筛选条件' : '等待用户发表评论'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 举报列表 */}
      {activeTab === 'reports' && (
        <div className="bg-card rounded-lg shadow divide-y divide-border">
          {reports.map((report) => (
            <div key={report.id} className="p-4 hover:bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* 举报信息 */}
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {getReasonText(report.reason)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(report.createdAt).toLocaleString('zh-CN')}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      report.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        : report.status === 'resolved'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                    }`}>
                      {report.status === 'pending' && '待处理'}
                      {report.status === 'resolved' && '已处理'}
                      {report.status === 'dismissed' && '已驳回'}
                    </span>
                  </div>

                  {/* 举报人信息 */}
                  <p className="text-sm text-muted-foreground mb-2">
                    举报人：<span className="text-foreground">{report.reporter.username}</span>
                  </p>

                  {/* 举报详情 */}
                  {report.details && (
                    <p className="text-sm text-muted-foreground mb-3">
                      详情：{report.details}
                    </p>
                  )}

                  {/* 被举报的评论 */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {report.comment.author.username}
                      </span>
                      <span className="text-xs text-muted-foreground">的评论</span>
                    </div>
                    <p className="text-sm text-foreground">{report.comment.content}</p>
                    <div className="mt-2 flex items-center text-xs text-muted-foreground">
                      <span>来自文章：</span>
                      <a
                        href={`/posts/${report.comment.post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-primary hover:underline flex items-center"
                      >
                        {report.comment.post.title}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                {report.status === 'pending' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveReport(report.id, 'resolve', false)}
                      title="标记为已处理"
                      className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveReport(report.id, 'resolve', true)}
                      title="处理并删除评论"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveReport(report.id, 'dismiss', false)}
                      title="驳回举报"
                      className="text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 空状态 */}
          {reports.length === 0 && (
            <div className="py-12 text-center">
              <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {reportStatus === 'pending' ? '没有待处理的举报' :
                 reportStatus === 'resolved' ? '没有已处理的举报' : '没有已驳回的举报'}
              </h3>
              <p className="text-muted-foreground">
                用户举报的评论会显示在这里
              </p>
            </div>
          )}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            上一页
          </Button>
          <span className="px-4 py-2 text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}

export default CommentManagementPage
