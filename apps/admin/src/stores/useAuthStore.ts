import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { blogApi, type LoginDto } from '@whispers/utils'

interface User {
  id: string
  username: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  setUser: (user: User) => void
  checkWebAuth: () => boolean
  validateToken: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const loginData: LoginDto = { username, password }
          const response = await blogApi.login(loginData)
          
          if (response.success && response.data) {
            const { user, access_token } = response.data
            const userData = {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
            }
            
            set({
              user: userData,
              token: access_token,
              isAuthenticated: true,
            })
            
            // 存储 token 到 localStorage
            localStorage.setItem('admin_token', access_token)
            // 设置API客户端的token
            blogApi.setToken(access_token)
            return true
          } else {
            // 如果API登录失败，抛出错误以便前端显示具体错误信息
            throw new Error(response.message || '登录失败，请检查用户名和密码')
          }
        } catch (error) {
          console.error('Login error:', error)
          // 重新抛出错误，让LoginPage处理
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        localStorage.removeItem('admin_token')
        // 清除API客户端的token
        blogApi.clearToken()
      },

      setUser: (user: User) => {
        set({ user })
      },

      // 检查web项目的登录状态
      checkWebAuth: () => {
        try {
          // 检查web项目的认证状态
          const webAuthData = localStorage.getItem('auth-storage')
          if (webAuthData) {
            const parsed = JSON.parse(webAuthData)
            if (parsed.state && parsed.state.isAuthenticated && parsed.state.accessToken) {
              // 如果web项目已登录，同步到admin项目
              const webUser = parsed.state.user
              const webToken = parsed.state.accessToken
              
              if (webUser && webToken) {
                set({
                  user: {
                    id: webUser.id,
                    username: webUser.username,
                    email: webUser.email,
                    role: webUser.role,
                  },
                  token: webToken,
                  isAuthenticated: true,
                })
                
                // 同步token到admin的localStorage
                localStorage.setItem('admin_token', webToken)
                // 设置API客户端的token
                blogApi.setToken(webToken)
                return true
              }
            }
          }
          return false
        } catch (error) {
          console.error('Error checking web auth:', error)
          return false
        }
      },

      // 验证token是否有效
      validateToken: async () => {
        try {
          const { token } = get()
          if (!token) {
            return false
          }

          // 尝试获取用户信息来验证token
          const response = await blogApi.getProfile()
          if (response.success && response.data) {
            // 更新用户信息
            set({
              user: {
                id: response.data.id,
                username: response.data.username,
                email: response.data.email,
                role: response.data.role,
              }
            })
            return true
          }
          return false
        } catch (error) {
          console.error('Token validation failed:', error)
          return false
        }
      },
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        // 在store重新水合后，检查web项目的登录状态
        if (state && !state.isAuthenticated) {
          state.checkWebAuth()
        }
        
        // 如果admin项目已登录，设置blogApi的token
        if (state && state.isAuthenticated && state.token) {
          blogApi.setToken(state.token)
        }
      },
    }
  )
)
