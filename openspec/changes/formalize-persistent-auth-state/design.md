## 设计动机

本变更不引入新行为,而是把"持久化认证状态"在生命周期中各个相位的不变量显式化。难点在于:**spec 既要描述外部可观察行为,又不能锁定 Zustand persist 的具体 API**。

## 关键决策

### 决策 1: spec 用"状态机视角",不依赖具体框架

- **选择**: spec 描述五个相位 — `初始未水合 / 水合中 / 已水合未登录 / 已水合已登录 / 登录中 / 刷新中` 各自的可观察标志位
- **理由**: Zustand / Redux / 自实现的 useReducer 都能映射到这套相位
- **后果**: spec 不会因换实现而失效,但实现方需要自行映射相位到框架原语

### 决策 2: token 双副本(persist + localStorage)的事实保留

- **选择**: spec 明确"系统 MUST 保证 persist 中的 `accessToken` 与 `localStorage['auth_token']` 同步",而不是把其中一份消除
- **理由**: 现实 api 拦截器只读 `localStorage`,Zustand persist 在 SSR/水合前不可用;消除双副本需要拦截器重写,超出本 change 范围
- **后果**: 引入了"两份数据必须同步"的强约束,但这是诚实反映现状
- **未来出路**: 如想消除双副本,可单独发起 change(改造 api 拦截器从 store 获取 token)

### 决策 3: `_hasHydrated` 标志位的存在被 spec 化

- **选择**: spec 要求"系统 MUST 暴露一个可被 UI 层观察的'水合完成'布尔标志,且该标志 MUST 在持久化恢复完成后才置为 true"
- **理由**: 路由守卫和首屏渲染都依赖它,如果未来重构丢了,会导致刷新页面后被错误重定向到登录页
- **后果**: 实现 MUST 暴露此标志,但命名 / 实现方式不限

### 决策 4: 失败级联到 `logout`

- **选择**: spec 要求"`refreshAuth` 失败 MUST 触发完整登出(清空所有状态 + 清 localStorage + 清 api header)"
- **理由**: 避免"有 token 但 user 为 null"的悬空状态;这是当前实现的隐式不变量
- **后果**: 实现简单,但要在 spec 中明确写出,防止未来"友善地不登出"重构

### 决策 5: 跨标签页同步暂不强制

- **选择**: spec 用 MAY 标注"跨标签页同步登出"(`storage` 事件监听)
- **理由**: 当前实现没有,贸然要求会构成新功能而非形式化
- **后果**: 留作未来增强,作为单独 change

## 不做的事

- 不锁定 token 存储位置(localStorage vs sessionStorage vs Cookie),只锁定"必须能被 api 拦截器立即读到"
- 不规定 refresh token 是否轮换(那是后端契约)
- 不要求自动刷新(spec 仅描述"请求 refresh 时"的行为,不要求"什么时候自动请求")
