## MODIFIED Requirements

### Requirement: Reconnection resumes from the receiver checkpoint

通道不可用时，双方 MUST 保留未完成会话、发送分块和接收分块，显示 paused。Socket.IO 重连后 MUST 恢复直连协商和中转能力；目标有任一可用通道后 MUST 重发 metadata、协商 checkpoint，并仅补发缺失分块。

#### Scenario: Network interruption resumes transfer

- **WHEN** 直连或中转在分块传输中断后恢复
- **THEN** 从接收端首个缺失分块续传，并经过 finalize/verification 完成

#### Scenario: Reconnect has no completed peer

- **WHEN** 重连后目标 Peer 尚未恢复
- **THEN** 会话保持 paused，保留队列，不宣称完成

### Requirement: Multi-peer rooms use an explicit ready receiver

多个远端 Peer 时，发送端 MUST 要求用户显式选择一个具有直连或中转通道的接收方，文件只绑定该 Peer。发送端 MUST NOT 隐式选择首个成员或广播文件。只有一个远端 Peer 时 MAY 自动选择。

#### Scenario: Multiple peers are ready

- **WHEN** 有两个或以上远端 Peer，且至少一个通道可用
- **THEN** 用户选择可用接收方后才允许发送，文件只发给该 Peer

#### Scenario: Selected peer becomes unavailable

- **WHEN** 已选接收方离开或所有通道均不可用
- **THEN** 清除选择并禁止新文件发送，直连切换为中转不视为离线

### Requirement: Direct ICE negotiation is bounded and diagnosable

客户端 MUST 使用公开 STUN 尝试直连，不依赖 TURN。直连失败或超时 SHALL 最多重建两次；3 秒后双方中转能力可用时 MUST 允许服务器中转，不等待 ICE 重试耗尽。仅全部通道不可用时展示传输不可用并保留会话。

#### Scenario: Direct connection succeeds

- **WHEN** 直连候选可用
- **THEN** 使用加密 WebRTC DataChannel 传输

#### Scenario: Direct connection remains blocked

- **WHEN** 直连重试耗尽但中转可用
- **THEN** 停止重复创建 PeerConnection，继续中转，保留长度与 SHA-256 校验
