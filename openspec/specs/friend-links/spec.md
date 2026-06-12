## Requirements

### Requirement: 友链数据模型

系统 SHALL 提供 `FriendLink` 数据模型，用于持久化友链信息。字段包括：`id`（cuid 主键）、`name`（站点名称，必填）、`url`（外链地址，必填，URL 格式）、`avatar`（头像 URL，可空）、`description`（描述，可空，纯文本）、`sortOrder`（排序权重，默认 0）、`status`（枚举 `ACTIVE` | `INACTIVE`，默认 `ACTIVE`）、`createdAt`、`updatedAt`。

#### Scenario: 创建友链记录

- **WHEN** 管理员通过创建接口提交 `{name, url}` 合法数据
- **THEN** 系统在数据库写入一条新友链记录，默认 `status=ACTIVE`、`sortOrder=0`

#### Scenario: 必填字段缺失

- **WHEN** 请求体缺少 `name` 或 `url`
- **THEN** 系统返回 400 校验错误，不写入数据

#### Scenario: URL 格式不合法

- **WHEN** 请求体 `url` 不是合法 HTTP/HTTPS URL
- **THEN** 系统返回 400 校验错误

### Requirement: 友链公开列表 API

系统 SHALL 提供公开 `GET /friend-links` 接口，返回所有 `status=ACTIVE` 的友链。支持 `limit` 查询参数限制返回数量。结果按 `sortOrder ASC, createdAt DESC` 排序。

#### Scenario: 访客获取友链列表

- **WHEN** 访客发送 `GET /friend-links`
- **THEN** 系统返回所有 ACTIVE 友链数组，包装在统一响应格式中

#### Scenario: 摘要场景限制数量

- **WHEN** 访客发送 `GET /friend-links?limit=8`
- **THEN** 系统最多返回 8 条 ACTIVE 友链

#### Scenario: INACTIVE 友链不可见

- **WHEN** 数据库中存在 `status=INACTIVE` 的友链
- **THEN** 公开接口结果中不包含该记录

### Requirement: 友链管理 API

系统 SHALL 提供 `POST /friend-links`、`PATCH /friend-links/:id`、`DELETE /friend-links/:id` 接口，仅允许管理员调用。管理列表 `GET /friend-links?includeInactive=true` 同样要求管理员权限。

#### Scenario: 未认证用户调用管理接口

- **WHEN** 未登录用户发送 `POST /friend-links`
- **THEN** 系统返回 401 未认证

#### Scenario: 非管理员用户调用管理接口

- **WHEN** 普通用户发送 `PATCH /friend-links/:id`
- **THEN** 系统返回 403 禁止访问

#### Scenario: 管理员更新友链

- **WHEN** 管理员发送 `PATCH /friend-links/:id` 带合法字段
- **THEN** 系统更新对应记录并返回最新值

#### Scenario: 管理员切换友链状态

- **WHEN** 管理员发送 `PATCH /friend-links/:id` 设置 `status=INACTIVE`
- **THEN** 系统更新状态，公开接口不再返回该友链

#### Scenario: 管理员删除友链

- **WHEN** 管理员发送 `DELETE /friend-links/:id`
- **THEN** 系统物理删除该记录并返回成功消息

#### Scenario: 删除不存在的友链

- **WHEN** 管理员发送 `DELETE /friend-links/:id` 指向不存在的 ID
- **THEN** 系统返回 404 未找到

### Requirement: 独立友链展示页

系统 SHALL 在前端提供路由 `/friends`，展示所有上线友链。每个友链卡片显示：头像、名称、描述、点击跳转外链（新标签页打开）。页面在移动端必须响应式正常显示。

#### Scenario: 访客打开友链页

- **WHEN** 访客访问 `/friends`
- **THEN** 页面调用 `GET /friend-links` 拉取数据并渲染所有 ACTIVE 友链卡片

#### Scenario: 友链列表为空

- **WHEN** 接口返回空数组
- **THEN** 页面展示友好的空状态提示（如「暂无友链」）

#### Scenario: 点击友链卡片

- **WHEN** 访客点击某个友链卡片
- **THEN** 浏览器在新标签页打开对应 `url`，使用 `rel="noopener noreferrer"`

#### Scenario: 头像加载失败

- **WHEN** 友链头像 URL 无法加载
- **THEN** UI 显示默认占位图标，不破坏布局

### Requirement: AboutPage 友链摘要卡片

系统 SHALL 在 AboutPage 最底部新增一个友链摘要卡片，调用 `GET /friend-links?limit=8` 获取数据，展示头像与名称网格，并在卡片底部提供「查看全部」入口跳转至 `/friends`。

#### Scenario: AboutPage 加载并有友链

- **WHEN** AboutPage 加载时数据库存在至少一个 ACTIVE 友链
- **THEN** 页面在最底部渲染友链摘要卡片，最多展示 8 个

#### Scenario: 暂无友链时

- **WHEN** 接口返回空数组
- **THEN** 摘要卡片整张隐藏，不展示空白区域

#### Scenario: 点击「查看全部」

- **WHEN** 访客点击摘要卡片中的「查看全部」入口
- **THEN** 路由跳转到 `/friends`

### Requirement: 后台友链管理 UI

系统 SHALL 在管理后台「网站设置」页面新增「友链管理」区域，提供友链的列表、新增、编辑、删除、上下线切换、排序调整能力。UI 必须遵循管理后台现有风格。

#### Scenario: 管理员查看友链列表

- **WHEN** 管理员进入网站设置页的友链管理区域
- **THEN** UI 调用管理列表接口（含 INACTIVE）并展示所有友链表格/列表

#### Scenario: 管理员新增友链

- **WHEN** 管理员填写表单（name、url、可选 avatar/description/sortOrder/status）并提交
- **THEN** UI 调用 `POST /friend-links` 创建记录并刷新列表

#### Scenario: 管理员编辑友链

- **WHEN** 管理员点击某条友链的编辑并提交修改
- **THEN** UI 调用 `PATCH /friend-links/:id` 更新记录并刷新列表

#### Scenario: 管理员删除友链

- **WHEN** 管理员点击删除并确认
- **THEN** UI 调用 `DELETE /friend-links/:id` 并刷新列表

#### Scenario: 管理员切换上下线

- **WHEN** 管理员点击某条友链的状态开关
- **THEN** UI 调用 `PATCH /friend-links/:id` 修改 `status` 字段并刷新状态显示

#### Scenario: 管理员调整排序

- **WHEN** 管理员修改 `sortOrder` 值并保存
- **THEN** UI 调用 `PATCH /friend-links/:id` 更新排序权重，列表按新顺序展示
