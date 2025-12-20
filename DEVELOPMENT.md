# Whispers of the Heart 开发指南

## 项目端口配置

| 项目 | 端口 | 访问地址 | 说明 |
|------|------|----------|------|
| **API** | 7777 | http://localhost:7777 | 后端 NestJS 服务 |
| **Web** | 8888 | http://localhost:8888 | 前端博客应用（含管理后台） |

## 开发命令

### 启动所有项目

```bash
pnpm dev
```

### 分别启动项目

```bash
# 启动后端 API
pnpm dev:api

# 启动前端 Web
pnpm dev:web
```

### 构建项目

```bash
# 构建所有项目
pnpm build

# 分别构建
pnpm build:api
pnpm build:web
```

### 类型检查

```bash
# 检查所有项目
pnpm type-check
```

### 代码检查

```bash
pnpm lint
```

### 数据库操作

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 推送数据库架构
pnpm db:push

# 初始化种子数据
pnpm db:seed

# 打开 Prisma Studio
cd apps/api && npx prisma studio
```

### Docker 操作

```bash
# 启动 Docker 服务
docker-compose -f docker-compose.prod.yml up -d

# 停止 Docker 服务
docker-compose -f docker-compose.prod.yml down

# 构建 Docker 镜像
docker-compose -f docker-compose.prod.yml build

# 查看 Docker 日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 快速开始

1. **安装依赖**

   ```bash
   pnpm install
   ```

2. **配置环境变量**

   ```bash
   cp configs/env.example configs/env.development
   # 编辑 configs/env.development 填入你的配置
   ```

3. **启动数据库服务**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d postgres redis minio
   ```

4. **初始化数据库**

   ```bash
   cd apps/api && npx prisma db push && npx prisma db seed
   ```

5. **启动开发环境**

   ```bash
   pnpm dev
   ```

6. **访问应用**

   - 博客前端：http://localhost:8888
   - 管理后台：http://localhost:8888/admin
   - API 服务：http://localhost:7777

## 项目结构

```
whispers-of-the-heart/
├── apps/
│   ├── web/                    # 前端博客应用（含管理后台）
│   │   ├── src/
│   │   │   ├── pages/          # 页面组件
│   │   │   │   ├── admin/      # 管理后台页面
│   │   │   │   └── ...         # 博客页面
│   │   │   ├── components/     # 公共组件
│   │   │   ├── layouts/        # 布局组件
│   │   │   ├── stores/         # Zustand 状态管理
│   │   │   └── i18n/           # 国际化配置
│   │   └── ...
│   └── api/                    # 后端 NestJS 服务
│       ├── src/
│       │   ├── auth/           # 认证模块
│       │   ├── user/           # 用户模块
│       │   ├── blog/           # 博客模块
│       │   ├── comment/        # 评论模块
│       │   ├── media/          # 媒体模块
│       │   ├── admin/          # 管理接口
│       │   ├── mail/           # 邮件模块
│       │   └── common/         # 公共模块
│       └── prisma/             # Prisma 配置和迁移
├── packages/
│   ├── ui/                     # 公共 UI 组件库
│   ├── utils/                  # 通用工具函数
│   ├── types/                  # 共享类型定义
│   └── hooks/                  # 共享 React Hooks
├── configs/                    # 环境配置
│   ├── env.example             # 配置模板
│   ├── env.development         # 开发环境配置
│   └── env.production          # 生产环境配置
└── infra/                      # 基础设施
    └── docker/                 # Docker 配置
```

## 功能模块

### Web 前端

- 文章展示与搜索
- 标签和分类浏览
- 评论系统（支持嵌套回复）
- 点赞与收藏
- 用户注册与登录
- 个人资料管理
- 暗色/亮色主题切换
- 国际化支持 (中文/英文)

### 管理后台 (/admin)

- 仪表盘数据统计
- 文章管理（发布、编辑、删除）
- 评论管理
- 用户管理
- 媒体资源管理
- 分类与标签管理
- 站点配置

### 后端 API

- JWT 认证 + RefreshToken
- 用户管理与权限控制
- 博客 CRUD 操作
- 媒体文件上传（MinIO）
- 评论系统
- 邮件通知
- 请求日志记录

## 技术栈

### 前端

- React 18 + TypeScript
- Vite 构建工具
- TailwindCSS 样式
- React Router 路由
- Zustand 状态管理
- BlockNote 富文本编辑器
- i18next 国际化

### 后端

- NestJS 框架
- Prisma ORM
- PostgreSQL 数据库
- JWT 认证
- MinIO 对象存储
- Nodemailer 邮件

### DevOps

- Docker + Docker Compose
- Nginx 反向代理
- Turborepo 构建系统
- pnpm Monorepo 管理

## 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@whispers.local | admin123 |

## 注意事项

1. 确保端口 7777、8888 未被其他服务占用
2. 首次启动需要运行数据库初始化命令
3. 管理后台需要管理员权限登录
4. 开发模式下所有项目支持热重载
5. 环境配置文件不会被提交到版本库，请妥善保管
