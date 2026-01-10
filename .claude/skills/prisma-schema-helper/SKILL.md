---
name: prisma-schema-helper
description: 帮助设计和修改 Prisma Schema。当需要添加新数据表、修改数据模型、设计数据库关系、或用户提到"数据库"、"schema"、"模型"时使用。
allowed-tools: Read, Edit, Bash
---

# Prisma Schema 助手

帮助设计和修改 Whispers of the Heart 项目的数据库模型。

## Schema 位置

`apps/api/prisma/schema.prisma`

## 现有模型概览

| 模型               | 用途                 |
| ------------------ | -------------------- |
| User               | 用户账户             |
| Post               | 博客文章             |
| Tag / PostTag      | 文章标签（多对多）   |
| Comment            | 评论（支持嵌套回复） |
| Like / CommentLike | 点赞                 |
| Favorite           | 收藏                 |
| Media / MediaUsage | 媒体文件管理         |
| SiteConfig         | 站点配置             |
| Feedback           | 用户反馈             |
| MailLog            | 邮件发送记录         |
| RefreshToken       | JWT 刷新令牌         |
| PasswordResetToken | 密码重置令牌         |
| VerificationCode   | 邮箱验证码           |

## 模型设计规范

### 基础字段

每个模型应包含：

```prisma
model Example {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("examples")  // 数据库表名使用 snake_case 复数形式
}
```

### 关联关系

```prisma
// 一对多
authorId String
author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)

// 多对多（通过关联表）
model PostTag {
  postId String
  tagId  String
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([postId, tagId])
}
```

### 索引优化

```prisma
@@index([fieldName])           // 单字段索引
@@index([field1, field2])      // 复合索引
@@unique([field1, field2])     // 唯一约束
```

### 字段类型

- ID：`String @id @default(cuid())`
- 长文本：`String @db.Text`
- 可选字段：`String?`
- 默认值：`@default(value)`
- JSON 数据：`Json?`
- 数组：`String[] @default([])`

## 修改流程

1. 修改 `schema.prisma` 文件
2. 运行迁移命令：
   ```bash
   cd apps/api && npx prisma migrate dev --name {migration_name}
   ```
3. 生成 Prisma Client：
   ```bash
   npx prisma generate
   ```

## 注意事项

- 生产环境迁移需谨慎，避免数据丢失
- 删除字段前确认无代码依赖
- 添加必填字段需考虑现有数据
- 关系删除策略：通常使用 `onDelete: Cascade`
