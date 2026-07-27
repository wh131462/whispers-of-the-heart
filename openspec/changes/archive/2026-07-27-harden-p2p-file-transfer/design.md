## Context

文件传输位于 `apps/web/src/apps/p2p-file-transfer/`，通过 `@whispers/hooks` 的 Socket.IO 信令和 WebRTC DataChannel 发送 16 KiB 的 Base64 分块。当前发送端在调用完 `send` 后立即标记完成，接收端在看到 `isLast` 后只检查内存数组，既没有远端确认，也没有内容摘要。`useTrysteroRoom` 在 Socket.IO 重连时只重新加入房间，没有为现有成员重建 PeerConnection，因此重连后的 DataChannel 不可用。

约束是浏览器端点对点传输、服务端不接触文件内容、保持其他 P2P 应用的 ActionSender API 兼容，并且不新增依赖。

## Goals / Non-Goals

**Goals:**

- 定义可版本化且可恢复的 metadata/chunk/progress/finalize/verification 消息流程。
- 让接收端确认的连续分块而非发送端本地发送计数驱动双方进度。
- 用 SHA-256、文件大小和分块完整性确认决定 completed。
- 断线期间保留发送队列和接收分块，重连后重建 DataChannel、协商缺口并幂等重传。
- 让传输 UI 能区分暂停、校验中、失败和已完成。

**Non-Goals:**

- 不引入服务端文件中转、数据库会话或后台 Service Worker。
- 不改变房间发现/鉴权，也不修改 p2p-chat、在线游戏的消息协议。

## Decisions

### 1. 分阶段协议与单一目标 Peer

每个文件使用 `fileId`、`protocolVersion`、`checksum`、`size`、`totalChunks` 标识会话。发送端先发送 metadata；接收端返回接受结果和 `nextChunkIndex`；分块完成后发送端发送 finalize；接收端仅在字节数、分块齐全和 SHA-256 全部匹配时返回 verification success。发送文件时解析一个明确的目标 Peer，避免广播导致多个接收端复用同一 fileId。

考虑过沿用 `isLast` 作为完成信号，但它无法表达缺块和校验失败，因此仅保留为兼容性提示，不作为状态转换依据。

### 2. 连续偏移 ACK + 幂等接收

接收端保留稀疏分块数组和 `nextChunkIndex`（从 0 开始的第一个缺块），重复分块不增加计数。进度消息包含 `receivedChunks`、`receivedBytes` 和 `nextChunkIndex`，发送端按该确认值更新 UI。完成请求缺块时，接收端返回缺口偏移，发送端从偏移续传；摘要不匹配时清空接收缓冲并最多重新尝试两次。

选择连续偏移而不是每次发送完整索引集合，是为了让大文件的控制消息大小保持常量；DataChannel 默认 ordered/reliable，少量乱序或重连重复也能通过稀疏数组处理。

### 3. Web Crypto 校验与完成握手

发送端读取文件后计算 `crypto.subtle.digest('SHA-256', arrayBuffer)`，接收端合并 Blob 后对同一字节序列计算摘要，并校验 `blob.size === metadata.size`。发送端只有收到 verification success 才进入 completed；接收端也只有此时生成可下载 Blob。摘要计算异常进入 failed，不宣称成功。

### 4. 重连与背压

`useTrysteroRoom` 将首次连接和 Socket.IO reconnect 统一为“join + 为返回成员创建 offer”的流程；淘汰的连接关闭后不影响上层传输 refs。文件 Hook 在连接状态恢复或目标 Peer 恢复时重新发送 metadata，接收端识别同一 `fileId` 后直接返回现有进度，不重复询问。分块发送按 DataChannel `bufferedAmount` 高水位等待，并在每批/定时器上发送进度确认，避免仅靠固定延迟。

### 5. 兼容性与错误边界

ActionSender 保持同步调用签名，背压在文件 Hook 中通过小批量和等待实现；已有 Action 使用不受影响。对缺失目标、拒绝、超时、校验失败和重连失败均写入 `error`，并保留可重试的发送/接收会话直到用户移除或重置。

## Risks / Trade-offs

- [Risk] Base64 和完整 ArrayBuffer 会占用约 1.33 倍传输内存。→ 保持现有兼容实现，限制单文件会话数量；后续可改为 Blob 分块二进制。
- [Risk] 浏览器标签页冻结会延迟 SHA-256 或重连。→ 状态显示 verifying/paused，恢复后继续协商，不提前完成。
- [Risk] 旧客户端不理解新控制消息。→ `protocolVersion` 不匹配时明确失败，不把旧 `isLast` 当作完成。
- [Risk] 摘要不匹配时无法定位单个损坏分块。→ 清空并从 0 重传，最多两次后失败，保证安全优先。

## Migration Plan

仅发布前端/共享 Hook 代码，无数据库迁移。升级期间新旧客户端可能同房间，协议版本检查会让不兼容传输失败并提示用户更新；回滚只需恢复前端构建，服务端信令无需变化。

## Open Questions

- 当前不引入持久化会话；若未来需要刷新页面后恢复，应另立规格并设计 IndexedDB 存储。
