import React, { useState, useEffect } from 'react'
import { Play, Heart, Music, User, Eye } from 'lucide-react'
import { DEFAULT_AUDIO_COVER } from '../constants/images'
import AudioPlayer from '../components/AudioPlayer'
import { FilePreviewModal } from '@whispers/ui'
import { api } from '@whispers/utils'

interface AudioTrack {
  id: string
  title: string
  artist: string
  album?: string
  cover?: string
  src: string
  duration: number
  plays?: number
  likes?: number
  uploadTime?: string
  genre?: string
}

const AudiosPage: React.FC = () => {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewTrack, setPreviewTrack] = useState<AudioTrack | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟从API获取音频数据
    const fetchTracks = async () => {
      try {
        const response = await api.get('/audios')
        if (response.data?.items) {
          setTracks(response.data.items)
        } else {
          // 使用模拟数据
          setTracks([
            {
              id: '1',
              title: '夜曲',
              artist: '周杰伦',
              album: '十一月的萧邦',
              cover: 'https://picsum.photos/300/300?random=1',
              src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              duration: 240,
              plays: 154200,
              likes: 8920,
              uploadTime: '2024-01-15',
              genre: '流行'
            },
            {
              id: '2',
              title: '青花瓷',
              artist: '周杰伦',
              album: '我很忙',
              cover: 'https://picsum.photos/300/300?random=2',
              src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              duration: 280,
              plays: 89200,
              likes: 4560,
              uploadTime: '2024-01-10',
              genre: '流行'
            },
            {
              id: '3',
              title: '稻香',
              artist: '周杰伦',
              album: '魔杰座',
              cover: 'https://picsum.photos/300/300?random=3',
              src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              duration: 210,
              plays: 123400,
              likes: 6780,
              uploadTime: '2024-01-08',
              genre: '流行'
            },
            {
              id: '4',
              title: '晴天',
              artist: '周杰伦',
              album: '叶惠美',
              cover: 'https://picsum.photos/300/300?random=4',
              src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              duration: 320,
              plays: 56700,
              likes: 2340,
              uploadTime: '2024-01-05',
              genre: '流行'
            },
            {
              id: '5',
              title: '七里香',
              artist: '周杰伦',
              album: '七里香',
              cover: 'https://picsum.photos/300/300?random=5',
              src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              duration: 260,
              plays: 78900,
              likes: 3450,
              uploadTime: '2024-01-03',
              genre: '流行'
            },
            {
              id: '6',
              title: '东风破',
              artist: '周杰伦',
              album: '叶惠美',
              cover: 'https://picsum.photos/300/300?random=6',
              src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              duration: 290,
              plays: 112300,
              likes: 5670,
              uploadTime: '2024-01-01',
              genre: '流行'
            }
          ])
        }
      } catch (error) {
        console.error('获取音频列表失败:', error)
        // 使用模拟数据作为后备
        setTracks([
          {
            id: '1',
            title: '夜曲',
            artist: '周杰伦',
            album: '十一月的萧邦',
            cover: 'https://picsum.photos/300/300?random=1',
            src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            duration: 240,
            plays: 154200,
            likes: 8920,
            uploadTime: '2024-01-15',
            genre: '流行'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTracks()
  }, [])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatPlays = (plays?: number) => {
    if (!plays) return '0'
    if (plays >= 10000) {
      return `${(plays / 10000).toFixed(1)}万`
    }
    return plays.toString()
  }

  const handleTrackClick = (index: number) => {
    setCurrentTrackIndex(index)
    setShowPlayer(true)
  }

  const handlePreviewTrack = (track: AudioTrack) => {
    setPreviewTrack(track)
    setShowPreviewModal(true)
  }

  const handleClosePlayer = () => {
    setShowPlayer(false)
  }

  const handleTrackChange = (_track: AudioTrack, index: number) => {
    setCurrentTrackIndex(index)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">加载音频中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">音乐中心</h1>
        <p className="text-gray-600">聆听美妙的音乐，感受心灵的共鸣</p>
      </div>

      {/* 音频播放器模态框 */}
      {showPlayer && tracks.length > 0 && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <button
              onClick={handleClosePlayer}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-lg font-bold"
            >
              关闭
            </button>
            <AudioPlayer
              tracks={tracks}
              currentTrackIndex={currentTrackIndex}
              autoPlay
              showPlaylist
              onTrackChange={handleTrackChange}
            />
          </div>
        </div>
      )}

      {/* 音频列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
          >
            {/* 音频封面 */}
            <div className="relative aspect-square bg-gray-200">
              <img
                src={track.cover}
                alt={track.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AUDIO_COVER
                }}
              />
              {/* 播放按钮覆盖层 */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTrackClick(index)
                    }}
                    className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Play className="w-6 h-6 text-gray-900 ml-1" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreviewTrack(track)
                    }}
                    className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Eye className="w-6 h-6 text-gray-900" />
                  </button>
                </div>
              </div>
              {/* 时长标签 */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(track.duration)}
              </div>
            </div>

            {/* 音频信息 */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 hover:text-primary transition-colors">
                {track.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-1 flex items-center">
                <User className="w-3 h-3 mr-1" />
                {track.artist}
              </p>
              {track.album && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-1 flex items-center">
                  <Music className="w-3 h-3 mr-1" />
                  {track.album}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Play className="w-3 h-3 mr-1" />
                    {formatPlays(track.plays)}
                  </span>
                  <span className="flex items-center">
                    <Heart className="w-3 h-3 mr-1" />
                    {track.likes || 0}
                  </span>
                </div>
                <span>{track.uploadTime || ''}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {tracks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无音频内容</h3>
          <p className="text-gray-600">敬请期待更多精彩音乐</p>
        </div>
      )}

      {/* 文件预览模态框 */}
      {previewTrack && (
        <FilePreviewModal
          file={{
            id: previewTrack.id,
            name: `${previewTrack.artist} - ${previewTrack.title}`,
            url: previewTrack.src,
            type: 'audio/mpeg',
            size: 0,
            originalName: `${previewTrack.artist} - ${previewTrack.title}`
          }}
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false)
            setPreviewTrack(null)
          }}
          showFileName={true}
          showFileSize={false}
        />
      )}
    </div>
  )
}

export default AudiosPage
