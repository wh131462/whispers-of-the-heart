import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, setAuthToken, removeAuthToken, blogApi } from '@whispers/utils'

interface User {
  id: string
  username: string
  email: string
  isAdmin: boolean
  avatar?: string
  bio?: string
  theme?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  _hasHydrated: boolean
}

interface AuthActions {
  login: (identifier: string, password: string) => Promise<boolean>
  logout: () => void
  refreshAuth: () => Promise<boolean>
  validateToken: () => Promise<boolean>
  updateUser: (user: User) => void
  setLoading: (loading: boolean) => void
  setHasHydrated: (state: boolean) => void
  token: string | null // alias for accessToken for compatibility
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
      _hasHydrated: false,

      // 登录（支持用户名或邮箱）
      login: async (identifier: string, password: string) => {
        try {
          set({ isLoading: true })

          // 判断是邮箱还是用户名
          const isEmail = identifier.includes('@')
          const response = await api.post('/auth/login', {
            ...(isEmail ? { email: identifier } : { username: identifier }),
            password
          })
          
          if (response.data?.success) {
            set({
              user: response.data.data.user,
              accessToken: response.data.data.accessToken,
              refreshToken: response.data.data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            })
            
            // 同时存储到localStorage，供API客户端使用
            const token = response.data.data.accessToken
            localStorage.setItem('auth_token', token)
            // 设置API客户端的认证token
            setAuthToken(token)
            blogApi.setToken(token)
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

        // 同时清除localStorage中的token
        localStorage.removeItem('auth_token')
        // 清除API客户端的认证token
        removeAuthToken()
        blogApi.clearToken()
      },

      // 刷新认证
      refreshAuth: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return false

        try {
          const response = await api.post('/auth/refresh', { refreshToken })
          
          if (response.data?.success) {
            const token = response.data.data.accessToken
            set({
              user: response.data.data.user,
              accessToken: token,
              refreshToken: response.data.data.refreshToken,
              isAuthenticated: true,
            })

            // 同时更新localStorage中的token
            localStorage.setItem('auth_token', token)
            // 更新API客户端的认证token
            setAuthToken(token)
            blogApi.setToken(token)
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

      // 设置 hydration 状态
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state })
      },

      // 验证token有效性
      validateToken: async () => {
        const { accessToken } = get()
        if (!accessToken) return false

        try {
          // 确保在请求前设置 token（解决 rehydration 竞争条件）
          setAuthToken(accessToken)
          blogApi.setToken(accessToken)

          const response = await api.get('/auth/me')

          if (response.data?.success) {
            // 更新用户信息
            set({ user: response.data.data })
            return true
          }
          return false
        } catch (error) {
          console.error('Token validation error:', error)
          return false
        }
      },

      // token getter for compatibility
      get token() {
        return get().accessToken
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
      onRehydrateStorage: () => (state) => {
        // 当状态从localStorage恢复时，设置API客户端的token
        if (state?.accessToken) {
          setAuthToken(state.accessToken)
          blogApi.setToken(state.accessToken)
        }
        // 标记 hydration 完成 - 使用 store 的方法而不是直接 setState
        // 延迟一个微任务以确保 store 已完全初始化
        queueMicrotask(() => {
          useAuthStore.getState().setHasHydrated(true)
        })
      },
    }
  )
)

export { useAuthStore }
