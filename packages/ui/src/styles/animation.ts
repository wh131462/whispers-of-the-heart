/**
 * 统一动画时长常量
 * 用于保持整个应用的动画一致性
 */

// 动画时长 (毫秒)
export const DURATION = {
  /** 极快 - 用于微交互如hover状态 */
  instant: 100,
  /** 快速 - 用于小型UI变化 */
  fast: 150,
  /** 正常 - 用于大多数过渡效果 */
  normal: 200,
  /** 中等 - 用于模态框、抽屉等 */
  medium: 300,
  /** 慢速 - 用于复杂动画或强调效果 */
  slow: 400,
  /** 非常慢 - 用于页面过渡或特殊效果 */
  slower: 500,
} as const;

// 动画时长 (CSS格式)
export const DURATION_CSS = {
  instant: '100ms',
  fast: '150ms',
  normal: '200ms',
  medium: '300ms',
  slow: '400ms',
  slower: '500ms',
} as const;

// 缓动函数
export const EASING = {
  /** 线性 */
  linear: 'linear',
  /** 默认缓动 - 适合大多数场景 */
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** 缓入 - 元素进入时使用 */
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  /** 缓出 - 元素退出时使用 */
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  /** 缓入缓出 - 元素移动时使用 */
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** 弹性效果 */
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  /** 弹簧效果 */
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// Tailwind CSS 类名
export const TRANSITION_CLASS = {
  /** 所有属性过渡 - 快速 */
  allFast: 'transition-all duration-150 ease-out',
  /** 所有属性过渡 - 正常 */
  all: 'transition-all duration-200 ease-out',
  /** 所有属性过渡 - 中等 */
  allMedium: 'transition-all duration-300 ease-out',
  /** 颜色过渡 */
  colors: 'transition-colors duration-200 ease-out',
  /** 透明度过渡 */
  opacity: 'transition-opacity duration-200 ease-out',
  /** 缩放过渡 */
  transform: 'transition-transform duration-200 ease-out',
  /** 阴影过渡 */
  shadow: 'transition-shadow duration-200 ease-out',
} as const;

// 预设动画组合
export const ANIMATION_PRESET = {
  /** 按钮悬停效果 */
  buttonHover: 'transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]',
  /** 卡片悬停效果 */
  cardHover: 'transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1',
  /** 淡入效果 */
  fadeIn: 'animate-in fade-in duration-200',
  /** 淡出效果 */
  fadeOut: 'animate-out fade-out duration-150',
  /** 滑入效果 (从下方) */
  slideInUp: 'animate-in slide-in-from-bottom-4 duration-300',
  /** 滑入效果 (从右侧) */
  slideInRight: 'animate-in slide-in-from-right-4 duration-300',
  /** 缩放进入 */
  zoomIn: 'animate-in zoom-in-95 duration-200',
  /** 脉冲效果 (用于骨架屏) */
  pulse: 'animate-pulse',
  /** 旋转效果 (用于加载) */
  spin: 'animate-spin',
} as const;

// 延迟常量
export const DELAY = {
  none: 0,
  short: 75,
  normal: 150,
  long: 300,
} as const;

export const DELAY_CSS = {
  none: '0ms',
  short: '75ms',
  normal: '150ms',
  long: '300ms',
} as const;

// 导出类型
export type Duration = keyof typeof DURATION;
export type Easing = keyof typeof EASING;
export type TransitionClass = keyof typeof TRANSITION_CLASS;
export type AnimationPreset = keyof typeof ANIMATION_PRESET;
export type Delay = keyof typeof DELAY;
