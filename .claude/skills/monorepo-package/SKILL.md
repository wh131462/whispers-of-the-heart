---
name: monorepo-package
description: 在 packages 目录下创建新的共享包。当需要抽取公共逻辑、创建共享库、或用户提到"共享包"、"packages"、"monorepo"时使用。
allowed-tools: Read, Write, Bash, Glob
---

# Monorepo 共享包生成器

帮助在 Whispers of the Heart 项目中创建和管理共享包。

## 项目结构

```
packages/
├── ui/       # 公共 UI 组件库 (@whispers/ui)
├── types/    # TypeScript 类型定义 (@whispers/types)
├── utils/    # 工具函数库 (@whispers/utils)
└── hooks/    # 共享 React Hooks (@whispers/hooks)
```

## 创建新包

### 1. 目录结构

```
packages/{package-name}/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts
└── README.md (可选)
```

### 2. package.json 模板

```json
{
  "name": "@whispers/{package-name}",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### 3. tsconfig.json 模板

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

## 在应用中使用

### 添加依赖

在 `apps/web/package.json` 或 `apps/api/package.json`:

```json
{
  "dependencies": {
    "@whispers/{package-name}": "workspace:*"
  }
}
```

### 导入使用

```typescript
import { something } from '@whispers/{package-name}';
```

## 现有包说明

### @whispers/ui

公共 UI 组件：

- BlockNote 编辑器
- Markdown 渲染器
- 媒体预览组件
- AI 组件

### @whispers/types

共享类型定义：

- API 响应类型
- 实体类型
- 通用工具类型

### @whispers/utils

工具函数：

- 日期格式化
- 字符串处理
- 数据转换

### @whispers/hooks

共享 React Hooks

## 开发流程

1. 创建包目录和配置文件
2. 编写代码并从 `src/index.ts` 导出
3. 在根目录运行 `pnpm install` 更新依赖
4. 在目标应用中添加依赖并使用

## Turborepo 配置

新包会自动被 Turborepo 识别。如需特殊构建配置，编辑根目录 `turbo.json`。

## 注意事项

- 包名使用 `@whispers/` 前缀
- 版本号统一管理
- 避免循环依赖
- 保持包的职责单一
