## ADDED Requirements

### Requirement: Negotiated bounded relay

系统 MUST 仅在服务端和双方声明中转版本后，将等待直连超过 3 秒的 Peer 视为可中转。系统 SHALL 优先使用已打开的 DataChannel；中转 MUST 按 Peer 有界排队、等待接收确认、有限重试，禁止离线无限缓存。

#### Scenario: Direct connection is unavailable

- **WHEN** 双方入房且支持中转，3 秒后 DataChannel 仍不可用
- **THEN** 聊天与文件允许通过服务器传输，不依赖 TURN

#### Scenario: Legacy receiver

- **WHEN** 对方未声明中转协议
- **THEN** 仅在 DataChannel 打开后允许发送

### Requirement: Relay isolation and resource limits

服务端 MUST 校验来源房间及当前 Socket、目标 sessionId 和双方中转能力。每包 MUST 不超过 32 KiB，每 Socket 在途转发 MUST 不超过 8 个，转发速率 MUST 不超过 2 MiB/s；接收端未确认或目标不可写时 MUST 返回失败。服务器 MUST 不持久化内容。

#### Scenario: Stale or cross-room target

- **WHEN** 客户端向其他房间或已被替换的 Socket 会话发送中转包
- **THEN** 服务端拒绝转发

#### Scenario: Resource limit exceeded

- **WHEN** 包大小、并发或速率超过限制
- **THEN** 服务端拒绝该包，客户端有限重试或暂停，不标记业务完成

### Requirement: Accurate transport disclosure

界面 MUST 区分入房和传输可用，并展示直连或服务器中转。帮助 MUST 说明中转内容经过业务服务器且没有应用层端到端加密。

#### Scenario: Relay active

- **WHEN** 使用服务器中转
- **THEN** UI 显示服务器中转，不能声称内容不经过服务器
