import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { LogIn, User } from 'lucide-react'

interface LoginDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

const LoginDialog: React.FC<LoginDialogProps> = ({ 
  isOpen, 
  onClose, 
  title = "需要登录",
  description = "请先登录后再进行此操作"
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* 对话框内容 */}
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-2xl border border-border bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
          <CardDescription className="text-muted-foreground text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1 h-12 text-base font-medium">
              <Link to="/login" onClick={onClose}>
                <LogIn className="w-5 h-5 mr-2" />
                立即登录
              </Link>
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 h-12 text-base">
              取消
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            还没有账号？{' '}
            <Link
              to="/register"
              className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
              onClick={onClose}
            >
              立即注册
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginDialog
