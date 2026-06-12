## Why

个人博客缺少友链展示能力，无法与其他独立博主互链。需要一个可后台管理的友链系统，支持公开展示页与 About 页摘要卡片，方便维护和扩展。

## What Changes

- 新增后端 `FriendLink` 数据模型与 CRUD API（`/friend-links`），支持公开读取与管理员管理
- 新增前端独立友链页 `/friends`，展示所有上线友链
- 在 AboutPage 最底部新增友链摘要卡片，展示前 N 个上线友链并链向 `/friends`
- 在管理后台「网站设置」中新增友链管理 Tab：增删改查、排序、上下线
- 数据库新增表 `FriendLink`（字段：`id`、`name`、`url`、`avatar`、`description`、`sortOrder`、`status`、`createdAt`、`updatedAt`）

## Capabilities

### New Capabilities

- `friend-links`: 友链的领域能力，覆盖数据模型、公开展示 API、后台管理 API、前端展示页、AboutPage 摘要卡片、后台管理 UI

### Modified Capabilities

<!-- 无 -->

## Non-goals

- 不实现友链互申/自助申请表单（后续可扩展）
- 不实现友链链接健康检查/自动巡检
- 不实现友链点击统计/访问分析
- 不引入新的第三方依赖

## Impact

- **数据库**: 新增 `FriendLink` 表，需要 `prisma db push`
- **后端**: 新增 `apps/api/src/friend-link/` 模块，注册到 `app.module.ts`
- **前端**:
  - 新增 `apps/web/src/pages/FriendsPage.tsx` 与路由
  - 修改 `apps/web/src/pages/AboutPage.tsx` 增加摘要卡片
  - 新增 `apps/web/src/pages/admin/` 下友链管理页与「网站设置」入口
- **API 文档**: 新增 `/friend-links` 系列接口
- **依赖**: 无新增第三方依赖
