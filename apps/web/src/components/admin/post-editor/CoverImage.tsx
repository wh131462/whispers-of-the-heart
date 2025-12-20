import React, { useState } from 'react'
import { Button } from '@whispers/ui'
import { ImageIcon, RefreshCw, Trash2, Move } from 'lucide-react'

interface CoverImageProps {
  coverImage?: string
  onCoverChange: (url: string) => void
  onOpenMediaPicker: () => void
}

const CoverImage: React.FC<CoverImageProps> = ({
  coverImage,
  onCoverChange,
  onOpenMediaPicker
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [objectPosition, setObjectPosition] = useState('center')

  const handleRemoveCover = () => {
    onCoverChange('')
    setImageError(false)
  }

  const handleRepositionCover = () => {
    const positions = ['top', 'center', 'bottom']
    const currentIndex = positions.indexOf(objectPosition)
    const nextIndex = (currentIndex + 1) % positions.length
    setObjectPosition(positions[nextIndex])
  }

  // 无封面状态
  if (!coverImage || imageError) {
    return (
      <div
        className="relative w-full group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onOpenMediaPicker}
      >
        <div
          className={`
            w-full h-16 flex items-center justify-center
            transition-all duration-200
            ${isHovered ? 'bg-muted/60 h-32' : 'bg-transparent'}
          `}
        >
          <div
            className={`
              flex items-center gap-2 text-muted-foreground/60
              transition-opacity duration-200
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-sm font-medium">添加封面</span>
          </div>
        </div>
      </div>
    )
  }

  // 有封面状态
  return (
    <div
      className="relative w-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 封面图片 */}
      <div className="relative w-full h-[280px] overflow-hidden">
        <img
          src={coverImage}
          alt="文章封面"
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ objectPosition }}
          onError={() => setImageError(true)}
        />

        {/* 渐变遮罩 */}
        <div
          className={`
            absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30
            transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
        />

        {/* 操作按钮 */}
        <div
          className={`
            absolute bottom-4 right-4 flex items-center gap-2
            transition-all duration-200
            ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onOpenMediaPicker()
            }}
            className="bg-white/90 hover:bg-white text-gray-800 shadow-lg"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            更换封面
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRepositionCover()
            }}
            className="bg-white/90 hover:bg-white text-gray-800 shadow-lg"
          >
            <Move className="h-4 w-4 mr-1.5" />
            调整位置
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRemoveCover()
            }}
            className="bg-white/90 hover:bg-white text-red-600 shadow-lg hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CoverImage
