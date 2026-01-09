# 技术栈速查表

> **用途**: 快速查询技术版本、用途、关键配置
> **格式**: 表格化，便于AI快速检索

## 前端技术栈 (apps/web)

| 技术                     | 版本    | 用途         | 配置文件                      |
| ------------------------ | ------- | ------------ | ----------------------------- |
| Vite                     | 7.x     | 构建工具     | `apps/web/vite.config.ts`     |
| React                    | 19.x    | UI框架       | -                             |
| TypeScript               | 5.8.x   | 类型系统     | `apps/web/tsconfig.json`      |
| Tailwind CSS             | 3.4.x   | 样式框架     | `apps/web/tailwind.config.js` |
| React Router             | 7.x     | 路由         | `apps/web/src/App.tsx`        |
| Zustand                  | 5.x     | 状态管理     | `apps/web/src/stores/`        |
| i18next                  | 25.x    | 国际化       | `apps/web/src/i18n/`          |
| Lucide React             | 0.542.x | 图标库       | -                             |
| React Markdown           | 10.x    | Markdown渲染 | -                             |
| Socket.IO Client         | 4.8.x   | 实时通信     | -                             |
| class-variance-authority | 0.7.x   | 组件变体     | -                             |
| clsx + tailwind-merge    | -       | 类名合并     | -                             |

## 后端技术栈 (apps/api)

| 技术              | 版本   | 用途      | 配置文件                        |
| ----------------- | ------ | --------- | ------------------------------- |
| NestJS            | 11.x   | 后端框架  | `apps/api/nest-cli.json`        |
| Prisma            | 6.15.x | ORM       | `apps/api/prisma/schema.prisma` |
| PostgreSQL        | 14+    | 数据库    | `configs/env.*`                 |
| Passport          | 0.7.x  | 认证      | `apps/api/src/auth/`            |
| JWT               | 11.x   | Token认证 | `@nestjs/jwt`                   |
| class-validator   | 0.14.x | 请求验证  | DTO文件                         |
| class-transformer | 0.5.x  | 数据转换  | -                               |
| bcrypt            | 6.x    | 密码加密  | -                               |
| Multer            | 2.x    | 文件上传  | -                               |
| Winston           | 3.x    | 日志系统  | `nest-winston`                  |
| Nodemailer        | 7.x    | 邮件发送  | `@nestjs-modules/mailer`        |
| Handlebars        | 4.x    | 邮件模板  | -                               |
| Socket.IO         | 4.8.x  | WebSocket | `@nestjs/websockets`            |
| Swagger           | 8.x    | API文档   | `@nestjs/swagger`               |

## 共享包

| 包名            | 用途        | 构建工具 | 位置              |
| --------------- | ----------- | -------- | ----------------- |
| @whispers/ui    | UI组件库    | tsup     | `packages/ui/`    |
| @whispers/utils | 工具函数    | tsup     | `packages/utils/` |
| @whispers/types | 类型定义    | tsup     | `packages/types/` |
| @whispers/hooks | React Hooks | tsup     | `packages/hooks/` |

## UI组件库核心依赖 (@whispers/ui)

| 技术                             | 用途             |
| -------------------------------- | ---------------- |
| BlockNote                        | 富文本编辑器     |
| @blocknote/xl-ai                 | BlockNote AI扩展 |
| CodeMirror                       | 代码编辑器       |
| Radix UI                         | 无样式组件       |
| Mantine                          | UI组件           |
| Video.js                         | 视频播放器       |
| React Howler                     | 音频播放器       |
| Emoji Mart                       | 表情选择器       |
| Shiki                            | 代码高亮         |
| Markmap                          | 思维导图渲染     |
| KaTeX                            | 数学公式渲染     |
| @eternalheart/react-file-preview | 文件/图片预览    |

## 开发工具

| 工具        | 版本 | 用途         | 配置文件                    |
| ----------- | ---- | ------------ | --------------------------- |
| pnpm        | 10.x | 包管理器     | `pnpm-workspace.yaml`       |
| Turborepo   | 2.x  | Monorepo构建 | `turbo.json`                |
| ESLint      | 9.x  | 代码检查     | `eslint.config.mjs`         |
| Prettier    | 3.x  | 代码格式化   | `.prettierrc`               |
| Husky       | 9.x  | Git钩子      | `.husky/`                   |
| lint-staged | 16.x | 暂存区检查   | `package.json`              |
| tsup        | 8.x  | 包构建       | `packages/*/tsup.config.ts` |

## 基础设施

| 服务           | 用途       | 配置文件                 |
| -------------- | ---------- | ------------------------ |
| Docker Compose | 容器编排   | `docker-compose.*.yml`   |
| MinIO          | 对象存储   | `configs/env.*`          |
| PostgreSQL     | 数据库     | `configs/env.*`          |
| pgAdmin        | 数据库管理 | `docker-compose.dev.yml` |
| Nginx          | 反向代理   | `infra/`                 |

## 环境变量速查

```bash
# 数据库
DATABASE_URL="postgresql://whispers_user:whispers_password@localhost:5432/whispers_db"

# JWT配置
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your_refresh_token_secret"
REFRESH_TOKEN_EXPIRES_IN="30d"

# MinIO对象存储
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="whispers_minio"
MINIO_SECRET_KEY="whispers_minio_password"
MINIO_BUCKET="whispers-storage"

# 邮件配置
MAIL_HOST="smtp.example.com"
MAIL_PORT="465"
MAIL_USERNAME="your_email@example.com"
MAIL_PASSWORD="your_email_password"

# 端口配置
API_PORT=7777
WEB_PORT=8888

# Vite前端环境变量
VITE_API_URL="http://localhost:7777"
VITE_WEB_URL="http://localhost:8888"
```

## 常用命令速查

```bash
# 开发
pnpm dev                        # 启动所有应用
pnpm dev:web                    # 只启动前端 (Vite)
pnpm dev:api                    # 只启动后端 (NestJS)
pnpm dev:local:db               # 启动数据库容器

# 构建
pnpm build                      # 构建所有包
pnpm packages:build             # 只构建共享包
pnpm build:web                  # 只构建前端
pnpm build:api                  # 只构建后端

# 数据库 (在 apps/api 目录下)
npx prisma db push              # 推送schema到数据库
npx prisma generate             # 生成Prisma客户端
npx prisma studio               # 打开数据库UI
npx prisma db seed              # 运行种子数据

# 代码检查
pnpm lint                       # 运行ESLint
pnpm type-check                 # TypeScript类型检查
pnpm format                     # Prettier格式化

# Docker
pnpm docker:dev:up              # 启动开发环境容器
pnpm docker:dev:down            # 停止开发环境容器
pnpm docker:dev:reset           # 重置开发环境（删除数据）

# 生产部署
pnpm prod:build                 # 构建生产镜像
pnpm prod:up                    # 启动生产容器
pnpm deploy                     # 完整部署流程
```

## API端点前缀

- 开发环境: `http://localhost:7777/api/v1`
- 生产环境: `https://api.131462.wang/api/v1`

## 数据库模型概览

| 模型               | 表名                  | 描述                 |
| ------------------ | --------------------- | -------------------- |
| User               | users                 | 用户账户             |
| Post               | posts                 | 博客文章             |
| Tag                | tags                  | 文章标签             |
| PostTag            | post_tags             | 文章-标签关联        |
| Comment            | comments              | 评论(抖音风格扁平化) |
| Like               | likes                 | 文章点赞             |
| CommentLike        | comment_likes         | 评论点赞             |
| Favorite           | favorites             | 文章收藏             |
| Media              | media                 | 媒体文件             |
| MediaUsage         | media_usages          | 媒体使用记录         |
| RefreshToken       | refresh_tokens        | 刷新令牌             |
| PasswordResetToken | password_reset_tokens | 密码重置令牌         |
| VerificationCode   | verification_codes    | 验证码               |
| CommentReport      | comment_reports       | 评论举报             |
| SiteConfig         | site_config           | 站点配置             |

---

**最后更新**: 2026-01-09
