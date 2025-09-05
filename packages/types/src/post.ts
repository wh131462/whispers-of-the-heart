// 文章状态枚举
export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

// 文章类型枚举
export enum PostType {
  ARTICLE = 'ARTICLE',
  NEWS = 'NEWS',
  TUTORIAL = 'TUTORIAL',
  REVIEW = 'REVIEW',
  INTERVIEW = 'INTERVIEW'
}

// 文章可见性枚举
export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PROTECTED = 'PROTECTED'
}

// 基础文章接口
export interface IPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featuredImage?: string
  status: PostStatus
  type: PostType
  visibility: PostVisibility
  authorId: string
  categoryId?: string
  tags: string[]
  metaTitle?: string
  metaDescription?: string
  isFeatured: boolean
  allowComments: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 创建文章接口
export interface ICreatePost {
  title: string
  slug?: string
  excerpt?: string
  content: string
  featuredImage?: string
  type: PostType
  visibility: PostVisibility
  categoryId?: string
  tags?: string[]
  metaTitle?: string
  metaDescription?: string
  isFeatured?: boolean
  allowComments?: boolean
}

// 更新文章接口
export interface IUpdatePost {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  featuredImage?: string
  status?: PostStatus
  type?: PostType
  visibility?: PostVisibility
  categoryId?: string
  tags?: string[]
  metaTitle?: string
  metaDescription?: string
  isFeatured?: boolean
  allowComments?: boolean
}

// 文章查询接口
export interface IPostQuery {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  tagId?: string
  authorId?: string
  status?: PostStatus
  type?: PostType
  visibility?: PostVisibility
  isFeatured?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'viewCount' | 'likeCount'
  sortOrder?: 'asc' | 'desc'
}

// 文章统计接口
export interface IPostStats {
  postId: string
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  averageReadingTime: number
  lastViewedAt?: Date
}

// 文章分类接口
export interface ICategory {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  level: number
  order: number
  postCount: number
  createdAt: Date
  updatedAt: Date
}

// 文章标签接口
export interface ITag {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  postCount: number
  createdAt: Date
  updatedAt: Date
}
