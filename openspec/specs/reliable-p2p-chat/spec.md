# reliable-p2p-chat Specification

## Purpose

TBD - created by archiving change harden-p2p-chat. Update Purpose after archive.

## Requirements

### Requirement: Verified message delivery

系统 SHALL 在发送前声明消息协议版本、类型、UTF-8 字节长度、分块参数和 SHA-256 摘要，并且 MUST 仅在目标 Peer 返回成功的最终校验结果后将该目标标记为已送达。

#### Scenario: Receiver verifies a complete message

- **WHEN** 接收端已获得所有连续分块，且拼接后的字节长度和 SHA-256 与元数据一致
- **THEN** 接收端展示消息并返回成功校验，发送端将该目标标记为已送达

#### Scenario: Message is incomplete or corrupted

- **WHEN** 接收端缺少任一分块，或最终字节长度、SHA-256 与元数据不一致
- **THEN** 接收端 MUST NOT 展示消息，并返回首个缺失位置或可重试的校验失败结果

### Requirement: DataChannel-only chat payloads

系统 MUST 仅通过已建立的 WebRTC DataChannel 发送聊天元数据、正文分块、进度和校验控制消息，不能将这些消息回退到 Socket.IO 信令服务器。

#### Scenario: DataChannel is unavailable

- **WHEN** 房间信令连接存在但目标 Peer 的 DataChannel 尚未打开或已经关闭
- **THEN** 系统保留待发送会话并显示等待恢复，且不通过信令消息接口转发聊天内容

### Requirement: Backpressure-aware chunk transfer

系统 SHALL 按 UTF-8 字节分块发送消息，并在 DataChannel 缓冲量达到高水位时等待其回落后再继续发送。

#### Scenario: Large image fills the send buffer

- **WHEN** 连续发送图片分块使 DataChannel 缓冲量达到配置的高水位
- **THEN** 发送循环等待低水位事件或连接状态变化，再决定继续或暂停

### Requirement: Resumable in-memory message sessions

系统 SHALL 在非主动断线期间保留未完成的发送和接收会话，并在目标 DataChannel 重建后通过元数据协商接收进度，从首个缺失分块继续传输。

#### Scenario: Connection recovers during a message

- **WHEN** 消息传输中断后，同一 Peer 的 DataChannel 在页面会话内重新建立
- **THEN** 接收端返回已经接收的进度，发送端从首个缺失分块续传，重复分块不得重复累计

#### Scenario: Verification response is lost

- **WHEN** 接收端已校验并展示消息，但发送端未收到成功校验结果
- **THEN** 接收端在后续进度查询和完成请求中再次返回成功结果，且不得重复展示该消息

### Requirement: Peer-isolated protocol validation

系统 MUST 将接收缓存与来源 Peer 绑定，并严格校验协议版本、消息标识、类型、字节长度、分块总数、分块索引和单块长度。

#### Scenario: Chunks with colliding message IDs arrive from different peers

- **WHEN** 多个 Peer 使用相同 `messageId` 发送分块
- **THEN** 系统按来源 Peer 隔离会话，任何 Peer 的分块都不能混入另一个 Peer 的消息

#### Scenario: Invalid metadata or chunk arrives

- **WHEN** 元数据超出限制、字段不一致，或分块越界、长度错误
- **THEN** 系统拒绝或忽略该数据，且不得将其计入接收进度或展示为消息

### Requirement: Bounded session lifetime and retries

系统 SHALL 清理超时的未完成接收缓存，并对摘要失败和最终确认超时采用有限次数重试，超过限制后明确标记失败。

#### Scenario: Sender never completes a message

- **WHEN** 未完成接收会话超过配置的无活动期限
- **THEN** 系统释放对应分块缓存，后续同一元数据按新会话重新协商

#### Scenario: Peer does not return verification

- **WHEN** DataChannel 可用但目标 Peer 在有限次进度查询后仍未返回最终校验
- **THEN** 发送端将该目标标记为失败并允许用户重试

### Requirement: Per-peer delivery status

系统 SHALL 对发送时房间内的每个目标 Peer 独立跟踪进度和校验结果，并在 UI 展示逻辑消息的聚合送达状态。

#### Scenario: All peers verify the message

- **WHEN** 发送时的所有目标 Peer 都返回成功校验
- **THEN** UI 显示“已送达”并释放发送分块队列

#### Scenario: Only some peers verify the message

- **WHEN** 至少一个目标 Peer 已校验成功且至少一个目标明确失败
- **THEN** UI 显示“部分送达”及送达数量，并允许只重试未成功目标

#### Scenario: No peer accepts the message

- **WHEN** 所有目标 Peer 均明确失败或发送时不存在目标 Peer
- **THEN** UI 显示“发送失败”，保留消息内容供用户重试
