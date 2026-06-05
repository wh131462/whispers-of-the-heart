## Context

`apps/web` 现有 28 个小应用，其中 `keyboard-tester` 提供键盘检测能力。屏幕检测在维修、二手交易、新机验收场景中需求频繁。参考站 [screen.bmcx.com](https://screen.bmcx.com/#welcome) 采用"侧边栏列表 + 主画布 + 顶部控制条"的极简布局，覆盖 23 项目视检测，是国内传统屏幕检测的事实标杆。本应用对其检测项做完整对齐，并补充"现代屏幕"特有的能力（屏幕信息、多点触控）。运行环境为现代浏览器，依赖 React 18 + Tailwind + `lucide-react`，UI 风格遵循 web-app-creator skill 中规定的"明亮主题"。

## Goals / Non-Goals

**Goals:**

- 完整复刻参考站的 23 项检测能力（纯色 8 + 线条 6 + 干扰图案 5 + 对比度 2 + 渐变 4 + 饱和度 1 + 欢迎页 1 = 23）
- 补充 2 项现代检测：屏幕信息汇总、多点触控
- 采用"侧边栏列表 + 主画布 + 顶部控制条"布局
- 支持真全屏（Fullscreen API），全屏后控制条与侧边栏均隐藏，画布纯净
- 不引入新依赖，全部使用现有工具链
- 适配桌面与平板

**Non-Goals:**

- 不做专业仪器级色彩校准（ΔE、Gamma 拟合）
- 不持久化测试结果、不上报后端
- 不实现跨屏/多显示器检测（浏览器 API 限制）
- 不做精确 GtG 响应时间测量
- 不做欢迎页/结束页之外的引导流程

## Decisions

### D1: 侧边栏列表布局（参考 bmcx）

**选择**：固定左侧 ~200px 侧边栏 + 右侧主画布 + 上方控制条。
**理由**：所有检测项一屏可见，单次点击切换；比卡片网格更适合"快速来回比对"。
**备选**：卡片菜单 → 切换需要返回菜单，多一次跳转；放弃。

### D2: 全屏实现使用浏览器 Fullscreen API

**选择**：对"主画布容器"调用 `requestFullscreen()`，全屏时侧边栏与控制条被排除在外。
**理由**：进入真实全屏可隐藏浏览器 chrome 与 OS 任务栏，避免漏光检测被干扰。
**降级**：对不支持 Fullscreen API 的环境，使用 CSS `position: fixed; inset: 0; z-index` 伪全屏。
**兼容**：用类型断言处理 `webkitRequestFullscreen` 等前缀。

### D3: 检测项数据结构

```ts
type PanelCategory =
  | 'intro'
  | 'pure-color'
  | 'line'
  | 'pattern'
  | 'contrast'
  | 'gradient'
  | 'saturation'
  | 'info'
  | 'touch';

type DetectorPanel = {
  id: string; // 'pure-red' | 'line-h1' | 'contrast-dark' ...
  category: PanelCategory;
  name: string; // 显示名（中文）
  description: string; // 一句话用途说明
  render: () => ReactNode;
};
```

所有面板在 `panels.tsx` 集中注册，主组件用 `panels.find(p => p.id === currentId)` 渲染。新增检测项只需追加一项。

### D4: 纯色面板（8 色，参考 bmcx）

固定顺序：红 `#ff0000` → 绿 `#00ff00` → 蓝 `#0000ff` → 黄 `#ffff00` → 青 `#00ffff` → 洋红 `#ff00ff` → 白 `#ffffff` → 黑 `#000000`。

每色独立一个 panel id（`pure-red` / `pure-green` ...），侧边栏分组显示。这样侧边栏可直接看到所有色，无需进入面板再切换；同时仍支持画布内 `← / →` 在同组内循环。

### D5: 线条面板（6 种）

| ID        | 内容              | 用途               |
| --------- | ----------------- | ------------------ |
| `line-h1` | 1px 间距黑/白横线 | 子像素水平方向异常 |
| `line-h2` | 2px 间距黑/白横线 | 残影 / 横向干扰    |
| `line-v1` | 1px 间距黑/白竖线 | 子像素垂直方向异常 |
| `line-v2` | 2px 间距黑/白竖线 | 残影 / 竖向干扰    |
| `line-d1` | 细对角线          | 像素对齐 / 锯齿    |
| `line-d2` | 粗对角线          | 摩尔纹             |

使用 CSS `repeating-linear-gradient` 实现，0 网络请求、无栅格化损失。

### D6: 干扰图案面板（5 种）

- `pattern-dots`：1px 黑底白点阵，`background: radial-gradient` 平铺
- `pattern-micro`：黑色背景，四角 + 中心 5 处微型棋盘格区块（200×200px 等），用于对焦/呼吸效应
- `pattern-flash`：闪烁方块，rAF 驱动以 ~2Hz 在黑/白间切换（CRT 呼吸效应测试）
- `pattern-grid-square`：100×100 等大网格方块（黑白棋盘大块）
- `pattern-grid-color`：彩色网格方块（红绿蓝青洋红黄循环），检测色块边缘

### D7: 对比度面板（亮/暗 2 种，4×10 灰度矩阵）

参考 bmcx 实现，4×10 矩阵渲染 40 个色块，每块显示其灰度百分比与 0-255 值。

- **对比度(暗)**：灰度从 `0/255 (0%)` 到 `40/255 (15.69%)`，每格 +1，按 4×10 排列
- **对比度(亮)**：灰度从 `175/255 (68.63%)` 到 `254/255 (99.61%)`，每格按 bmcx 实测的非线性步长（约 +4 / +2 / +1）排列，最后几行密集，用于测试高光区域的色阶分辨能力

每色块：背景为该灰度，居中显示 `XX.XX%` 与 `(N/255)` 文本（深背景用浅字、浅背景用深字，自动反相）。

### D8: 渐变面板（4 种）

`linear-gradient(to right, #000000, #ffffff)`、`linear-gradient(to right, #000000, #ff0000)`、绿、蓝同理。256 级横向，全宽渲染。

### D9: 饱和度面板

水平 HSL 色相条：`linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`，等同 bmcx 的彩虹条。

### D10: 屏幕信息面板

| 字段           | 来源                                  |
| -------------- | ------------------------------------- | --- | ----------- |
| 视口尺寸       | `window.innerWidth/Height`            |
| 屏幕物理尺寸   | `window.screen.width/height`          |
| DPR            | `window.devicePixelRatio`             |
| 颜色深度       | `window.screen.colorDepth`            |
| 色域           | `matchMedia('(color-gamut: srgb       | p3  | rec2020)')` |
| HDR            | `matchMedia('(dynamic-range: high)')` |
| 刷新率（估算） | rAF 采样 120 帧                       |
| 触摸支持       | `'ontouchstart' in window`            |

监听 `resize` 自动更新视口字段。

### D11: 多点触控面板

`pointerdown/move/up` 追踪每个 `pointerId`，Canvas 绘制每个指针上色的圆与轨迹；`R` 键清空。

### D12: 全屏无干扰模式

- 进入全屏后 1.5s 内控制条与侧边栏完全淡出
- 鼠标移动或按键时短暂显现 1.5s 再次淡出
- `H` 键彻底隐藏直到再次按 `H`

### D13: 键盘绑定

| 键           | 作用                       |
| ------------ | -------------------------- |
| `F`          | 进入/退出全屏              |
| `Esc`        | 退出全屏                   |
| `←` / `→`    | 上一项 / 下一项检测项      |
| `Space`      | 启动/暂停自动巡检          |
| `[` / `]`    | 调整自动巡检间隔（1/2/5s） |
| `H`          | 强制隐藏/显现控制条        |
| `R`          | 多点触控面板清空轨迹       |
| 鼠标单击画布 | 下一项                     |

## Risks / Trade-offs

- **[全屏 API 仅在用户手势中触发]** → 仅在按钮 onClick 内调用 `requestFullscreen()`，失败时降级伪全屏并提示。
- **[闪烁方块/快速色彩交替可能引发不适]** → 在欢迎页与闪烁面板首次进入时显示一次性"光敏警告"提示。
- **[刷新率 rAF 估算不精确]** → 标注"估算值"，并显示原始平均帧间隔。
- **[对比度 4×10 矩阵字体在不同 DPR 下可能失真]** → 字体大小用 `clamp()`，自动反相文字颜色保证可读。
- **[移动端 iOS Safari Fullscreen 受限]** → 降级为 CSS 伪全屏。
- **[图案 panel 在低端设备渲染慢]** → 使用 CSS `repeating-linear-gradient` / `radial-gradient` 而非 DOM 节点循环。
