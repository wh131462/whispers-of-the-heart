<div align="center">

# Whispers of the Heart

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&pause=1000&color=6366F1&center=true&vCenter=true&random=false&width=500&lines=A+Modern+Blog+Platform;Built+with+React+%2B+NestJS;Monorepo+Architecture" alt="Typing SVG" />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)

<p align="center">
  <b>一个现代化的个人博客系统，采用 Monorepo 架构构建</b>
</p>

[在线演示](https://131462.wang) · [报告问题](https://github.com/wh131462/whispers-of-the-heart/issues) · [功能请求](https://github.com/wh131462/whispers-of-the-heart/issues)

</div>

---

## 特性

<table>
<tr>
<td>

**前端**

- React 19 + TypeScript + Vite
- TailwindCSS 原子化样式
- 响应式设计，移动端优先
- 暗色 / 亮色主题切换
- BlockNote 富文本编辑器
- Zustand 状态管理（持久化）
- 国际化支持 (i18n)

</td>
<td>

**后端**

- NestJS 11 企业级框架
- Prisma 6 + PostgreSQL
- JWT 身份认证 + Refresh Token
- Socket.IO 实时通知
- MinIO 对象存储
- 邮件系统 / IP 定位 / UA 解析

</td>
<td>

**功能**

- 文章发布、点赞、收藏、搜索
- 嵌套评论 + 举报 / 审核
- 标签 / 分类管理
- 媒体管理与使用追踪
- RSS 2.0 订阅
- 应用中心（小工具 / 小游戏）
- WebRTC P2P 聊天与文件传输

</td>
</tr>
</table>

## 项目结构

```
whispers-of-the-heart/
├── apps/
│   ├── web/                   # Vite + React 19 前端（含管理后台 / 应用中心）
│   └── api/                   # NestJS 11 后端服务
├── packages/
│   ├── ui/                    # 共享 UI 组件库 (@whispers/ui)
│   ├── utils/                 # 共享工具函数 (@whispers/utils)
│   ├── types/                 # 共享类型定义 (@whispers/types)
│   └── hooks/                 # 共享 React Hooks (@whispers/hooks)
├── configs/                   # 环境配置 (env.development / env.production)
├── infra/                     # 基础设施
│   ├── docker/                # Dockerfile
│   ├── nginx/                 # Nginx 配置
│   └── backup/                # 备份策略
├── scripts/                   # 部署、构建、备份脚本
├── docker-compose.dev.yml     # 开发用 Docker 编排
├── docker-compose.prod.yml    # 生产用 Docker 编排
├── pnpm-workspace.yaml        # pnpm 工作空间
└── turbo.json                 # Turborepo 配置
```

## 快速开始

### 前置要求

| 工具       | 版本要求                                 |
| ---------- | ---------------------------------------- |
| Node.js    | >= 18.0.0                                |
| pnpm       | >= 8.0.0（项目锁定 10.15.0）             |
| Docker     | 用于本地数据库 / MinIO（可选但强烈推荐） |
| PostgreSQL | >= 14（若不使用 Docker，需本地自备）     |

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/wh131462/whispers-of-the-heart.git
cd whispers-of-the-heart

# 2. 一键安装 + 生成 Prisma 客户端 + 构建共享包
pnpm setup

# 3. 配置环境变量（按需修改）
cp configs/env.example configs/env.development

# 4. 启动本地依赖（PostgreSQL + MinIO + pgAdmin）
pnpm dev:local:db

# 5. 初始化数据库 schema
pnpm db:migrate:push

# 6. 启动前后端开发服务器
pnpm dev
```

也可以一步到位（启动 Docker 依赖 + 前后端）：

```bash
pnpm dev:local
```

### 访问应用

| 应用         | 开发环境                     | 生产环境                  |
| ------------ | ---------------------------- | ------------------------- |
| 博客前端     | http://localhost:8888        | https://131462.wang       |
| API 服务     | http://localhost:7777/api/v1 | https://api.131462.wang   |
| 管理后台     | http://localhost:8888/admin  | https://131462.wang/admin |
| MinIO 控制台 | http://localhost:9001        | —                         |
| pgAdmin      | http://localhost:5050        | —                         |

## 技术栈

<div align="center">

### 前端技术

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=react-router&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-000000?style=flat-square&logo=react&logoColor=white)
![BlockNote](https://img.shields.io/badge/BlockNote-8B5CF6?style=flat-square&logoColor=white)

### 后端技术

![NestJS](https://img.shields.io/badge/NestJS_11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_6-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![MinIO](https://img.shields.io/badge/MinIO-C72E49?style=flat-square&logo=minio&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socket.io&logoColor=white)

### DevOps

![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)

</div>

## 可用脚本

### 开发

| 命令                | 描述                                                       |
| ------------------- | ---------------------------------------------------------- |
| `pnpm dev`          | 启动前后端开发服务器（不含 Docker 依赖）                   |
| `pnpm dev:local`    | 启动 Docker 依赖 + 前后端（推荐）                          |
| `pnpm dev:local:db` | 仅启动数据库相关 Docker 服务（postgres + minio + pgadmin） |
| `pnpm dev:web`      | 仅启动前端开发服务器                                       |
| `pnpm dev:api`      | 仅启动后端开发服务器                                       |
| `pnpm setup`        | 安装依赖 + 生成 Prisma 客户端 + 构建共享包                 |
| `pnpm kill:ports`   | 释放 7777 / 8888 端口                                      |

### 构建与质量

| 命令                                | 描述                 |
| ----------------------------------- | -------------------- |
| `pnpm build`                        | 构建所有应用和共享包 |
| `pnpm build:web` / `pnpm build:api` | 单独构建前端 / 后端  |
| `pnpm lint`                         | ESLint 检查          |
| `pnpm type-check`                   | TypeScript 类型检查  |
| `pnpm format`                       | Prettier 格式化      |

### 数据库

| 命令                                 | 描述                      |
| ------------------------------------ | ------------------------- |
| `pnpm db:generate`                   | 生成 Prisma 客户端        |
| `pnpm db:migrate:push`               | 直接推送 schema（开发用） |
| `pnpm db:migrate:dev`                | 创建并应用 migration      |
| `pnpm db:migrate:status`             | 查看 migration 状态       |
| `pnpm db:backup` / `pnpm db:restore` | 数据库备份 / 恢复         |

### Docker

| 命令                                                  | 描述                         |
| ----------------------------------------------------- | ---------------------------- |
| `pnpm docker:dev:up`                                  | 启动开发环境完整 Docker 编排 |
| `pnpm docker:dev:down`                                | 停止开发环境 Docker          |
| `pnpm docker:dev:logs`                                | 查看开发容器日志             |
| `pnpm docker:dev:reset`                               | 重置开发容器（含 volume）    |
| `pnpm prod:build` / `pnpm prod:up` / `pnpm prod:down` | 生产编排构建 / 启动 / 停止   |
| `pnpm deploy:restart`                                 | 生产环境重新构建并重启       |

## Docker 部署

```bash
# 构建镜像
pnpm prod:build

# 启动生产服务
pnpm prod:up

# 查看日志
pnpm prod:logs

# 一键重新构建并重启
pnpm deploy:restart
```

## 应用中心

内置 26+ 独立小工具与小游戏，可通过 `/apps` 路径访问：

| 类别   | 应用                                                                                                 |
| ------ | ---------------------------------------------------------------------------------------------------- |
| 工具   | JSON 格式化、Base64 编解码、正则测试器、时间戳转换、密码生成器、单位转换器、计算器、取色板、屏幕检测 |
| 游戏   | 2048、俄罗斯方块、贪吃蛇、扫雷、五子棋、黑白棋、数独、斗地主、史莱姆足球                             |
| 多媒体 | 音频播放器、视频播放器、钢琴、键盘测试器、计时器                                                     |
| P2P    | WebRTC 聊天、WebRTC 文件传输                                                                         |

## 测试账号

| 角色   | 邮箱                 | 密码     |
| ------ | -------------------- | -------- |
| 管理员 | admin@whispers.local | admin123 |

## 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 [MIT](./LICENSE) 许可证

---

<div align="center">

**如果这个项目对你有帮助，请给一个 Star！**

Made with love by [wh131462](https://github.com/wh131462)

</div>
