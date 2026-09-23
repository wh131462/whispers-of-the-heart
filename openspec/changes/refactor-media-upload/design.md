## Context

服务端媒体目前由 NestJS `MediaController` 写入本地 `uploads` 目录并由 `MediaService` 建立媒体记录；前端多个页面和两个选择器各自实现列表、上传和筛选，BlockNote 编辑器还直接使用 `fetch`。现有 `/media/upload`、`/media/upload/multiple` 路径和数据库模型已经被生产功能使用，因此本次采用兼容式重构，不改变存储位置和媒体记录结构。

## Goals / Non-Goals

**Goals:**

- 在 `@whispers/utils` 提供唯一的媒体 API 封装和共享类型。
- 将前端服务端媒体选择收敛为一个 Web 侧弹窗，并统一返回完整媒体对象。
- 统一 `type` 查询参数、上传用途、前端错误处理和后端 MIME/大小校验。
- 让编辑器通过注入函数上传，保留粘贴图片和块插入行为。
- 覆盖头像、Logo、封面、作品/友链图片、评论和文章编辑器、媒体库。

**Non-Goals:**

- 不改 P2P 文件传输、Base64 编码器或播放器的本地文件选择。
- 不迁移 MinIO，不做分片、断点续传、裁剪、队列或新的数据库模型。

## Decisions

1. **共享 API 放在 `@whispers/utils`，而不是新建 React Hook。**
   页面和共享 UI 都能使用纯 TypeScript API；状态（loading、选择、toast）仍属于调用组件。这样避免为一次请求再引入全局状态。

2. **保留 `/media/upload`，增加可选 `purpose`，并兼容旧请求。**
   现有客户端无需同时切换接口；后端按用途执行头像/Logo/封面/编辑器/媒体库的类型和大小策略，未传用途时使用媒体库默认策略。

3. **以现有管理端 `MediaPickerDialog` 为基础，迁移到 `components/media`。**
   它已经具备分页、搜索、预览和文档分组；删除 `packages/ui` 中重复的业务型 `MediaPicker`，避免共享包反向依赖 Web toast 或 API。

4. **统一选择结果为 `MediaItem`。**
   回调携带 `url`、原始文件名、大小、MIME、缩略图和创建时间，页面需要 URL 时直接读取字段；编辑器再转换成已有 `MediaSelectResult`，保持编辑器公共接口稳定。

5. **后端以 MIME 前缀处理筛选，兼容 `mimeType` 一段时间。**
   新客户端只发送 `type`；服务端若收到旧 `mimeType` 则映射到同一过滤逻辑，避免发布期间旧页面失效。

6. **上传请求不手动设置 multipart `Content-Type`。**
   共享 API 传递 `FormData` 时让浏览器生成 boundary；认证沿用现有 `api` 客户端 token 刷新机制。

## Risks / Trade-offs

- [旧调用仍发送 `mimeType`] → 后端兼容读取并增加 API/前端回归检查，迁移完成后再清理兼容分支。
- [统一弹窗迁移遗漏入口] → 以全仓 `api.post('/media/upload')`、`DEFAULT_UPLOAD_ENDPOINT`、`MediaPicker` 和隐藏 file input 搜索作为完成门槛。
- [用途校验阻塞原有文件] → 未传用途保留当前 50 MB 白名单；前端用途限制只增强体验，后端继续强制校验。
- [选择弹窗在小屏预览撑开] → 移动端预览改为可折叠/底部区域，并做 Web 构建与手动页面检查。

## Migration Plan

1. 先新增共享类型/API，并让现有调用继续可编译。
2. 迁移列表和上传入口，再迁移统一选择弹窗。
3. 迁移编辑器注入上传函数和所有头像/封面页面。
4. 删除旧 `MediaPicker` 和重复上传代码，保留后端兼容参数。
5. 执行类型、Lint、构建、API 测试和真实上传回归；任一步失败时可回滚前端迁移，后端接口保持向后兼容。

## Open Questions

- 当前媒体 hash 是全局唯一；本次不改变跨用户重复文件复用行为，后续如需隔离应单独提案。
- 线上真实浏览器是否可用由当前环境决定；不可用时以 API multipart 回归和构建静态验证为准，并明确记录边界。
