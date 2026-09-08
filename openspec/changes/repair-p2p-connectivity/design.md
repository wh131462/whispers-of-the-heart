## Context

聊天、文件、五子棋、黑白棋、史莱姆足球和斗地主共用 `useTrysteroRoom`。Socket.IO 负责成员与信令；聊天/文件协议只用 DataChannel，游戏控制消息允许信令回退。

## Goals / Non-Goals

恢复首次连接、单端与双端重连、成员初始化及游戏角色恢复；支持部署方提供的 TURN。沿用既有 SHA-256、ACK 和续传协议，不部署 TURN 或实现房主迁移。

## Decisions

- 保留 peerId 稳定排序选定发起方；每次重建赋予 connectionId，服务端用 socketId 标识成员 sessionId，过滤旧信令和旧断开回调。
- 每个 Peer 串行处理 SDP/candidate；候选先到时按 connectionId 缓存。失败或协商超时后双方使用新连接重试，避免单侧替换 SCTP 导致旧 DataChannel 假就绪。每次故障最多两次重试。
- 加入 ACK 校验当前 Socket 及重连代次；离房清理计时器、回调与消息缓存。注册成员监听时回放当前成员。
- 游戏广播遍历房间成员，注册 handler 后异步投递早到消息。通用游戏重连保留可用角色；斗地主仅首次显式入房选房主，恢复时请求座位/手牌快照。
- 默认 STUN 追加可选 TURN 候选，使用浏览器默认 ICE 策略。通过 Web 构建变量接入现有外部 TURN，避免新增后端凭证服务或基础设施依赖。

## Risks / Trade-offs

- 没有 TURN 或中继不可用 → 仍无法保证受限网络连通，展示失败并保留传输队列。
- VITE 配置客户端可见 → 只允许使用可分发的 TURN 凭证，不写入管理密钥；额度/过期管理由服务提供方承担。
- 信令房间为单实例内存 → 多副本部署需另外处理房间共享与 sticky session。
- 斗地主房主页面关闭后内存牌局丢失 → 本次只恢复原页面会话内断线，不新增房主迁移。

## Migration Plan

先更新 API，再发布 Web；新增会话字段允许旧客户端省略。需要中继时按 `configs/CICD-CONFIG-GUIDE.md` 注入 Web 构建变量并重新构建。回退时一起回退 API/Web 镜像，无数据库迁移。

## Open Questions

生产可用 TURN 地址/凭证及真实跨网络验证尚待部署方提供。
