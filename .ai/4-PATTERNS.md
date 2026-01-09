# 项目常用模式

> **用途**: 提供可复制的代码模式，让AI直接复用，而不是每次重新设计
> **原则**: 示例代码 > 文字描述

## 前端模式

### 模式1: UI组件 (packages/ui)

```tsx
// packages/ui/src/components/VideoPlayer.tsx
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  onError?: (error: string) => void;
  onPlay?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  className,
  autoPlay = false,
  onError,
  onPlay,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => onPlay?.();
    const handleError = () => onError?.('视频加载失败');

    video.addEventListener('play', handlePlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('error', handleError);
    };
  }, [onError, onPlay]);

  return (
    <div
      className={cn(
        'relative bg-gray-900 dark:bg-black rounded-lg overflow-hidden',
        className
      )}
    >
      {title && <div className="vjs-title-bar">{title}</div>}
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        controls
        className="w-full h-full"
      />
    </div>
  );
};
```

**使用场景**: packages/ui 中的所有组件
**复用指南**: 遵循此结构，使用 `cn()` 合并类名

### 模式2: Zustand Store (持久化)

```typescript
// apps/web/src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setAuthToken, removeAuthToken } from '@whispers/utils';

interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
}

interface AuthActions {
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  setHasHydrated: (state: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      // 登录
      login: async (identifier: string, password: string) => {
        try {
          set({ isLoading: true });
          const isEmail = identifier.includes('@');

          const response = await api.post('/auth/login', {
            ...(isEmail ? { email: identifier } : { username: identifier }),
            password,
          });

          if (response.data?.success) {
            const token = response.data.data.accessToken;
            set({
              user: response.data.data.user,
              accessToken: token,
              refreshToken: response.data.data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            localStorage.setItem('auth_token', token);
            setAuthToken(token);
            return true;
          }

          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      // 登出
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('auth_token');
        removeAuthToken();
      },

      // 刷新token
      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          if (response.data?.success) {
            const token = response.data.data.accessToken;
            set({
              user: response.data.data.user,
              accessToken: token,
              refreshToken: response.data.data.refreshToken,
              isAuthenticated: true,
            });
            localStorage.setItem('auth_token', token);
            setAuthToken(token);
            return true;
          }
          get().logout();
          return false;
        } catch {
          get().logout();
          return false;
        }
      },

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => state => {
        if (state?.accessToken) {
          localStorage.setItem('auth_token', state.accessToken);
          setAuthToken(state.accessToken);
        }
        queueMicrotask(() => {
          useAuthStore.getState().setHasHydrated(true);
        });
      },
    }
  )
);

export { useAuthStore };
```

**使用场景**: 需要持久化的全局状态
**复用指南**: 修改接口定义和方法实现

### 模式3: 页面组件 (带数据获取)

```tsx
// apps/web/src/pages/posts/PostDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@whispers/utils';

interface Post {
  id: string;
  title: string;
  content: string;
  author: { username: string; avatar?: string };
}

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await api.get(`/posts/${id}`);
        if (response.data?.success) {
          setPost(response.data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) return <div className="animate-pulse">加载中...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!post) return <div>文章不存在</div>;

  return (
    <article className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <div className="mt-4 prose dark:prose-invert">{post.content}</div>
    </article>
  );
};
```

**使用场景**: 需要从API获取数据的页面
**复用指南**: 替换类型定义和API端点

## 后端模式

### 模式1: NestJS Service (完整CRUD)

```typescript
// apps/api/src/blog/blog.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/blog.dto';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // 创建
  async createPost(createPostDto: CreatePostDto, authorId: string) {
    const slug = await this.generateUniqueSlug(createPostDto.title);

    return this.prisma.post.create({
      data: {
        ...createPostDto,
        slug,
        authorId,
        published: createPostDto.published || false,
        publishedAt: createPostDto.published ? new Date() : null,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
      },
    });
  }

  // 分页列表
  async findAllPosts(
    page = 1,
    limit = 10,
    search?: string,
    published?: boolean
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (published !== undefined) {
      where.published = published;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, username: true, avatar: true } },
          _count: { select: { postComments: true, postLikes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  // 单个查询
  async findOnePost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        _count: { select: { postComments: true, postLikes: true } },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 增加浏览量
    await this.prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return post;
  }

  // 更新
  async updatePost(id: string, updatePostDto: UpdatePostDto, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('文章不存在');

    // 权限检查
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (post.authorId !== userId && !currentUser?.isAdmin) {
      throw new ForbiddenException('无权限修改此文章');
    }

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  // 删除
  async removePost(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('文章不存在');

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (post.authorId !== userId && !currentUser?.isAdmin) {
      throw new ForbiddenException('无权限删除此文章');
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: '文章删除成功' };
  }

  // 辅助方法
  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() || `post-${Date.now()}`;

    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return slug;
  }
}
```

**使用场景**: 任何资源的CRUD服务
**复用指南**: 替换模型名、DTO、关联查询

### 模式2: NestJS Controller

```typescript
// apps/api/src/blog/blog.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreatePostDto, UpdatePostDto } from './dto/blog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('posts')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: any) {
    return this.blogService.createPost(createPostDto, user.id);
  }

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('published') published?: boolean
  ) {
    return this.blogService.findAllPosts(page, limit, search, published);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.findOnePost(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: any
  ) {
    return this.blogService.updatePost(id, updatePostDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.blogService.removePost(id, user.id);
  }

  // 特殊操作: 点赞
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@Param('id') id: string, @CurrentUser() user: any) {
    return this.blogService.toggleLike(id, user.id);
  }
}
```

### 模式3: DTO 定义

```typescript
// apps/api/src/blog/dto/blog.dto.ts
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}
```

## 数据库模式

### 模式1: Prisma Schema 标准结构

```prisma
// apps/api/prisma/schema.prisma

// 用户模型
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String   @unique
  password      String
  avatar        String?
  bio           String?
  isAdmin       Boolean  @default(false)
  emailVerified Boolean  @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // 关联关系
  posts         Post[]
  comments      Comment[]
  likes         Like[]

  @@index([email])
  @@index([username])
  @@map("users")
}

// 文章模型
model Post {
  id          String    @id @default(cuid())
  title       String
  content     String    @db.Text
  excerpt     String?
  slug        String    @unique
  coverImage  String?
  published   Boolean   @default(false)
  publishedAt DateTime?
  views       Int       @default(0)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // 关联关系
  authorId    String
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  postTags    PostTag[]
  comments    Comment[]
  likes       Like[]

  @@index([slug])
  @@index([published])
  @@index([authorId])
  @@map("posts")
}

// 多对多关联表
model PostTag {
  id     String @id @default(cuid())
  postId String
  tagId  String

  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([postId, tagId])
  @@index([postId])
  @@index([tagId])
  @@map("post_tags")
}

// 点赞模型 (唯一约束)
model Like {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])  // 确保一个用户只能点赞一次
  @@index([postId])
  @@index([userId])
  @@map("likes")
}
```

## 工具函数模式

### 模式1: cn() 类名合并

```typescript
// packages/ui/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

使用示例：

```tsx
<div className={cn(
  'base-class',
  isActive && 'active-class',
  className
)}>
```

### 模式2: API 客户端

```typescript
// packages/utils/src/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7777';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// 添加认证token
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

// 响应拦截器
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 处理认证失败
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);
```

---

## 编辑器模式

### 模式1: BlockNote FormattingToolbar 自定义

```tsx
// packages/ui/src/components/editor/BlockNoteEditor.tsx
import {
  FormattingToolbar,
  FormattingToolbarController,
  BlockTypeSelect,
  BasicTextStyleButton,
  TextAlignButton,
  ColorStyleButton,
  NestBlockButton,
  UnnestBlockButton,
  CreateLinkButton,
  blockTypeSelectItems,
  useSelectedBlocks,
  useBlockNoteEditor,
  useComponentsContext,
  useEditorState,
} from '@blocknote/react';
import { AIToolbarButton } from '@blocknote/xl-ai';

// 媒体块类型列表
const MEDIA_BLOCK_TYPES = [
  'customImage',
  'customVideo',
  'customAudio',
  'customFile',
];

// 自定义 FormattingToolbar 组件
const CustomFormattingToolbar: React.FC<{
  blockTypeSelectItems: ReturnType<typeof blockTypeSelectItems>;
  showAIButton: boolean;
}> = ({ blockTypeSelectItems: items, showAIButton }) => {
  const selectedBlocks = useSelectedBlocks();

  // 检查是否选中了媒体块
  const isMediaBlockSelected = selectedBlocks.some(block =>
    MEDIA_BLOCK_TYPES.includes(block.type)
  );

  // 媒体块选中时不显示 AI 按钮
  const shouldShowAIButton = showAIButton && !isMediaBlockSelected;

  return (
    <FormattingToolbar>
      {/* AI 编辑按钮放在最前面 */}
      {shouldShowAIButton && <AIToolbarButton />}

      {/* 段落类型选择 */}
      <BlockTypeSelect items={items} />

      {/* 基本文本样式 */}
      <BasicTextStyleButton basicTextStyle="bold" />
      <BasicTextStyleButton basicTextStyle="italic" />
      <BasicTextStyleButton basicTextStyle="underline" />
      <BasicTextStyleButton basicTextStyle="strike" />

      {/* 文本对齐 */}
      <TextAlignButton textAlignment="left" />
      <TextAlignButton textAlignment="center" />
      <TextAlignButton textAlignment="right" />

      {/* 颜色 */}
      <ColorStyleButton />

      {/* 缩进 */}
      <NestBlockButton />
      <UnnestBlockButton />

      {/* 链接 */}
      <CreateLinkButton />

      {/* 媒体块选中时显示自定义按钮 */}
      {isMediaBlockSelected && (
        <>
          <MediaReplaceButton />
          <MediaDeleteButton />
        </>
      )}
    </FormattingToolbar>
  );
};

// 在 BlockNoteView 中使用
<BlockNoteView editor={editor} formattingToolbar={false}>
  <FormattingToolbarController
    formattingToolbar={() => (
      <CustomFormattingToolbar
        blockTypeSelectItems={getFilteredBlockTypeSelectItems()}
        showAIButton={isAIEnabled}
      />
    )}
  />
</BlockNoteView>;
```

**使用场景**: 需要自定义 BlockNote 编辑器工具栏时
**关键点**:

- `formattingToolbar={false}` 禁用默认工具栏
- FormattingToolbar 的子元素会**完全替换**默认按钮
- 使用 `useSelectedBlocks()` 检测当前选中的块类型
- 根据块类型条件渲染不同的按钮

---

## AI使用指南

**当AI需要创建新功能时：**

1. 首先查阅此文件，找到最相似的模式
2. 复制模式代码作为起点
3. 根据具体需求修改关键部分
4. 遵守 `3-CODING-RULES.md` 中的规则

**示例提示词：**

```
"参考 4-PATTERNS.md 中的「模式1: NestJS Service」，为 Comment 资源创建完整的 CRUD Service"
```

---

**最后更新**: 2026-01-09
**新增模式**: 在重复实现类似功能3次后，应提取为新模式
