import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from './ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@whispers/ui'
import { MapPin, Calendar, Mail, Shield } from 'lucide-react'
import { getMediaUrl } from '@whispers/utils'
import { DEFAULT_AVATAR } from '../constants/images'

export interface UserProfileData {
  id: string
  username: string
  avatar?: string | null
  email?: string
  isAdmin?: boolean
  location?: string | null      // IP 归属地
  createdAt?: string            // 注册时间
  bio?: string | null           // 个人简介（预留）
  postCount?: number            // 文章数（预留）
  commentCount?: number         // 评论数（预留）
}

interface UserProfileCardProps {
  user: UserProfileData
  isOpen: boolean
  onClose: () => void
  anchorEl?: HTMLElement | null
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  isOpen,
  onClose,
  anchorEl,
  position = 'bottom'
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 })
  const [positionReady, setPositionReady] = useState(false)

  // 计算卡片位置
  useEffect(() => {
    if (isOpen && anchorEl) {
      // 先隐藏，等位置计算完再显示
      setPositionReady(false)

      const calculatePosition = () => {
        if (!cardRef.current) return

        const anchorRect = anchorEl.getBoundingClientRect()
        const cardRect = cardRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let top = 0
        let left = 0

        switch (position) {
          case 'bottom':
            top = anchorRect.bottom + 8
            left = anchorRect.left + anchorRect.width / 2 - cardRect.width / 2
            break
          case 'top':
            top = anchorRect.top - cardRect.height - 8
            left = anchorRect.left + anchorRect.width / 2 - cardRect.width / 2
            break
          case 'left':
            top = anchorRect.top + anchorRect.height / 2 - cardRect.height / 2
            left = anchorRect.left - cardRect.width - 8
            break
          case 'right':
            top = anchorRect.top + anchorRect.height / 2 - cardRect.height / 2
            left = anchorRect.right + 8
            break
        }

        // 边界检测
        if (left < 8) left = 8
        if (left + cardRect.width > viewportWidth - 8) left = viewportWidth - cardRect.width - 8
        if (top < 8) top = 8
        if (top + cardRect.height > viewportHeight - 8) top = viewportHeight - cardRect.height - 8

        setCardPosition({ top, left })
        // 位置计算完成后显示
        setPositionReady(true)
      }

      requestAnimationFrame(calculatePosition)
    } else {
      setPositionReady(false)
    }
  }, [isOpen, anchorEl, position])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      // 延迟添加事件监听，避免立即触发
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose])

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知'
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 z-40" />

      {/* 卡片 */}
      <Card
        ref={cardRef}
        className={`fixed z-50 w-72 shadow-xl border transition-opacity duration-200 ${
          positionReady ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          top: cardPosition.top,
          left: cardPosition.left,
        }}
      >
        <CardContent className="p-4">
          {/* 头部：头像和基本信息 */}
          <div className="flex items-start gap-3">
            <Avatar size={56} className="ring-2 ring-background shadow-md shrink-0">
              <AvatarImage
                src={user.avatar ? getMediaUrl(user.avatar) : DEFAULT_AVATAR}
                alt={user.username}
              />
              <AvatarFallback username={user.username} variant="gradient" />
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {user.username}
                </h3>
                {user.isAdmin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                    <Shield className="w-3 h-3 mr-0.5" />
                    管理员
                  </span>
                )}
              </div>


              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {user.bio || "这个人很懒，什么都没有留下..."}
              </p>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="border-t my-3" />

          {/* 详细信息 */}
          <div className="space-y-2">
            {/* IP 归属地 */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>IP 属地：{user.location || "未知"}</span>
            </div>
            {/* 注册时间 */}
            {user.createdAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>加入于 {formatDate(user.createdAt)}</span>
              </div>
            )}

            {/* 邮箱（可选，仅管理员可见） */}
            {user.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
          </div>

          {/* 统计信息（预留） */}
          {(user.postCount !== undefined || user.commentCount !== undefined) && (
            <>
              <div className="border-t my-3" />
              <div className="flex justify-around text-center">
                {user.postCount !== undefined && (
                  <div>
                    <div className="text-lg font-semibold text-foreground">{user.postCount}</div>
                    <div className="text-xs text-muted-foreground">文章</div>
                  </div>
                )}
                {user.commentCount !== undefined && (
                  <div>
                    <div className="text-lg font-semibold text-foreground">{user.commentCount}</div>
                    <div className="text-xs text-muted-foreground">评论</div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default UserProfileCard
