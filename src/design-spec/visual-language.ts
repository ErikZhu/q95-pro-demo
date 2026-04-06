/**
 * Q95 Pro 视觉设计语言规范
 *
 * 定义统一的颜色体系、字体规范、图标风格和基础视觉常量。
 * 所有组件应引用此文件中的常量，确保视觉一致性。
 *
 * 需求: 21.1
 */

// ─── 颜色体系 ───────────────────────────────────────────────

/** 主色调 — 品牌蓝，用于主要交互元素和焦点指示 */
export const COLOR_PRIMARY = 'rgba(100, 200, 255, 0.9)';
export const COLOR_PRIMARY_LIGHT = 'rgba(140, 220, 255, 0.7)';
export const COLOR_PRIMARY_DARK = 'rgba(60, 140, 220, 0.95)';

/** 辅助色 — 用于次要交互元素和辅助信息 */
export const COLOR_SECONDARY = 'rgba(180, 130, 255, 0.85)';
export const COLOR_SECONDARY_LIGHT = 'rgba(200, 170, 255, 0.65)';
export const COLOR_SECONDARY_DARK = 'rgba(140, 80, 240, 0.9)';

/** 强调色 — 用于高亮和引导注意力 */
export const COLOR_ACCENT = 'rgba(255, 180, 60, 0.9)';
export const COLOR_ACCENT_LIGHT = 'rgba(255, 210, 120, 0.7)';
export const COLOR_ACCENT_DARK = 'rgba(240, 140, 20, 0.95)';

/** 背景色 — AR 叠加层的深色半透明背景 */
export const COLOR_BG_BASE = '#0a0a1a';
export const COLOR_BG_GRADIENT_START = '#0a0a1a';
export const COLOR_BG_GRADIENT_END = '#1a1a2e';
export const COLOR_BG_OVERLAY = 'rgba(10, 10, 26, 0.75)';
export const COLOR_BG_CARD = 'rgba(255, 255, 255, 0.04)';

/** 文本色 */
export const COLOR_TEXT_PRIMARY = 'rgba(255, 255, 255, 0.95)';
export const COLOR_TEXT_SECONDARY = 'rgba(255, 255, 255, 0.7)';
export const COLOR_TEXT_TERTIARY = 'rgba(255, 255, 255, 0.45)';
export const COLOR_TEXT_DISABLED = 'rgba(255, 255, 255, 0.25)';

/** 状态色 */
export const COLOR_SUCCESS = 'rgba(80, 220, 160, 0.9)';
export const COLOR_WARNING = 'rgba(255, 200, 60, 0.9)';
export const COLOR_ERROR = 'rgba(255, 90, 90, 0.9)';
export const COLOR_INFO = 'rgba(100, 200, 255, 0.9)';

/** 边框色 */
export const COLOR_BORDER = 'rgba(255, 255, 255, 0.12)';
export const COLOR_BORDER_FOCUS = 'rgba(100, 200, 255, 0.5)';

/** AI 状态球颜色 — 与 AIStatusOrb 组件保持一致 */
export const AI_ORB_COLORS = {
  idle: { core: 'rgba(100, 200, 255, 0.85)', glow: 'rgba(60, 140, 220, 0.4)' },
  listening: { core: 'rgba(80, 220, 160, 0.9)', glow: 'rgba(40, 180, 120, 0.45)' },
  thinking: { core: 'rgba(180, 130, 255, 0.9)', glow: 'rgba(140, 80, 240, 0.45)' },
  responding: { core: 'rgba(255, 180, 60, 0.9)', glow: 'rgba(240, 140, 20, 0.45)' },
} as const;


// ─── 字体规范 ───────────────────────────────────────────────

/** 字体族 — 优先使用系统无衬线字体，保证 AR 场景下的清晰度 */
export const FONT_FAMILY_PRIMARY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const FONT_FAMILY_MONO = '"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace';

/** 字号（px） */
export const FONT_SIZE_XS = 10;
export const FONT_SIZE_SM = 12;
export const FONT_SIZE_BASE = 14;
export const FONT_SIZE_MD = 16;
export const FONT_SIZE_LG = 20;
export const FONT_SIZE_XL = 24;
export const FONT_SIZE_XXL = 32;

/** 字重 */
export const FONT_WEIGHT_REGULAR = 400;
export const FONT_WEIGHT_MEDIUM = 500;
export const FONT_WEIGHT_SEMIBOLD = 600;
export const FONT_WEIGHT_BOLD = 700;

/** 行高 */
export const LINE_HEIGHT_TIGHT = 1.2;
export const LINE_HEIGHT_NORMAL = 1.5;
export const LINE_HEIGHT_RELAXED = 1.75;

// ─── 图标风格 ───────────────────────────────────────────────

/** 图标尺寸（px） */
export const ICON_SIZE_SM = 16;
export const ICON_SIZE_MD = 20;
export const ICON_SIZE_LG = 24;
export const ICON_SIZE_XL = 32;

/** 图标描边宽度（px）— 线性图标风格 */
export const ICON_STROKE_THIN = 1;
export const ICON_STROKE_REGULAR = 1.5;
export const ICON_STROKE_BOLD = 2;

// ─── 间距体系 ───────────────────────────────────────────────

/** 间距比例尺（px）— 基于 4px 基准 */
export const SPACING_XXS = 2;
export const SPACING_XS = 4;
export const SPACING_SM = 8;
export const SPACING_MD = 12;
export const SPACING_BASE = 16;
export const SPACING_LG = 24;
export const SPACING_XL = 32;
export const SPACING_XXL = 48;

// ─── 圆角 ───────────────────────────────────────────────────

/** 圆角比例尺（px） */
export const RADIUS_SM = 4;
export const RADIUS_MD = 8;
export const RADIUS_LG = 12;
export const RADIUS_XL = 16;
export const RADIUS_FULL = 9999;

// ─── 透明度 ───────────────────────────────────────────────

/** AR 叠加层透明度等级 */
export const OPACITY_OVERLAY_HEAVY = 0.85;
export const OPACITY_OVERLAY_MEDIUM = 0.65;
export const OPACITY_OVERLAY_LIGHT = 0.45;
export const OPACITY_OVERLAY_SUBTLE = 0.25;
export const OPACITY_OVERLAY_GHOST = 0.1;
