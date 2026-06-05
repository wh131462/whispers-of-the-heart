## ADDED Requirements

### Requirement: 视觉契约保持不变

`FallingPattern` 组件的视觉呈现 SHALL 在重构后保持与现状像素级等价。具体包括：图案布局、颜色映射（受 `color` / `backgroundColor` props 控制）、下落速度（受 `duration` prop 控制）、blur 强度（受 `blurIntensity` prop 控制）、密度（受 `density` prop 控制）。

#### Scenario: 默认 props 下的视觉一致性

- **WHEN** 调用方未传入任何 props 渲染 `FallingPattern`
- **THEN** 渲染结果与重构前的默认渲染像素级一致（图案、颜色、下落周期、blur 半径均不变）

#### Scenario: HomePage 当前调用参数下的视觉一致性

- **WHEN** 调用方以 `color="hsl(var(--primary))"` `backgroundColor="hsl(var(--background))"` `duration={120}` `blurIntensity="0.8em"` 渲染
- **THEN** 渲染结果与重构前 `HomePage` 的 Hero 背景效果在主观观感上完全一致

### Requirement: Props 接口向后兼容

`FallingPattern` 组件 SHALL 保持现有公开 props 接口（`color` / `backgroundColor` / `duration` / `blurIntensity` / `density` / 以及继承自 `React.ComponentProps<'div'>` 的标准 props）100% 兼容。

#### Scenario: 调用方零改动

- **WHEN** 任何现有调用方（含 `HomePage`）的代码完全不修改
- **THEN** 组件正常工作且行为符合预期

#### Scenario: TypeScript 类型签名兼容

- **WHEN** 调用方使用 `FallingPatternProps` 类型
- **THEN** 类型签名与重构前完全兼容，不引入新的必填 prop

### Requirement: 动画在所有现代浏览器稳定 60fps

当组件在视口内可见时，动画 SHALL 由浏览器合成线程独立处理，主线程不参与动画帧调度。

#### Scenario: 动画使用合成属性

- **WHEN** 组件渲染并开始播放动画
- **THEN** 用于驱动视觉变化的 CSS 属性 SHALL 为 `transform`（合成属性），不再使用 `background-position`（paint 属性）

#### Scenario: 主线程零动画成本

- **WHEN** 动画运行中
- **THEN** Chrome DevTools Performance 面板下，主线程在动画期间 SHALL NOT 出现由本组件触发的持续 Paint 或 Composite Layers 任务

#### Scenario: Windows 集显设备流畅运行

- **WHEN** 在 Windows + Intel 集显 + 1.25x/1.5x DPI 缩放环境下打开首页
- **THEN** Hero 区域动画帧率 SHALL 稳定在 55-60fps 区间，无明显卡顿或掉帧

### Requirement: 视口外动画自动暂停

当组件根元素完全滚出视口时，动画 SHALL 自动暂停以节省 GPU 资源；重新进入视口时 SHALL 自动恢复。

#### Scenario: 滚出视口暂停

- **WHEN** 用户从首页 Hero 区滚动到下方文章列表，组件根元素完全离开视口
- **THEN** 动画 SHALL 通过 `animation-play-state: paused` 暂停，GPU 不再为该层做合成更新

#### Scenario: 滚回视口恢复

- **WHEN** 用户滚动回 Hero 区域，组件根元素重新进入视口
- **THEN** 动画 SHALL 自动恢复播放，无视觉抖动或闪烁

### Requirement: 尊重 prefers-reduced-motion

当用户系统/浏览器设置了 `prefers-reduced-motion: reduce` 偏好时，组件 SHALL 完全禁用下落动画，仅显示静态背景图案。

#### Scenario: 用户启用减弱动效偏好

- **WHEN** `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true`
- **THEN** 下落动画 SHALL 不播放，pattern 保持静止显示，blur 与圆点 mask 仍正常呈现

### Requirement: 无缝循环动画

下落动画 SHALL 实现首尾无缝衔接，用户在持续观察时不应看到任何跳变或重置瞬间。

#### Scenario: 持续观察无跳变

- **WHEN** 用户持续观察 Hero 背景超过一个完整 `duration` 周期
- **THEN** 图案下落 SHALL 平滑连续，无任何位置跳跃、闪烁或可感知的循环边界
