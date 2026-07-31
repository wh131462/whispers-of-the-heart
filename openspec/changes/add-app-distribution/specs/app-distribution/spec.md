## ADDED Requirements

### Requirement: 管理员注册和维护分发应用

系统 SHALL 允许已认证管理员创建、查看、修改和删除分发应用；应用 SHALL 包含名称与全局唯一、仅由小写字母、数字和连字符组成的接口标识 `slug`，非管理员 SHALL 无法调用这些管理操作。

#### Scenario: 注册应用

- **WHEN** 管理员提交合法且未占用的名称和 `slug`
- **THEN** 系统创建应用并返回其详情与空版本列表

#### Scenario: 重复接口标识

- **WHEN** 管理员提交已被其他应用使用的 `slug`
- **THEN** 系统拒绝请求并返回冲突错误

#### Scenario: 删除应用

- **WHEN** 管理员确认删除一个应用
- **THEN** 系统删除该应用及其全部版本记录，之后公开接口返回未找到

#### Scenario: 未授权管理

- **WHEN** 未认证用户或非管理员调用应用管理接口
- **THEN** 系统拒绝该请求且不修改数据

### Requirement: 管理员维护应用版本历史

系统 SHALL 允许管理员为应用创建、修改和删除版本；每个版本 MUST 包含正整数 `versionCode`、非空 `versionName` 和 HTTPS `apkUrl`，并 MAY 包含非空 `releaseNotes`；同一应用内 `versionCode` SHALL 唯一。

#### Scenario: 创建新版本

- **WHEN** 管理员为已存在应用提交合法且未使用的版本信息
- **THEN** 系统保存版本并在应用详情中按 `versionCode` 降序返回版本历史

#### Scenario: 拒绝非 HTTPS 下载地址

- **WHEN** 管理员提交 HTTP、相对路径或其他非 HTTPS `apkUrl`
- **THEN** 系统拒绝请求且不保存版本

#### Scenario: 重复版本码

- **WHEN** 管理员为同一应用提交已存在的 `versionCode`
- **THEN** 系统拒绝请求并返回冲突错误

### Requirement: 客户端获取最新版本 JSON

系统 SHALL 提供无需认证的 `GET /api/v1/app-distributions/:slug/latest.json` 接口，并以该应用最高 `versionCode` 的版本作为最新版本；响应 SHALL 是不带统一 API 包裹的 JSON 对象，包含 `versionCode`、`versionName`、`apkUrl`，且仅在已配置时包含 `releaseNotes`。

#### Scenario: 获取包含发布说明的最新版本

- **WHEN** 客户端通过有效 `slug` 请求一个已有多个版本且最新版本带发布说明的应用
- **THEN** 系统返回最高 `versionCode` 对应的四个字段，`Content-Type` 为 JSON

#### Scenario: 获取不含发布说明的最新版本

- **WHEN** 最新版本未配置 `releaseNotes`
- **THEN** 响应包含三个必填字段且不包含 `releaseNotes` 属性

#### Scenario: 应用或版本不存在

- **WHEN** `slug` 不存在或应用尚未创建任何版本
- **THEN** 系统返回未找到错误

### Requirement: 管理页面展示可用更新地址

管理页面 SHALL 响应式展示应用、版本历史和由当前 API 基础地址及应用 `slug` 组成的更新接口地址，并允许管理员复制该地址。

#### Scenario: 复制更新接口

- **WHEN** 管理员在应用卡片点击复制接口地址
- **THEN** 页面将该应用的完整最新版本接口 URL 写入剪贴板并显示成功反馈

#### Scenario: 小屏维护版本

- **WHEN** 管理员在移动设备打开应用分发页面
- **THEN** 应用与版本操作保持可见且无需横向滚动即可完成主要表单操作
