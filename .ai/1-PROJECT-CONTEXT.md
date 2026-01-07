# 项目全局上下文

> **用途**: 让AI在30秒内理解项目的核心信息
> **更新频率**: 重大变更时（每月1-2次）

## 项目基本信息

**项目名称**: Whispers of the Heart (心语)
**类型**: 全栈博客平台 (Monorepo)
**领域**: 个人博客系统
**当前阶段**: 生产环境运行中
**在线地址**: https://131462.wang
**仓库**: https://github.com/wh131462/whispers-of-the-heart

## 一句话描述

一个现代化的个人博客系统，采用 React + NestJS + PostgreSQL 技术栈，支持文章发布、评论互动、标签分类、媒体管理等功能。

## 项目结构速览

```
whispers-of-the-heart/
├── apps/
│   ├── web/              # Vite + React 前端应用（含管理后台）
│   └── api/              # NestJS 后端 API 服务
├── packages/
│   ├── ui/               # 共享UI组件库 (@whispers/ui)
│   ├── utils/            # 共享工具函数 (@whispers/utils)
│   ├── types/            # 共享类型定义 (@whispers/types)
│   └── hooks/            # 共享React Hooks (@whispers/hooks)
├── configs/              # 环境配置文件
├── infra/                # 基础设施配置
├── scripts/              # 构建和部署脚本
└── working/              # AI工作区（报告和临时文件）
```

## 核心技术栈（关键技术）

- **前端**: Vite + React 19 + TypeScript + Tailwind CSS
- **后端**: NestJS 11 + Prisma 6 + PostgreSQL
- **状态管理**: Zustand (持久化)
- **包管理**: pnpm (Workspace) + Turborepo
- **富文本**: BlockNote 编辑器
- **存储**: MinIO 对象存储

## 架构关键点

1. **Monorepo结构**: 使用 pnpm workspace + Turborepo 管理
2. **共享包**: packages/\* 被 web 和 api 复用
3. **API通信**: RESTful API + JWT 认证
4. **状态管理**: Zustand + persist 中间件
5. **实时通信**: Socket.IO (通知系统)

## 核心功能模块

| 模块     | 描述                        | 关键文件                    |
| -------- | --------------------------- | --------------------------- |
| 用户认证 | 登录/注册/JWT刷新/邮箱验证  | `apps/api/src/auth/`        |
| 博客文章 | CRUD/标签/点赞/收藏/搜索    | `apps/api/src/blog/`        |
| 评论系统 | 嵌套评论/点赞/举报          | `apps/api/src/comment/`     |
| 媒体管理 | MinIO存储/图片视频/使用追踪 | `apps/api/src/media/`       |
| 用户管理 | 个人资料/头像/通知设置      | `apps/api/src/user/`        |
| 站点配置 | Logo/社交链接/评论设置      | `apps/api/src/site-config/` |
| 管理后台 | 文章/评论/用户/媒体管理     | `apps/web/src/pages/admin/` |

## 端口配置

| 服务       | 开发环境              | 说明        |
| ---------- | --------------------- | ----------- |
| API        | http://localhost:7777 | 后端API服务 |
| Web        | http://localhost:8888 | 前端应用    |
| PostgreSQL | localhost:5432        | 数据库      |
| MinIO      | localhost:9000/9001   | 对象存储    |
| pgAdmin    | localhost:5050        | 数据库管理  |

## 关键约束

- ✅ 必须保持 TypeScript 严格模式
- ✅ 所有UI组件必须响应式（移动端优先）
- ✅ API必须有统一的响应格式和错误处理
- ✅ 使用 Prisma 进行数据库操作
- ❌ 不使用 any 类型（除非有明确注释）
- ❌ 不直接操作 DOM（使用 React 方式）
- ❌ 不在组件中直接调用 Prisma

## 重要目录映射

| 功能领域   | 文件位置                                  |
| ---------- | ----------------------------------------- |
| 用户认证   | `apps/api/src/auth/`                      |
| 博客服务   | `apps/api/src/blog/blog.service.ts`       |
| 评论服务   | `apps/api/src/comment/comment.service.ts` |
| 媒体上传   | `apps/api/src/media/`                     |
| Prisma模型 | `apps/api/prisma/schema.prisma`           |
| UI组件     | `packages/ui/src/components/`             |
| 前端页面   | `apps/web/src/pages/`                     |
| 状态管理   | `apps/web/src/stores/`                    |
| API工具    | `packages/utils/src/`                     |

## 常用命令

```bash
# 开发
pnpm dev                    # 启动所有应用
pnpm dev:web                # 只启动前端
pnpm dev:api                # 只启动后端
pnpm dev:local:db           # 启动本地数据库服务

# 构建
pnpm build                  # 构建所有包
pnpm packages:build         # 只构建共享包

# 数据库
cd apps/api && npx prisma db push      # 推送schema
cd apps/api && npx prisma generate     # 生成客户端
cd apps/api && npx prisma studio       # 打开数据库UI

# 代码检查
pnpm lint                   # ESLint检查
pnpm type-check            # TypeScript类型检查
```

## 测试账号

| 角色   | 邮箱                 | 密码     |
| ------ | -------------------- | -------- |
| 管理员 | admin@whispers.local | admin123 |

---

**最后更新**: 2025-12-25
**维护者**: wh131462
