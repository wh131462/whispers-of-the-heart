## Context

项目当前没有友链管理能力。`SiteConfig` 只有零散的 `socialLinks` JSON 字段，存放站长自身的社交链接。AboutPage 已展示个人介绍与社交按钮，但没有友链区域；前台也没有友链入口。

业务上需要：

- 站长在管理后台维护一组「友链」（其他独立博主/站点）
- 访客在独立 `/friends` 页面浏览全部上线友链
- AboutPage 底部展示前若干个友链作为摘要

技术上需要：跨前后端引入一个新的领域模块，遵循现有 `site-config` / `blog` 等模块的代码结构。

## Goals / Non-Goals

**Goals:**

- 提供独立、可扩展的 `FriendLink` 数据模型与 CRUD API
- 公开读取（列表）与管理员管理（增删改查、排序、上下线）权限分离
- 前端 `/friends` 页面 + AboutPage 摘要卡片复用同一公开接口
- 后台管理 UI 嵌入「网站设置」页面，与现有 site-config 管理体验一致

**Non-Goals:**

- 不实现友链互申/自助申请
- 不实现链接健康检查/自动 ping
- 不实现点击统计、热度排序
- 不引入新的第三方依赖

## Decisions

### Decision 1: 独立表 vs SiteConfig JSON 字段

**选择**: 新建 `FriendLink` 表。
**理由**: 友链是独立实体（有自己的排序、状态、可独立 CRUD），用 JSON 字段会失去查询/排序能力，且与现有 `site-config` 单条记录的设计冲突。`Blog` / `Comment` 等模块都采用独立表模式。
**备选**: 在 `SiteConfig.socialLinks` 旁加 `friendLinks: Json`。已否决——扩展性差。

### Decision 2: 状态字段类型

**选择**: 使用 `status` 枚举字段 `ACTIVE | INACTIVE`（Prisma enum）。
**理由**: 与项目中其他模块（如 `Post.status`）保持一致；后续若新增 `PENDING`（友链申请审核）等状态可平滑扩展。
**备选**: `isActive: Boolean`。简单但扩展性弱。

### Decision 3: 排序字段

**选择**: `sortOrder: Int @default(0)`，列表按 `sortOrder ASC, createdAt DESC` 排序。
**理由**: 站长可手动控制顺序，相同 sortOrder 时按最新优先。

### Decision 4: 公开接口与管理接口分离

**选择**:

- 公开: `GET /friend-links`（仅返回 `ACTIVE`），`GET /friend-links?limit=N`（摘要场景）
- 管理: `POST/PATCH/DELETE /friend-links` 走 `@UseGuards(JwtAuthGuard, AdminGuard)`，列表加 `?includeInactive=true`
  **理由**: 沿用 `site-config` 模块中公开/管理混合在一个 Controller 的做法，方法级别加 Guard，减少新增 Controller 数量。

### Decision 5: 头像存储

**选择**: 仅存 URL（外链），不接入 MinIO 媒体使用追踪。
**理由**: 友链头像通常是对方站点的外链/Gravatar，不需要纳入本站媒体生命周期管理。若后续需要本地化再扩展（可复用 `media-usage` 模块）。

### Decision 6: 后台管理 UI 入口

**选择**: 在管理后台「网站设置」页面新增 Tab/Section 「友链管理」，复用站点设置页路由。
**理由**: 符合需求描述「在网站设置添加对应设置」；避免在侧边栏新增一级菜单。

### Decision 7: AboutPage 摘要卡片

**选择**: 调用 `GET /friend-links?limit=8`，展示头像 + name，点击跳转外链，底部「查看全部」链接到 `/friends`。
**理由**: 不重复实现完整列表 UI，保持 About 页轻量。

## Risks / Trade-offs

- [友链外链可能失效] → 不做自动巡检，由站长手动维护；UI 层 `target="_blank" rel="noopener noreferrer"` 防止打开异常时影响本站
- [外链头像加载失败/慢] → 前端使用 `onError` 回退默认占位图，参考 AboutPage 中 GitHub 头像回退模式
- [公开接口被滥用爬取] → 友链本身公开数据，无敏感性；不做额外限流
- [管理接口权限] → 必须复用现有 `AdminGuard`，避免普通用户调用 CUD

## Migration Plan

1. `prisma db push` 创建 `FriendLink` 表（开发/生产均无历史数据，零迁移风险）
2. 部署后端代码后无需数据回填
3. 前端发布后默认友链列表为空，AboutPage 摘要卡片为空时隐藏整张卡片（避免空白区）
4. 回滚: 删除模块代码、`prisma db push` 删除表即可（无外键依赖）

## Open Questions

- 友链描述字段是否需要支持 Markdown / 富文本？当前决定使用纯文本（短描述）
- AboutPage 摘要展示数量阈值（当前定 8 个）——可后续根据视觉调整
