## MODIFIED Requirements

### Requirement: Direct ICE negotiation is bounded and diagnosable

客户端 MUST 默认使用公开 STUN 候选，并支持部署方追加 TURN 中继候选。首次协商失败或超时后，发起方 MUST 进行最多两次连接重建；重试仍失败后 MUST 清理失效 PeerConnection、保留聊天/文件会话队列并展示可诊断失败，不得无限创建连接或把聊天/文件内容回退到信令服务器。

#### Scenario: Direct connection succeeds

- **WHEN** 双方已完成信令交换且至少一个直连候选对可以连通
- **THEN** WebRTC 建立加密 DataChannel，聊天和文件协议继续通过该通道工作

#### Scenario: Direct connection remains blocked

- **WHEN** 双方完成有限重试后所有已配置候选对仍无法连通
- **THEN** 系统停止重复创建 PeerConnection 并显示连接失败；未完成的聊天/文件会话保留为可恢复状态

#### Scenario: TURN relay is configured

- **WHEN** 直连受限且配置了可用的 TURN 地址和客户端凭证
- **THEN** 浏览器可以通过中继候选建立 DataChannel，内容仍经 WebRTC 加密传输

## ADDED Requirements

### Requirement: Reconnection signals belong to the active session

系统 MUST 按当前 Socket 会话和连接 ID 处理信令，旧 Socket 离开不得删除替代它的新成员。SDP 与候选 SHALL 按 Peer 串行处理，候选可提前缓存但不得混入其他连接轮次。

#### Scenario: Old socket disconnects after replacement

- **WHEN** 同一 peerId 已由新 Socket 加入而旧 Socket 稍后离开
- **THEN** 新 Socket 保持房间成员身份并可继续交换信令

#### Scenario: Either peer reconnects

- **WHEN** 发起方或接收方的信令连接恢复
- **THEN** 双方为当前会话重新建立 DataChannel，旧连接回调不得覆盖新连接就绪状态

#### Scenario: WebSocket transport is unavailable

- **WHEN** WebSocket 连接被代理拒绝但 HTTP polling 可用
- **THEN** 客户端回退到 polling 完成加入房间和信令交换
