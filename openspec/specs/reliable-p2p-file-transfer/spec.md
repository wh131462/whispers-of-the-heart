# reliable-p2p-file-transfer Specification

## Purpose

TBD - created by archiving change harden-p2p-file-transfer. Update Purpose after archive.

## Requirements

### Requirement: Transfer metadata establishes an integrity-bound session

每个文件传输会话 MUST 使用唯一 `fileId`，并在元数据中携带协议版本、文件名、MIME 类型、字节大小、分块大小、总分块数、发送方名称和 SHA-256 摘要。发送端 MUST 将文件分块数与字节大小保持一致，接收端 MUST 拒绝缺少摘要、大小不匹配或不支持的协议版本。

#### Scenario: Receiver accepts valid metadata

- **WHEN** 接收端收到支持版本且字段自洽的 metadata
- **THEN** 接收端创建或恢复对应会话，并返回 accepted 与当前第一个缺失分块偏移

#### Scenario: Receiver rejects invalid metadata

- **WHEN** metadata 缺少 checksum、size 为负数、totalChunks 与 size 不一致或协议版本不支持
- **THEN** 接收端不创建可下载缓冲区，返回 rejected 及可展示的原因

### Requirement: Receiver-confirmed progress drives transfer state

接收端 MUST 对每个新分块按 `chunkIndex` 幂等存储，并计算已收分块、已收字节和第一个缺失分块。进度确认 MUST 定期发送或在发送端请求时发送；发送端 MUST 使用接收端确认值更新进度，不得仅因本地 `send()` 返回就标记完成。

#### Scenario: Duplicate chunk is harmless

- **WHEN** 接收端收到已存储过的 chunkIndex
- **THEN** 接收端不重复计算字节数，并返回不倒退的进度

#### Scenario: Missing chunk is reported

- **WHEN** 接收端收到末块提示但仍有任意分块缺失
- **THEN** 接收端保持 transferring/paused，返回第一个缺失偏移，且不得生成 completed 文件

### Requirement: Completion requires finalize and cryptographic verification

发送端 MUST 在所有分块已发送后发送 finalize；接收端 MUST 在 finalize 时确认所有分块齐全、合并字节数等于 metadata.size，并对完整字节序列计算 SHA-256。只有摘要完全匹配时接收端才生成 Blob 并返回 verification success；发送端只有收到该 success 才能将会话标记为 completed。

#### Scenario: Valid file completes

- **WHEN** finalize 到达且分块齐全、大小和 SHA-256 均匹配
- **THEN** 接收端返回 success 并提供可下载 Blob，发送端显示 100% completed

#### Scenario: Corrupted or truncated file never completes

- **WHEN** finalize 到达但分块缺失、大小不符或 SHA-256 不匹配
- **THEN** 接收端返回 failure 及恢复偏移，双方保持可恢复状态，发送端不得显示 completed

### Requirement: Reconnection resumes from the receiver checkpoint

断开或连接状态不可用时，双方 MUST 保留未完成会话、发送分块和接收端已收分块，并将状态显示为 paused。Socket.IO 重连后 MUST 重建到房间成员的 PeerConnection/DataChannel；发送端 MUST 重新发送 metadata，接收端 MUST 用已有 checkpoint 响应而不重复询问，随后仅补发缺失分块。

#### Scenario: Network interruption resumes transfer

- **WHEN** 分块传输中 DataChannel 或信令连接中断后恢复
- **THEN** 会话恢复为 transferring，从接收端报告的第一个缺失分块继续，并最终经过 finalize/verification 完成

#### Scenario: Reconnect has no completed peer

- **WHEN** 重连后目标 Peer 尚未恢复
- **THEN** 会话保持 paused，发送端不丢弃队列也不宣称完成，直到 Peer 恢复或用户移除会话

### Requirement: Safe flow control and bounded retry

分块发送 MUST 在 DataChannel 缓冲量达到高水位时等待 drain，并以固定批次/时间间隔让接收端确认进度。摘要校验失败 MUST 清空接收缓冲并从 0 重新传输，自动重试次数 MUST 有上限；拒绝、超时、版本不兼容或超过重试上限 MUST 显示明确失败原因。

#### Scenario: Backpressure prevents uncontrolled buffering

- **WHEN** DataChannel bufferedAmount 超过发送高水位
- **THEN** 发送循环暂停，待 bufferedAmount 降至低水位或连接恢复后继续

#### Scenario: Retry limit is enforced

- **WHEN** 同一文件摘要校验连续失败达到最大重试次数
- **THEN** 双方将会话标记为 failed，保留错误原因且不提供下载 Blob

### Requirement: Multi-peer rooms use an explicit ready receiver

房间存在多个远端 Peer 时，发送端 MUST 要求用户显式选择一个 DataChannel 已就绪的接收方，并将本次文件会话只绑定到该 Peer。发送端 MUST NOT 隐式选择成员集合中的第一个 Peer，也不得默认向所有成员广播文件。房间仅有一个远端 Peer 时 MAY 自动选择该已就绪 Peer。

#### Scenario: Multiple peers are ready

- **WHEN** 房间中有两个或以上远端 Peer 且至少一个 DataChannel 已就绪
- **THEN** 上传入口保持禁用直到用户选择一个已就绪接收方，随后文件只发送给该 Peer

#### Scenario: Selected peer becomes unavailable

- **WHEN** 已选择的接收方离开房间或其 DataChannel 断开
- **THEN** 发送端清除当前选择、禁止新文件发送，并要求用户重新选择可用接收方

### Requirement: Direct ICE negotiation is bounded and diagnosable

客户端 MUST 只使用公开 STUN 候选尝试直连，不依赖 TURN 中继或额外凭证服务。ICE 首次失败时发起方 MUST 进行有限次数的 ICE restart；重试仍失败后 MUST 清理失效 PeerConnection、保留聊天/文件会话队列，并展示“直连失败”的可诊断状态，不得无限创建连接或把数据回退到信令服务器。

#### Scenario: Direct connection succeeds

- **WHEN** 双方已完成信令交换且至少一个 STUN 候选对可以连通
- **THEN** WebRTC 建立加密 DataChannel，聊天和文件协议继续通过该通道工作

#### Scenario: Direct connection remains blocked

- **WHEN** 双方完成有限 ICE restart 后所有 STUN 候选对仍无法连通
- **THEN** 系统停止重复创建 PeerConnection，显示直连失败；未完成的聊天/文件会话保留为可恢复状态
