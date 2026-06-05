## 1. 准备与基线

- [ ] 1.1 在 Chrome DevTools Performance 面板录制改造前的 Hero 区基线（截图保存帧率、Long Tasks、Paint 次数），作为对比依据
- [ ] 1.2 在 macOS Chrome 上用 `pnpm dev:web` 打开首页，截图 Hero 区当前视觉效果作为视觉等价对比基线（建议保存为 `working/falling-pattern-before.png`）

## 2. 核心重构：transform 化背景滚动

- [x] 2.1 在 [FallingPattern.tsx](packages/ui/src/components/background/FallingPattern.tsx) 中保留 props 类型签名；原始 `generateBackgroundImage` / `backgroundSizes` / `startPositions` 静态数据等价编码到新的 `ROWS` 结构（按行拆分为 12 组，每组包含 sizeY / cycles / bgPosition / buildGradients）
- [x] 2.2 移除 `framer-motion` 在本组件的引用（`import { motion } from 'framer-motion'` 删除）
- [x] 2.3 重构 DOM 结构为：外层容器（`overflow: hidden` + `IntersectionObserver` 锚点）→ 背景底色层 → 12 个独立行动画层（每层 `top: -sizeY / bottom: -sizeY`，承载该行 3 个 gradient + transform 动画）→ 现有 backdrop-filter mask 层保持不变
- [x] 2.4 通过组件内 `<style>` 标签注入 12 条 `@keyframes` 定义（`{prefix}-r0` ~ `{prefix}-r11`），prefix 由 `useId()` 生成确保同页多实例不冲突
- [x] 2.5 在每行动画层上应用 `animation: {prefix}-r{i} ${duration / cycles}s linear infinite`、`will-change: transform`；keyframes 使用 `translate3d(0,0,0) → translate3d(0,sizeY,0)` 已自带 GPU 合成 hint
- [x] 2.6 确认每行 tile 高度 `sizeY` 与位移距离一致 → 循环边界与 pattern 平铺边界对齐 → 无缝（cycles 均为整数已数学验证）

## 3. 视口暂停与无障碍

- [x] 3.1 在组件内使用 `useRef` 引用外层容器 DOM
- [x] 3.2 用 `useEffect` 创建 `IntersectionObserver`，当 `isIntersecting === false` 时给动画层设置 `animationPlayState: 'paused'`，反之 `'running'`
- [x] 3.3 组件卸载时正确 disconnect observer
- [x] 3.4 通过 CSS `@media (prefers-reduced-motion: reduce)` 在 keyframes 注入处加上 `animation: none` 覆盖

## 4. 验证与对比

- [ ] 4.1 macOS Chrome：视觉对比改造前后截图，确认像素级等价
- [ ] 4.2 macOS Safari：动画播放正常，无视觉异常
- [ ] 4.3 Windows Chrome（理想情况：集显 + 1.5x DPI）：Performance 面板录制改造后帧率，目标 55-60fps 稳定
- [ ] 4.4 滚动到下方文章列表，验证 Hero 离开视口后动画暂停（DevTools Layers 面板观察）
- [ ] 4.5 滚回 Hero，验证动画无缝恢复
- [ ] 4.6 在系统/浏览器开启"减弱动效"偏好，验证动画完全静止
- [ ] 4.7 验证 `HomePage` 调用方代码完全未修改且行为正常

## 5. 构建与提交

- [x] 5.1 运行 `pnpm build:packages` 重新构建 `@whispers/ui` 包（实际命令使用 `pnpm --filter "@whispers/ui" build`，由于 `build:packages` 走 turbo `packages/*` 过滤在本仓库匹配为空）
- [x] 5.2 运行 `pnpm --filter "@whispers/ui" type-check` 与 `pnpm --filter web type-check` 与 ESLint，全部通过零警告
- [ ] 5.3 按 Conventional Commits 规范提交：`perf(ui): falling pattern uses transform compositing` 或类似

## 6. 文档同步

- [x] 6.1 在 `.ai/5-MEMORY.md` 当前 session 记录中追加：性能优化决策（transform 化、视口暂停、prefers-reduced-motion）及定位手段（Chrome Performance 录制对比）
- [x] 6.2 如该模式（transform 化背景动画 + IntersectionObserver 视口暂停）后续可能被复用，在 `.ai/4-PATTERNS.md` 添加"装饰性背景动画性能基线"条目
- [ ] 6.3 完成后运行 `/opsx:archive optimize-falling-pattern-performance` 归档
