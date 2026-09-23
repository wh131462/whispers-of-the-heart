# 会话记忆存储

> 记录最近 5 次重要会话、当前上下文和可复用结论；避免保存临时调试信息。

## 📝 会话日志

### 2026-09-23 - 统一移除 Dialog 右上角关闭图标

**需求**：所有共享 Dialog 不再默认显示右上角 X 关闭按钮。

**实施**：移除 `@whispers/ui` `DialogContent` 内置的右上角关闭按钮和图标实现；保留 `DialogClose` 导出、Radix Escape/遮罩关闭能力，以及各业务弹窗自己的取消/关闭按钮。

**验证**：UI 包类型检查、`git diff --check` 通过；提交前将把当前工作区全部文件一并提交并推送。

### 2026-09-23 - 同步作品编辑弹窗滚动布局

**问题**：作品新增/编辑弹窗仍在 `DialogContent` 外层直接滚动，与媒体弹窗的内容面板布局不一致。

**实施**：作品弹窗改为固定标题区、固定底部操作区，中间使用带内边距和圆角边框的内容面板滚动；保留表单字段、作品类型/关联应用下拉、媒体选择和提交行为。

**验证**：Web 类型检查、作品页面定向 ESLint、`git diff --check` 和 Web 生产构建通过；构建仅保留既有 Browserslist 与大 chunk warning。

### 2026-09-23 - 将媒体弹窗滚动条放入内容面板

**问题**：单一滚动容器位于中间区域最外层，滚动条贴着弹窗外框显示。

**实施**：中间区域外层改为裁剪与内边距容器，内部新增带圆角边框的内容面板承载滚动；头部、工具栏和底部操作栏仍固定，列表/详情仍共用一个滚动上下文。

**验证**：Web 类型检查、媒体弹窗定向 ESLint、`git diff --check` 通过。

### 2026-09-23 - 简化媒体弹窗滚动结构

**需求**：媒体弹窗采用更常见的弹窗布局，避免列表和详情各自出现滚动条。

**实施**：保留固定头部、工具栏和底部操作栏，将媒体列表与详情合并到单一滚动容器；桌面端详情栏使用 `sticky` 保持可见，移动端按列表后顺序展示。上传、筛选、分页、选择和 Escape 关闭逻辑不变。

**验证**：Web 类型检查、媒体弹窗定向 ESLint、`git diff --check` 和 Web 生产构建通过；构建仅保留既有 Browserslist 与大 chunk warning。

### 2026-09-23 - 优化媒体弹窗共享组件与滚动条

**需求**：媒体弹窗复用共享 UI，并改善侧栏滚动条视觉。

**实施**：筛选按钮和加载骨架改用 `@whispers/ui` 的 `Button`、`Skeleton`；媒体列表和详情侧栏复用共享 `scrollbar-thin-overlay` 样式，并加入 `overscroll-contain`，不新增滚动组件或依赖。

**验证**：Web 类型检查、媒体弹窗定向 ESLint 和 `git diff --check` 通过。

### 2026-09-23 - 收敛媒体弹窗查询触发

**问题**：弹窗搜索输入、筛选切页和上传刷新存在把状态更新与立即请求叠加的风险，可能造成重复 GET 与加载状态闪动。

**实施**：将搜索草稿与已提交查询分离；列表请求统一由已提交的筛选、页码和搜索条件触发；筛选类型切换先同步状态再请求；上传成功后按当前查询显式刷新一次。保留 Toast 方法引用稳定性修复，避免上传状态重渲染重新创建请求依赖。

**验证**：Web 类型检查、媒体弹窗与 Toast 定向 ESLint、`git diff --check` 通过；定向 ESLint 仅保留 Toast 文件既有 Fast Refresh warning。

### 2026-09-23 - 重构统一媒体上传弹窗

**需求**：重构上传/选择媒体弹窗，保留统一上传 API、筛选分页、完整媒体回调和移动端可用性。

**实施**：将 `apps/web/src/components/media/MediaPickerDialog.tsx` 从文件树布局改为媒体库画廊 + 详情预览布局；增加骨架加载、空状态、类型图标、缩略图、搜索/筛选工具栏、明确的上传中状态、分页按钮和响应式移动端上下布局；改用现有 `@whispers/ui` Dialog 原语，保留 Escape/关闭、鉴权、上传后单次刷新和调用方接口不变。头像/Logo 上传的文件选择器同步限制为非 SVG 图片类型。

**验证**：Web 类型检查、媒体弹窗定向 ESLint、`git diff --check` 通过；Web 生产构建通过，仅保留仓库已有 warning。

### 2026-09-23 - 修复媒体上传弹窗重复请求

**问题**：点击统一媒体弹窗的上传按钮后，`GET /media` 持续重复请求并伴随界面闪动。

**原因与修复**：`useToastContext` 每次渲染都会创建新的便捷方法对象；媒体弹窗把该对象作为列表请求 `useCallback` 依赖，上传状态切换触发重渲染后形成副作用循环。将 `success/error/warning/info` 改为 `useCallback` 并缓存返回对象，使请求依赖稳定；保留上传后显式刷新列表。

**验证**：Web 类型检查、媒体弹窗与 Toast 定向 ESLint、`git diff --check` 和 Web 生产构建通过；仅保留仓库已有 ESLint warning、Browserslist 过期和大 chunk warning。原有 API 与全链路验证结果不变。

### 2026-09-23 - 完成全项目服务端媒体上传重构

**需求**：统一头像、Logo、封面、编辑器、媒体库和媒体选择弹窗的上传链路，并完成全链路验证。

**实施**：新增 `@whispers/utils` 共享媒体 API（列表、单文件、批量上传）；`/media` 统一 `type` 筛选并兼容旧 `mimeType`；后端增加 avatar/logo/cover/editor/library 用途的 MIME 与大小校验。将 Web 媒体选择器收敛为 `apps/web/src/components/media/MediaPickerDialog.tsx`，迁移个人资料、站点配置、友链、作品、文章封面、评论/文章编辑器和媒体库；删除 `packages/ui` 旧 `MediaPicker`，编辑器改为注入 `uploadFile`，P2P/本地工具保持独立。收尾时修复未知 MIME 的 500→400 边界、搜索分页使用旧页码的问题，并为弹窗交互按钮补充表单安全类型和对话框无障碍属性。

**验证**：`@whispers/utils`、`@whispers/ui`、API、Web 类型检查通过；API 6 套件 14 项测试通过；共享包、API、Web 生产构建通过；Web lint 0 error（保留仓库既有 warning），媒体控制器定向 ESLint 通过，`git diff --check` 通过；健康检查 200；真实 API multipart 上传 201、未知 MIME 400、canonical `type=file` 查询 200、legacy `mimeType` 查询 200、删除 200、头像非图片拒绝、空批量拒绝均通过。修复了 Multer `fileFilter` 将未知 MIME 误报 500 的边界问题，并补充回归测试。浏览器自动化仅确认本地首页和未登录保护页；未在浏览器输入测试密码或执行受保护页面上传点击回归，API/构建链路可用。

**规格**：OpenSpec `openspec/changes/refactor-media-upload/` 已完成 15/15 任务。未迁移 MinIO、未增加裁剪/分片/断点续传；媒体 hash 全局去重行为保持不变。

## 📝 会话日志

### 2026-09-23 - 修复弹窗内作品类型选项无法点击

**问题**：作品类型下拉可以打开，但点击选项后无效，编辑弹窗会被关闭。

**实施**：共享 `SelectContent` 的传送菜单增加 `pointerdown` / `mousedown` 捕获隔离并显式启用指针事件，避免 Radix Dialog 将 body 下的下拉菜单误判为弹窗外点击并卸载表单。

**验证**：UI/Web 类型检查、目标文件 ESLint/Prettier 检查和 `git diff --check` 通过。

### 2026-09-23 - 修复作品类型下拉立即关闭

**问题**：作品类型下拉点击后立即关闭，无法选择选项。

**实施**：移除作品编辑表单中包裹自定义 `Select` 的 `<label>`，改用普通容器；同样调整关联应用下拉，避免按钮触发 label 默认行为导致下拉二次切换。

**验证**：Web 类型检查、目标文件 ESLint/Prettier 检查和 `git diff --check` 通过。

### 2026-09-23 - 修复编辑作品下拉触发保存

**问题**：编辑作品表单点击下拉控件时，未选择选项也会触发表单保存。

**实施**：共享 `SelectTrigger` 补充 `type="button"`，避免浏览器将表单内下拉触发器按默认 `submit` 按钮处理；所有复用该组件的表单同时受益。

**验证**：`@whispers/ui` 与 Web 类型检查、目标文件 Prettier 检查和 `git diff --check` 通过。

### 2026-09-23 - 统一作品列表卡片尺寸

**问题**：作品页首个项目使用 featured 变体，跨两列且最小高度 30rem，导致列表卡片明显过大。

**实施**：作品列表统一使用 standard 卡片，两列网格保持同等信息密度；首页精选区继续保留 featured 主卡片布局。

**验证**：Web 类型检查、目标文件 ESLint 和 `git diff --check` 通过。

### 2026-09-23 - 修复作品页阴影裁剪并移除底部提示

**需求**：修复作品页容器裁剪卡片 hover 阴影，并删除底部“按作品类型浏览”行。

**实施**：移除作品页根容器的 `overflow-hidden`，删除底部提示及对应图标导入；保留右上环境光不影响卡片阴影扩展。

**验证**：Web 类型检查、目标文件 ESLint 和 `git diff --check` 通过。

### 2026-09-23 - 修复首页作品卡片 hover 中间线条

**问题**：首页作品卡片 hover 时封面和内容区交界处出现明显横线。

**实施**：移除卡片顶部 hover 高光线；封面与内容区改为连续渐变、轻微重叠，并让内容区使用明确的卡片背景层；封面 hover 缩放降至 1.015。

**验证**：Web 类型检查、目标文件 ESLint 和 `git diff --check` 通过。

### 2026-09-23 - 恢复作品列表卡片层级

**问题**：卡片静止状态阴影过弱，与页面背景接近，列表项边界不明显。

**实施**：为公开作品卡片、后台作品清单、统计卡片和空状态补充静态柔和阴影与更清晰的 ring；hover 使用更明显的前景色/主题色双层阴影，兼容亮暗主题。

**验证**：Web 类型检查、相关文件 ESLint 和 `git diff --check` 通过。

### 2026-09-23 - 统一作品卡片阴影与 hover 动效

**需求**：解决作品卡片 hover 阴影和 CSS 动效割裂的问题。

**实施**：卡片统一为轻微上移、主题色柔和阴影、边框高光和封面微缩放；作品链接、筛选按钮和后台清单同步使用短时长过渡，并加入 `motion-reduce` 兼容。

**验证**：Web 类型检查、相关文件 ESLint 和 `git diff --check` 通过。

### 2026-09-23 - 收窄作品卡片圆角

**需求**：减少作品展示页面卡片的圆角。

**实施**：首页、公开作品页和后台作品清单/表单分组由大圆角统一收窄为 `rounded-lg`；保留后台头部和弹窗的大圆角作为页面层级区分。

**验证**：Web 类型检查通过，改动文件格式化及 `git diff --check` 通过。

### 2026-09-23 - 重构作品展示全链路页面

**需求**：统一重构首页精选作品、公开作品页、作品新增/编辑界面和后台作品管理。

**实施**：保留原有 API、字段和路由，统一为偏编辑型作品集视觉。首页精选增加层次化标题与环境光；作品页改为大标题、作品数量、筛选胶囊和非对称卡片网格；作品卡片统一封面、图标、标签、操作链接和 hover 状态；后台改为深色工作台头部、数据统计、清单卡片和更清晰的新增/编辑弹窗分组。

**验证**：`pnpm --filter web type-check`、`pnpm --filter web build` 通过；生产构建保留已有 Browserslist 过期及大 chunk warning。未进行真实浏览器端到端交互验收。

### 2026-09-23 - 精简首页作品展示

**需求**：首页作品区移除约 30% 非必要展示元素。

**实施**：首页隐藏作品卡片的平台与标签元数据，移除 FEATURED PROJECTS 装饰眉题和重复说明；完整信息仍保留在 `/projects` 作品页。卡片新增可选 `showMetadata`，默认保持原有行为。

**验证**：`pnpm --filter web type-check` 通过；`pnpm --filter web lint` 通过，保留仓库既有 warning，无 error。

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

0. **编辑作品下拉已修复**：共享 `SelectTrigger` 明确声明 `type="button"`，防止表单内点击下拉误提交；UI/Web 类型检查通过。
1. **首页作品展示已精简**：首页卡片隐藏平台与标签元数据并移除重复装饰文案；`/projects` 保持完整信息，Web 类型检查与 Lint 无 error。
2. **服务器中转兜底**：用户明确不使用 TURN，新增 `add-p2p-server-relay` OpenSpec 变更。实现直连优先、双方声明后 3 秒启用 Socket.IO 中转，聊天/文件完整性协议保留；类型检查、Lint 和生产构建通过，跨网络中转仍待真实设备验收。

3. **作品展示与后台管理**：公开作品页和首页精选已接入，后台可维护展示字段并关联应用分发；开发库迁移已执行，待录入作品后进行端到端验证。
4. **应用分发与更新接口**：管理端维护应用/版本，公开 latest.json 返回最高 versionCode 对应 HTTPS APK；后续迁移已完成，业务端到端验证待完成。

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
