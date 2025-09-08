import React, { useState, useEffect } from 'react'
import { Shield, UserX, Edit, Search, Users, Lock, Unlock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import ProtectedPage from '../components/ProtectedPage'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { DataTable } from '../components/tables/DataTable'
import { Modal } from '../components/modals/Modal'
import { request } from '@whispers/utils'

interface User {
  id: string
  username: string
  email: string
  role: 'ADMIN' | 'EDITOR' | 'USER'
  isActive: boolean
  avatar?: string
  bio?: string
  createdAt: string
  updatedAt: string
}

interface UserListResponse {
  items: User[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBanModalOpen, setIsBanModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<User[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        return
      }

      const response = await request<UserListResponse>(`/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          page: currentPage,
          limit: 10,
          search: searchQuery || undefined,
        }
      })

      if (response.success && response.data) {
        setUsers(response.data.items)
        setTotalPages(response.data.totalPages)
        setTotal(response.data.total)
      } else {
        console.error('Failed to fetch users:', response)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchQuery])

  // 过滤用户（客户端过滤，用于角色和状态筛选）
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)
    return matchesRole && matchesStatus
  })

  // 角色标签
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { label: '管理员', className: 'bg-red-100 text-red-800' },
      EDITOR: { label: '编辑', className: 'bg-blue-100 text-blue-800' },
      USER: { label: '用户', className: 'bg-green-100 text-green-800' }
    }
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.USER
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  // 状态标签
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          正常
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          已禁用
        </span>
      )
    }
  }

  // 操作按钮
  const getActionButtons = (user: User) => (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedUser(user)
          setIsEditModalOpen(true)
        }}
      >
        <Edit className="h-4 w-4" />
      </Button>
      {user.isActive ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleUserStatus(user.id)}
          className="text-red-600 hover:text-red-700"
        >
          <UserX className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleUserStatus(user.id)}
          className="text-green-600 hover:text-green-700"
        >
          <Unlock className="h-4 w-4" />
        </Button>
      )}
    </div>
  )

  // 切换用户状态
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        return
      }

      const response = await request(`/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.success) {
        // 刷新用户列表
        fetchUsers()
      } else {
        console.error('Failed to toggle user status:', response)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  // 更新用户角色
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No admin token found')
        return
      }

      const response = await request(`/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: {
          role: newRole
        }
      })

      if (response.success) {
        // 刷新用户列表
        fetchUsers()
        setSelectedUser(null)
        setIsEditModalOpen(false)
      } else {
        console.error('Failed to update user role:', response)
      }
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  // 封禁用户
  const handleBanUser = (userId: string, _reason: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId
        ? { ...user, isActive: false }
        : user
    ))
    setIsBanModalOpen(false)
  }

  // 批量封禁
  const handleBatchBan = (_reason: string) => {
    setUsers(prev => prev.map(user => 
      selectedRows.some(selected => selected.id === user.id)
        ? { ...user, isActive: false }
        : user
    ))
    setSelectedRows([])
    setIsBanModalOpen(false)
  }

  // 表格列配置
  const columns = [
    { key: 'username', title: '用户名' },
    { key: 'email', title: '邮箱' },
    { key: 'role', title: '角色', render: (user: User) => getRoleBadge(user.role) },
    { key: 'status', title: '状态', render: (user: User) => getStatusBadge(user.isActive) },
    { key: 'createdAt', title: '注册时间', render: (user: User) => 
      new Date(user.createdAt).toLocaleString('zh-CN')
    },
    { key: 'actions', title: '操作', render: getActionButtons }
  ]

  return (
    <ProtectedPage>
      <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理用户账户和权限</p>
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
                  placeholder="搜索用户名或邮箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有角色</SelectItem>
                <SelectItem value="ADMIN">管理员</SelectItem>
                <SelectItem value="EDITOR">编辑</SelectItem>
                <SelectItem value="USER">用户</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="inactive">已禁用</SelectItem>
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
                已选择 {selectedRows.length} 个用户
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
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBanModalOpen(true)}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  批量封禁
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
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">总用户数</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">管理员</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'ADMIN').length}
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
                <p className="text-sm text-muted-foreground">活跃用户</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">禁用用户</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => !u.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredUsers}
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

      {/* 编辑用户模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑用户"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">用户名</label>
              <Input defaultValue={selectedUser.username} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">邮箱</label>
              <Input defaultValue={selectedUser.email} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">角色</label>
              <Select
                value={selectedUser.role}
                onValueChange={(value) => handleUpdateUserRole(selectedUser.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">用户</SelectItem>
                  <SelectItem value="EDITOR">编辑</SelectItem>
                  <SelectItem value="ADMIN">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                取消
              </Button>
              <Button>保存修改</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 封禁用户模态框 */}
      <Modal
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        title="封禁用户"
        size="md"
      >
        <div className="space-y-4">
          {selectedUser && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                确定要封禁用户 <strong>{selectedUser.username}</strong> 吗？
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">封禁原因</label>
            <Input placeholder="请输入封禁原因..." />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsBanModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const reason = '违反社区规定'
                if (selectedUser) {
                  handleBanUser(selectedUser.id, reason)
                } else if (selectedRows.length > 0) {
                  handleBatchBan(reason)
                }
              }}
            >
              确认封禁
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </ProtectedPage>
  )
}

export default UserManagementPage
