## Context

[FallingPattern.tsx](packages/ui/src/components/background/FallingPattern.tsx) 当前实现使用 framer-motion 持续动画 `backgroundPosition` 字符串（36 个值），叠加全屏 `backdrop-filter: blur(0.8em)` 作为视觉柔焦层。此实现在 macOS / 高端独显设备上表现尚可，但在以下环境出现明显卡顿：

- **Windows + Intel UHD/Iris 集显**：ANGLE → D3D11 渲染路径下，blur 滤镜在某些驱动版本会退化到 CPU 路径
- **Windows + 非整数 DPI 缩放（1.25x / 1.5x）**：blur 像素无法整齐对齐，开销进一步放大
- **任何浏览器**：`background-position` 不是合成属性，每帧触发整屏 paint，下层 paint 一变化 backdrop-filter 也跟着重算

调用方 [HomePage.tsx](apps/web/src/pages/HomePage.tsx) 已上线运行，视觉效果是已验证的产品契约，不能改变。

## Goals / Non-Goals

**Goals:**

- 在所有现代浏览器 + 主流设备（含 Windows 集显 + 1.5x DPI）上，Hero 区可见时稳定 60fps
- 保持组件公开 props 接口完全兼容，调用方零改动
- 保持图案、颜色、下落速度、blur 强度、整体观感与现状视觉等价
- 尊重 `prefers-reduced-motion`
- 视口外暂停动画，避免页面其他区域被动消耗 GPU

**Non-Goals:**

- 不替换或重写 backdrop-filter 圆点 mask 层（保留现有实现）
- 不引入 Canvas / WebGL 路径
- 不卸载 `framer-motion` 依赖（其他组件仍在使用）
- 不抽象为"背景动画基类"或建立组件家族

## Decisions

### 决策 1：用 `transform: translate3d` 替代 `background-position` 动画（多层视差实现）

**选择**：将原始 36 个 radial-gradient 按"行"拆分为 12 个独立合成层，每层包含 3 个共享 `background-size`（300px × `sizeY`）的 gradient。每层使用独立的 CSS `@keyframes` 做 `translate3d(0, 0, 0) → translate3d(0, sizeY px, 0)` 循环，`animation-duration = duration / cycles_for_this_row`，其中 `cycles` 是该行在 `duration` 秒内的整数循环次数（从原始 `endPositions - startPositions / sizeY` 推导得到，所有行均为整数，保证全局周期对齐）。

每层 DOM 结构：

- `position: absolute`、`top: -sizeY`、`bottom: -sizeY`、`left/right: 0`（向上下各延伸一个 tile 以避免位移露白）
- `background-repeat: repeat`（默认值）让 pattern 在垂直方向无缝拼接
- 位移恰为一个 tile 高度 → 循环边界与 pattern 平铺边界对齐 → 无缝

**为什么不是单层 `translate(0, -50%)`**：原始 36 个 gradient 不仅图案不同、**`background-size` 不同（134-299 px）、移动距离不同（5000-18000 px）**，导致每行视觉下落速度差异最大约 3 倍。这是该效果的视差核心。单一 transform 动画会丢失视差，违反 spec "视觉契约保持不变"。多层方案是 transform 化路径下唯一能完整保留视觉契约的实现。

**理由**：

- `transform` 是合成属性，浏览器在独立合成层上做矩阵变换，**零 paint、零 layout、零主线程参与**
- 每层独立合成不会显著放大 GPU 内存压力（12 个矩形纹理，远小于一次 backdrop-filter 全屏模糊）
- 全局周期对齐（所有 cycles 均为整数）保证 `duration` 秒后所有层同时回到初始相位，与原实现行为等价

**备选**：

- ❌ 单层 transform：丢失视差，违反视觉 spec
- ❌ Web Animations API + JS 控制：仍然引入主线程参与，无收益
- ❌ Canvas 渲染：改动量大、视觉一致性难保证、调用方契约破坏

### 决策 2：用 CSS `@keyframes` 而非 framer-motion 驱动

**选择**：动画通过纯 CSS `@keyframes` 实现，组件内通过 `<style>` 注入或 Tailwind/inline style 实现。

**理由**：

- 纯 CSS 动画由浏览器合成线程独立处理，主线程完全空闲
- framer-motion 的 transform 动画也会走合成层，但需要保留 JS runtime 调度，对此场景为不必要的开销
- 减少 React 渲染依赖，组件 mount 后动画完全自治

**备选**：

- framer-motion + transform：可行但有 JS 调度成本，相比 CSS keyframes 净收益不明显

### 决策 3：显式 `will-change: transform` 提升合成层

**选择**：在动画内层 div 上声明 `will-change: transform`。

**理由**：

- 强制浏览器为该元素分配独立合成层，避免某些渲染器在动画启动瞬间才创建合成层导致的首帧卡顿
- 配合 `transform: translate3d(0,0,0)` 形成稳定的硬件加速 hint

**风险**：

- 过度使用 `will-change` 会消耗显存。本组件单实例、单元素声明，可接受。

### 决策 4：`IntersectionObserver` 视口暂停

**选择**：组件内创建 `IntersectionObserver`，当根元素 `isIntersecting === false` 时，给动画内层加 `animation-play-state: paused`。

**理由**：

- 当前用户滚动到文章列表后，Hero 区域早已不可见，背景动画仍在烧 GPU
- `animation-play-state: paused` 让浏览器完全停止合成器对该层的更新，GPU 进入空闲
- 滚回视口时无缝恢复，无视觉抖动

### 决策 5：尊重 `prefers-reduced-motion`

**选择**：通过 CSS `@media (prefers-reduced-motion: reduce)` 直接将 `animation` 设为 `none`，pattern 保持静止显示。

**理由**：

- 无障碍合规要求
- 纯 CSS 实现，零运行时成本

### 决策 6：保留 backdrop-filter 圆点 mask 层不变

**选择**：第二层（z-index:1）的 `backdrop-filter` + 圆点 mask 保持现状。

**理由**：

- 决策 1 让下层不再触发 paint，backdrop-filter 从"每帧重算"退化为"GPU 缓存一次后只 compose"，成本大幅下降
- 视觉契约要求 blur 效果保留
- 待方向 A 上线后实测，若仍有压力再单独优化（非本次范围）

## Risks / Trade-offs

| 风险                                                                                | 缓解                                                                         |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 2 倍高度的 pattern 在视口小、缩放小的设备上可能因为过度绘制带来初始 paint 成本      | 仅初始 paint 一次，之后不再 paint；可通过设置 `contain: strict` 限制重绘范围 |
| 不同浏览器对 `will-change` 的合成层策略不同，可能在某些低端 Android 上仍未提升      | 增加 `transform: translateZ(0)` 作为兜底硬件加速 hint                        |
| CSS keyframes 注入方式（`<style>` 标签 vs `style` 属性 vs Tailwind plugin）需要选定 | 倾向于在组件文件内 `<style>` 注入唯一 keyframes 定义，避免污染全局           |
| `duration` prop 现为 framer-motion 数值，改为 CSS 后需以 `${duration}s` 字符串注入  | 在 inline style 中以 `animationDuration` 写入，保持 prop 数值语义            |
| 视觉等价的验证需要人工对比                                                          | 在 tasks.md 中列出截图/录屏对比项                                            |

## Migration Plan

1. 单文件改造 `FallingPattern.tsx`，对外 props 不变
2. 本地 `pnpm dev:web` 自检：首页加载、滚动暂停、回滚恢复
3. 跨设备验证：macOS Chrome/Safari、Windows Chrome（最好覆盖集显 + 1.5x DPI）、移动端浏览器
4. 重新构建 `@whispers/ui` 包：`pnpm packages:build`
5. 无需数据库 / API 变更，无需回滚预案；如出现问题直接 revert 单文件

## Open Questions

- 当前 `duration` 默认值为 150（HomePage 实际传入 120）。CSS keyframes 用同样秒数实现的"线性下落周期"是否会因为 2 倍高度而需要按 2 倍周期重算？→ **答**：2 倍高度 + 位移 50% 等价于原始周期，duration 数值无需调整
- 是否需要在组件上额外暴露 `paused` 或 `disabled` prop 让外部强制控制？→ 本次不暴露，YAGNI
