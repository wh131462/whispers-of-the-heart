---
name: smart-commit
description: 智能分组提交代码。按功能/模块划分未提交的代码，分批次有条理地 commit。当用户提到"提交"、"commit"、"分组提交"时使用。
allowed-tools: Bash, Read, Glob, Grep, TodoWrite, AskUserQuestion
---

# 智能分组提交

按功能或模块划分当前未提交的代码，分批次创建有条理的 commit 记录。

## 核心约束

1. **禁止 AI 共同作者信息** - commit message 中不得包含任何 `Co-Authored-By` 或类似的 AI 生成标识
2. **使用 git config 作者** - 保持当前 git 配置的 user.name 和 user.email 作为提交作者
3. **代码安全优先** - 遇到 husky 预处理失败时，必须确保代码不丢失
4. **原子化提交** - 每个 commit 应该是一个独立的功能单元

## 执行流程

### 第一步：收集信息

```bash
# 查看当前 git 用户配置
git config user.name
git config user.email

# 查看所有未提交的变更（不使用 -uall 避免大仓库内存问题）
git status

# 查看未暂存的变更
git diff --stat

# 查看已暂存的变更
git diff --cached --stat

# 查看最近的 commit 风格
git log --oneline -10
```

### 第二步：分析变更并分组

根据以下维度对变更进行分组：

1. **按目录/模块分组**
   - `apps/web/` - 前端变更
   - `apps/api/` - 后端变更
   - `packages/` - 共享包变更
   - `prisma/` - 数据库变更

2. **按功能类型分组**
   - `feat:` - 新功能
   - `fix:` - bug 修复
   - `refactor:` - 代码重构
   - `style:` - 样式/格式调整
   - `docs:` - 文档更新
   - `chore:` - 构建/工具/配置变更
   - `test:` - 测试相关

3. **按业务功能分组**
   - 识别相关联的文件（如组件+样式+类型定义）
   - 将同一功能的变更归为一组

### 第三步：与用户确认分组方案

使用 AskUserQuestion 工具向用户展示分组方案并确认：

```
建议将变更分为以下 N 个 commit:

1. feat(web): 添加 XXX 功能
   - file1.tsx
   - file2.ts

2. fix(api): 修复 YYY 问题
   - file3.ts

请确认或调整分组方案。
```

### 第四步：逐个提交

对每个分组执行：

```bash
# 1. 先重置暂存区（如果需要）
git reset HEAD

# 2. 添加该分组的文件
git add <file1> <file2> ...

# 3. 提交（不带 Co-Authored-By）
git commit -m "<type>(<scope>): <description>"
```

## Commit Message 规范

### 格式

```
<type>(<scope>): <subject>

[可选的正文]

[可选的脚注]
```

### Type 类型

| Type     | 说明                   |
| -------- | ---------------------- |
| feat     | 新功能                 |
| fix      | Bug 修复               |
| refactor | 代码重构（不改变功能） |
| style    | 格式调整（空格、分号） |
| docs     | 文档变更               |
| test     | 测试相关               |
| chore    | 构建/工具变更          |
| perf     | 性能优化               |

### Scope 范围

- `web` - 前端应用
- `api` - 后端服务
- `ui` - UI 组件库
- `utils` - 工具库
- `prisma` - 数据库
- `config` - 配置文件

### 示例

```
feat(web): add user profile page

fix(api): resolve authentication timeout issue

chore: update dependencies
```

## 错误处理：Husky 预处理失败

当 `git commit` 因 husky pre-commit hook 失败时：

### 1. 保存当前状态

```bash
# 查看当前暂存的文件
git diff --cached --name-only

# 创建临时 stash 备份（包含暂存和未暂存）
git stash push -m "backup-before-fix-$(date +%Y%m%d-%H%M%S)"
```

### 2. 分析失败原因

常见失败原因：

- ESLint 错误
- TypeScript 类型错误
- 测试失败
- 格式化问题

```bash
# 运行 lint 检查
pnpm lint

# 运行类型检查
pnpm type-check
```

### 3. 修复问题

```bash
# 自动修复 lint 问题
pnpm lint --fix

# 格式化代码
pnpm format
```

### 4. 恢复并重新提交

```bash
# 恢复 stash
git stash pop

# 重新添加文件
git add <files>

# 重新提交
git commit -m "<message>"
```

### 5. 如果修复失败

```bash
# 确保 stash 中有备份
git stash list

# 可以随时恢复
git stash apply stash@{0}
```

## 安全措施

1. **提交前备份**
   - 每次提交前确认变更内容
   - 复杂操作前创建 stash 备份

2. **分步执行**
   - 不要一次性添加所有文件
   - 每个 commit 后验证状态

3. **回滚方案**

   ```bash
   # 撤销最后一次 commit（保留变更）
   git reset --soft HEAD~1

   # 撤销 add（保留变更）
   git reset HEAD <file>
   ```

## 禁止事项

- **禁止** 在 commit message 中添加 `Co-Authored-By: Claude` 或任何 AI 相关信息
- **禁止** 修改 git config 的 user 信息
- **禁止** 使用 `--amend` 修改已推送的 commit
- **禁止** 使用 `--force` 强制推送
- **禁止** 跳过 hooks（`--no-verify`）除非用户明确要求
- **禁止** 在没有备份的情况下执行可能丢失代码的操作

## 输出格式

每次提交后输出：

```
✓ Commit 1/N: <commit message>
  - <file1>
  - <file2>
  SHA: <short-sha>

✓ Commit 2/N: <commit message>
  ...

提交完成！共创建 N 个 commit。
```
