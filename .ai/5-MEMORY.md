# 会话记忆存储

> 记录最近 5 次重要会话、当前上下文和可复用结论；避免保存临时调试信息。

## 📝 会话日志

### 2026-09-08 - 修复共享 P2P 连接与全部游戏联机入口

**需求**：排查聊天/文件长期无法连接，按推荐方案覆盖聊天、文件及游戏联机，完成验证后创建 commit。

**实施**：共享 WebRTC 按 Socket 会话与 connectionId 隔离信令，逐 Peer 串行处理 SDP/candidate，连接重建清理旧回调与 readyPeers；协商超时、断开和失败采用最多两次重试，双方可见最终失败。修复旧 Socket 延迟离开误删新成员、跨房间信令归属、重复加入及加入 ACK 过期问题；Socket.IO 支持 WebSocket 失败回退 polling。追加可选 TURN 构建变量并贯通 Docker/CI/发布脚本，凭证不写入仓库。

**游戏**：成员监听注册时回放现有成员，广播覆盖尚未建立 PeerConnection 的成员，缓冲消息等发送函数注册后再投递；通用游戏刷新消息处理回调并恢复角色。斗地主修复重连客户端抢占房主、座位重复占用及座位/手牌恢复；史莱姆足球菜单改为游戏区域内遮罩，使在线入口可点击。

**验证**：本地 Vite 页面 + 实际 Nest SignalingModule，多页面聊天中文/emoji 已送达；8 MB 文件完整传输，64 MB 文件在约 2% 时断开双方信令后自动续传，双方 SHA-256 校验通过；五子棋双端落子并分别断开发起方/接收方后继续落子，黑白棋落子翻转同步，史莱姆足球双端入房/开局，斗地主三端入座/准备/发牌及全部断线恢复后叫地主/出牌同步。实际 Socket.IO 验证成员替换、旧断开、旧信令目标、跨房间拒绝、重复加入、切换房间及 WebSocket 被拒绝时 polling 回退。全仓类型、Lint（仅已有 warning）、生产构建、目标 ESLint、Compose/YAML、发布脚本语法与 OpenSpec 校验通过。

**边界与决策**：当前仅创建本地提交，未部署。无可用 TURN 配置且未进行不同设备/运营商网络验收，不能宣称受限 NAT 全部连通。`openspec/changes/repair-p2p-connectivity/` 记录实现与仍待配置的中继验收；默认 STUN，聊天/文件继续仅走 DataChannel，API 房间仍为单实例内存。

### 2026-09-01 - P2P 聊天重连协商竞态修复

**问题**：P2P 聊天在 DataChannel 未打开时长期显示“正在建立安全数据通道，请稍候”，Socket.IO 重连后尤其容易无法恢复聊天。

**分析与实施**：确认线上信令服务和生产前端 API 地址正常；共享 WebRTC Hook 在首次加入和 Socket.IO 重连时可能由双方同时创建 offer，收到对方 offer 后又销毁本地连接，形成协商冲突。改为按 `peerId` 稳定排序选择唯一 offer 发起方，并统一复用 offer 创建逻辑，覆盖新成员加入与重连重建场景。

**验证**：`@whispers/hooks` 构建、Web 类型检查和 Web 生产构建通过；线上 Socket.IO signaling polling 握手正常。未进行真实双浏览器 DataChannel 回归（当前环境无可用应用内浏览器）。

### 2026-08-31 - 作品展示与后台管理

**需求**：在个人博客中宣传博主开发的开源项目和 APP，并允许管理员方便地维护展示内容。

**实施**：新增 `add-project-showcase` OpenSpec 变更和 `ShowcaseProject` 领域模型，支持开源项目、APP、网站、站内工具四类作品，以及草稿/上线、首页推荐、排序、图标封面、标签平台和外链。NestJS 新增公开 `GET /api/v1/projects` 与管理员作品 CRUD；作品可唯一关联一个 `DistributedApp`，公开结果按最高 `versionCode` 派生最新版本和有效下载地址，删除分发应用时保留作品并清空关联。Web 新增 `/projects` 作品页、顶部“作品”入口、首页精选非对称展示和后台“作品管理”，后台复用媒体库并支持状态快速切换。

**修改文件**：`apps/api/src/project-showcase/`、`apps/api/prisma/{schema.prisma,migrations/20260831000000_add_project_showcase/}`、`apps/web/src/{components/project-showcase,pages/projects,pages/admin/ProjectShowcasePage.tsx,types/project-showcase.ts}`、前后台路由与导航；规格位于 `openspec/changes/add-project-showcase/`。

**验证**：Prisma Schema 静态校验与 Client 生成、API/Web 类型检查、目标 ESLint、API 现有 5 个测试套件（8 项测试）、API 构建和 Web 生产构建通过。开发库最初存在 `20260721000000_add_user_token_version` 失败记录，但其字段、表、索引和外键实际完整；通过 `prisma migrate resolve --applied` 修复历史后，`add_app_distribution` 与 `add_project_showcase` 均已部署，迁移状态为最新，真实 `showcaseProject.findMany` 查询成功。尚未进行带作品数据的浏览器端到端验证；Web 构建仅保留已有 Browserslist 数据过期和大 chunk 警告。

### 2026-08-21 - 移除 TURN/coturn，恢复纯 STUN 直连

**需求**：不再部署 `turn.131462.wang` 或任何 coturn 转发服务，恢复聊天和文件传输的直连使用体验。

**实施**：删除 API 的 ICE 配置 Controller/Service、Compose 的 coturn 服务、CI 的 coturn 镜像/配置生成与 TURN 密钥注入，以及环境模板中的 TURN 字段。`useTrysteroRoom` 改为固定使用公开 STUN；ICE 失败时最多执行两次有限重协商（第二次重建 PeerConnection），最终清理失效连接并提示直连失败。文件聊天 Action 全部要求 DataChannel，避免内容回退到 Socket.IO；已有元数据、进度 ACK、SHA-256、finalize/verification 和内存断点续传协议保持不变。

**验证**：Hooks/API/Web 类型检查与构建、目标 ESLint、CI YAML 和生产 Compose 解析通过；纯 STUN 跨对称 NAT/企业防火墙仍无法保证连通，这是不使用 TURN 的网络能力边界。

### 2026-07-31 - P2P DataChannel 建立竞态修复

**问题**：文件传输双方已进入同一房间且成员可见，但在部分信令时序下 DataChannel 一直无法就绪，上传任务停留在等待 P2P 通道状态。Trickle ICE candidate 到达时，目标 PeerConnection 可能尚未创建或尚未设置 `remoteDescription`，原逻辑会直接丢弃或添加失败且不再重试。

**实施**：`useTrysteroRoom` 按 Peer 缓存提前到达的 ICE candidate，在 offer/answer 的远端描述设置完成后按序刷新；候选缓存限制为 256 条，Peer 离开、Socket 重连、断开和主动离房时同步清理。信令异步处理增加统一错误隔离，避免单个无效信令产生未处理的 Promise rejection 并影响后续协商。文件传输 UI 区分“无人加入”和“DataChannel 尚未就绪”；多人房间必须显式选择一个通道已就绪的接收方，禁止隐式选择首位成员或默认广播，目标离线后自动清除选择。此前尝试的 TURN 配置已在 2026-08-21 移除，当前仅保留 STUN 直连和有限 ICE 重协商。

**修改文件**：`packages/hooks/src/useTrysteroRoom.ts`、`apps/api/src/signaling/signaling.module.ts`、`apps/web/src/apps/p2p-file-transfer/index.tsx`、`configs/env.example`、`.github/workflows/docker-build.yml`、`openspec/specs/reliable-p2p-file-transfer/spec.md`

**验证**：Hooks/API 类型检查与构建、Web 类型检查和生产构建通过；双浏览器直连验证仍可建立 DataChannel。此前文件校验与断点协议保持未改动。

## 🎯 当前上下文（最近 3 次）

0. **服务器中转兜底**：用户明确不使用 TURN，新增 `add-p2p-server-relay` OpenSpec 变更。实现直连优先、双方声明后 3 秒启用 Socket.IO 中转，聊天/文件完整性协议保留；类型检查、Lint 和生产构建通过，跨网络中转仍待真实设备验收。

1. **P2P 共享连接与联机恢复**：聊天、文件、五子棋、黑白棋、史莱姆足球和斗地主本地多页面回归通过；包含 64 MB 断线续传和游戏角色恢复。TURN 已移除，聊天/文件改为 Socket.IO 中转兜底，待跨网络验收。
2. **作品展示与后台管理**：公开作品页和首页精选已接入，后台可维护展示字段并关联应用分发；开发库迁移已执行，待录入作品后进行端到端验证。
3. **应用分发与更新接口**：管理端维护应用/版本，公开 latest.json 返回最高 versionCode 对应 HTTPS APK；后续迁移已完成，业务端到端验证待完成。

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
| 客户端更新接口不应带通用响应包裹     | 管理 CRUD 使用 `ApiResponseDto`，公开 `latest.json` Controller 直接返回固定版本字段        |
| 共享 UI 的 Tailwind 任意值类未生效   | Web 的 Tailwind `content` 必须扫描 `packages/ui/src/**/*.{js,ts,jsx,tsx}`                  |
| P2P 成员在线但传输立即暂停           | 区分房间成员与 `readyPeers`；仅 DataChannel 就绪后开放文件选择和启动分块发送               |
| P2P 旧连接干扰重连                   | Socket sessionId + connectionId 隔离信令；旧 Socket 无权移除新成员，按 Peer 串行协商       |
| 斗地主重连出现多个房主               | 只在首次显式入房分配房主，普通客户端恢复时请求原房主快照                                   |
| P2P DataChannel 一直无法就绪         | 缓存早于 offer/answer 到达的 ICE candidate，远端 SDP 设置完成后再按 Peer 补加              |
| 作品与 APP 下载信息重复维护          | `ShowcaseProject` 可选关联 `DistributedApp`，读取时按最高 `versionCode` 派生最新下载信息   |

## 🔗 关键代码位置

| 功能          | 路径                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| 首页动态背景  | `packages/ui/src/components/background/FallingPattern.tsx`                                                           |
| 首页调用方    | `apps/web/src/pages/HomePage.tsx`                                                                                    |
| 认证与会话    | `apps/api/src/auth/`、`apps/web/src/stores/useAuthStore.ts`                                                          |
| 博客          | `apps/api/src/blog/`                                                                                                 |
| 评论          | `apps/api/src/comment/`                                                                                              |
| AI 对话       | `apps/api/src/ai-chat/`、`apps/web/src/pages/chat/`                                                                  |
| 应用分发      | `apps/api/src/app-distribution/`、`apps/web/src/pages/admin/AppDistributionPage.tsx`                                 |
| 作品展示      | `apps/api/src/project-showcase/`、`apps/web/src/pages/projects/`、`apps/web/src/pages/admin/ProjectShowcasePage.tsx` |
| P2P 共享连接  | `packages/hooks/src/useTrysteroRoom.ts`                                                                              |
| P2P 聊天      | `apps/web/src/apps/p2p-chat/`                                                                                        |
| P2P 文件传输  | `apps/web/src/apps/p2p-file-transfer/`                                                                               |
| 富文本编辑器  | `packages/ui/src/components/editor/BlockNoteEditor.tsx`                                                              |
| AI 协作入口   | `CLAUDE.md`、`AGENTS.md`、`.ai/`                                                                                     |
| Prisma Schema | `apps/api/prisma/schema.prisma`                                                                                      |
| UI 组件库     | `packages/ui/src/components/`                                                                                        |

---

**最后更新**：2026-09-08
