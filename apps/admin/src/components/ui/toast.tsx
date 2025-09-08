import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Button } from './button'

export interface ToastProps {
  id: string
  title?: string
  description: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300) // 等待动画完成
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getBackgroundColor()}
        border rounded-lg shadow-lg p-4
      `}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-medium text-gray-900 mb-1">
              {title}
            </p>
          )}
          <p className="text-sm text-gray-700">
            {description}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-6 w-6 p-0 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Toast容器组件
export interface ToastContainerProps {
  toasts: ToastProps[]
  onRemoveToast: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemoveToast
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id
    }
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (description: string, title?: string) => {
    addToast({ type: 'success', description, title })
  }

  const error = (description: string, title?: string) => {
    addToast({ type: 'error', description, title })
  }

  const warning = (description: string, title?: string) => {
    addToast({ type: 'warning', description, title })
  }

  const info = (description: string, title?: string) => {
    addToast({ type: 'info', description, title })
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}

export default Toast
