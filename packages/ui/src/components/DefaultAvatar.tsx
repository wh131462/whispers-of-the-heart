import React from 'react'

interface DefaultAvatarProps {
  size?: number
  className?: string
  variant?: 'simple' | 'modern' | 'gradient' | 'minimal'
  username?: string
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ 
  size = 32, 
  className = '',
  variant = 'simple',
  username
}) => {
  // 生成基于用户名的颜色
  const getColorFromUsername = (name: string) => {
    const colors = [
      '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', 
      '#EF4444', '#6366F1', '#8B5CF6', '#EC4899', '#10B981'
    ]
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return colors[Math.abs(hash) % colors.length]
  }

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U'
  }

  const getSvgContent = () => {
    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`
    const primaryColor = username ? getColorFromUsername(username) : '#3B82F6'
    const secondaryColor = username ? getColorFromUsername(username + '2') : '#8B5CF6'

    switch (variant) {
      case 'modern':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="20" cy="20" r="20" fill={`url(#${gradientId})`}/>
            <g fill="white" opacity="0.95">
              <circle cx="20" cy="15" r="5.5"/>
              <path d="M10 30c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </g>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: primaryColor, stopOpacity:1}} />
                <stop offset="50%" style={{stopColor: secondaryColor, stopOpacity:1}} />
                <stop offset="100%" style={{stopColor: '#EC4899', stopOpacity:1}} />
              </linearGradient>
            </defs>
          </svg>
        )
      case 'gradient':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="20" cy="20" r="20" fill={`url(#${gradientId})`}/>
            <g fill="white" opacity="0.9">
              <circle cx="20" cy="14" r="6"/>
              <path d="M8 32c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </g>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: primaryColor, stopOpacity:1}} />
                <stop offset="100%" style={{stopColor: secondaryColor, stopOpacity:1}} />
              </linearGradient>
            </defs>
          </svg>
        )
      case 'minimal':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="16" cy="16" r="16" fill={primaryColor}/>
            <text x="16" y="20" textAnchor="middle" fill="white" fontSize="14" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
              {getInitials(username || 'U')}
            </text>
          </svg>
        )
      default: // simple
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="16" cy="16" r="16" fill={`url(#${gradientId})`}/>
            <g fill="white" opacity="0.9">
              <circle cx="16" cy="12" r="4"/>
              <path d="M8 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </g>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: primaryColor, stopOpacity:1}} />
                <stop offset="100%" style={{stopColor: secondaryColor, stopOpacity:1}} />
              </linearGradient>
            </defs>
          </svg>
        )
    }
  }

  return getSvgContent()
}

export default DefaultAvatar
