## 1. 撰写 spec

- [ ] 1.1 在 `openspec/changes/formalize-persistent-auth-state/specs/persistent-auth-state/spec.md` 撰写所有 ADDED Requirements 与 Scenario
- [ ] 1.2 自检 spec 不依赖任何具体框架名称(不出现 Zustand / persist 字样,只出现行为契约)

## 2. 与现有实现核对(不修复)

- [ ] 2.1 对照 `apps/web/src/stores/useAuthStore.ts` 完整阅读一遍 spec
- [ ] 2.2 在 `design.md` 末尾追加"已知违规清单"(若有);例如 hardcoded `localStorage.getItem('auth_token')` 出现在多个地方
- [ ] 2.3 **不修改任何代码**

## 3. 同步 `.ai/` 知识库

- [ ] 3.1 修改 `.ai/4-PATTERNS.md` 的"模式 2: Zustand Store (持久化)":保留代码骨架,但加入提示"涉及认证状态时,行为契约由 spec: persistent-auth-state 强约束"
- [ ] 3.2 修改 `.ai/0-INDEX.md` 的"已沉淀的 Specs 索引"小节,添加 `persistent-auth-state` 条目

## 4. 验证

- [ ] 4.1 用 spec 走读 `login` / `logout` / `refreshAuth` 三条流程,确保每步外部可观察行为都对应到一条 Requirement
- [ ] 4.2 用 spec 走读"刷新页面 → 水合 → 路由守卫读取 isAuthenticated"的时序,确保 `_hasHydrated` 的语义被正确捕获
- [ ] 4.3 模拟"refresh token 过期"的场景,确认 spec 中"失败级联 logout"的 Scenario 准确

## 5. 归档前检查

- [ ] 5.1 spec 不含任何代码片段
- [ ] 5.2 spec 不依赖具体技术(不出现"Zustand"、"localStorage" 之外的实现细节)。**注**: `localStorage` 出现是因为 api 拦截器的现实耦合,在设计决策 2 中已说明,保留
- [ ] 5.3 运行 openspec 校验(如有 CLI)
