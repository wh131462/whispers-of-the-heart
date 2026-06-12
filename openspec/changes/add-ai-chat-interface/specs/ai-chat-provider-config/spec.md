## ADDED Requirements

### Requirement: 供应商配置数据模型

系统 SHALL 在前端定义 Provider 配置数据结构，每个 Provider MUST 包含以下字段：`id`（字符串）、`name`（显示名）、`protocol`（`openai` 或 `anthropic`）、`baseUrl`（字符串）、`apiKey`（字符串，可空）、`model`（字符串）、`temperature`（数字）、`maxTokens`（数字）、`isPreset`（布尔，标识是否为内置预设）、`isServerDefault`（布尔，标识是否为博主服务器默认）。

#### Scenario: 加载默认 Provider 列表

- **WHEN** 前端首次加载且本地存储无用户自定义 Provider
- **THEN** 系统 SHALL 通过内置常量 `BUILTIN_PROVIDERS` 提供以下预设：`__server_default__`（博主默认）、OpenAI、Anthropic、DeepSeek、Ollama、自定义（OpenAI 兼容）
- **AND** 这些内置 Provider MUST NOT 被写入 `localStorage`

#### Scenario: 字段类型校验

- **WHEN** 用户保存自定义 Provider
- **THEN** 系统 MUST 校验 `baseUrl` 为合法 URL，`temperature` 在 0-2，`maxTokens` 为正整数，否则拒绝保存并显示错误

### Requirement: 协议风格切换

Provider 配置 MUST 支持选择 `openai` 或 `anthropic` 协议。前端 SHALL 根据 `protocol` 字段使用对应的请求格式与流式解析器，对上层调用方透明。

#### Scenario: 使用 OpenAI 风格请求

- **WHEN** 当前 Provider 的 `protocol` 为 `openai`
- **THEN** 请求体 SHALL 遵循 `{ model, messages: [{role, content}], stream: true, temperature, max_tokens }` 结构
- **AND** 流式解析器按 `data: {choices: [{delta: {content}}]}` 增量取出文本

#### Scenario: 使用 Anthropic 风格请求

- **WHEN** 当前 Provider 的 `protocol` 为 `anthropic`
- **THEN** 请求体 SHALL 遵循 `{ model, messages, system, stream: true, max_tokens }` 结构（system 不在 messages 中）
- **AND** 流式解析器按 `event: content_block_delta` / `data: {delta: {text}}` 取出文本

### Requirement: 配置管理 UI

页面 MUST 提供「配置管理」入口（对话页内的设置侧边栏或弹窗），允许用户新增、编辑、删除自定义 Provider，并选择当前激活的 Provider。内置预设 Provider（`isPreset=true`）可通过「以预设为模板新建」复制后再编辑，但内置项本身 MUST NOT 被原地修改或删除。`__server_default__` MUST NOT 显示编辑/删除按钮，仅可选择激活。

#### Scenario: 新增自定义 Provider

- **WHEN** 用户点击「新增 Provider」并填写完整字段后保存
- **THEN** 系统 SHALL 校验通过后将其加入 `userProviders` 列表并持久化

#### Scenario: 切换激活 Provider

- **WHEN** 用户在配置 UI 中选中另一个 Provider
- **THEN** `activeProviderId` 更新，下次发送的消息使用新 Provider 配置

#### Scenario: 服务器默认配置受保护

- **WHEN** 用户在配置 UI 中查看 `__server_default__`
- **THEN** UI MUST NOT 显示该项的编辑、删除按钮
- **AND** 不显示 `apiKey` / `baseUrl` 字段（这些由服务端持有）

### Requirement: 本地化存储

用户自定义 Provider 配置（含 API Key）、激活的 Provider ID、对话记录、知识库开关状态 MUST 持久化在浏览器 `localStorage`，使用 Zustand `persist` 中间件，存储键名为 `ai-chat-storage`。`partialize` MUST 仅持久化 `userProviders` / `activeProviderId` / `conversations` / `activeConversationId` / `knowledgeEnabled`，明确排除内置预设与 `__server_default__` 的任何字段。配置数据 MUST 不上传到服务器。

#### Scenario: 刷新后恢复用户配置

- **WHEN** 用户保存自定义 Provider 后刷新页面
- **THEN** 用户自定义 Provider 列表与上次状态一致
- **AND** 内置预设与 `__server_default__` 由代码常量重新提供，不从 `localStorage` 读取

#### Scenario: 服务端默认配置升级即时生效

- **WHEN** 博主在新版本中调整内置 `BUILTIN_PROVIDERS` 中 `__server_default__` 的 `model` 或描述
- **THEN** 用户加载新前端后立即使用新值，不被旧 `localStorage` 覆盖

#### Scenario: API Key 不出现在网络请求中（除目标供应商）

- **WHEN** 用户使用任意非 `__server_default__` 的 Provider 发送消息
- **THEN** API Key 仅作为 `Authorization` 头通过 `ai-proxy` 透传给目标供应商
- **AND** 不会出现在 `/api/v1/ai-chat/*` 端点的请求中

### Requirement: 服务器默认配置回退

系统 MUST 提供一份 ID 为 `__server_default__` 的内置 Provider，作为「博主服务器默认」。使用该 Provider 时，前端 SHALL 调用后端 `POST /api/v1/ai-chat/completions` 端点；后端 SHALL 注入服务器持有的 API Key，并基于环境变量 `AI_DEFAULT_BASE_URL` / `AI_DEFAULT_MODEL` 决定上游目标与默认模型。该 Provider 仅对已登录用户可用，且受每用户 5 小时 token 配额限制。

#### Scenario: 已登录用户默认配置开箱即用

- **WHEN** 已登录用户首次访问 `/chat` 未做任何配置即发送消息
- **THEN** 系统 SHALL 使用 `__server_default__` Provider 经由 `/api/v1/ai-chat/completions` 完成对话
- **AND** 用户无需输入任何 API Key

#### Scenario: 未登录用户尝试使用默认配置

- **WHEN** 未登录用户在 `/chat` 选中 `__server_default__` 并发送消息
- **THEN** 前端 SHALL 拦截并提示「使用默认配置需先登录」，引导跳转到登录页
- **AND** 不发起后端请求

#### Scenario: 服务器未配置默认 Key

- **WHEN** 后端环境变量未设置 `AI_API_KEY`
- **THEN** `/api/v1/ai-chat/completions` SHALL 返回 400 并提示「服务器未配置默认 AI 配置」

#### Scenario: 用户超出 token 配额

- **WHEN** 已登录用户在最近 5 小时内累计 token 用量已达配额且发起新请求
- **THEN** 端点 SHALL 返回 HTTP 429
- **AND** 前端 SHALL 展示「已达本周期 token 配额，请稍后再试」并显示重置时间
