## Why

`apps/web/src/stores/useAuthStore.ts` 已稳定运行,但它把多个**领域不变量**藏在实现里:

1. `accessToken` 同时存在于 Zustand persist 和 `localStorage['auth_token']`,且必须保持同步(api 拦截器只读 `localStorage`)
2. 页面刷新后存在一段"已水合但还未应用 token"的窗口期,需要 `_hasHydrated` 标志位防止路由守卫误判
3. `refreshAuth` 失败必须级联调用 `logout()`,否则会出现"有 token 但 user 为 null"的不一致状态
4. `partialize` 必须把 `_hasHydrated` 排除,否则下次启动会跳过水合逻辑

这些不变量目前**只能从代码反推**,任何想"再写一个持久化 store"(用户偏好、阅读历史)的人都得重新踩坑。把它们提炼为 `persistent-auth-state` spec,可以:

- 让"持久化认证状态"成为可被引用的领域契约
- 未来若引入新的持久化 store(如 `usePreferencesStore`),其中**与认证耦合的部分**(token、登出清理)受 spec 强约束
- 防止后续重构时无意打破隐式不变量

## What Changes

- 新增 capability `persistent-auth-state`,描述前端"持久化的已登录状态"在整个生命周期(初次加载/登录/刷新/登出/水合/失败回退)中必须满足的行为契约
- spec 不规定具体使用 Zustand / Redux / Jotai(留出未来切换空间),只规定**外部可观察的行为**
- 不修改任何现有代码,仅形式化已有实践
- 在 `.ai/4-PATTERNS.md` 中,把"Zustand Store (持久化)"模式段落改为"代码骨架 + 行为契约链接到 spec"

## Capabilities

### New Capabilities

- `persistent-auth-state`: 前端持久化认证状态(用户对象、access token、refresh token、认证标志、水合标志)在加载、登录、刷新、登出、水合失败、跨标签页同步等场景下必须满足的行为契约

### Modified Capabilities

(无)

## Non-goals

- 不规范登录表单 UI(独立)
- 不规范后端 `/auth/login` `/auth/refresh` 的响应格式(归 `rest-resource-api` spec,或单独 `auth-endpoints` spec)
- 不规范"其他领域"的持久化 store(如阅读偏好);本 spec 仅覆盖**与认证相关**的持久化状态
- 不要求强制使用 HttpOnly Cookie 替代 localStorage(那是独立的安全改造,需独立 change)

## Impact

- 新增 spec:`openspec/specs/persistent-auth-state/spec.md`(归档后产生)
- 修改文件:`.ai/4-PATTERNS.md`(前端模式段落 2 改为引用 spec)、`.ai/0-INDEX.md`("已沉淀的 Specs 索引")
- 现有代码:**零改动**;后续如发现 `useAuthStore` 违反 spec,通过单独 change 修复
- 依赖:无
