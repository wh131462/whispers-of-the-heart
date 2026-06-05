## Why

首页 Hero 区域的 `FallingPattern` 背景动画在 Windows 设备（特别是集显 + 高 DPI 缩放场景）上出现明显卡顿，影响首屏体验。根因是该组件同时踩中浏览器渲染管线两个最贵的操作：通过 framer-motion 持续动画 `background-position`（每帧触发整屏 paint），叠加全屏 `backdrop-filter: blur`（每帧 GPU 模糊整屏）。需要在**完全保持现有视觉效果**的前提下重构渲染策略。

## What Changes

- 将 `FallingPattern` 的下落动画实现从 `background-position` 改为 `transform: translate3d`，使动画层成为独立 GPU 合成层，主线程零参与
- 将原本依赖动态偏移的 36 个 `radial-gradient` 图案 bake 到一个高度为 2 倍图案周期的静态内层 div 中，通过 `translate3d(0, 0, 0) → translate3d(0, -50%, 0)` 实现无缝循环
- 显式声明 `will-change: transform` 提升合成层
- 新增 `IntersectionObserver` 视口可见性检测，组件滚出视口时通过 `animation-play-state: paused` 暂停动画
- 尊重用户 `prefers-reduced-motion` 偏好：完全禁用动画
- 保持现有公开 props 接口（`color` / `backgroundColor` / `duration` / `blurIntensity` / `density`）100% 兼容，调用方无需改动

## Capabilities

### New Capabilities

- `ui-background-pattern`：共享 UI 包提供的装饰性背景动画组件契约，含视觉契约、性能契约与可访问性契约

### Modified Capabilities

（无 —— 当前没有已沉淀的相关 spec）

## Impact

- **代码**：[packages/ui/src/components/background/FallingPattern.tsx](packages/ui/src/components/background/FallingPattern.tsx) 单文件重写内部实现
- **调用方**：[apps/web/src/pages/HomePage.tsx](apps/web/src/pages/HomePage.tsx) 无需改动（props 兼容）
- **依赖**：移除对 `framer-motion` 在此组件中的使用（其他组件仍依赖，不卸载包）
- **构建**：`@whispers/ui` 包需重新构建
- **视觉契约**：图案、颜色、下落速度、blur 强度、整体观感完全保持不变
- **性能契约**：所有现代浏览器在视口可见时稳定 60fps；视口外动画暂停

## Non-goals

- 不重写或替换 `backdrop-filter` 圆点 mask 层（待方向 A 上线后实测决定是否需要进一步优化）
- 不引入 Canvas / WebGL 实现
- 不为其他装饰性背景组件做统一抽象（YAGNI，未来出现第二个此类组件时再抽）
- 不修改首页 `HomePage.tsx` 的任何调用代码
