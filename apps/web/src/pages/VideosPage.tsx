import React, { useState, useEffect } from 'react'
import { Play, Clock, Eye, Heart } from 'lucide-react'
import { DEFAULT_VIDEO_COVER } from '../constants/images'
import VideoPlayer from '../components/VideoPlayer'
import { FilePreviewModal } from '@whispers/ui'
import { api } from '@whispers/utils'

interface Video {
  id: string
  title: string
  description: string
  cover: string
  src: string
  duration: number
  views: number
  likes: number
  uploadTime: string
  category: string
}

const VideosPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟从API获取视频数据
    const fetchVideos = async () => {
      try {
        const response = await api.get('/videos')
        if (response.data?.items) {
          setVideos(response.data.items)
        } else {
          // 使用模拟数据
          setVideos([
            {
              id: '1',
              title: 'React 18 新特性详解',
              description: '深入解析 React 18 的新特性和改进，包括并发渲染、自动批处理等',
              cover: 'https://picsum.photos/400/225?random=1',
              src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
              duration: 1250,
              views: 15420,
              likes: 892,
              uploadTime: '2024-01-15',
              category: '技术'
            },
            {
              id: '2',
              title: 'TypeScript 高级技巧',
              description: '学习 TypeScript 的高级类型、泛型和装饰器等高级特性',
              cover: 'https://picsum.photos/400/225?random=2',
              src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
              duration: 1840,
              views: 8920,
              likes: 456,
              uploadTime: '2024-01-10',
              category: '技术'
            },
            {
              id: '3',
              title: 'TailwindCSS 实战教程',
              description: '从零开始学习 TailwindCSS，构建现代化的响应式界面',
              cover: 'https://picsum.photos/400/225?random=3',
              src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
              duration: 2100,
              views: 12340,
              likes: 678,
              uploadTime: '2024-01-08',
              category: '设计'
            },
            {
              id: '4',
              title: 'Node.js 微服务架构',
              description: '使用 Node.js 构建可扩展的微服务架构系统',
              cover: 'https://picsum.photos/400/225?random=4',
              src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_10mb.mp4',
              duration: 3200,
              views: 5670,
              likes: 234,
              uploadTime: '2024-01-05',
              category: '后端'
            },
            {
              id: '5',
              title: 'Docker 容器化部署',
              description: '学习 Docker 容器化技术，实现应用的快速部署和扩展',
              cover: 'https://picsum.photos/400/225?random=5',
              src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
              duration: 1560,
              views: 7890,
              likes: 345,
              uploadTime: '2024-01-03',
              category: '运维'
            },
            {
              id: '6',
              title: 'Vue 3 Composition API',
              description: '深入理解 Vue 3 的 Composition API 和响应式系统',
              cover: 'https://picsum.photos/400/225?random=6',
              src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
              duration: 1980,
              views: 11230,
              likes: 567,
              uploadTime: '2024-01-01',
              category: '前端'
            }
          ])
        }
      } catch (error) {
        console.error('获取视频列表失败:', error)
        // 使用模拟数据作为后备
        setVideos([
          {
            id: '1',
            title: 'React 18 新特性详解',
            description: '深入解析 React 18 的新特性和改进，包括并发渲染、自动批处理等',
            cover: 'https://picsum.photos/400/225?random=1',
            src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 1250,
            views: 15420,
            likes: 892,
            uploadTime: '2024-01-15',
            category: '技术'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatViews = (views: number) => {
    if (views >= 10000) {
      return `${(views / 10000).toFixed(1)}万`
    }
    return views.toString()
  }

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video)
    setShowPlayer(true)
  }

  const handlePreviewVideo = (video: Video) => {
    setPreviewVideo(video)
    setShowPreviewModal(true)
  }

  const handleClosePlayer = () => {
    setShowPlayer(false)
    setSelectedVideo(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">加载视频中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">视频中心</h1>
        <p className="text-gray-600">发现精彩的技术视频内容</p>
      </div>

      {/* 视频播放器模态框 */}
      {showPlayer && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl">
            <button
              onClick={handleClosePlayer}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-lg font-bold"
            >
              关闭
            </button>
            <VideoPlayer
              src={selectedVideo.src}
              poster={selectedVideo.cover}
              title={selectedVideo.title}
              className="w-full aspect-video"
              autoPlay
            />
            {/* 视频信息 */}
            <div className="bg-white p-6 rounded-b-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedVideo.title}</h2>
              <p className="text-gray-600 mb-4">{selectedVideo.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {formatViews(selectedVideo.views)} 次观看
                </span>
                <span className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {selectedVideo.likes} 点赞
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(selectedVideo.duration)}
                </span>
                <span>{selectedVideo.uploadTime}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 视频网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* 视频封面 */}
            <div className="relative aspect-video bg-gray-200">
              <img
                src={video.cover}
                alt={video.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_VIDEO_COVER
                }}
              />
              {/* 播放按钮覆盖层 */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVideoClick(video)
                    }}
                    className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Play className="w-6 h-6 text-gray-900 ml-1" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreviewVideo(video)
                    }}
                    className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Eye className="w-6 h-6 text-gray-900" />
                  </button>
                </div>
              </div>
              {/* 时长标签 */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>
            </div>

            {/* 视频信息 */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors">
                {video.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {video.description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {formatViews(video.views)}
                  </span>
                  <span className="flex items-center">
                    <Heart className="w-3 h-3 mr-1" />
                    {video.likes}
                  </span>
                </div>
                <span>{video.uploadTime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {videos.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无视频内容</h3>
          <p className="text-gray-600">敬请期待更多精彩视频</p>
        </div>
      )}

      {/* 文件预览模态框 */}
      {previewVideo && (
        <FilePreviewModal
          file={{
            id: previewVideo.id,
            name: previewVideo.title,
            url: previewVideo.src,
            type: 'video/mp4',
            size: 0,
            originalName: previewVideo.title
          }}
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false)
            setPreviewVideo(null)
          }}
          showFileName={true}
          showFileSize={false}
        />
      )}
    </div>
  )
}

export default VideosPage
