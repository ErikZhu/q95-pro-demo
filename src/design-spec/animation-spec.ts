/**
 * Q95 Pro 动效规范
 *
 * 定义统一的过渡时间、缓动曲线、状态动画参数。
 * 所有动画应引用此文件中的常量，确保动效体验一致。
 *
 * 需求: 21.1
 */

// ─── 过渡时间（ms） ─────────────────────────────────────────

/** 快速过渡 — 微交互反馈（按钮按下、图标切换） */
export const DURATION_FAST = 150;

/** 常规过渡 — 一般状态变化（面板展开、卡片切换） */
export const DURATION_NORMAL = 250;

/** 慢速过渡 — 大面积布局变化（页面切换、全屏动画） */
export const DURATION_SLOW = 400;

/** Smart Task Zone 展开/收回时间 — 需求 3.5, 3.6 要求 300ms 内完成 */
export const DURATION_SMART_TASK_EXPAND = 300;

/** 连接状态更新时间 — 需求 4.4 要求 500ms 内更新 */
export const DURATION_STATUS_UPDATE = 500;

// ─── 缓动曲线 ───────────────────────────────────────────────

/** 标准缓入 — 元素进入视野 */
export const EASING_IN = 'cubic-bezier(0.4, 0, 1, 1)';

/** 标准缓出 — 元素离开视野 */
export const EASING_OUT = 'cubic-bezier(0, 0, 0.2, 1)';

/** 标准缓入缓出 — 元素状态变化 */
export const EASING_IN_OUT = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** 弹性曲线 — 强调性动画（展开、弹出） */
export const EASING_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/** 减速曲线 — 自然减速（滚动惯性、滑入） */
export const EASING_DECELERATE = 'cubic-bezier(0, 0, 0.2, 1)';

// ─── AI Status Orb 动画参数 ─────────────────────────────────

/** 空闲态 — 静态柔光，微弱呼吸感 */
export const ORB_IDLE = {
  glowIntensity: 0.4,
  pulseEnabled: false,
} as const;

/** 聆听态 — 脉冲呼吸动效 */
export const ORB_LISTENING = {
  pulseDuration: 2000,
  pulseScaleMin: 1.0,
  pulseScaleMax: 1.18,
  pulseEasing: 'ease-in-out',
} as const;

/** 思考态 — 旋转动效 */
export const ORB_THINKING = {
  rotationDuration: 1000,
  rotationEasing: 'linear',
  ringBorderWidth: 2,
  ringOffset: 4,
} as const;

/** 响应态 — 扩散波纹 */
export const ORB_RESPONDING = {
  rippleCount: 2,
  rippleDuration: 1600,
  rippleScaleMax: 2.2,
  rippleDelay: 800,
  rippleEasing: 'ease-out',
} as const;

// ─── Smart Task Zone 动画参数 ────────────────────────────────

/** 展开动画 — 从紧凑模式到展开模式 */
export const SMART_TASK_EXPAND = {
  duration: DURATION_SMART_TASK_EXPAND,
  easing: EASING_SPRING,
  scaleFrom: 0.9,
  scaleTo: 1.0,
  opacityFrom: 0,
  opacityTo: 1,
} as const;

/** 收回动画 — 从展开模式到紧凑模式 */
export const SMART_TASK_COLLAPSE = {
  duration: DURATION_NORMAL,
  easing: EASING_OUT,
  scaleFrom: 1.0,
  scaleTo: 0.9,
  opacityFrom: 1,
  opacityTo: 0,
} as const;

// ─── 页面切换动画参数 ────────────────────────────────────────

/** 页面进入 */
export const PAGE_ENTER = {
  duration: DURATION_NORMAL,
  easing: EASING_DECELERATE,
  translateX: 30,
  opacityFrom: 0,
  opacityTo: 1,
} as const;

/** 页面退出 */
export const PAGE_EXIT = {
  duration: DURATION_FAST,
  easing: EASING_IN,
  translateX: -30,
  opacityFrom: 1,
  opacityTo: 0,
} as const;

// ─── 通知动画参数 ────────────────────────────────────────────

/** 通知进入 — 从视野边缘滑入 */
export const NOTIFICATION_ENTER = {
  duration: DURATION_NORMAL,
  easing: EASING_SPRING,
  translateY: -20,
  opacityFrom: 0,
  opacityTo: 1,
} as const;

/** 通知退出 — 淡出并上移 */
export const NOTIFICATION_EXIT = {
  duration: DURATION_FAST,
  easing: EASING_OUT,
  translateY: -10,
  opacityFrom: 1,
  opacityTo: 0,
} as const;
