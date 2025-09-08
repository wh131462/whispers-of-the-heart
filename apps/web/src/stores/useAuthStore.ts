import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@whispers/utils'

interface User {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refreshAuth: () => Promise<boolean>
  updateUser: (user: User) => void
  setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // 登录
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          
          const response = await api.post('/auth/login', { email, password })
          
          if (response.data?.success) {
            set({
              user: response.data.data.user,
              accessToken: response.data.data.accessToken,
              refreshToken: response.data.data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            })
            
            // 同时存储到admin项目的token key，实现共享
            localStorage.setItem('admin_token', response.data.data.accessToken)
            return true
          }
          
          set({ isLoading: false })
          return false
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false })
          return false
        }
      },

      // 退出登录
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
        
        // 同时清除admin项目的token
        localStorage.removeItem('admin_token')
      },

      // 刷新认证
      refreshAuth: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return false

        try {
          const response = await api.post('/auth/refresh', { refreshToken })
          
          if (response.data?.success) {
            set({
              user: response.data.data.user,
              accessToken: response.data.data.accessToken,
              refreshToken: response.data.data.refreshToken,
              isAuthenticated: true,
            })
            
            // 同时更新admin项目的token
            localStorage.setItem('admin_token', response.data.data.accessToken)
            return true
          }
          
          // 刷新失败，清除认证状态
          get().logout()
          return false
        } catch (error) {
          console.error('Refresh auth error:', error)
          get().logout()
          return false
        }
      },

      // 更新用户信息
      updateUser: (user: User) => {
        set({ user })
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export { useAuthStore }
