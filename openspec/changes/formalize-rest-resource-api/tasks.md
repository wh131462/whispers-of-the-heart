## 1. 撰写 spec

- [ ] 1.1 在 `openspec/changes/formalize-rest-resource-api/specs/rest-resource-api/spec.md` 写完所有 ADDED Requirements 与 Scenario
- [ ] 1.2 自检每条 Requirement 都至少有 1 个 Scenario,且 Scenario 用 WHEN/THEN 句式

## 2. 与现有代码核对(发现违规但不修复)

- [ ] 2.1 抽样阅读 `apps/api/src/blog/`、`comment/`、`user/`、`media/`、`site-config/` 五个模块的 controller/service
- [ ] 2.2 在 `design.md` 末尾追加"已知违规清单",列出每个不符合 spec 的具体位置(供后续 change 引用)
- [ ] 2.3 **不修改任何代码**

## 3. 同步 `.ai/` 知识库

- [ ] 3.1 修改 `.ai/4-PATTERNS.md` 的"后端模式"段落:保留代码骨架,行为契约部分改为"详见 spec: rest-resource-api"
- [ ] 3.2 修改 `.ai/0-INDEX.md` 的"已沉淀的 Specs 索引"小节,添加 `rest-resource-api` 条目

## 4. 验证

- [ ] 4.1 用 spec 对照 `blog.service.ts` 走一遍,确保 spec 文字能完全描述其行为
- [ ] 4.2 用 spec 对照 `media.controller.ts` 走一遍,确认非典型资源(文件上传)正确归入 Non-goals,未被错误约束
- [ ] 4.3 让另一个 AI 仅看 spec,尝试推断 `findAll` 端点的响应 JSON 结构,核对是否能逐字段写出

## 5. 归档前检查

- [ ] 5.1 `proposal.md` 字数控制(目前需要时压缩)
- [ ] 5.2 spec 没有任何代码片段(spec 应是行为描述,代码归 `.ai/`)
- [ ] 5.3 运行 openspec 校验(如有 CLI):格式、文件结构、Requirement 引用完整
