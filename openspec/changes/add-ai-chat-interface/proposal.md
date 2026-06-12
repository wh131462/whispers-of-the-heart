## Why

当前博客缺少面向访客与博主自身的 AI 对话能力，访客无法基于站内文章快速提问、博主也无法在浏览过程中就地与 AI 协作。已有的 `ai-proxy` 模块仅服务于编辑器内嵌的 BlockNote AI（写作辅助），不暴露可独立交互的对话界面，也不具备「以博客为知识库」的检索增强能力。我们需要一个独立、可自配置、且默认即可用的 AI 对话入口，把博客内容作为天然的知识库。

## What Changes

- 新增独立的 AI 对话页面（路由 `/chat`），提供流式对话、Markdown 渲染、消息历史、复制/重发等基础能力
- 新增前端「AI 模型配置」管理界面与本地存储（Zustand persist），用户可：
  - 选择内置预设供应商（OpenAI / Anthropic / DeepSeek / Ollama / 自定义 OpenAI 兼容端点）
  - 自定义 base URL、API Key、模型名、温度等参数
  - 切换 OpenAI 风格（`/chat/completions`）或 Anthropic 风格（`/messages`）的请求协议
- 默认提供一份「博主服务器默认配置」，免配置即可使用（请求经由扩展后的 `ai-proxy` 转发）
- 新增博客知识库检索接口（`POST /api/v1/ai-chat/knowledge/search`），基于现有博客文章内容做关键词检索，返回 Top-N 命中片段
- 对话默认开启「博客知识库」开关，把命中的片段作为 system / context 注入到提示词；用户可手动关闭
- 扩展 `ai-proxy` 增加一组明确的会话端点白名单，并支持「不带 Key 的默认配置」走服务器端注入 Key
- **BREAKING**: 无（纯新增能力，不影响现有 `ai-proxy` 调用方）

## Capabilities

### New Capabilities

- `ai-chat-interface`: 前端独立对话界面，包含会话视图、消息流式渲染、会话列表、本地历史持久化
- `ai-chat-provider-config`: AI 供应商配置能力，包括预设供应商、协议风格切换、本地化存储与「服务器默认配置」回退
- `ai-chat-knowledge`: 后端知识库检索能力，基于博客文章为对话提供站内 RAG 上下文

### Modified Capabilities

- 无（已有 `ai-proxy` 通过非破坏方式扩展，不修改其对外契约）

## Impact

- **前端 (`apps/web`)**: 新增 `apps/web/src/pages/chat/` 页面、`apps/web/src/stores/useAiChatStore.ts`、新增导航入口；复用 `packages/ui` 现有组件与 Markdown 能力
- **后端 (`apps/api`)**: 新增 `apps/api/src/ai-chat/` 模块（knowledge 检索 + 默认会话转发），`ai-proxy` 增加白名单与默认配置注入逻辑
- **依赖**: 不新增重型依赖；如需 Token 流解析将复用 `fetch` + `ReadableStream`
- **数据库**: 不新增表；知识库基于现有 `Post` 表做关键词检索（`title` / `content` / `excerpt`）
- **环境变量**: `AI_PROXY_ALLOWED_HOSTS` 复用，新增可选 `AI_DEFAULT_MODEL` / `AI_DEFAULT_BASE_URL` 描述「博主默认配置」
- **路由**: 前端新增 `/chat`；后端新增 `/api/v1/ai-chat/*`

## Non-goals

- 不实现向量嵌入 / 语义检索，知识库仅做关键词匹配（首版）
- 不做多用户独立 Key 管理后台，所有用户配置仅存在浏览器本地
- 不实现工具调用（function calling）、图片生成、TTS 等高级能力
- 不修改 BlockNote 编辑器内的 AI 写作功能
