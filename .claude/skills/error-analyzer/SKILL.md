---
name: error-analyzer
description: 分析错误日志和堆栈信息。当遇到运行时错误、需要排查问题、或用户提到"错误"、"bug"、"报错"、"异常"时使用。
allowed-tools: Read, Bash, Glob, Grep
---

# 错误分析器

帮助分析和解决 Whispers of the Heart 项目中的错误。

## 错误类型分类

### 前端错误 (React/Vite)

- 编译错误：TypeScript/ESLint
- 运行时错误：React 组件错误
- 网络错误：API 请求失败

### 后端错误 (NestJS)

- 启动错误：依赖注入、配置问题
- 运行时错误：业务逻辑异常
- 数据库错误：Prisma 查询失败

## 分析步骤

### 1. 收集错误信息

```bash
# 查看前端日志
cd apps/web && pnpm dev 2>&1 | tail -50

# 查看后端日志
cd apps/api && pnpm dev 2>&1 | tail -50

# 查看 Docker 日志
docker-compose logs --tail=100 api
```

### 2. 定位错误来源

- 查看堆栈跟踪的第一个项目文件
- 检查错误消息中提到的文件和行号
- 搜索相关错误关键词

### 3. 常见错误模式

#### TypeScript 错误

```
error TS2339: Property 'x' does not exist on type 'Y'
```

**解决**: 检查类型定义，添加缺失的属性

#### Prisma 错误

```
PrismaClientKnownRequestError: Foreign key constraint failed
```

**解决**: 检查关联数据是否存在，确认级联删除配置

#### React 错误

```
Error: Rendered more hooks than during the previous render
```

**解决**: 确保 Hooks 调用顺序一致，不在条件语句中使用

#### NestJS 错误

```
Nest can't resolve dependencies of the XService
```

**解决**: 检查模块导入，确保依赖已注册

## 调试命令

```bash
# TypeScript 类型检查
pnpm type-check

# ESLint 检查
pnpm lint

# 运行测试
pnpm test

# Prisma 数据库状态
cd apps/api && npx prisma db pull
cd apps/api && npx prisma validate

# 清理缓存
rm -rf node_modules/.cache
rm -rf apps/web/.vite
```

## 错误报告模板

```markdown
## 错误描述

{简要描述错误现象}

## 错误信息
```

{完整错误堆栈}

```

## 复现步骤
1. {步骤1}
2. {步骤2}

## 环境信息
- Node 版本: {版本}
- 操作系统: {系统}
- 浏览器: {浏览器}

## 分析结论
{错误原因分析}

## 解决方案
{修复建议}
```

## 常见问题快速参考

| 错误               | 可能原因   | 解决方案           |
| ------------------ | ---------- | ------------------ |
| `MODULE_NOT_FOUND` | 依赖未安装 | `pnpm install`     |
| `ECONNREFUSED`     | 服务未启动 | 启动对应服务       |
| `EADDRINUSE`       | 端口占用   | 结束占用进程       |
| `Unauthorized`     | JWT 过期   | 重新登录           |
| `CORS error`       | 跨域配置   | 检查后端 CORS 设置 |
