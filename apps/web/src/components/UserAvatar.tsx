import React, { useState, useRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@whispers/ui'
import { getMediaUrl } from '@whispers/utils'
import { DEFAULT_AVATAR } from '../constants/images'
import UserProfileCard, { type UserProfileData } from './UserProfileCard'

interface UserAvatarProps {
  user: UserProfileData
  size?: number
  className?: string
  showProfileOnClick?: boolean
  cardPosition?: 'top' | 'bottom' | 'left' | 'right'
  fallbackVariant?: 'simple' | 'modern' | 'gradient' | 'minimal'
}

/**
 * 统一的用户头像组件
 * - 自动处理头像 URL
 * - 支持点击查看用户信息卡片
 * - 支持多种尺寸和样式
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 36,
  className = '',
  showProfileOnClick = true,
  cardPosition = 'bottom',
  fallbackVariant = 'simple'
}) => {
  const [showProfile, setShowProfile] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    if (showProfileOnClick) {
      e.stopPropagation()
      setShowProfile(true)
    }
  }

  const avatarUrl = user.avatar ? getMediaUrl(user.avatar) : DEFAULT_AVATAR

  return (
    <>
      <div
        ref={avatarRef}
        onClick={handleClick}
        className={`shrink-0 ${showProfileOnClick ? 'cursor-pointer' : ''}`}
      >
        <Avatar
          size={size}
          className={`ring-2 ring-background shadow-sm transition-transform ${
            showProfileOnClick ? 'hover:scale-105' : ''
          } ${className}`}
        >
          <AvatarImage
            src={avatarUrl}
            alt={user.username}
          />
          <AvatarFallback
            username={user.username}
            variant={fallbackVariant}
          />
        </Avatar>
      </div>

      {/* 用户信息卡片 */}
      {showProfileOnClick && (
        <UserProfileCard
          user={user}
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          anchorEl={avatarRef.current}
          position={cardPosition}
        />
      )}
    </>
  )
}

export default UserAvatar
