## Why

后端 `apps/api/` 下 `blog`、`comment`、`user`、`media`、`site-config` 等 5+ 个模块已经反复实现了同一套 REST 资源契约(响应格式、分页结构、错误处理、权限模型、端点形状),但这套契约目前只散落在 `.ai/4-PATTERNS.md` 的"NestJS Service / Controller / DTO"代码片段中,**没有任何正式 spec 描述其行为契约**。这导致:

1. 新模块作者只能"看着旧代码抄",抄错也无人识别(例如 `findAll` 的分页字段命名漂移)
2. 前端调用者依赖隐式约定(`response.data.data.items`),一旦后端某模块写错就静默崩溃
3. PR review 时缺少可引用的客观标准

通过把这套契约提炼为正式 spec,新增模块可以被 spec 直接约束,review 可以引用 Requirement 编号。

## What Changes

- 新增 capability `rest-resource-api`,描述 NestJS 资源端点的**行为契约**(注意:**不是代码风格,代码风格仍在 `.ai/3-CODING-RULES.md`**)
- 契约覆盖:统一响应包装、分页列表结构、HTTP 状态码语义、错误响应、CRUD 端点形状、权限模型
- 不修改任何现有代码,仅形式化已有实践
- 在 `.ai/4-PATTERNS.md` 中,把对应 NestJS Service/Controller 模式的描述精简为"代码骨架",行为契约部分链接到本 spec

## Capabilities

### New Capabilities

- `rest-resource-api`: NestJS 后端任何"资源型"模块(用户、文章、评论、媒体等)在暴露 REST 端点时必须遵守的统一行为契约,包括响应包装、分页、错误、权限与端点形状

### Modified Capabilities

(无)

## Non-goals

- 不规范代码风格、命名、目录结构(那些归 `.ai/3-CODING-RULES.md`)
- 不规范 Prisma schema 设计(那是数据层契约,独立 spec)
- 不强制 OpenAPI/Swagger 文档生成(可以另起一个 change)
- 不涉及非资源型端点(如 `/auth/login`、`/health` 等)

## Impact

- 新增 spec:`openspec/specs/rest-resource-api/spec.md`(归档后产生)
- 修改文件:`.ai/4-PATTERNS.md`(后端模式段落改为引用 spec)、`.ai/0-INDEX.md`("已沉淀的 Specs 索引")
- 现有代码:**零改动**;后续如发现现有模块违反 spec,通过单独 change 修复
- 依赖:无
