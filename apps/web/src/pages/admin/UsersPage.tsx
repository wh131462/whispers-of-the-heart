import React, { useEffect, useState } from 'react'
import { Users, Search, Shield, ShieldOff, Trash2, MoreVertical } from 'lucide-react'
import { Button, Input } from '@whispers/ui'
import { api } from '@whispers/utils'

interface User {
  id: string
  username: string
  email: string
  avatar?: string
  isAdmin: boolean
  createdAt: string
  _count?: {
    posts: number
    comments: number
  }
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [page])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 20 }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      const response = await api.get('/admin/users', { params })
      if (response.data?.success) {
        setUsers(response.data.data.items || [])
        setTotalPages(response.data.data.totalPages || 1)
      } else {
        setError('获取用户列表失败')
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setError('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}`, { isAdmin: !isAdmin })
      fetchUsers()
    } catch (err) {
      console.error('Failed to update user:', err)
      alert('更新用户权限失败')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？此操作不可恢复。')) return
    try {
      await api.delete(`/admin/users/${userId}`)
      fetchUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert('删除用户失败')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">用户管理</h1>
          <p className="text-muted-foreground mt-1">管理注册用户和权限</p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>搜索</Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* 用户列表 */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                用户
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                统计
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                注册时间
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无用户数据</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isAdmin
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {user.isAdmin ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <div>文章: {user._count?.posts || 0}</div>
                    <div>评论: {user._count?.comments || 0}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                        title={user.isAdmin ? '移除管理员权限' : '设为管理员'}
                      >
                        {user.isAdmin ? (
                          <ShieldOff className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        title="删除用户"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
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

export default UsersPage
