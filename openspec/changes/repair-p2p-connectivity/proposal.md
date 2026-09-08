## Why

聊天、文件与游戏共用的 WebRTC 协商会被旧 Socket、旧 SDP 和重连时序干扰。仅有 STUN 也无法覆盖对称 NAT。用户已授权修复全部联机入口并创建 commit。

## What Changes

- 以 Socket 会话和连接 ID 隔离信令，有限重建连接，支持 polling 回退。
- 修复游戏初始成员同步、重连角色及斗地主房主/座位恢复。
- 在默认 STUN 基础上支持配置 TURN，并接通前端构建参数。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `reliable-p2p-file-transfer`：允许可选 TURN 候选，约束重连协商的会话归属与失败状态。

## Impact

影响 `packages/hooks`、API signaling gateway、斗地主 Hook 及 Web 构建配置。继续遵循 `reliable-p2p-chat` 的 DataChannel 内容传输契约及 `.ai/3-CODING-RULES.md`，不新增依赖。

## Non-goals

不部署 TURN、不修改文件/聊天完整性协议、不增加游戏房主迁移。真实跨网络 TURN 验收依赖可用服务和部署配置。
