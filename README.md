# Whispers of the Heart - Monorepo

这是一个基于 Turborepo + pnpm workspace 构建的 monorepo 项目。

## 🏗️ 项目结构

```
whispers-of-the-heart/
├── apps/                    # 应用程序
│   ├── web                 # 前端 React 应用
│   ├── admin              # 后台管理系统
│   └── api                # 后端 NestJS 服务
├── packages/               # 共享包
│   ├── ui                 # 公共 UI 组件库
│   ├── hooks              # React hooks
│   ├── types              # TypeScript 类型定义
│   └── utils              # 通用工具函数
├── infra/                  # 基础设施
│   └── docker             # Docker 配置
├── package.json            # 根目录配置
├── pnpm-workspace.yaml    # pnpm 工作空间配置
├── turbo.json             # Turborepo 配置
└── README.md              # 项目说明
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动容器 数据库服务
sh start-blog-system.sh
# 启动所有应用的开发服务器
pnpm dev

# 启动特定应用
pnpm dev:web
pnpm dev:admin
pnpm dev:api
```

### 构建项目

```bash
# 构建所有应用和包
pnpm build

# 构建特定应用
pnpm build --filter=web
```

### 代码检查

```bash
# 运行所有检查
pnpm lint
pnpm type-check

# 运行测试
pnpm test
```

## 📦 可用脚本

- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建项目
- `pnpm lint` - 代码检查
- `pnpm type-check` - 类型检查
- `pnpm test` - 运行测试
- `pnpm clean` - 清理构建产物
- `pnpm format` - 代码格式化

## 🔧 技术栈

- **Monorepo 工具**: Turborepo
- **包管理器**: pnpm
- **前端**: React
- **后端**: NestJS
- **数据库**: Prisma
- **语言**: TypeScript

## 📝 开发指南

1. 在 `packages/` 目录下开发共享包
2. 在 `apps/` 目录下开发应用程序
3. 使用 `pnpm add <package-name> --filter=<target>` 添加依赖
4. 遵循 Turborepo 的构建管道配置

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
