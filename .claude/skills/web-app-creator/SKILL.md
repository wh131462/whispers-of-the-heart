---
name: web-app-creator
description: 在 apps/web/src/apps 目录下创建新的 Web 应用。当需要新增小工具、小游戏、或用户提到"创建 app"、"新增工具"、"添加游戏"时使用。
allowed-tools: Read, Write, Glob, Grep
---

# Web App 生成器

为 Whispers of the Heart 项目在 `apps/web/src/apps/` 目录下生成新的 Web 应用。

## 项目结构

应用位置：`apps/web/src/apps/{app-id}/`

每个应用应包含：

```
{app-id}/
├── index.tsx           # 应用入口组件（默认导出）
├── types.ts            # 类型定义（可选）
├── components/         # 子组件目录（可选）
│   └── *.tsx
├── hooks/              # 自定义 hooks（可选）
│   └── use*.ts
└── utils/              # 工具函数（可选）
    └── *.ts
```

## 应用元数据

每个应用需要在 `apps/web/src/apps/index.ts` 中注册：

```typescript
import { lazy } from 'react';
import type { AppMeta } from './types';

// 在 appRegistry 数组中添加
{
  id: 'app-id',           // kebab-case 标识符
  name: '应用名称',        // 中文显示名
  description: '应用描述', // 简短的功能说明
  icon: 'IconName',       // lucide-react 图标名
  tags: ['分类'],         // 分类标签：开发 | 实用 | 设计 | 娱乐
  component: lazy(() => import('./app-id')),
}
```

## 类型定义

应用元数据类型（`types.ts`）：

```typescript
import type { LazyExoticComponent, ComponentType } from 'react';

export type AppMeta = {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  cover?: string; // 封面图（可选）
  tags?: string[]; // 分类标签
  component: LazyExoticComponent<ComponentType>;
};
```

## 应用分类

| 分类 | 说明         | 示例                               |
| ---- | ------------ | ---------------------------------- |
| 开发 | 开发者工具   | JSON格式化、正则测试、Base64编解码 |
| 实用 | 日常实用工具 | 计算器、计时器、密码生成器         |
| 设计 | 设计相关工具 | 调色板、图标选择器                 |
| 娱乐 | 游戏娱乐     | 扫雷、2048、贪吃蛇                 |

## 组件规范

### 入口组件模板

```typescript
import { useState } from 'react';
import { cn } from '@/lib/utils';
// 其他必要的导入

export default function {AppName}() {
  // 状态和逻辑

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        className={cn(
          'flex flex-col gap-4 p-5',
          'bg-white/95',
          'rounded-xl',
          'border border-zinc-200',
          'shadow-lg shadow-zinc-200/50'
        )}
      >
        {/* 应用内容 */}
      </div>
    </div>
  );
}
```

### 命名规范

- 应用 ID：kebab-case（如 `json-formatter`）
- 组件名：PascalCase（如 `JsonFormatter`）
- 文件名：组件用 PascalCase.tsx，工具用 kebab-case.ts
- Hooks：use 前缀（如 `useCalculator`）

### 样式规范

- 使用 TailwindCSS
- **明亮主题为主**：
  - 背景：`bg-white/95`
  - 边框：`border-zinc-200`
  - 阴影：`shadow-lg shadow-zinc-200/50`
  - 文字：`text-zinc-600`（次要）、`text-zinc-900`（主要）
  - 分隔线：`bg-zinc-200`
- 错误状态：`bg-red-50`、`border-red-200`、`text-red-600`
- 成功状态：`bg-green-50`、`border-green-200`、`text-green-600`
- 圆角：`rounded-xl`（容器）、`rounded-lg`（子元素）
- 使用 `cn()` 工具函数合并类名

### 常用导入

```typescript
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// lucide-react 图标
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
```

## 生成步骤

1. **确认应用信息**
   - 应用 ID（kebab-case）
   - 应用名称（中文）
   - 功能描述
   - 分类标签
   - 图标选择

2. **创建目录结构**
   - 创建 `apps/web/src/apps/{app-id}/` 目录
   - 创建必要的子目录

3. **生成核心文件**
   - `index.tsx` - 入口组件
   - `types.ts` - 类型定义（如需要）

4. **注册应用**
   - 在 `apps/web/src/apps/index.ts` 中添加注册信息

5. **创建子组件**（如需要）
   - 在 `components/` 目录下创建子组件
   - 在 `hooks/` 目录下创建自定义 hooks
   - 在 `utils/` 目录下创建工具函数

## 注意事项

- 应用组件必须使用 `export default` 导出
- 使用懒加载（`lazy`）导入组件以优化性能
- 保持组件独立，不依赖外部状态管理
- 适配移动端和桌面端
- 添加键盘快捷键支持（如适用）
- 使用项目现有的 UI 组件库（`@/components/ui/`）需要的组件可以在组件库进行创建
