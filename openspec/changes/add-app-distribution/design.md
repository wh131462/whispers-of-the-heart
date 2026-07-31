## Context

项目已有受 JWT 与管理员守卫保护的管理后台，以及 NestJS + Prisma 的资源 CRUD 模式，但没有客户端应用发布领域。客户端更新检查需要稳定、无需认证且不带统一响应包裹的 JSON 契约；管理操作仍应遵循现有统一响应格式。

## Goals / Non-Goals

**Goals:**

- 用独立应用记录和版本记录保存多个应用及其版本历史。
- 由应用 `slug` 形成可复制、稳定的公开更新接口。
- 管理员可在单一响应式页面完成应用与版本维护。
- 严格验证版本号和 HTTPS APK 地址，并保证同一应用的 `versionCode` 唯一。

**Non-Goals:**

- APK 上传、存储、签名与安全扫描。
- 渠道、灰度、强制更新、最低兼容版本和下载统计。
- 为公开更新接口增加认证或统一响应包裹。

## Decisions

### 使用应用与版本两个 Prisma 模型

`DistributedApp` 保存名称和唯一 `slug`，`AppRelease` 保存版本字段并通过级联外键关联应用；同一应用内使用 `(appId, versionCode)` 复合唯一约束。相比把最新版本字段直接放在应用表中，该方案保留发布历史，并允许管理端修订或删除单个版本。

### 以最高 versionCode 作为最新版本

公开接口按 `versionCode DESC` 查询第一条记录，而不依赖创建时间。Android 客户端本身以递增的整数版本码比较更新，该规则在补录旧版本或编辑记录后仍确定。系统拒绝非正整数版本码。

### 公开接口直接返回更新 JSON

使用 `GET /api/v1/app-distributions/:slug/latest.json`，成功响应仅包含 `versionCode`、`versionName`、`apkUrl`，存在说明时附加 `releaseNotes`。管理接口位于 `/api/v1/admin/app-distributions` 并返回项目统一响应结构。相比为每个应用持久化完整 URL，只存储受限 `slug` 可避免域名和部署环境迁移造成脏数据。

### 仅接受 HTTPS APK URL

DTO 在写入前验证 URL 协议为 HTTPS。公开接口自身由现有生产 HTTPS 入口提供；开发环境仍可通过本地 HTTP 调试 API。

## Risks / Trade-offs

- [删除最高版本会使旧版本重新成为最新版本] → 管理端删除前明确确认，并在列表中标识当前最新版本。
- [修改 slug 会使旧更新地址失效] → 管理端显示完整接口路径并在编辑界面提示该影响。
- [并发创建相同 versionCode 或 slug] → 由数据库唯一约束兜底，并转换为 409 冲突响应。
- [公开接口可能被高频轮询] → 查询使用唯一 slug 与复合索引；本次不增加缓存，后续可基于实际流量扩展。

## Migration Plan

1. 部署创建 `distributed_apps` 与 `app_releases` 表的向前兼容迁移。
2. 部署包含新模块和管理页面的 API/Web 版本。
3. 管理员注册应用并录入首个版本后，将公开 HTTPS 地址配置到客户端。
4. 回滚应用代码时可保留新表；若确认不再使用，再单独执行删除表迁移。

## Open Questions

无；灰度、渠道和 APK 上传明确留待后续独立变更。
