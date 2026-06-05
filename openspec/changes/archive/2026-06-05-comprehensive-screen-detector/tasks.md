## 1. 目录与脚手架

- [x] 1.1 在 `apps/web/src/apps/screen-detector/` 下创建目录结构：`index.tsx`、`types.ts`、`panels.tsx`、`components/`、`hooks/`、`utils/`、`panels/`（每个检测面板一文件）
- [x] 1.2 在 `apps/web/src/apps/index.ts` 的 `appRegistry` 中追加 `screen-detector` 条目（id、name="屏幕检测器"、icon="Monitor"、tags=["实用"]、`lazy(() => import('./screen-detector'))`）

## 2. 类型与共享工具

- [x] 2.1 在 `types.ts` 定义 `PanelCategory`、`PanelId`、`DetectorPanel`、`PanelGroup` 等类型
- [x] 2.2 在 `hooks/useFullscreen.ts` 实现 Fullscreen API 封装（含 webkit 前缀回退、降级伪全屏标志位）
- [x] 2.3 在 `hooks/useRefreshRate.ts` 实现 rAF 采样 120 帧的刷新率估算，返回 `{ hz, avgFrameMs, sampling }`
- [x] 2.4 在 `hooks/useAutoHide.ts` 实现"1.5s 无操作淡出 + H 键强制隐藏"的覆盖层显隐控制
- [x] 2.5 在 `hooks/useAutoCycle.ts` 实现自动巡检：Space 切换、`[`/`]` 间隔切换（1/2/5s）
- [x] 2.6 在 `utils/screenInfo.ts` 实现屏幕信息收集
- [x] 2.7 在 `utils/contrast.ts` 实现"对比度(暗)"与"对比度(亮)"的灰度值数组（4×10 = 40 个数）以及文本反相工具

## 3. 框架组件

- [x] 3.1 实现 `index.tsx` 主组件：管理 `currentId` 状态、键盘全局监听、全屏切换、自动巡检
- [x] 3.2 实现 `components/Sidebar.tsx`：按分组渲染所有检测项，选中项高亮，点击切换
- [x] 3.3 实现 `components/ControlBar.tsx`：标题 + 描述 + 全屏按钮 + 结束按钮，支持自动淡出
- [x] 3.4 实现 `components/FullscreenStage.tsx`：包裹主画布，处理 fullscreen container ref 与降级伪全屏样式

## 4. 介绍/结束页

- [x] 4.1 实现 `panels/WelcomePanel.tsx`：项目介绍 + 当前分辨率 + 光敏警告
- [x] 4.2 实现 `panels/EndPanel.tsx`：致谢 + "重新开始"按钮（回到欢迎页）

## 5. 纯色面板（8 个）

- [x] 5.1 实现 `panels/PureColorPanel.tsx`：参数化的纯色全屏组件（接收 `color: string`）
- [x] 5.2 在 `panels.tsx` 注册 8 个纯色条目：纯红 / 纯绿 / 纯蓝 / 纯黄 / 纯青 / 纯洋红 / 纯白 / 纯黑

## 6. 线条面板（6 个）

- [x] 6.1 实现 `panels/LinePanel.tsx`：参数化的 `repeating-linear-gradient` 组件，接收方向（horizontal/vertical/diagonal）与间距档位（1/2）
- [x] 6.2 注册 6 个线条条目：水平线 1/2、垂直线 1/2、正斜线 1/2

## 7. 干扰图案面板（5 个）

- [x] 7.1 实现 `panels/DotsPanel.tsx`：1px 黑底白点阵（radial-gradient 平铺）
- [x] 7.2 实现 `panels/MicroPatternPanel.tsx`：黑底，四角 + 中心 5 处微型棋盘格（200×200px）
- [x] 7.3 实现 `panels/FlashSquarePanel.tsx`：rAF 驱动 ~2Hz 闪烁的方块，首次进入显示光敏警告
- [x] 7.4 实现 `panels/SquareGridPanel.tsx`：黑白等大方块网格
- [x] 7.5 实现 `panels/ColorGridPanel.tsx`：红/绿/蓝/青/洋红/黄循环填充的彩色方块网格

## 8. 对比度面板（2 个）

- [x] 8.1 在 `utils/contrast.ts` 定义两组灰度数组（暗 0-40、亮 175-254 的密集采样）
- [x] 8.2 实现 `panels/ContrastPanel.tsx`：渲染 4×10 灰度色块矩阵，每块居中显示 `XX.XX%` 与 `(N/255)`，文本颜色根据背景灰度反相
- [x] 8.3 注册 `contrast-dark` / `contrast-light` 两条目

## 9. 渐变面板（4 个）

- [x] 9.1 实现 `panels/GradientPanel.tsx`：参数化 `linear-gradient(to right, #000, <to>)`
- [x] 9.2 注册白色 / 红色 / 绿色 / 蓝色 4 条目

## 10. 饱和度面板

- [x] 10.1 实现 `panels/SaturationPanel.tsx`：横向 HSL 色相条
- [x] 10.2 注册 `saturation` 条目

## 11. 现代补充：屏幕信息 / 多点触控

- [x] 11.1 实现 `panels/ScreenInfoPanel.tsx`：表格展示视口 / 屏幕 / DPR / colorDepth / color-gamut / dynamic-range / 刷新率 / 触摸支持，监听 resize 自动刷新
- [x] 11.2 实现 `panels/MultiTouchPanel.tsx`：Canvas + pointer 事件追踪 `pointerId`、彩色轨迹、R 键清空、按钮清空

## 12. 注册与汇总

- [x] 12.1 在 `panels.tsx` 集中导出 `panelGroups: PanelGroup[]`，按介绍/纯色/线条/干扰/对比度/渐变/饱和度/现代/结束分组并按顺序登记 25 个面板
- [x] 12.2 在主组件中接入 `panelGroups`，实现按 `← / →` 在面板顺序中切换、按 `Esc` 退出全屏
- [x] 12.3 在主组件挂载/卸载时正确清理键盘监听与 fullscreenchange 监听

## 13. 样式校对

- [x] 13.1 侧边栏、控制条遵循 `bg-white/95` + `border-zinc-200` + `rounded-xl` + `shadow-lg shadow-zinc-200/50`，选中项 `bg-zinc-100`
- [x] 13.2 检测画布区域无圆角、无 margin、无阴影，背景由具体面板决定
- [x] 13.3 用 `cn()` 合并类名，纯色色值由参数注入避免硬编码

## 14. 自检与验证

- [x] 14.1 在 dev server 中打开"屏幕检测器"，依次点击侧边栏所有 25 项，每项均能正常渲染
- [x] 14.2 测试 Fullscreen API：进入全屏后侧边栏与控制条均不可见；Esc 退出；不支持时降级伪全屏
- [x] 14.3 测试键盘交互：`←/→` 切换、`F` 全屏切换、`Space` 巡检、`[`/`]` 间隔、`H` 强制隐藏、`R` 多点触控清空
- [x] 14.4 在 Chrome DevTools 设备模拟下确认 `useRefreshRate` 不卡死且 60Hz 估算稳定
- [x] 14.5 ESLint 通过；无 `any`、无未使用变量
