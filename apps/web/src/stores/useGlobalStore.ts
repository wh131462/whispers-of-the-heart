import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { api } from '@whispers/utils'

/**
 * 全局应用状态
 * 管理应用级别的状态,如加载状态、错误信息、通知等
 */

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface HitokotoData {
  hitokoto: string
  from: string
}

interface GlobalState {
  // 加载状态
  isLoading: boolean
  loadingMessage: string | null

  // 错误状态
  error: Error | null
  errorMessage: string | null

  // 通知
  notifications: Notification[]

  // 主题
  theme: 'light' | 'dark' | 'system'

  // 侧边栏状态
  sidebarOpen: boolean

  // 模态框状态
  modals: Record<string, boolean>

  // 一言（缓存）
  hitokoto: HitokotoData | null
  hitokotoFetched: boolean
}

interface GlobalActions {
  // 加载状态
  setLoading: (loading: boolean, message?: string) => void
  
  // 错误处理
  setError: (error: Error | string | null) => void
  clearError: () => void
  
  // 通知
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // 主题
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // 侧边栏
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // 模态框
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  toggleModal: (modalId: string) => void

  // 一言
  setHitokoto: (data: HitokotoData) => void
  fetchHitokoto: () => Promise<void>
}

type GlobalStore = GlobalState & GlobalActions

export const useGlobalStore = create<GlobalStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      isLoading: false,
      loadingMessage: null,
      error: null,
      errorMessage: null,
      notifications: [],
      theme: 'system',
      sidebarOpen: true,
      modals: {},
      hitokoto: null,
      hitokotoFetched: false,

      // 加载状态
      setLoading: (loading, message) => {
        set({
          isLoading: loading,
          loadingMessage: message || null,
        })
      },

      // 错误处理
      setError: (error) => {
        if (error === null) {
          set({ error: null, errorMessage: null })
        } else if (typeof error === 'string') {
          set({
            error: new Error(error),
            errorMessage: error,
          })
        } else {
          set({
            error,
            errorMessage: error.message,
          })
        }
      },

      clearError: () => {
        set({ error: null, errorMessage: null })
      },

      // 通知
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random()}`
        const newNotification: Notification = {
          ...notification,
          id,
        }
        
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }))

        // 自动移除通知
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, notification.duration || 5000)
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },

      // 主题
      setTheme: (theme) => {
        set({ theme })
        
        // 应用主题到 DOM
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement
          root.classList.remove('light', 'dark')
          
          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            root.classList.add(systemTheme)
          } else {
            root.classList.add(theme)
          }
          
          // 保存到 localStorage
          localStorage.setItem('theme', theme)
        }
      },

      // 侧边栏
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open })
      },

      // 模态框
      openModal: (modalId) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: true },
        }))
      },

      closeModal: (modalId) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: false },
        }))
      },

      toggleModal: (modalId) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: !state.modals[modalId] },
        }))
      },

      // 一言
      setHitokoto: (data) => {
        set({ hitokoto: data, hitokotoFetched: true })
      },

      fetchHitokoto: async () => {
        // 如果已经获取过，不再重复请求
        if (get().hitokotoFetched) {
          return
        }

        try {
          const response = await api.get('/hitokoto')
          // API 返回结构: { success: true, data: { hitokoto: "...", from: "..." } }
          if (response.data?.success && response.data?.data?.hitokoto) {
            set({
              hitokoto: {
                hitokoto: response.data.data.hitokoto,
                from: response.data.data.from || '未知',
              },
              hitokotoFetched: true,
            })
          } else {
            set({
              hitokoto: {
                hitokoto: '生活不止眼前的代码，还有诗和远方。',
                from: '佚名',
              },
              hitokotoFetched: true,
            })
          }
        } catch (error) {
          console.error('Failed to fetch hitokoto:', error)
          set({
            hitokoto: {
              hitokoto: '生活不止眼前的代码，还有诗和远方。',
              from: '佚名',
            },
            hitokotoFetched: true,
          })
        }
      },
    }),
    { name: 'GlobalStore' }
  )
)

// 便捷的 hooks
export const useLoading = () => {
  const isLoading = useGlobalStore((state) => state.isLoading)
  const loadingMessage = useGlobalStore((state) => state.loadingMessage)
  const setLoading = useGlobalStore((state) => state.setLoading)
  
  return { isLoading, loadingMessage, setLoading }
}

export const useError = () => {
  const error = useGlobalStore((state) => state.error)
  const errorMessage = useGlobalStore((state) => state.errorMessage)
  const setError = useGlobalStore((state) => state.setError)
  const clearError = useGlobalStore((state) => state.clearError)
  
  return { error, errorMessage, setError, clearError }
}

export const useNotifications = () => {
  const notifications = useGlobalStore((state) => state.notifications)
  const addNotification = useGlobalStore((state) => state.addNotification)
  const removeNotification = useGlobalStore((state) => state.removeNotification)
  const clearNotifications = useGlobalStore((state) => state.clearNotifications)
  
  return { notifications, addNotification, removeNotification, clearNotifications }
}

export const useTheme = () => {
  const theme = useGlobalStore((state) => state.theme)
  const setTheme = useGlobalStore((state) => state.setTheme)
  
  return { theme, setTheme }
}

export const useSidebar = () => {
  const sidebarOpen = useGlobalStore((state) => state.sidebarOpen)
  const toggleSidebar = useGlobalStore((state) => state.toggleSidebar)
  const setSidebarOpen = useGlobalStore((state) => state.setSidebarOpen)
  
  return { sidebarOpen, toggleSidebar, setSidebarOpen }
}

export const useModal = (modalId: string) => {
  const isOpen = useGlobalStore((state) => state.modals[modalId] || false)
  const openModal = useGlobalStore((state) => state.openModal)
  const closeModal = useGlobalStore((state) => state.closeModal)
  const toggleModal = useGlobalStore((state) => state.toggleModal)

  return {
    isOpen,
    open: () => openModal(modalId),
    close: () => closeModal(modalId),
    toggle: () => toggleModal(modalId),
  }
}

export const useHitokoto = () => {
  const hitokoto = useGlobalStore((state) => state.hitokoto)
  const hitokotoFetched = useGlobalStore((state) => state.hitokotoFetched)
  const fetchHitokoto = useGlobalStore((state) => state.fetchHitokoto)

  return { hitokoto, hitokotoFetched, fetchHitokoto }
}

