/**
 * Q95 Pro 界面布局规范
 *
 * 定义安全显示区域、三分区布局常量、信息层级（z-index）和视觉焦点区域。
 * 所有布局组件应引用此文件中的常量，确保空间分配一致。
 *
 * 需求: 21.3
 */

// ─── 显示区域基准 ────────────────────────────────────────────

/** 单眼参考分辨率（px） */
export const DISPLAY_WIDTH = 1280;
export const DISPLAY_HEIGHT = 720;

/** 视场角（度） */
export const DISPLAY_FOV = 40;

// ─── 安全显示区域 ────────────────────────────────────────────

/**
 * 安全显示区域边距（px）
 * 内容不应超出此边距范围，避免被光学畸变或镜框遮挡。
 */
export const SAFE_AREA = {
  top: 8,
  right: 16,
  bottom: 8,
  left: 16,
} as const;

/** 安全显示区域有效尺寸 */
export const SAFE_AREA_WIDTH = DISPLAY_WIDTH - SAFE_AREA.left - SAFE_AREA.right;
export const SAFE_AREA_HEIGHT = DISPLAY_HEIGHT - SAFE_AREA.top - SAFE_AREA.bottom;

// ─── 三分区布局常量 ─────────────────────────────────────────

/** 分区间隔（px）— 保证视觉边界清晰（需求 2.6） */
export const ZONE_GAP = 4;

/** 顶部栏高度比例 */
export const TOP_BAR_HEIGHT_RATIO = 0.15;

/** 顶部栏宽度比例（Smart_Task_Zone / Status_Bar 各占） */
export const TOP_BAR_WIDTH_RATIO = 0.25;

/**
 * Smart_Task_Zone — 左上角智能任务区（需求 2.3）
 */
export const SMART_TASK_ZONE = {
  x: 0,
  y: 0,
  width: Math.round(DISPLAY_WIDTH * TOP_BAR_WIDTH_RATIO),   // 320
  height: Math.round(DISPLAY_HEIGHT * TOP_BAR_HEIGHT_RATIO), // 108
} as const;

/**
 * Status_Bar — 右上角设备状态栏（需求 2.4）
 */
export const STATUS_BAR = {
  x: DISPLAY_WIDTH - Math.round(DISPLAY_WIDTH * TOP_BAR_WIDTH_RATIO), // 960
  y: 0,
  width: Math.round(DISPLAY_WIDTH * TOP_BAR_WIDTH_RATIO),   // 320
  height: Math.round(DISPLAY_HEIGHT * TOP_BAR_HEIGHT_RATIO), // 108
} as const;

/**
 * Main_Task_Area — 中央主任务区（需求 2.2）
 * 位于顶部栏下方，占满宽度。
 */
export const MAIN_TASK_AREA = {
  x: 0,
  y: Math.round(DISPLAY_HEIGHT * TOP_BAR_HEIGHT_RATIO) + ZONE_GAP, // 112
  width: DISPLAY_WIDTH,                                              // 1280
  height: DISPLAY_HEIGHT - Math.round(DISPLAY_HEIGHT * TOP_BAR_HEIGHT_RATIO) - ZONE_GAP, // 608
} as const;

// ─── Smart Task Zone 展开模式尺寸 ────────────────────────────

/** 展开模式下 Smart_Task_Zone 覆盖的区域（半透明浮层，需求 3.7） */
export const SMART_TASK_ZONE_EXPANDED = {
  x: 0,
  y: 0,
  width: Math.round(DISPLAY_WIDTH * 0.55),  // 704
  height: Math.round(DISPLAY_HEIGHT * 0.7), // 504
} as const;

// ─── 信息层级（z-index） ────────────────────────────────────

/**
 * z-index 层级定义
 * 数值越大越靠前（离用户越近）。
 */
export const Z_INDEX = {
  /** 基础内容层 — Main_Task_Area 中的应用内容 */
  BASE_CONTENT: 0,
  /** 常驻 UI 层 — Smart_Task_Zone（紧凑）、Status_Bar */
  PERSISTENT_UI: 100,
  /** 应用内浮层 — 下拉菜单、工具提示 */
  APP_OVERLAY: 200,
  /** 展开面板层 — Smart_Task_Zone（展开）、设置面板 */
  EXPANDED_PANEL: 300,
  /** 通知层 — 通知提示、Toast */
  NOTIFICATION: 400,
  /** 模态对话框层 — 确认弹窗、权限请求 */
  MODAL: 500,
  /** 系统警告层 — 低电量全屏警告（需求 4.3） */
  SYSTEM_ALERT: 600,
  /** AI 助手层 — 语音助手激活时的交互界面 */
  AI_ASSISTANT: 700,
} as const;

// ─── 视觉焦点区域 ───────────────────────────────────────────

/**
 * 视觉焦点区域 — 用户视野中心区域
 * 最重要的信息应放置在此区域内以确保可读性。
 * 基于 FOV 中心 60% 范围定义。
 */
export const VISUAL_FOCUS_AREA = {
  x: Math.round(DISPLAY_WIDTH * 0.2),   // 256
  y: Math.round(DISPLAY_HEIGHT * 0.2),  // 144
  width: Math.round(DISPLAY_WIDTH * 0.6),  // 768
  height: Math.round(DISPLAY_HEIGHT * 0.6), // 432
} as const;

/**
 * AR 导航信息安全区域 — 导航叠加信息应在此区域内显示（需求 11.5）
 * 位于视野下方，不遮挡主要视线。
 */
export const AR_NAV_OVERLAY_AREA = {
  x: Math.round(DISPLAY_WIDTH * 0.15),
  y: Math.round(DISPLAY_HEIGHT * 0.7),
  width: Math.round(DISPLAY_WIDTH * 0.7),
  height: Math.round(DISPLAY_HEIGHT * 0.25),
} as const;

/**
 * 翻译结果显示区域 — 位于视野下方（需求 14.4）
 */
export const TRANSLATOR_OVERLAY_AREA = {
  x: Math.round(DISPLAY_WIDTH * 0.1),
  y: Math.round(DISPLAY_HEIGHT * 0.78),
  width: Math.round(DISPLAY_WIDTH * 0.8),
  height: Math.round(DISPLAY_HEIGHT * 0.18),
} as const;

/**
 * 通知提示区域 — 视野边缘（需求 7.1）
 */
export const NOTIFICATION_HINT_AREA = {
  x: Math.round(DISPLAY_WIDTH * 0.6),
  y: SAFE_AREA.top,
  width: Math.round(DISPLAY_WIDTH * 0.38),
  height: 64,
} as const;
