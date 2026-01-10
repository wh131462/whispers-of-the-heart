---
name: code-optimizer
description: 优化代码质量和性能。当需要重构代码、提升性能、改善可读性、或用户提到"优化"、"重构"、"性能"、"清理代码"时使用。
allowed-tools: Read, Edit, Glob, Grep
---

# 代码优化器

帮助优化 Whispers of the Heart 项目的代码质量和性能。

## 优化维度

### 1. 性能优化

#### React 前端

- [ ] 避免不必要的重渲染（React.memo, useMemo, useCallback）
- [ ] 懒加载组件（React.lazy + Suspense）
- [ ] 虚拟列表处理大数据（react-window）
- [ ] 图片懒加载和优化
- [ ] 减少 bundle 体积（代码分割）

#### NestJS 后端

- [ ] 避免 N+1 查询（Prisma include/select）
- [ ] 添加数据库索引
- [ ] 实现缓存策略
- [ ] 分页处理大量数据
- [ ] 异步任务处理

### 2. 可读性优化

- [ ] 提取重复逻辑为函数/组件
- [ ] 使用有意义的命名
- [ ] 简化复杂条件判断
- [ ] 拆分过长函数（单一职责）
- [ ] 减少嵌套层级

### 3. 可维护性优化

- [ ] 添加 TypeScript 类型
- [ ] 消除 magic numbers/strings
- [ ] 提取配置常量
- [ ] 统一错误处理
- [ ] 遵循项目代码规范

## 优化模式

### React 组件优化

**Before:**

```typescript
const List = ({ items }) => {
  const [filter, setFilter] = useState('');

  // 每次渲染都重新计算
  const filtered = items.filter(i => i.name.includes(filter));

  return filtered.map(item => <Item key={item.id} item={item} />);
};
```

**After:**

```typescript
const List: React.FC<{ items: Item[] }> = ({ items }) => {
  const [filter, setFilter] = useState('');

  // 仅当依赖变化时重新计算
  const filtered = useMemo(
    () => items.filter(i => i.name.includes(filter)),
    [items, filter]
  );

  return filtered.map(item => <MemoizedItem key={item.id} item={item} />);
};

const MemoizedItem = React.memo(Item);
```

### Prisma 查询优化

**Before:**

```typescript
// N+1 问题
const posts = await prisma.post.findMany();
for (const post of posts) {
  post.author = await prisma.user.findUnique({ where: { id: post.authorId } });
}
```

**After:**

```typescript
// 单次查询
const posts = await prisma.post.findMany({
  include: { author: true },
  // 只选择需要的字段
  select: {
    id: true,
    title: true,
    author: { select: { id: true, username: true } },
  },
});
```

### 条件简化

**Before:**

```typescript
if (user !== null && user !== undefined) {
  if (user.isAdmin === true) {
    if (user.permissions.includes('write')) {
      doSomething();
    }
  }
}
```

**After:**

```typescript
const canWrite = user?.isAdmin && user.permissions.includes('write');
if (canWrite) {
  doSomething();
}
```

### 提取复用逻辑

**Before:**

```typescript
// 多处重复
try {
  setLoading(true);
  const result = await api.fetchData();
  setData(result);
} catch (error) {
  console.error(error);
  addToast({ title: '操作失败', variant: 'destructive' });
} finally {
  setLoading(false);
}
```

**After:**

```typescript
// 自定义 Hook
const { data, loading, error, execute } = useAsync(api.fetchData);

// 或通用处理函数
const handleAsync = async <T>(
  asyncFn: () => Promise<T>,
  onSuccess?: (data: T) => void
) => {
  try {
    setLoading(true);
    const result = await asyncFn();
    onSuccess?.(result);
    return result;
  } catch (error) {
    addToast({ title: '操作失败', variant: 'destructive' });
    throw error;
  } finally {
    setLoading(false);
  }
};
```

## 优化流程

1. **分析** - 识别问题代码（复杂度、重复、性能瓶颈）
2. **评估** - 确定优化优先级和风险
3. **重构** - 逐步优化，保持功能不变
4. **验证** - 确保测试通过，无回归问题

## 检查命令

```bash
# 类型检查
pnpm type-check

# Lint 检查
pnpm lint

# 运行测试
pnpm test

# Bundle 分析
cd apps/web && pnpm build --analyze
```

## 优化原则

1. **不过早优化** - 先让代码工作，再优化
2. **最小改动** - 每次只改一处，便于追踪
3. **保持功能** - 重构不应改变行为
4. **可测试** - 优化后应能验证正确性
5. **可读优先** - 可读性 > 微小性能提升

## 注意事项

- 优化前确保有测试覆盖或手动验证方案
- 复杂优化分多个 commit 提交
- 性能优化需有数据支撑（profiling）
- 不优化没有问题的代码
