// 用户角色枚举
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED'
}

// 基础用户接口
export interface IUser {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: UserRole
  status: UserStatus
  isEmailVerified: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 创建用户接口
export interface ICreateUser {
  email: string
  username: string
  password: string
  firstName?: string
  lastName?: string
  role?: UserRole
}

// 更新用户接口
export interface IUpdateUser {
  firstName?: string
  lastName?: string
  avatar?: string
  role?: UserRole
  status?: UserStatus
}

// 用户登录接口
export interface IUserLogin {
  email: string
  password: string
  rememberMe?: boolean
}

// 用户注册接口
export interface IUserRegister extends ICreateUser {
  confirmPassword: string
  acceptTerms: boolean
}

// 用户资料接口
export interface IUserProfile {
  id: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  bio?: string
  website?: string
  location?: string
  birthDate?: Date
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'
}

// 用户统计接口
export interface IUserStats {
  userId: string
  postsCount: number
  commentsCount: number
  likesCount: number
  followersCount: number
  followingCount: number
  lastActivityAt: Date
}
