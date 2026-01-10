---
name: pr-review
description: 按照项目规范审查代码变更。当需要审查 PR、检查代码质量、或用户提到"审查"、"review"、"检查代码"时使用。
allowed-tools: Read, Bash, Glob, Grep
---

# PR 代码审查

按照 Whispers of the Heart 项目规范审查代码变更。

## 审查清单

### 1. 代码风格

- [ ] 遵循 ESLint 规则
- [ ] TypeScript 类型完整，无 `any` 滥用
- [ ] 命名规范（camelCase 变量，PascalCase 组件）
- [ ] 代码格式化（Prettier）

### 2. 安全性

- [ ] 无硬编码的敏感信息（密钥、密码）
- [ ] SQL 注入防护（使用 Prisma 参数化查询）
- [ ] XSS 防护（React 默认转义）
- [ ] 输入验证（DTO 使用 class-validator）
- [ ] 认证/授权检查（Guard 使用正确）

### 3. 性能

- [ ] 避免 N+1 查询（使用 Prisma include）
- [ ] React 组件避免不必要的重渲染
- [ ] 大列表使用虚拟滚动或分页
- [ ] 图片/资源优化

### 4. 错误处理

- [ ] 异步操作有 try-catch
- [ ] 用户友好的错误提示
- [ ] 适当的日志记录

### 5. 测试

- [ ] 关键逻辑有单元测试
- [ ] API 端点有集成测试

## 审查命令

```bash
# 查看变更文件
git diff --name-only HEAD~1

# 查看具体变更
git diff HEAD~1

# 运行 lint 检查
pnpm lint

# 运行类型检查
pnpm type-check

# 运行测试
pnpm test
```

## 审查输出格式

### 问题分类

- **Critical**: 必须修复（安全漏洞、严重 bug）
- **Major**: 应该修复（性能问题、代码质量）
- **Minor**: 建议修复（风格问题、优化建议）
- **Info**: 信息说明（代码解释、学习建议）

### 审查报告模板

```markdown
## 审查总结

**变更范围**: {描述主要变更}
**风险等级**: 低/中/高

## 问题列表

### Critical

- [ ] {问题描述} - `文件:行号`

### Major

- [ ] {问题描述} - `文件:行号`

### Minor

- [ ] {问题描述} - `文件:行号`

## 优点

- {做得好的地方}

## 建议

- {改进建议}
```

## 注意事项

- 关注变更的影响范围
- 检查是否破坏现有功能
- 验证数据库迁移的安全性
- 确认环境变量配置完整
