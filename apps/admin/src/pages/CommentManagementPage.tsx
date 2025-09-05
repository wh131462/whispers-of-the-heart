import React, { useState, useEffect } from 'react'
import { Check, X, Eye, Trash2, Search, MessageSquare } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import ProtectedPage from '../components/ProtectedPage'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { DataTable } from '../components/tables/DataTable'
import { Modal } from '../components/modals/Modal'
import { request } from '@whispers/utils'
import { useToastContext } from '../contexts/ToastContext'

interface Comment {
  id: string
  content: string
  authorName?: string
  authorEmail?: string
  authorWebsite?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  ipAddress?: string
  userAgent?: string
  adminReply?: string
  isSpam?: boolean
  author?: {
    id: string
    username: string
    avatar?: string
  }
  postTitle?: string
  post: {
    id: string
    title: string
    slug: string
  }
  parent?: {
    id: string
    content: string
    authorName: string
  }
  replies?: Comment[]
}

interface CommentListResponse {
  items: Comment[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const CommentManagementPage: React.FC = () => {
  const { success, error, warning, info } = useToastContext()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Comment[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // 获取评论列表
  const fetchComments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        return
      }

      const response = await request<CommentListResponse>(`/api/v1/comments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          page: currentPage,
          limit: 10,
          search: searchQuery || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }
      })

      if (response.success && response.data) {
        setComments(response.data.items)
        setTotalPages(response.data.totalPages)
        setTotal(response.data.total)
      } else {
        console.error('Failed to fetch comments:', response)
        error(`获取评论列表失败: ${response.message || '未知错误'}`)
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
      error(`获取评论列表失败: ${err instanceof Error ? err.message : '网络错误'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [currentPage, searchQuery, statusFilter])

  // 过滤评论（客户端过滤，用于其他筛选条件）
  const filteredComments = comments

  // 状态标签
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: '待审核', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: '已通过', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: '已拒绝', className: 'bg-red-100 text-red-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  // 垃圾评论标签
  const getSpamBadge = (isSpam: boolean) => {
    if (isSpam) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          垃圾评论
        </span>
      )
    }
    return null
  }

  // 操作按钮
  const getActionButtons = (comment: Comment) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedComment(comment)
          setIsDetailModalOpen(true)
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {comment.status === 'PENDING' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleApproveComment(comment.id)}
            className="text-green-600 hover:text-green-700"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRejectComment(comment.id)}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDeleteComment(comment.id)}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

  // 审核评论
  const handleApproveComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        error('请先登录')
        return
      }

      const response = await request(`/api/v1/comments/${commentId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.success) {
        success('评论审核通过')
        // 刷新评论列表
        fetchComments()
      } else {
        console.error('Failed to approve comment:', response)
        error(`审核失败: ${response.message || '未知错误'}`)
      }
    } catch (err) {
      console.error('Error approving comment:', err)
      error(`审核失败: ${err instanceof Error ? err.message : '网络错误'}`)
    }
  }

  const handleRejectComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        error('请先登录')
        return
      }

      const response = await request(`/api/v1/comments/${commentId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.success) {
        success('评论已拒绝')
        // 刷新评论列表
        fetchComments()
      } else {
        console.error('Failed to reject comment:', response)
        error(`拒绝失败: ${response.message || '未知错误'}`)
      }
    } catch (err) {
      console.error('Error rejecting comment:', err)
      error(`拒绝失败: ${err instanceof Error ? err.message : '网络错误'}`)
    }
  }

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        error('请先登录')
        return
      }

      const response = await request(`/api/v1/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.success) {
        success('评论删除成功')
        // 刷新评论列表
        fetchComments()
      } else {
        console.error('Failed to delete comment:', response)
        error(`删除失败: ${response.message || '未知错误'}`)
      }
    } catch (err) {
      console.error('Error deleting comment:', err)
      error(`删除失败: ${err instanceof Error ? err.message : '网络错误'}`)
    }
  }

  // 批量审核
  const handleBatchApprove = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        error('请先登录')
        return
      }

      if (selectedRows.length === 0) {
        warning('请先选择要审核的评论')
        return
      }

      const commentIds = selectedRows.map(comment => comment.id)
      console.log('批量审批请求参数:', { commentIds })
      
      const response = await request(`/api/v1/comments/batch-approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentIds })
      })

      console.log('批量审批响应:', response)

      if (response.success) {
        const updatedCount = response.data?.updatedCount || 0
        if (updatedCount > 0) {
          success(`批量审核成功，共处理 ${updatedCount} 条评论`)
          // 更新本地状态
          setComments(prev => prev.map(comment => 
            selectedRows.some(selected => selected.id === comment.id)
              ? { ...comment, status: 'APPROVED' }
              : comment
          ))
        } else {
          info(`所选评论都已经是已审核状态，无需重复操作`)
        }
        setSelectedRows([])
        // 重新获取数据
        fetchComments()
      } else {
        error(`批量审核失败: ${response.message || '未知错误'}`)
      }
    } catch (err) {
      console.error('Error batch approving comments:', err)
      error(`批量审核失败: ${err instanceof Error ? err.message : '网络错误'}`)
    }
  }

  const handleBatchReject = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        error('请先登录')
        return
      }

      if (selectedRows.length === 0) {
        warning('请先选择要拒绝的评论')
        return
      }

      const commentIds = selectedRows.map(comment => comment.id)
      console.log('批量拒绝请求参数:', { commentIds })
      
      const response = await request(`/api/v1/comments/batch-reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentIds })
      })

      console.log('批量拒绝响应:', response)

      if (response.success) {
        const updatedCount = response.data?.updatedCount || 0
        if (updatedCount > 0) {
          success(`批量拒绝成功，共处理 ${updatedCount} 条评论`)
          // 更新本地状态
          setComments(prev => prev.map(comment => 
            selectedRows.some(selected => selected.id === comment.id)
              ? { ...comment, status: 'REJECTED' }
              : comment
          ))
        } else {
          info(`所选评论都已经是已拒绝状态，无需重复操作`)
        }
        setSelectedRows([])
        // 重新获取数据
        fetchComments()
      } else {
        error(`批量拒绝失败: ${response.message || '未知错误'}`)
      }
    } catch (err) {
      console.error('Error batch rejecting comments:', err)
      error(`批量拒绝失败: ${err instanceof Error ? err.message : '网络错误'}`)
    }
  }

  const handleBatchDelete = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        error('请先登录')
        return
      }

      if (selectedRows.length === 0) {
        warning('请先选择要删除的评论')
        return
      }

      // 逐个删除评论
      let successCount = 0
      for (const comment of selectedRows) {
        const response = await request(`/api/v1/comments/${comment.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.success) {
          successCount++
        }
      }

      if (successCount > 0) {
        success(`批量删除成功，共删除 ${successCount} 条评论`)
        // 更新本地状态
        setComments(prev => prev.filter(comment => 
          !selectedRows.some(selected => selected.id === comment.id)
        ))
        setSelectedRows([])
        // 重新获取数据
        fetchComments()
      } else {
        error('批量删除失败，没有评论被删除')
      }
    } catch (err) {
      console.error('Error batch deleting comments:', err)
      error(`批量删除失败: ${err instanceof Error ? err.message : '网络错误'}`)
    }
  }

  // 表格列配置
  const columns = [
    { key: 'content', title: '评论内容', render: (comment: Comment) => (
      <div className="max-w-xs">
        <p className="text-sm truncate">{comment.content}</p>
      </div>
    )},
    { key: 'author', title: '评论者', render: (comment: Comment) => 
      comment.author?.username || comment.authorName || '未知用户'
    },
    { key: 'post', title: '文章标题', render: (comment: Comment) => comment.post.title },
    { key: 'status', title: '状态', render: (comment: Comment) => getStatusBadge(comment.status) },
    { key: 'ipAddress', title: 'IP地址', render: (comment: Comment) => 
      comment.ipAddress || '未知'
    },
    { key: 'createdAt', title: '评论时间', render: (comment: Comment) => 
      new Date(comment.createdAt).toLocaleString('zh-CN')
    },
    { key: 'actions', title: '操作', render: getActionButtons }
  ]

  return (
    <ProtectedPage>
      <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">评论管理</h1>
          <p className="text-muted-foreground">审核和管理用户评论</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索评论内容、作者或文章标题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="PENDING">待审核</SelectItem>
                <SelectItem value="APPROVED">已通过</SelectItem>
                <SelectItem value="REJECTED">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作 */}
      {selectedRows.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                已选择 {selectedRows.length} 条评论
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRows([])}
                >
                  取消选择
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchApprove}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  批量通过
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchReject}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  批量拒绝
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  批量删除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">总评论数</p>
                <p className="text-2xl font-bold">{comments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 rounded-full bg-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">待审核</p>
                <p className="text-2xl font-bold">
                  {comments.filter(c => c.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 rounded-full bg-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">已通过</p>
                <p className="text-2xl font-bold">
                  {comments.filter(c => c.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 rounded-full bg-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">垃圾评论</p>
                <p className="text-2xl font-bold">
                  {comments.filter(c => c.isSpam).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>评论列表</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredComments}
            columns={columns}
            pageSize={10}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onRowSelect={setSelectedRows}
            selectable={true}
          />
        </CardContent>
      </Card>

      {/* 评论详情模态框 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="评论详情"
        size="lg"
      >
        {selectedComment && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">评论内容</label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{selectedComment.content}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">评论者</label>
                <p className="text-sm text-muted-foreground">
                  {selectedComment.author?.username || selectedComment.authorName || '未知用户'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">文章标题</label>
                <p className="text-sm text-muted-foreground">
                  {selectedComment.post?.title || selectedComment.postTitle || '未知文章'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">评论时间</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedComment.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">IP 地址</label>
                <p className="text-sm text-muted-foreground">
                  {selectedComment.ipAddress || '未知'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">User-Agent</label>
                <p className="text-sm text-muted-foreground break-all">
                  {selectedComment.userAgent || '未知'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">更新时间</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedComment.updatedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">状态：</span>
              {getStatusBadge(selectedComment.status)}
              {getSpamBadge(selectedComment.isSpam || false)}
            </div>
            {selectedComment.status === 'PENDING' && (
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleRejectComment(selectedComment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  拒绝
                </Button>
                <Button
                  onClick={() => handleApproveComment(selectedComment.id)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  通过
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
    </ProtectedPage>
  )
}

export default CommentManagementPage
