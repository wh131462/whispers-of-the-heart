import { create } from 'zustand'

interface AdminState {
  sidebarCollapsed: boolean
  currentPage: string
  toggleSidebar: () => void
  setCurrentPage: (page: string) => void
}

export const useAdminStore = create<AdminState>((set) => ({
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentPage: (page: string) => set({ currentPage: page }),
}))
