/**
 * Q95 Pro 导航流程与页面跳转逻辑
 *
 * 定义功能模块路由、模块间导航转换规则、返回逻辑和深度链接。
 * NavigationEngine 和 Launcher 应引用此文件中的常量。
 *
 * 需求: 21.4
 */

// ─── 路由定义 ────────────────────────────────────────────────

/** 所有功能模块路由标识 */
export type ModuleRoute =
  | 'launcher'
  | 'ar_navigation'
  | 'camera'
  | 'music'
  | 'translator'
  | 'teleprompter'
  | 'health'
  | 'messaging'
  | 'settings'
  | 'notification_center'
  | 'ai_assistant'
  | 'phone_relay'
  | 'app_store';

/** 路由元信息 */
export interface RouteInfo {
  route: ModuleRoute;
  /** 显示名称 */
  label: string;
  /** 图标标识（供 Launcher 使用） */
  icon: string;
  /** 是否在 Launcher 快捷入口中显示（最多 6 个，需求 5.3） */
  launcherShortcut: boolean;
  /** 是否支持深度链接 */
  deepLinkable: boolean;
}

/** 全部路由注册表 */
export const ROUTE_REGISTRY: RouteInfo[] = [
  { route: 'launcher',            label: '主界面',     icon: 'home',         launcherShortcut: false, deepLinkable: false },
  { route: 'ar_navigation',       label: 'AR 导航',    icon: 'navigation',   launcherShortcut: true,  deepLinkable: true },
  { route: 'camera',              label: '相机',       icon: 'camera',       launcherShortcut: true,  deepLinkable: true },
  { route: 'music',               label: '音乐',       icon: 'music',        launcherShortcut: true,  deepLinkable: true },
  { route: 'translator',          label: '翻译',       icon: 'translate',    launcherShortcut: true,  deepLinkable: true },
  { route: 'teleprompter',        label: '提词器',     icon: 'teleprompter', launcherShortcut: true,  deepLinkable: true },
  { route: 'health',              label: '健康',       icon: 'heart',        launcherShortcut: true,  deepLinkable: true },
  { route: 'messaging',           label: '消息',       icon: 'message',      launcherShortcut: false, deepLinkable: true },
  { route: 'settings',            label: '设置',       icon: 'settings',     launcherShortcut: false, deepLinkable: true },
  { route: 'notification_center', label: '通知中心',   icon: 'bell',         launcherShortcut: false, deepLinkable: false },
  { route: 'ai_assistant',        label: 'AI 助手',    icon: 'assistant',    launcherShortcut: false, deepLinkable: false },
  { route: 'phone_relay',         label: '手机信息',   icon: 'phone',        launcherShortcut: false, deepLinkable: true },
  { route: 'app_store',           label: '应用商店',   icon: 'store',        launcherShortcut: false, deepLinkable: false },
];

/** Launcher 快捷入口路由（最多 6 个） */
export const LAUNCHER_SHORTCUTS: ModuleRoute[] = ROUTE_REGISTRY
  .filter((r) => r.launcherShortcut)
  .map((r) => r.route);

// ─── 导航转换规则 ────────────────────────────────────────────

/** 导航转换类型 */
export type TransitionType = 'push' | 'replace' | 'overlay' | 'modal';

/** 模块间导航转换定义 */
export interface NavigationTransition {
  from: ModuleRoute | '*';
  to: ModuleRoute;
  type: TransitionType;
  /** 转换描述 */
  description: string;
}

/** 预定义的导航转换规则 */
export const NAVIGATION_TRANSITIONS: NavigationTransition[] = [
  // Launcher → 各应用（标准 push）
  { from: 'launcher', to: 'ar_navigation',  type: 'push', description: '从主界面进入 AR 导航' },
  { from: 'launcher', to: 'camera',         type: 'push', description: '从主界面进入相机' },
  { from: 'launcher', to: 'music',          type: 'push', description: '从主界面进入音乐' },
  { from: 'launcher', to: 'translator',     type: 'push', description: '从主界面进入翻译' },
  { from: 'launcher', to: 'teleprompter',   type: 'push', description: '从主界面进入提词器' },
  { from: 'launcher', to: 'health',         type: 'push', description: '从主界面进入健康' },
  { from: 'launcher', to: 'messaging',      type: 'push', description: '从主界面进入消息' },
  { from: 'launcher', to: 'settings',       type: 'push', description: '从主界面进入设置' },
  { from: 'launcher', to: 'phone_relay',    type: 'push', description: '从主界面进入手机信息' },
  { from: 'launcher', to: 'app_store',      type: 'push', description: '从主界面进入应用商店' },

  // 全局覆盖层（任意页面可触发）
  { from: '*', to: 'notification_center', type: 'overlay', description: '下滑打开通知中心（需求 7.3）' },
  { from: '*', to: 'ai_assistant',        type: 'overlay', description: '唤醒词/长按激活 AI 助手（需求 8.1）' },

  // 跨模块跳转
  { from: 'notification_center', to: 'messaging',    type: 'push',  description: '从通知跳转到消息详情' },
  { from: 'notification_center', to: 'phone_relay',  type: 'push',  description: '从通知跳转到信息卡片' },
  { from: 'ai_assistant',        to: 'ar_navigation', type: 'push',  description: 'AI 助手启动导航' },
  { from: 'ai_assistant',        to: 'music',         type: 'push',  description: 'AI 助手控制音乐' },
  { from: 'ai_assistant',        to: 'camera',        type: 'push',  description: 'AI 助手打开相机' },
  { from: 'ai_assistant',        to: 'messaging',     type: 'push',  description: 'AI 助手打开消息' },
  { from: 'phone_relay',         to: 'messaging',     type: 'push',  description: '从微信卡片进入消息' },
  { from: 'phone_relay',         to: 'music',         type: 'push',  description: '从音乐卡片进入播放器' },
  { from: 'phone_relay',         to: 'ar_navigation', type: 'push',  description: '从打车/机票卡片进入导航' },

  // 来电模态
  { from: '*', to: 'messaging', type: 'modal', description: '来电弹窗（需求 17.3）' },
];

// ─── 返回导航规则 ────────────────────────────────────────────

/**
 * 返回导航规则（需求 5.5）
 *
 * - 任意应用页面 → goBack() → 上一页（栈弹出）
 * - 任意应用页面 → goHome() → launcher（栈清空）
 * - launcher 页面 → goBack() → 无操作（已是根页面）
 * - overlay 类型页面 → dismiss → 恢复底层页面
 */
export const BACK_NAVIGATION_RULES = {
  /** 默认返回行为：弹出路由栈顶 */
  defaultBehavior: 'stack_pop' as const,
  /** 根路由：不可再返回 */
  rootRoute: 'launcher' as const,
  /** 一键回主界面手势 */
  homeGestures: ['physical_button_double_press', 'voice_home'] as const,
  /** overlay 页面关闭方式 */
  overlayDismiss: ['swipe_up', 'back_gesture', 'gaze_away'] as const,
} as const;

// ─── 深度链接 ────────────────────────────────────────────────

/** 深度链接定义 — 供 AI 助手和通知跳转使用 */
export interface DeepLink {
  /** 链接路径（如 'q95://music/play'） */
  path: string;
  /** 目标路由 */
  route: ModuleRoute;
  /** 携带参数描述 */
  params?: string[];
  /** 说明 */
  description: string;
}

export const DEEP_LINKS: DeepLink[] = [
  { path: 'q95://navigation/start', route: 'ar_navigation', params: ['destination'], description: '启动导航到指定目的地' },
  { path: 'q95://camera/photo',     route: 'camera',        description: '打开相机并拍照' },
  { path: 'q95://camera/video',     route: 'camera',        params: ['action'], description: '打开相机并开始录像' },
  { path: 'q95://music/play',       route: 'music',         params: ['trackId'], description: '播放指定曲目' },
  { path: 'q95://music/control',    route: 'music',         params: ['action'], description: '音乐播放控制（play/pause/next/prev）' },
  { path: 'q95://translator/start', route: 'translator',    params: ['sourceLang', 'targetLang'], description: '启动翻译' },
  { path: 'q95://teleprompter/load', route: 'teleprompter', params: ['textId'], description: '加载提词文本' },
  { path: 'q95://health/workout',   route: 'health',        params: ['type'], description: '开始运动记录' },
  { path: 'q95://messaging/chat',   route: 'messaging',     params: ['contactId'], description: '打开与指定联系人的对话' },
  { path: 'q95://messaging/call',   route: 'messaging',     params: ['contactId'], description: '拨打电话' },
  { path: 'q95://settings',         route: 'settings',      params: ['section'], description: '打开设置指定分类' },
  { path: 'q95://phone-relay/card', route: 'phone_relay',   params: ['cardId'], description: '打开指定信息卡片' },
];
