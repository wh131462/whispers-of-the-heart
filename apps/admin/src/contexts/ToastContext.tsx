import React, { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { ToastContainer, useToast } from '../components/ui/toast'

interface ToastContextType {
  success: (description: string, title?: string) => void
  error: (description: string, title?: string) => void
  warning: (description: string, title?: string) => void
  info: (description: string, title?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToastContext = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { toasts, removeToast, success, error, warning, info } = useToast()

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  )
}
