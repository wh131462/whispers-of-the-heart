## ADDED Requirements

### Requirement: 统一响应包装

所有资源端点(GET / POST / PATCH / DELETE)成功返回时,系统 MUST 返回一个对象,**至少**包含 `success: true` 与 `data` 两个字段;在适当时 MAY 携带 `message: string`(人类可读提示)。

#### Scenario: 单资源 GET 响应

- **WHEN** 客户端请求 `GET /api/v1/<resource>/:id` 且资源存在
- **THEN** 响应 MUST 形如 `{ success: true, data: <resource-object> }`,HTTP 状态码 MUST 为 `200`

#### Scenario: 创建成功响应

- **WHEN** 客户端请求 `POST /api/v1/<resource>` 并通过 DTO 校验
- **THEN** 响应 MUST 形如 `{ success: true, data: <created-resource> }`,HTTP 状态码 MUST 为 `201`

#### Scenario: 删除成功响应

- **WHEN** 客户端请求 `DELETE /api/v1/<resource>/:id` 且通过权限校验
- **THEN** 响应 MUST 形如 `{ success: true, data: { message: string } }`,HTTP 状态码 MUST 为 `200`

### Requirement: 分页列表结构

所有"列表型" GET 端点返回的数据 MUST 是一个**分页对象**,其字段命名固定为:`items`、`total`、`page`、`limit`、`totalPages`、`hasNext`、`hasPrev`。

#### Scenario: 默认分页参数

- **WHEN** 客户端请求 `GET /api/v1/<resource>` 而未携带 `page` / `limit` 查询参数
- **THEN** 系统 MUST 使用 `page=1`、`limit=10` 作为默认值,返回的 `data` 对象 MUST 包含上述七个字段

#### Scenario: 分页字段语义

- **WHEN** 任意分页响应被生成
- **THEN** `items` MUST 是当前页的资源数组、`total` MUST 是符合查询条件的总记录数、`totalPages` MUST 等于 `Math.ceil(total / limit)`、`hasNext` MUST 为 `page < totalPages`、`hasPrev` MUST 为 `page > 1`

#### Scenario: 空结果分页

- **WHEN** 查询无任何匹配项
- **THEN** 系统 MUST 返回 `{ items: [], total: 0, page, limit, totalPages: 0, hasNext: false, hasPrev: false }`,HTTP 状态码 MUST 为 `200`(**不得**返回 404)

### Requirement: 错误响应使用 HTTP 语义状态码

资源端点遇到可识别错误时 MUST 抛出对应的 NestJS HTTP 异常,使浏览器与拦截器能基于 HTTP 状态码统一处理。

#### Scenario: 资源不存在

- **WHEN** 客户端请求 `GET / PATCH / DELETE /api/v1/<resource>/:id` 但记录不存在
- **THEN** 系统 MUST 返回 HTTP `404`,响应体 MUST 包含可读的 `message` 字段(中文文案)

#### Scenario: 未认证访问受保护端点

- **WHEN** 客户端访问需要 JWT 的端点但未携带或携带了无效 token
- **THEN** 系统 MUST 返回 HTTP `401`

#### Scenario: 已认证但无权限

- **WHEN** 已认证用户尝试修改或删除一个**不属于自己且自己也不是管理员**的资源
- **THEN** 系统 MUST 返回 HTTP `403`,响应体 MUST 包含可读的 `message`(中文文案)

#### Scenario: DTO 校验失败

- **WHEN** 客户端请求体未通过 `class-validator` 校验
- **THEN** 系统 MUST 返回 HTTP `400`,响应体 MUST 列出失败的字段与原因

#### Scenario: 唯一约束冲突

- **WHEN** 创建/更新操作命中数据库的唯一约束(如重复 slug、重复 email)
- **THEN** 系统 MUST 返回 HTTP `409`,响应体 MUST 包含可读的 `message`

### Requirement: CRUD 端点形状

任何"资源型"模块在暴露完整 CRUD 时 MUST 提供以下五个端点,且方法与路径必须一致:

- `POST   /api/v1/<resource>` —— 创建
- `GET    /api/v1/<resource>` —— 分页列表
- `GET    /api/v1/<resource>/:id` —— 单条查询
- `PATCH  /api/v1/<resource>/:id` —— 部分更新
- `DELETE /api/v1/<resource>/:id` —— 删除

#### Scenario: 完整 CRUD 资源必须覆盖五个端点

- **WHEN** 一个模块声明"完整 CRUD"
- **THEN** 该模块 MUST 同时暴露上述五个端点;若缺少其中一个,模块 MUST 在自身文档中显式声明"非完整 CRUD"

#### Scenario: 局部更新使用 PATCH 而非 PUT

- **WHEN** 客户端只更新资源的一部分字段
- **THEN** 系统 MUST 暴露 `PATCH` 端点,使用 `PartialType(CreateDto)` 派生的 DTO,**不得**强制要求传入完整对象

#### Scenario: 列表端点支持基础查询参数

- **WHEN** 客户端请求 `GET /api/v1/<resource>?page=2&limit=20&search=foo`
- **THEN** 系统 MUST 支持 `page` (number, ≥1)、`limit` (number, 1-100)、`search` (string, optional) 三个查询参数;`search` 存在时 MUST 对**至少一个文本字段**做大小写不敏感的模糊匹配

### Requirement: 权限模型

涉及"修改个体资源"的操作 (`PATCH`、`DELETE` 及类似业务动作如点赞/取消点赞) MUST 满足:**操作者为资源的作者** OR **操作者具有管理员标识**,二者择一。

#### Scenario: 作者修改自己的资源

- **WHEN** 已认证用户的 `id` 等于资源的 `authorId` / `userId` / `ownerId`
- **THEN** 系统 MUST 允许该用户执行 `PATCH` 或 `DELETE`

#### Scenario: 管理员修改任意资源

- **WHEN** 已认证用户的 `isAdmin` 字段为 `true`
- **THEN** 系统 MUST 允许该用户执行 `PATCH` 或 `DELETE`,即使其不是资源作者

#### Scenario: 非作者非管理员被拒绝

- **WHEN** 已认证用户既不是资源作者也不是管理员
- **THEN** 系统 MUST 返回 HTTP `403`(参见"错误响应"要求)

#### Scenario: 公开读取端点豁免

- **WHEN** 端点是 `GET /api/v1/<resource>` 或 `GET /api/v1/<resource>/:id`,且资源被标记为"公开可读"(如 `published = true` 的文章)
- **THEN** 系统 MUST **不**要求 JWT,匿名访问被允许

### Requirement: 响应中关联数据的最小化

资源端点返回的关联对象(如 `author`、`tag`)MUST 只 `select` 出前端展示必需的字段,**不得**默认返回敏感字段(`password`、`refreshToken`、邮箱等)。

#### Scenario: 作者关联的默认形状

- **WHEN** 任何端点返回的资源包含 `author` 字段
- **THEN** `author` MUST 仅包含 `{ id, username, avatar }`,**不得**包含 `email` / `password` / `isAdmin` 等

#### Scenario: 列表端点聚合计数

- **WHEN** 列表端点的资源在前端需要"评论数 / 点赞数"等聚合
- **THEN** 系统 MUST 使用 Prisma `_count` 在同一查询中获取,**不得**在 controller 层 N+1 查询
