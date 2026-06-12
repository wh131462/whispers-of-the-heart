## 1. 后端：知识库与服务器默认对话端点

- [x] 1.1 在 `apps/api/src/` 下新建 `ai-chat/` 模块目录，创建 `ai-chat.module.ts`、`ai-chat.controller.ts`、`ai-chat.service.ts`，并在 `app.module.ts` 注册
- [x] 1.2 创建 DTO：`dto/knowledge-search.dto.ts`（含 `query` / `limit` 校验）、`dto/completions.dto.ts`（含 `messages` / `useKnowledge` / `query` / `temperature` / `maxTokens`）
- [x] 1.3 实现 `AiChatService.searchKnowledge(query, limit)`：基于 Prisma 对 `Post` 表做 `published=true` + `OR(title/excerpt/content contains)` 查询，做命中片段截取（±200）与简单评分
- [x] 1.4 实现 `AiChatService.streamCompletions(dto, ip)`：注入服务器 Key，按 OpenAI 兼容协议向 `AI_DEFAULT_BASE_URL` 发起流式请求，返回 `Readable`
- [x] 1.5 实现 `AiChatService` 内的 IP 限流（内存 Map + 定时清理），可由 `AI_DEFAULT_RATE_LIMIT_PER_MINUTE` 调整
- [x] 1.5a 实现 `AiChatService` 内的「每用户 5 小时滑动窗口 token 配额」，可由 `AI_DEFAULT_USER_TOKEN_LIMIT_PER_5H` 调整；提供 `checkUserQuota(userId)` / `addUserUsage(userId, tokens)`；估算策略：请求按字符数 /4，响应优先取上游 `usage`，否则按字符 /4
- [x] 1.5b 在 `AiChatController.completions` 上加 `JwtAuthGuard`，从 `req.user` 取 `userId` 做配额校验；流式响应结束时回写实际 token 用量
- [x] 1.6 实现 prompt 注入安全包裹：把知识库片段拼成 `<context>...</context>` system 模板并加入对抗指令
- [x] 1.7 `AiChatController`：`POST /ai-chat/knowledge/search` 与 `POST /ai-chat/completions`（流式 SSE 回写）；走统一响应/错误格式
- [x] 1.8 在 `configs/env.development` 与文档中补充 `AI_DEFAULT_BASE_URL` / `AI_DEFAULT_MODEL` / `AI_DEFAULT_RATE_LIMIT_PER_MINUTE` / `AI_DEFAULT_USER_TOKEN_LIMIT_PER_5H` 说明
- [ ] 1.9 启动后端做手动验证：`curl` 调用 `knowledge/search` 与 `completions`，确认响应与流式行为正常

## 2. 共享类型与工具

- [x] 2.1 在 `packages/types/src/` 增加 `ai-chat.ts`，导出 `Provider`、`Message`、`Conversation`、`KnowledgeHit`、`CompletionsRequest` 等类型，并在包入口 `index.ts` 导出
- [x] 2.2 在 `packages/utils/src/` 增加 `ai-chat/` 子目录，封装两个 Adapter：`OpenAIAdapter` 与 `AnthropicAdapter`，统一暴露 `chat(messages, opts, signal): AsyncIterable<string>`
- [x] 2.3 增加 SSE 流解析工具 `parseSSE(stream)`，处理 `data: {...}` 与 Anthropic 的 `event:`/`data:` 多行事件
- [x] 2.4 运行 `pnpm packages:build` 验证类型与构建通过

## 3. 前端状态：`useAiChatStore`

- [x] 3.1 创建 `apps/web/src/stores/useAiChatStore.ts`，定义 state（userProviders / activeProviderId / conversations / activeConversationId / knowledgeEnabled）
- [x] 3.2 在同目录新建 `aiChatBuiltins.ts`，导出常量 `BUILTIN_PROVIDERS`（含 `__server_default__`、OpenAI、Anthropic、DeepSeek、Ollama、自定义模板），并提供派生函数 `getAllProviders(userProviders)` 合并内置与用户自定义
- [x] 3.3 实现 actions：`addProvider` / `updateProvider`（仅作用于 `userProviders`，禁止修改内置项）/ `removeProvider`（仅作用于 `userProviders`）/ `setActiveProvider` / `createConversation` / `deleteConversation` / `renameConversation` / `setActiveConversation` / `setKnowledgeEnabled`
- [x] 3.4 实现核心 action：`sendMessage(text)`、`regenerate(messageId)`、`stop()`，内部按 `protocol` 选择 Adapter，处理 `__server_default__` 走 `/api/v1/ai-chat/completions`
- [x] 3.5 配置 `persist`：`name: 'ai-chat-storage'`，`partialize` 仅保留 `userProviders` / `activeProviderId` / `conversations` / `activeConversationId` / `knowledgeEnabled`，明确排除内置 Provider 数据
- [x] 3.6 加载流程：每次组件读取 providers 时通过 `getAllProviders(userProviders)` 派生，而非从 store state 直接取持久化数据；确保博主升级 `BUILTIN_PROVIDERS` 后老用户立即生效

## 4. 前端 UI：对话页面与配置

- [x] 4.1 新建 `apps/web/src/pages/chat/ChatPage.tsx`，整体采用「左侧会话列表 + 右侧消息流」两栏布局，移动端折叠
- [x] 4.2 子组件：`ConversationList`（新建/切换/重命名/删除）、`MessageList`（流式渲染 + Markdown）、`MessageItem`（复制/重发/编辑）、`Composer`（输入 + 发送 + 停止 + 知识库开关）
- [x] 4.3 子组件：`ProviderSettingsDialog`（增删改 Provider，校验 baseUrl/temperature/maxTokens，受保护字段处理）
- [x] 4.4 接入 `react-markdown` 或现有 Markdown 渲染管线，确保代码块高亮与现有博客文章渲染风格一致
- [x] 4.5 在 `apps/web/src/router` 注册 `/chat` 路由（懒加载）
- [x] 4.6 在 `apps/web/src/layouts/MainLayout.tsx` 导航栏增加「AI 对话」入口

## 5. 知识库注入与协议适配

- [x] 5.1 在 `sendMessage` 中根据 `knowledgeEnabled` 调 `POST /api/v1/ai-chat/knowledge/search` 取片段（仅非 `__server_default__` 场景前端自己拼，`__server_default__` 在后端拼）
- [x] 5.2 拼装 system 消息模板：固定隔离指令 + `<context>...</context>` 片段
- [x] 5.3 OpenAI Adapter：将 system 作为 `messages[0]`，发到自定义 `baseUrl`（默认 `${baseUrl}/chat/completions`），通过 `ai-proxy/proxy?url=` 转发
- [x] 5.4 Anthropic Adapter：将 system 作为顶层 `system` 字段，发到 `${baseUrl}/messages`，通过 `ai-proxy` 转发；解析 `content_block_delta` 事件
- [x] 5.5 处理 `AbortController`：用户点击停止时取消 fetch；Adapter 内部捕获 `AbortError` 并安全结束流
- [x] 5.6 `__server_default__` 前端校验：若用户未登录则提示「使用默认配置需先登录」并阻止发送；若收到 401/429 显示对应提示（429 时解析 `data.resetAt` 渲染重置时间）

## 6. 安全与体验细节

- [x] 6.1 配置 UI 中：API Key 字段 `type=password`，附「仅存浏览器」提示，提供「清除所有本地配置」按钮（带二次确认）
- [x] 6.2 错误展示：网络错误 / 上游 4xx / 5xx / 429 限流分别显示友好提示
- [x] 6.3 移动端检查：< md 视口下侧边栏可抽屉展开，输入区固定底部
- [ ] 6.4 i18n：所有可见文案接入 i18n（如项目已启用 i18n 体系；否则用中文常量集中管理）

## 7. 校验与文档

- [x] 7.1 运行 `pnpm type-check` 与 `pnpm lint` 全量通过
- [ ] 7.2 浏览器端手动测试：默认配置开箱即用、切换 OpenAI/Anthropic 自定义配置、知识库开关、停止生成、刷新后状态保留
- [x] 7.3 在 `apps/api/src/ai-proxy` 的环境变量 `AI_PROXY_ALLOWED_HOSTS` 文档中补充常见预设 Host（api.deepseek.com 等已存在；如有新增按需补）
- [x] 7.4 更新 `.ai/1-PROJECT-CONTEXT.md`：模块表新增 `AI 对话` 行（前端 `apps/web/src/pages/chat/`，后端 `apps/api/src/ai-chat/`）
- [x] 7.5 更新 `.ai/2-TECH-STACK.md`：如新增类型/工具/依赖记录在案
- [ ] 7.6 更新 `.ai/4-PATTERNS.md`：若 Adapter / SSE 解析在项目中达到 3 次复用，沉淀为模式
- [x] 7.7 更新 `.ai/5-MEMORY.md`：记录本次会话的关键决策与遗留事项
