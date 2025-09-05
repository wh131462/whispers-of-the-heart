import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { AlertCircle, LogIn, Bookmark } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'warning' | 'danger' | 'bookmark'
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "确认操作",
  description = "您确定要执行此操作吗？",
  confirmText = "确认",
  cancelText = "取消",
  variant = 'default'
}) => {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: 'text-yellow-500',
          iconBg: 'bg-yellow-50',
          confirmButton: 'bg-yellow-500 hover:bg-yellow-600'
        }
      case 'danger':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-500',
          iconBg: 'bg-red-50',
          confirmButton: 'bg-red-500 hover:bg-red-600'
        }
      case 'bookmark':
        return {
          icon: Bookmark,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-50',
          confirmButton: 'bg-blue-500 hover:bg-blue-600'
        }
      default:
        return {
          icon: LogIn,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-50',
          confirmButton: 'bg-blue-500 hover:bg-blue-600'
        }
    }
  }

  const styles = getVariantStyles()
  const IconComponent = styles.icon

  return (
    <AlertDialog>
      <AlertDialogOverlay onClick={onClose} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              <IconComponent className={`w-8 h-8 ${styles.iconColor}`} />
            </div>
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={styles.confirmButton}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
