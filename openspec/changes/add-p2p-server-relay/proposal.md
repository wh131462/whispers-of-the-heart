## Why

聊天和文件在无法建立 WebRTC 直连时不可用。用户明确不要 TURN，选择复用现有服务器兜底；文件完整性与是否直连无关，继续遵循现有校验和续传契约。

## What Changes

- 直连优先，等待 3 秒后允许通过现有 Socket.IO 转发；双方和服务端必须声明支持新协议。
- 独立的有确认中继事件，限制消息大小、并发和发送速率，按房间及 Socket 会话隔离。
- 聊天/文件使用统一可用通道判断，保留 SHA-256、最终确认和页面内续传。
- 界面显示直连/服务器中转，修正无需服务器和全程端到端加密文案。
- 移除 TURN 构建配置，替代 `repair-p2p-connectivity` 中待执行的 TURN 验收。

## Capabilities

### New Capabilities

- `p2p-server-relay`: 有界、按会话隔离的服务器转发和传输方式展示。

### Modified Capabilities

- `reliable-p2p-chat`: 允许已协商的服务器转发，保留校验与送达语义。
- `reliable-p2p-file-transfer`: 可用接收方和恢复条件同时覆盖直连与服务器中转。

## Impact

共享 Hooks、API SignalingGateway、聊天/文件 Hooks 与界面、前端构建配置。不新增依赖、数据库或域名。遵循 `.ai/3-CODING-RULES.md`。

## Non-goals

不部署 TURN、不新增应用层端到端加密、不修改游戏业务协议、不部署生产环境。
