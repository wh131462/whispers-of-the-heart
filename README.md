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

[在线演示](https://your-demo-url.com) · [报告问题](https://github.com/wh131462/whispers-of-the-heart/issues) · [功能请求](https://github.com/wh131462/whispers-of-the-heart/issues)

</div>

---

## ✨ 特性

<table>
<tr>
<td>

**前端**

- 现代化 React 18 + TypeScript
- TailwindCSS 原子化样式
- 响应式设计，移动端优先
- 暗色/亮色主题切换
- 打字机效果、动画过渡
- 无限滚动加载

</td>
<td>

**后端**

- NestJS 企业级框架
- Prisma ORM 类型安全
- JWT 身份认证
- 邮件通知系统
- 内容审核功能
- RESTful API 设计

</td>
<td>

**功能**

- 文章发布与管理
- 评论系统（置顶/举报）
- 点赞与收藏
- 标签分类管理
- 站点配置管理
- 用户权限控制

</td>
</tr>
</table>

## 🏗️ 项目结构

```
whispers-of-the-heart/
├── 📂 apps/                    # 应用程序
│   ├── 🌐 web/                # 前端博客应用
│   └── 🔧 api/                # 后端 NestJS 服务
├── 📂 packages/                # 共享包
│   ├── 🎨 ui/                 # 公共 UI 组件库
│   └── 🛠️ utils/              # 通用工具函数
├── 📂 infra/                   # 基础设施
│   └── 🐳 docker/             # Docker 配置
├── 📄 package.json             # 根目录配置
├── 📄 pnpm-workspace.yaml      # pnpm 工作空间配置
└── 📄 turbo.json               # Turborepo 配置
```

## 🚀 快速开始

### 前置要求

| 工具 | 版本要求 |
|------|----------|
| Node.js | >= 18.0.0 |
| pnpm | >= 8.0.0 |
| PostgreSQL | >= 14.0 |
| Docker | (可选) |

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/wh131462/whispers-of-the-heart.git
cd whispers-of-the-heart

# 2. 安装依赖
pnpm install

# 3. 启动数据库服务
sh start-blog-system.sh

# 4. 初始化数据库
cd apps/api && npx prisma db push && npx prisma db seed

# 5. 启动开发服务器
pnpm dev
```

### 访问应用

| 应用 | 地址 |
|------|------|
| 博客前端 | http://localhost:5173 |
| API 服务 | http://localhost:3000 |
| API 文档 | http://localhost:3000/api-docs |

## 🔧 技术栈

<div align="center">

### 前端技术

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=react-router&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-000000?style=flat-square&logo=react&logoColor=white)

### 后端技术

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)

### DevOps

![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)

</div>

## 📦 可用脚本

| 命令 | 描述 |
|------|------|
| `pnpm dev` | 启动所有应用的开发服务器 |
| `pnpm dev:web` | 仅启动前端开发服务器 |
| `pnpm dev:api` | 仅启动后端开发服务器 |
| `pnpm build` | 构建所有应用和包 |
| `pnpm lint` | 运行代码检查 |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm test` | 运行测试 |
| `pnpm clean` | 清理构建产物 |
| `pnpm format` | 代码格式化 |

## 🐳 Docker 部署

```bash
# 构建镜像
docker-compose -f docker-compose.prod.yml build

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 开发指南

1. **共享包开发** - 在 `packages/` 目录下开发，修改后自动热更新
2. **添加依赖** - 使用 `pnpm add <package> --filter=<target>`
3. **数据库迁移** - 修改 schema 后运行 `npx prisma db push`
4. **API 测试** - 访问 `/api-docs` 使用 Swagger UI

### 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@whispers.local | admin123 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 [MIT](./LICENSE) 许可证

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star！**

Made with ❤️ by [wh131462](https://github.com/wh131462)

</div>
