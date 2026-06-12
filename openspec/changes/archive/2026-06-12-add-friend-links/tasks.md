## 1. 数据库 & 模型

- [x] 1.1 在 `apps/api/prisma/schema.prisma` 新增 `FriendLinkStatus` 枚举与 `FriendLink` 模型
- [x] 1.2 执行 `prisma generate` 和 `prisma db push` 使模型生效

## 2. 后端模块

- [x] 2.1 创建 `apps/api/src/friend-link/` 模块目录结构（module、controller、service、dto）
- [x] 2.2 实现 `CreateFriendLinkDto` 和 `UpdateFriendLinkDto`（class-validator 校验）
- [x] 2.3 实现 `FriendLinkService`：CRUD + 列表（含公开/管理两种模式）
- [x] 2.4 实现 `FriendLinkController`：路由注册、公开/管理权限分离
- [x] 2.5 在 `app.module.ts` 注册 `FriendLinkModule`
- [x] 2.6 验证 API 接口正常运行（手动或 HTTP 测试）

## 3. 前端：独立友链页面

- [x] 3.1 创建 `apps/web/src/pages/FriendsPage.tsx` 页面组件（调用公开 API、卡片网格布局、空状态、头像 fallback）
- [x] 3.2 在前端路由中注册 `/friends` 路由

## 4. 前端：AboutPage 摘要卡片

- [x] 4.1 在 `AboutPage.tsx` 最底部新增友链摘要区域，调用 `GET /friend-links?limit=8`，为空时隐藏

## 5. 后台管理 UI

- [x] 5.1 在管理后台「网站设置」页面新增「友链管理」区域/Tab
- [x] 5.2 实现友链列表展示（含 INACTIVE 标记）
- [x] 5.3 实现新增/编辑友链弹窗表单
- [x] 5.4 实现删除确认、状态切换、排序调整交互

## 6. 收尾

- [x] 6.1 前后端联调验证全流程（增删改查、展示页、摘要卡片）
- [x] 6.2 更新 `.ai/1-PROJECT-CONTEXT.md` 核心功能模块表（追加友链模块条目）
- [x] 6.3 更新 `.ai/2-TECH-STACK.md` 如有新依赖（预期无新增）
