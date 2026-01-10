---
name: react-component-creator
description: 创建符合项目规范的 React 组件。当需要新建页面、UI 组件、或用户提到"创建组件"、"新增页面"时使用。
allowed-tools: Read, Write, Glob, Grep
---

# React 组件生成器

为 Whispers of the Heart 项目生成符合规范的 React 组件。

## 项目结构

- 页面组件：`apps/web/src/pages/`
- UI 组件：`apps/web/src/components/`
- 基础 UI：`apps/web/src/components/ui/`
- 共享组件：`packages/ui/src/components/`

## 组件规范

### 函数组件模板

```typescript
import React from 'react';

interface {Name}Props {
  // 定义 props 类型
}

const {Name}: React.FC<{Name}Props> = ({ ...props }) => {
  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
};

export default {Name};
```

### 命名规范

- 组件名：PascalCase（如 `PostCard`）
- 文件名：PascalCase.tsx（如 `PostCard.tsx`）
- Props 接口：`{Name}Props`

### 样式规范

- 使用 TailwindCSS 进行样式编写
- 使用项目定义的 CSS 变量（如 `text-primary`, `bg-secondary`）
- 响应式设计使用 Tailwind 断点

### 状态管理

- 本地状态：`useState`
- 全局状态：使用 `stores/` 下的 Zustand store
- 认证状态：`useAuthStore`
- Toast 通知：`useToast` from `contexts/ToastContext`

### 常用导入

```typescript
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { useAuthStore } from '../stores/useAuthStore';
import { useToast } from '../contexts/ToastContext';
```

### 图标使用

使用 `lucide-react` 图标库：

```typescript
import { Heart, Eye, Calendar, Tag } from 'lucide-react';
```

## 生成步骤

1. 确认组件类型（页面/UI 组件/共享组件）
2. 确认组件名称和存放位置
3. 定义 Props 接口
4. 生成组件文件
5. 如需要，创建相关的 hook 或 service

## 注意事项

- 使用 TypeScript 类型声明
- 事件处理函数命名：`handle{Action}`（如 `handleClick`）
- 异步操作需处理 loading 和 error 状态
- 需要认证的操作检查 `isAuthenticated`
