# 会话记忆存储

> 记录最近 5 次重要会话、当前上下文和可复用结论；避免保存临时调试信息。

## 📝 会话日志

### 2026-07-31 - P2P DataChannel 建立竞态修复

**问题**：文件传输双方已进入同一房间且成员可见，但在部分信令时序下 DataChannel 一直无法就绪，上传任务停留在等待 P2P 通道状态。Trickle ICE candidate 到达时，目标 PeerConnection 可能尚未创建或尚未设置 `remoteDescription`，原逻辑会直接丢弃或添加失败且不再重试。

**实施**：`useTrysteroRoom` 按 Peer 缓存提前到达的 ICE candidate，在 offer/answer 的远端描述设置完成后按序刷新；候选缓存限制为 256 条，Peer 离开、Socket 重连、断开和主动离房时同步清理。信令异步处理增加统一错误隔离，避免单个无效信令产生未处理的 Promise rejection 并影响后续协商。

**修改文件**：`packages/hooks/src/useTrysteroRoom.ts`

**验证**：`@whispers/hooks` 类型检查与构建、目标 ESLint、Web 类型检查和生产构建通过；两个独立应用内浏览器加入同一房间后，双方均确认 `RTCPeerConnection` 为 `connected`、DataChannel 为 `opened`，上传区域正常可用。浏览器自动化未能操作隐藏文件输入，因此本轮未重复执行完整文件内容传输；此前文件校验与断点协议保持未改动。

### 2026-07-31 - 管理后台应用分发与更新接口

**需求**：在管理后台注册待分发应用、维护版本，并为客户端提供包含 `versionCode`、`versionName`、`apkUrl` 和可选 `releaseNotes` 的 HTTPS JSON 更新地址。

**实施**：新增 `add-app-distribution` OpenSpec 变更；以 `DistributedApp + AppRelease` 保存应用及版本历史，同一应用的 `versionCode` 唯一，公开接口始终选择最高版本码。NestJS 新增管理员应用/版本 CRUD 与无需认证的 `GET /api/v1/app-distributions/:slug/latest.json`，下载地址仅接受 HTTPS，公开成功响应不套统一 API 包裹。管理后台新增响应式“应用分发”页面，可维护应用和版本、识别当前最新版本、复制或打开环境对应的完整更新地址。

**修改文件**：`apps/api/src/app-distribution/`、`apps/api/prisma/{schema.prisma,migrations/20260731000000_add_app_distribution/}`、`apps/web/src/pages/admin/AppDistributionPage.tsx`、管理路由与侧边栏；规格位于 `openspec/changes/add-app-distribution/`。

**验证**：Prisma Schema 校验与 Client 生成通过；API/Web 类型检查、目标 ESLint、API 构建和 Web 生产构建通过；HTTPS URL 校验确定性检查通过。本地 API/Web 可访问，但数据库已有 `20260721000000_add_user_token_version` 失败迁移导致 Prisma P3009，新增迁移未执行，因此未完成真实管理端/API 端到端验证。Web 构建仅保留已有 Browserslist 数据过期和大 chunk 警告。

### 2026-07-27 - P2P 聊天可靠传输与断点续传

**问题**：聊天原实现把本地 `send()` 调用当作发送成功，按 JavaScript 字符切分正文，接收端不校验完整分块/摘要，也没有来源 Peer 隔离、远端确认、重连续传或接收缓存过期清理。

**实施**：新增 `reliable-p2p-chat` OpenSpec 变更。聊天协议拆为 metadata、chunk、ack、progress、finalize、verification 六类 DataChannel-only Action；正文先转 UTF-8 字节并按 16 KiB Base64 分块，接收端严格检查协议版本、摘要、总字节、索引与单块长度，SHA-256 校验成功后才展示并回传 verification。发送端按目标 Peer 保存队列、检查点、背压等待、有限超时/摘要重试；共享 Hook 重建 DataChannel 后重发 metadata，从首个缺块继续。接收缓存按 `peerId + messageId` 隔离，设置会话上限与 TTL，已验证会话重复请求不重复展示。UI 保留稳定消息 ID，展示发送中/已送达/部分送达/失败，失败消息可重试，断线期间不清空列表且未就绪时禁用输入。

**修改文件**：`apps/web/src/apps/p2p-chat/{types.ts,index.tsx,components/{MessageInput.tsx,MessageItem.tsx,MessageList.tsx},hooks/{useWebRTC.ts,useChat.ts,chat-transfer-utils.ts}}`；规格已同步至 `openspec/specs/reliable-p2p-chat/`，变更归档于 `openspec/changes/archive/2026-07-27-harden-p2p-chat/`。

**验证**：`@whispers/hooks` 类型检查与构建、Web 类型检查、聊天目标 ESLint、Web 生产构建均通过。构建仍输出仓库已有的大 chunk 与 Browserslist 数据过期提示；未完成真实双浏览器端到端聊天及断网实测（本机信令/API 服务未启动）。

### 2026-07-27 - P2P 文件传输可靠性与断点续传

**问题**：旧实现把发送端 `send()` 完成/最后分块误判为接收端完成，缺块、截断或损坏文件也可能显示成功；Socket.IO 重连后只重新加入房间，没有重建 WebRTC DataChannel。

**实施**：新增版本化 metadata、SHA-256 文件摘要、接收端连续缺块 checkpoint、幂等分块、周期进度 ACK、finalize/verification 完成握手；发送端仅在接收端校验成功后完成，DataChannel 分块使用高低水位背压，校验失败最多重试 2 次并带 15 秒校验超时。`useTrysteroRoom` 在每次 Socket.IO connect（含 reconnect）依据成员列表重建 PeerConnection，并暴露 `readyPeers`、DataChannel drain 等能力；文件传输在断线时暂停，重连后重新协商 metadata 并从首个缺块续传。UI 增加暂停、校验中、SHA-256 校验通过状态。

**修改文件**：`apps/web/src/apps/p2p-file-transfer/{types.ts,hooks/transfer-utils.ts,hooks/useFileTransfer.ts,components/TransferList.tsx}`、`packages/hooks/src/{useTrysteroRoom.ts,index.ts}`；规格已同步至 `openspec/specs/reliable-p2p-file-transfer/`，变更归档于 `openspec/changes/archive/2026-07-27-harden-p2p-file-transfer/`。

**验证**：P2P 辅助函数确定性检查通过（缺块、重复块、断点、空文件、SHA-256）；hooks 类型检查/构建、web 类型检查、目标 ESLint、web 生产构建通过。应用内浏览器可加载连接页；因本机 API/信令服务未启动，未完成双浏览器端到端传输和断网实测，页面控制台的 API 500 属于环境缺少后端服务。

### 2026-07-22 - BlockNote AI 长内容续写滚动修复

**问题**：长文章选区触发 AI 编辑后，AI 扩写会持续把锚点移动到最后变更块；项目根节点的全局平滑滚动与 BlockNote AI 的自动定位互相干扰。同时 AI 菜单按文档块定位且编辑器容器允许溢出，长内容下菜单会离开可视区并参与页面高度计算，表现为滚动条异常变长、无法找到“接受/拒绝”。

**实施**：AI 会话开启期间临时将根节点滚动行为切换为 `auto`，关闭后恢复；将 AI 菜单固定到视口底部并限制最大高度，使输入、生成、审阅阶段的操作始终可见且不再撑高文档。正文的捕获阶段粘贴处理器仅处理 `.bn-editor` 内事件，并放行原生输入框，避免 AI 提示词被 Markdown 粘贴逻辑截获后插入正文。

**修改文件**：`packages/ui/src/components/editor/BlockNoteEditor.tsx`

**验证**：UI 类型检查、目标 ESLint、UI 包构建和 Web 生产构建通过；本地 80 段长文浏览器验证中，菜单滚动前后均固定于视口底部，页面高度保持稳定，关闭后平滑滚动恢复。AI 输入框粘贴回归确认文本只进入提示词输入框，正文内容保持不变。实际模型请求被当前本地模型配置以 `Thinking mode does not support this tool_choice` 拒绝，未覆盖成功生成后的“接受/拒绝”端到端点击，该错误与本次布局修复独立。

## 🎯 当前上下文（最近 3 次）

1. **P2P DataChannel 建立竞态修复**：提前到达的 ICE candidate 按 Peer 缓存，远端描述就绪后补入；双浏览器已确认连接与 DataChannel 正常打开。
2. **应用分发与更新接口**：管理端可维护应用和版本历史；公开 `latest.json` 返回最高 `versionCode` 对应字段，APK URL 强制 HTTPS；静态验证完成，待数据库迁移与真实端到端验证。
3. **P2P 聊天可靠传输与断点续传**：消息只有接收端 SHA-256 verification 后才送达；DataChannel 重连后按首个缺块续传，UI 保留失败状态与重试；本地构建通过，待真实双端断网实测。

## 💡 重要发现

### 架构决策

| 领域 | 选择                          | 说明               |
| ---- | ----------------------------- | ------------------ |
| 前端 | Vite + React 19               | SPA，无 SSR        |
| 状态 | Zustand                       | 轻量并支持持久化   |
| 后端 | NestJS + Prisma               | 模块化与类型安全   |
| 文件 | MinIO                         | S3 兼容、自托管    |
| 评论 | `rootId + replyToId` 扁平结构 | 便于分页与批量查询 |

### 常见问题及解决方案

| 问题                                 | 解决方案                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| Zustand rehydration 竞态             | `_hasHydrated` + `queueMicrotask`                                                          |
| 可选认证不解析 token                 | 使用 `OptionalJwtAuthGuard`                                                                |
| 评论点赞 N+1                         | 汇总评论 ID 后单次 `{ in: ids }` 查询                                                      |
| BlockNote 自定义工具栏丢失默认按钮   | 显式列出全部按钮                                                                           |
| BlockNote AI 长内容菜单离屏/撑高页面 | AI 会话期间关闭根节点平滑滚动，并将 AI 菜单固定于视口底部                                  |
| BlockNote AI 输入框粘贴进入正文      | 将正文粘贴捕获限制在 `.bn-editor`，并放行 `input` / `textarea`                             |
| 动态背景偶发闪烁                     | 避免全屏 `backdrop-filter` 依赖运动图层；静态滤镜纹理 + transform 合成 + paint containment |
| 装饰动画离屏仍耗资源                 | `IntersectionObserver` 与 Page Visibility 共同控制 CSS 播放变量                            |
| P2P `send()` 被误判为送达            | 使用 metadata/checkpoint/finalize/verification 协议；仅远端长度与 SHA-256 校验成功后完成   |
| P2P 断线后无法继续                   | 保留内存会话，重建 DataChannel 后重发 metadata，并从接收端首个缺块位置续传                 |
| P2P 成员可见但 DataChannel 不就绪    | 缓存早于远端描述到达的 ICE candidate，并在 `setRemoteDescription` 完成后按序补入           |
| 客户端更新接口不应带通用响应包裹     | 管理 CRUD 使用 `ApiResponseDto`，公开 `latest.json` Controller 直接返回固定版本字段        |

## 🔗 关键代码位置

| 功能          | 路径                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| 首页动态背景  | `packages/ui/src/components/background/FallingPattern.tsx`                           |
| 首页调用方    | `apps/web/src/pages/HomePage.tsx`                                                    |
| 认证与会话    | `apps/api/src/auth/`、`apps/web/src/stores/useAuthStore.ts`                          |
| 博客          | `apps/api/src/blog/`                                                                 |
| 评论          | `apps/api/src/comment/`                                                              |
| AI 对话       | `apps/api/src/ai-chat/`、`apps/web/src/pages/chat/`                                  |
| 应用分发      | `apps/api/src/app-distribution/`、`apps/web/src/pages/admin/AppDistributionPage.tsx` |
| P2P 共享连接  | `packages/hooks/src/useTrysteroRoom.ts`                                              |
| P2P 聊天      | `apps/web/src/apps/p2p-chat/`                                                        |
| P2P 文件传输  | `apps/web/src/apps/p2p-file-transfer/`                                               |
| 富文本编辑器  | `packages/ui/src/components/editor/BlockNoteEditor.tsx`                              |
| AI 协作入口   | `CLAUDE.md`、`AGENTS.md`、`.ai/`                                                     |
| Prisma Schema | `apps/api/prisma/schema.prisma`                                                      |
| UI 组件库     | `packages/ui/src/components/`                                                        |

---

**最后更新**：2026-07-31
