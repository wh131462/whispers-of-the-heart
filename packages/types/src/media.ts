// 媒体类型枚举
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  ARCHIVE = 'ARCHIVE'
}

// 媒体状态枚举
export enum MediaStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
  DELETED = 'DELETED'
}

// 媒体格式枚举
export enum MediaFormat {
  // 图片格式
  JPEG = 'JPEG',
  PNG = 'PNG',
  GIF = 'GIF',
  WEBP = 'WEBP',
  SVG = 'SVG',
  
  // 视频格式
  MP4 = 'MP4',
  AVI = 'AVI',
  MOV = 'MOV',
  WMV = 'WMV',
  FLV = 'FLV',
  
  // 音频格式
  MP3 = 'MP3',
  WAV = 'WAV',
  AAC = 'AAC',
  OGG = 'OGG',
  FLAC = 'FLAC',
  
  // 文档格式
  PDF = 'PDF',
  DOC = 'DOC',
  DOCX = 'DOCX',
  TXT = 'TXT',
  
  // 压缩格式
  ZIP = 'ZIP',
  RAR = 'RAR',
  TAR = 'TAR',
  GZ = 'GZ'
}

// 基础媒体接口
export interface IMedia {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  type: MediaType
  format: MediaFormat
  status: MediaStatus
  url: string
  thumbnailUrl?: string
  previewUrl?: string
  duration?: number // 视频/音频时长（秒）
  width?: number   // 图片/视频宽度
  height?: number  // 图片/视频高度
  metadata?: Record<string, any>
  tags: string[]
  uploadedBy: string
  uploadedAt: Date
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 创建媒体接口
export interface ICreateMedia {
  filename: string
  originalName: string
  mimeType: string
  size: number
  type: MediaType
  format: MediaFormat
  url: string
  thumbnailUrl?: string
  previewUrl?: string
  duration?: number
  width?: number
  height?: number
  metadata?: Record<string, any>
  tags?: string[]
}

// 更新媒体接口
export interface IUpdateMedia {
  filename?: string
  tags?: string[]
  status?: MediaStatus
  metadata?: Record<string, any>
}

// 媒体查询接口
export interface IMediaQuery {
  type?: MediaType
  format?: MediaFormat
  status?: MediaStatus
  uploadedBy?: string
  tags?: string[]
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'size' | 'filename'
  sortOrder?: 'asc' | 'desc'
}

// 媒体统计接口
export interface IMediaStats {
  mediaId: string
  viewCount: number
  downloadCount: number
  shareCount: number
  lastAccessedAt?: Date
}

// 媒体处理任务接口
export interface IMediaProcessingTask {
  id: string
  mediaId: string
  type: 'THUMBNAIL' | 'RESIZE' | 'COMPRESS' | 'CONVERT' | 'EXTRACT_METADATA'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  result?: any
  error?: string
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 媒体集合接口
export interface IMediaCollection {
  id: string
  name: string
  description?: string
  mediaIds: string[]
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
