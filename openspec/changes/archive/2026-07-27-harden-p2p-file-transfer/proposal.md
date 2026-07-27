## Why

当前 P2P 文件传输把发送端“最后一个分块已发出”误当作接收端“文件已完成”，接收端可能在缺块、截断或数据损坏时仍显示成功。断网后现有内存缓冲也没有向对端声明已收偏移，重连只能重新开始或停在错误状态，无法保证文件完整性与可恢复性。

## What Changes

- 引入带协议版本、文件大小、分块数和 SHA-256 摘要的传输元数据。
- 将接收确认、分块进度、发送结束、接收校验结果拆分为明确的协议阶段。
- 以接收端已确认的连续分块和最终摘要校验作为唯一完成条件；校验失败时拒绝完成并触发有限重试。
- 在断线/重连期间保留传输会话和已收分块，重新协商缺失偏移，实现断点续传和重复分块幂等处理。
- 对 DataChannel 分块发送增加背压等待与接收端进度确认，避免发送端内存/缓冲区过载。
- 在传输列表中显示暂停、校验中、已确认完成和失败原因，避免误导用户。

## Capabilities

### New Capabilities

- `reliable-p2p-file-transfer`: 定义 P2P 文件传输的分阶段协议、进度确认、完整性校验、断点续传和完成语义。

### Modified Capabilities

<!-- 当前 openspec/specs/ 没有 P2P 文件传输规格，因此无既有能力需要修改。 -->

## Impact

- `apps/web/src/apps/p2p-file-transfer/` 的类型、传输 Hook、传输列表 UI。
- `packages/hooks/src/useTrysteroRoom.ts` 的信令重连后 Peer/DataChannel 重建逻辑。
- 不新增后端 API 或依赖；沿用现有 Socket.IO 信令和 WebRTC DataChannel。
- 浏览器端使用 Web Crypto API 计算 SHA-256；不上传文件内容到服务端。

## Non-goals

- 不实现服务端中转、云端持久化或跨浏览器后台下载。
- 不改变现有房间码、信令路径和其他 P2P 应用的业务消息格式。
