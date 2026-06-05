## ADDED Requirements

### Requirement: 持久化状态字段

系统 MUST 暴露以下"认证状态"字段供 UI 层观察,且字段语义 MUST 与本节描述完全一致:

- `user`: 当前已登录用户对象或 `null`
- `accessToken`: 当前 JWT access token 或 `null`
- `refreshToken`: 当前 refresh token 或 `null`
- `isAuthenticated`: 布尔标志,**当且仅当** `accessToken !== null && user !== null` 时为 `true`
- `isLoading`: 布尔标志,**当且仅当**正在进行登录、刷新等异步操作时为 `true`
- `hasHydrated`: 布尔标志,**当且仅当**持久化层完成读取并已应用到内存状态时为 `true`(命名可不同,但语义必须如此)

#### Scenario: 默认初始值

- **WHEN** 应用首次启动(用户从未登录,无任何持久化数据)
- **THEN** 系统 MUST 处于 `user=null, accessToken=null, refreshToken=null, isAuthenticated=false, isLoading=false, hasHydrated=true` 状态

#### Scenario: 持久化恢复完成前

- **WHEN** 应用刚启动且持久化层尚未完成读取
- **THEN** 系统 MUST 处于 `hasHydrated=false`;此时 `user / accessToken / refreshToken` 的值 MAY 为初始 `null`,UI 层 MUST 据此推迟所有依赖认证态的渲染或路由跳转

### Requirement: 持久化范围

系统 MUST 将 `user / accessToken / refreshToken / isAuthenticated` 四个字段持久化到客户端持久存储;**MUST NOT** 持久化 `isLoading / hasHydrated`。

#### Scenario: 刷新页面后状态恢复

- **WHEN** 已登录用户刷新页面
- **THEN** 持久化层 MUST 在水合阶段恢复 `user / accessToken / refreshToken / isAuthenticated`,并最终把 `hasHydrated` 置为 `true`

#### Scenario: 临时状态不被持久化

- **WHEN** `isLoading` 在登录过程中变为 `true`
- **THEN** 即使用户在该瞬间刷新页面,下次启动后 `isLoading` MUST 是 `false`(初始值)

### Requirement: Token 与 HTTP 拦截器同步

只要 `accessToken` 非空,**HTTP 客户端必须立即可读取到该 token 并附加到后续请求的 `Authorization` 头**。系统 MUST 在以下三个时刻同步 token 到 HTTP 客户端:

1. 登录成功后
2. 刷新 token 成功后
3. 水合阶段恢复出非空 `accessToken` 时

同样,在 `accessToken` 被清空(登出 / 刷新失败)时,HTTP 客户端 MUST 立即移除 `Authorization` 头。

#### Scenario: 登录后第一个请求自动带 token

- **WHEN** 用户登录成功,且立即发起一个需要认证的 API 请求
- **THEN** 该请求 MUST 在 `Authorization` 头中携带新获得的 `accessToken`

#### Scenario: 刷新页面后第一个请求自动带 token

- **WHEN** 已登录用户刷新页面,水合完成后立即发起一个需要认证的 API 请求
- **THEN** 该请求 MUST 携带恢复出的 `accessToken`,**不得**因 Zustand persist 与 axios 拦截器的时序问题导致首个请求未带 token

#### Scenario: 登出后请求不再带 token

- **WHEN** 用户执行登出,随后立即发起任意 API 请求
- **THEN** 该请求 MUST NOT 携带任何 `Authorization` 头

### Requirement: 登录流程

`login(identifier, password)` 操作 MUST 满足以下行为契约:

#### Scenario: 登录开始

- **WHEN** `login` 被调用
- **THEN** 系统 MUST 立即把 `isLoading` 置为 `true`

#### Scenario: 登录成功

- **WHEN** 后端返回成功响应且包含 `accessToken`、`refreshToken`、`user`
- **THEN** 系统 MUST 一次性把 `user / accessToken / refreshToken` 写入状态,`isAuthenticated` 自动为 `true`,`isLoading` 置为 `false`,token 同步到 HTTP 客户端,并把结果以 `true` 返回给调用方

#### Scenario: 登录失败

- **WHEN** 后端返回非成功响应,或网络异常
- **THEN** 系统 MUST 保持 `user / accessToken / refreshToken` 为 `null`,`isLoading` 置为 `false`,并以 `false` 返回给调用方;**不得**抛出未捕获的异常

#### Scenario: identifier 自动识别为邮箱

- **WHEN** `identifier` 包含 `@` 字符
- **THEN** 系统 MUST 以邮箱字段提交,否则以用户名字段提交;此识别 MUST 在前端完成,不依赖后端容错

### Requirement: 登出流程

`logout()` 操作 MUST 是**幂等**的,且 MUST 把所有认证相关状态恢复到"未登录"。

#### Scenario: 主动登出

- **WHEN** `logout` 被调用
- **THEN** 系统 MUST 把 `user / accessToken / refreshToken` 置为 `null`,`isAuthenticated` 自动为 `false`,清理持久化存储中对应字段,移除 HTTP 客户端的 `Authorization` 头

#### Scenario: 重复登出无副作用

- **WHEN** `logout` 在已登出的状态下被再次调用
- **THEN** 系统 MUST 不抛出异常,状态 MUST 保持未登录

#### Scenario: 登出不需要等待后端

- **WHEN** `logout` 被调用
- **THEN** 系统 MUST 立即完成本地状态清理(同步返回);对后端的"通知登出"请求 MAY 异步发起但 MUST NOT 阻塞本地清理

### Requirement: 刷新流程

`refreshAuth()` 操作 MUST 满足:

#### Scenario: 无 refresh token 直接失败

- **WHEN** `refreshAuth` 被调用且当前 `refreshToken` 为 `null`
- **THEN** 系统 MUST 直接以 `false` 返回,**不**发起网络请求,**不**触发登出

#### Scenario: 刷新成功

- **WHEN** 后端返回成功响应并携带新的 `accessToken` (以及可能轮换的 `refreshToken`、最新 `user`)
- **THEN** 系统 MUST 更新 `user / accessToken / refreshToken`,同步 token 到 HTTP 客户端,并以 `true` 返回

#### Scenario: 刷新失败级联登出

- **WHEN** 后端返回非成功响应,或网络异常
- **THEN** 系统 MUST 调用 `logout()` 把所有状态清空,并以 `false` 返回。**不得**保留"有 token 但 user 为 null"的悬空状态

### Requirement: 水合标志的不可逆性

`hasHydrated` 一旦置为 `true`,在当前会话内 MUST NOT 再次变回 `false`(即使后续登出)。该标志反映"持久化层是否已读完",与登录状态正交。

#### Scenario: 登出不影响水合标志

- **WHEN** 用户在 `hasHydrated=true` 状态下登出
- **THEN** `hasHydrated` MUST 保持 `true`

#### Scenario: 重新登录不重置水合标志

- **WHEN** 用户登出后再次登录
- **THEN** `hasHydrated` MUST 保持 `true`

### Requirement: UI 层依赖契约

UI 层(路由守卫、首屏渲染)在判断"是否已登录"时 MUST 同时检查 `hasHydrated && isAuthenticated`;**不得**仅检查 `isAuthenticated`。

#### Scenario: 受保护路由的守卫逻辑

- **WHEN** 用户访问需要登录的路由
- **THEN** 守卫 MUST 满足:
  1. 若 `hasHydrated === false`:渲染加载占位,**不**重定向
  2. 若 `hasHydrated === true && isAuthenticated === true`:渲染目标页
  3. 若 `hasHydrated === true && isAuthenticated === false`:重定向到登录页

#### Scenario: 首屏闪烁规避

- **WHEN** 已登录用户刷新一个受保护页面
- **THEN** 用户 MUST NOT 在水合期间看到"未登录占位/登录页"再被换回原页;UI MUST 在 `hasHydrated=false` 期间显示中性加载态

### Requirement: 错误隔离

任何 `login / logout / refreshAuth` 内部的异常(网络、序列化、持久化失败)MUST NOT 把状态对象损坏;失败时 MUST 收敛到一个**明确定义**的状态(参见各操作的"失败" Scenario)。

#### Scenario: 网络异常处理

- **WHEN** `login` 或 `refreshAuth` 过程中发生网络异常
- **THEN** 系统 MUST 在 catch 中恢复 `isLoading=false`,**不得**让 `isLoading` 永久卡在 `true`

#### Scenario: 持久化写入失败

- **WHEN** 持久化层写入失败(如 localStorage quota 已满)
- **THEN** 内存中的状态变更 MUST 仍然生效;系统 MAY 在控制台记录警告,但 MUST NOT 把错误抛回调用方
