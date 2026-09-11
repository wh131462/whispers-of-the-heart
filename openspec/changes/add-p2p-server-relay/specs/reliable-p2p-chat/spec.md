## RENAMED Requirements

- FROM: `### Requirement: DataChannel-only chat payloads`
- TO: `### Requirement: Verified chat payload transport`

## MODIFIED Requirements

### Requirement: Verified chat payload transport

系统 MUST 优先使用 WebRTC DataChannel 发送聊天元数据、正文分块、进度和校验消息；直连不可用时 SHALL 使用已协商且有接收确认的服务器中转。所有通道 MUST 保留字节长度、SHA-256 和最终送达确认。

#### Scenario: DataChannel is unavailable

- **WHEN** DataChannel 尚未打开或已关闭，但双方支持且能够使用中转
- **THEN** 通过服务器中转恢复消息传输；中转不可用时保留待发送会话，不宣称送达

### Requirement: Resumable in-memory message sessions

系统 SHALL 在非主动断线期间保留未完成的发送和接收会话，并在目标直连或中转恢复后通过元数据协商接收进度，从首个缺失分块继续传输。

#### Scenario: Connection recovers during a message

- **WHEN** 消息传输中断后，同一 Peer 的可用通道在页面会话内恢复
- **THEN** 接收端返回已接收进度，从首个缺失分块续传，重复分块不得重复累计

#### Scenario: Verification response is lost

- **WHEN** 接收端已校验并展示消息，但发送端未收到成功校验结果
- **THEN** 接收端在后续进度查询和完成请求中再次返回成功结果，不得重复展示
