# 编码规则和约束

> **用途**: AI编写代码时必须遵守的规则（清单式，无歧义）
> **原则**: 约束越明确，AI输出越精准，token消耗越少

## 通用规则

### ✅ 必须做

- [ ] 所有函数必须有TypeScript类型注解
- [ ] 使用ESLint和Prettier的规则（运行`pnpm lint`验证）
- [ ] 错误处理：所有API调用必须有try-catch
- [ ] 未使用变量使用 `_` 前缀忽略 (如 `_unused`)
- [ ] 优先使用 `const`，只在需要时使用 `let`

### ✅ 命名规范

| 类型       | 规范             | 示例                          |
| ---------- | ---------------- | ----------------------------- |
| React组件  | PascalCase       | `UserProfile`, `PostCard`     |
| 函数/方法  | camelCase        | `getUserData`, `handleClick`  |
| 常量       | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| 文件(组件) | PascalCase       | `UserProfile.tsx`             |
| 文件(工具) | kebab-case       | `format-date.ts`              |
| 类型/接口  | PascalCase       | `User`, `PostResponse`        |
| CSS类      | kebab-case       | `.user-card`, `.btn-primary`  |

### ✅ 导入顺序

```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. 外部库
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

// 3. 内部包 (@whispers/*)
import { Button } from '@whispers/ui';
import { api } from '@whispers/utils';

// 4. 相对路径
import { useAuthStore } from '../stores/useAuthStore';
import { formatDate } from './utils';
```

### ❌ 禁止做

- [ ] 不使用 `any` 类型（使用 `unknown` 或具体类型，必要时用 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 并注释原因）
- [ ] 不使用 `console.log`（开发调试除外，生产前删除）
- [ ] 不直接修改 Prisma 生成的文件
- [ ] 不在前端组件中直接写数据库查询
- [ ] 不提交 `.env` 文件（只提交 `.env.example`）
- [ ] 不硬编码敏感信息（密码、密钥等）

## 前端规则（React/Vite）

### 组件结构模板

```tsx
// 标准函数组件模板
import React from 'react';
import { cn } from '@whispers/ui';

interface UserCardProps {
  userId: string;
  name: string;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  userId,
  name,
  className,
}) => {
  // 1. Hooks (状态、副作用)
  const [loading, setLoading] = React.useState(false);

  // 2. 事件处理函数
  const handleClick = () => {
    // ...
  };

  // 3. 渲染
  return <div className={cn('p-4 rounded-lg', className)}>{/* ... */}</div>;
};
```

### 样式规则

- [ ] 优先使用 Tailwind CSS 类
- [ ] 使用 `cn()` 函数合并类名（来自 `@whispers/ui`）
- [ ] 响应式设计：移动端优先 (`sm:`, `md:`, `lg:`)
- [ ] 暗色模式：使用 `dark:` 前缀
- [ ] 颜色使用 Tailwind 预设，不硬编码 hex 值

```tsx
// 正确示例
<div className="p-4 bg-white dark:bg-gray-800 sm:p-6 lg:p-8">

// 错误示例
<div style={{ padding: '16px', backgroundColor: '#ffffff' }}>
```

### 状态管理

| 场景             | 方案                               |
| ---------------- | ---------------------------------- |
| 组件本地状态     | `useState` / `useReducer`          |
| 全局状态(认证等) | Zustand (`stores/useAuthStore.ts`) |
| 服务器数据       | 直接 fetch + useState              |
| 表单状态         | `useState` + 受控组件              |

### Zustand Store 规范

```typescript
// stores/useExampleStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExampleState {
  data: SomeType | null;
  loading: boolean;
}

interface ExampleActions {
  fetchData: () => Promise<void>;
  reset: () => void;
}

type ExampleStore = ExampleState & ExampleActions;

export const useExampleStore = create<ExampleStore>()(
  persist(
    (set, get) => ({
      // 状态
      data: null,
      loading: false,

      // 方法
      fetchData: async () => {
        set({ loading: true });
        try {
          const response = await api.get('/endpoint');
          set({ data: response.data, loading: false });
        } catch (error) {
          set({ loading: false });
        }
      },

      reset: () => set({ data: null, loading: false }),
    }),
    {
      name: 'example-storage',
      partialize: state => ({ data: state.data }), // 只持久化必要字段
    }
  )
);
```

## 后端规则（NestJS）

### Controller 规范

```typescript
// *.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: User) {
    return this.postsService.create(createPostDto, user.id);
  }
}
```

### Service 规范

```typescript
// *.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    return post;
  }

  async create(createPostDto: CreatePostDto, authorId: string) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId,
      },
    });
  }
}
```

### DTO 规范

```typescript
// dto/create-post.dto.ts
import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

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
  @IsBoolean()
  published?: boolean;
}
```

### API 响应格式

所有 API 响应应遵循统一格式：

```typescript
// 成功响应
{
  success: true,
  data: T,
  message?: string
}

// 分页响应
{
  success: true,
  data: {
    items: T[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}

// 错误响应 (由 NestJS 异常过滤器处理)
{
  success: false,
  statusCode: number,
  message: string,
  error?: string
}
```

### RESTful 命名规范

| 操作     | 方法   | 路径                  | 示例                 |
| -------- | ------ | --------------------- | -------------------- |
| 列表     | GET    | /resources            | GET /posts           |
| 详情     | GET    | /resources/:id        | GET /posts/123       |
| 创建     | POST   | /resources            | POST /posts          |
| 更新     | PATCH  | /resources/:id        | PATCH /posts/123     |
| 删除     | DELETE | /resources/:id        | DELETE /posts/123    |
| 特殊操作 | POST   | /resources/:id/action | POST /posts/123/like |

## 数据库规则（Prisma）

### Schema 规范

```prisma
model Post {
  id          String    @id @default(cuid())
  title       String
  content     String    @db.Text
  published   Boolean   @default(false)

  // 时间戳
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // 关系 - 必须注释说明
  authorId    String
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  // 索引
  @@index([authorId])
  @@index([published])

  // 表名映射
  @@map("posts")
}
```

### 查询规则

- [ ] 避免 N+1 查询，使用 `include` 预加载关联数据
- [ ] 分页查询必须限制 `take` 最大值（如 100）
- [ ] 敏感字段使用 `select` 排除（如密码）
- [ ] 使用复合唯一索引避免重复数据

```typescript
// 正确：预加载关联
const posts = await this.prisma.post.findMany({
  include: {
    author: { select: { id: true, username: true } },
  },
});

// 正确：分页
const posts = await this.prisma.post.findMany({
  skip: (page - 1) * limit,
  take: Math.min(limit, 100), // 限制最大值
});
```

## Git 提交规则

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具链相关
```

示例：

```
feat: 添加评论点赞功能
fix: 修复登录token过期问题
docs: 更新API文档
```

## AI执行检查清单

在提交代码前，AI必须验证：

```bash
# 1. 类型检查
pnpm run type-check

# 2. 代码检查
pnpm run lint

# 3. 构建测试（如修改了共享包）
pnpm run packages:build
```

## 错误处理规范

### 前端错误处理

```typescript
try {
  const response = await api.post('/endpoint', data);
  if (response.data?.success) {
    // 处理成功
  }
} catch (error) {
  // 统一错误处理
  const message = error instanceof Error ? error.message : '操作失败';
  // 显示错误提示
}
```

### 后端错误处理

使用 NestJS 内置异常：

```typescript
throw new NotFoundException('资源不存在');
throw new BadRequestException('参数错误');
throw new ForbiddenException('无权限');
throw new ConflictException('资源已存在');
throw new UnauthorizedException('未授权');
```

---

**最后更新**: 2025-12-25
