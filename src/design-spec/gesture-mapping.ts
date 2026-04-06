/**
 * Q95 Pro 手势映射表与操作规范
 *
 * 定义六种交互方式的手势-动作映射、上下文覆盖规则和优先级常量。
 * 所有交互组件应引用此文件中的映射表，确保手势行为一致。
 *
 * 需求: 21.2
 */

import type { InputSource } from '../types/interaction';

// ─── 通用动作类型 ────────────────────────────────────────────

/** 系统级动作标识 */
export type SystemAction =
  | 'select'
  | 'back'
  | 'home'
  | 'scroll_up'
  | 'scroll_down'
  | 'scroll_left'
  | 'scroll_right'
  | 'confirm'
  | 'cancel'
  | 'open_notifications'
  | 'toggle_play_pause'
  | 'next_track'
  | 'prev_track'
  | 'volume_up'
  | 'volume_down'
  | 'take_photo'
  | 'start_recording'
  | 'stop_recording'
  | 'activate_assistant'
  | 'dismiss'
  | 'expand'
  | 'collapse'
  | 'cursor_move'
  | 'focus_shift';

// ─── 手势映射条目 ────────────────────────────────────────────

export interface GestureMapping {
  /** 手势名称（如 'single_tap', 'swipe_up'） */
  gesture: string;
  /** 映射到的系统动作 */
  action: SystemAction;
  /** 手势描述 */
  description: string;
}

/** 上下文覆盖：特定场景下的手势行为变更 */
export interface ContextOverride {
  /** 适用的上下文/场景 */
  context: string;
  /** 被覆盖的手势名称 */
  gesture: string;
  /** 覆盖后的动作 */
  action: SystemAction;
  /** 覆盖说明 */
  description: string;
}

// ─── 侧边触控板 (Side Touchpad) ─────────────────────────────

export const SIDE_TOUCHPAD_GESTURES: GestureMapping[] = [
  { gesture: 'single_tap', action: 'select', description: '单击 — 选择/确认当前焦点项' },
  { gesture: 'double_tap', action: 'toggle_play_pause', description: '双击 — 切换播放/暂停' },
  { gesture: 'long_press', action: 'back', description: '长按 — 返回上一页' },
  { gesture: 'swipe_forward', action: 'scroll_down', description: '向前滑动 — 向下滚动/下一项' },
  { gesture: 'swipe_backward', action: 'scroll_up', description: '向后滑动 — 向上滚动/上一项' },
  { gesture: 'swipe_down', action: 'open_notifications', description: '向下滑动 — 打开通知中心' },
];

export const SIDE_TOUCHPAD_OVERRIDES: ContextOverride[] = [
  { context: 'music_player', gesture: 'swipe_forward', action: 'next_track', description: '音乐播放中向前滑动切换下一曲' },
  { context: 'music_player', gesture: 'swipe_backward', action: 'prev_track', description: '音乐播放中向后滑动切换上一曲' },
  { context: 'teleprompter', gesture: 'swipe_forward', action: 'scroll_down', description: '提词器中向前滑动加速滚动' },
  { context: 'teleprompter', gesture: 'swipe_backward', action: 'scroll_up', description: '提词器中向后滑动减速滚动' },
  { context: 'phone_relay', gesture: 'swipe_forward', action: 'scroll_right', description: '信息卡片中向前滑动浏览下一张' },
  { context: 'phone_relay', gesture: 'swipe_backward', action: 'scroll_left', description: '信息卡片中向后滑动浏览上一张' },
  { context: 'ar_navigation', gesture: 'single_tap', action: 'confirm', description: '导航中单击确认路线选择' },
];

// ─── 语音输入 (Voice) ────────────────────────────────────────

export const VOICE_GESTURES: GestureMapping[] = [
  { gesture: 'wake_word', action: 'activate_assistant', description: '唤醒词 — 激活 AI 语音助手' },
  { gesture: 'voice_command', action: 'confirm', description: '语音指令 — 执行识别到的意图' },
  { gesture: 'voice_cancel', action: 'cancel', description: '"取消" — 取消当前操作' },
  { gesture: 'voice_back', action: 'back', description: '"返回" — 返回上一页' },
  { gesture: 'voice_home', action: 'home', description: '"回到主页" — 返回 Launcher' },
];

// ─── EMG 手环 (EMG Band) ─────────────────────────────────────

export const EMG_BAND_GESTURES: GestureMapping[] = [
  { gesture: 'pinch', action: 'select', description: '捏合 — 选择/确认' },
  { gesture: 'double_pinch', action: 'confirm', description: '双击捏合 — 强确认（展开 Smart Task Zone）' },
  { gesture: 'fist', action: 'back', description: '握拳 — 返回' },
  { gesture: 'spread', action: 'dismiss', description: '张开手掌 — 关闭/取消当前浮层' },
  { gesture: 'wrist_rotate_cw', action: 'volume_up', description: '手腕顺时针旋转 — 增大音量' },
  { gesture: 'wrist_rotate_ccw', action: 'volume_down', description: '手腕逆时针旋转 — 减小音量' },
];

export const EMG_BAND_OVERRIDES: ContextOverride[] = [
  { context: 'smart_task_zone_confirm', gesture: 'double_pinch', action: 'expand', description: '确认提示时双击捏合展开任务区' },
  { context: 'camera', gesture: 'pinch', action: 'take_photo', description: '相机模式下捏合拍照' },
  { context: 'camera', gesture: 'fist', action: 'start_recording', description: '相机模式下握拳开始录像' },
  { context: 'camera', gesture: 'spread', action: 'stop_recording', description: '相机模式下张开手掌停止录像' },
];

// ─── 摄像头手势 (Camera Gesture) ─────────────────────────────

export const CAMERA_GESTURE_GESTURES: GestureMapping[] = [
  { gesture: 'palm_open', action: 'dismiss', description: '张开手掌 — 关闭/取消' },
  { gesture: 'palm_swipe_left', action: 'scroll_left', description: '手掌左滑 — 向左切换' },
  { gesture: 'palm_swipe_right', action: 'scroll_right', description: '手掌右滑 — 向右切换' },
  { gesture: 'thumbs_up', action: 'confirm', description: '竖起大拇指 — 确认' },
  { gesture: 'victory_sign', action: 'take_photo', description: '比 V 手势 — 拍照' },
];

/** 摄像头手势识别最大延迟（ms）— 需求 6.7 */
export const CAMERA_GESTURE_MAX_LATENCY_MS = 200;

// ─── 头部追踪 (Head Tracking) ────────────────────────────────

export const HEAD_TRACKING_GESTURES: GestureMapping[] = [
  { gesture: 'head_move', action: 'cursor_move', description: '头部移动 — 光标/焦点跟随' },
  { gesture: 'nod', action: 'confirm', description: '点头 — 确认' },
  { gesture: 'head_shake', action: 'cancel', description: '摇头 — 取消/拒绝' },
  { gesture: 'head_tilt_left', action: 'focus_shift', description: '头部左倾 — 焦点左移' },
  { gesture: 'head_tilt_right', action: 'focus_shift', description: '头部右倾 — 焦点右移' },
];

export const HEAD_TRACKING_OVERRIDES: ContextOverride[] = [
  { context: 'smart_task_zone_confirm', gesture: 'nod', action: 'expand', description: '确认提示时点头展开任务区' },
  { context: 'smart_task_zone_expanded', gesture: 'head_shake', action: 'collapse', description: '展开模式下摇头收回任务区' },
  { context: 'incoming_call', gesture: 'nod', action: 'confirm', description: '来电时点头接听' },
  { context: 'incoming_call', gesture: 'head_shake', action: 'dismiss', description: '来电时摇头拒接' },
];

// ─── 物理按键 (Physical Button) ──────────────────────────────

export const PHYSICAL_BUTTON_GESTURES: GestureMapping[] = [
  { gesture: 'single_press', action: 'select', description: '单按 — 选择/确认' },
  { gesture: 'double_press', action: 'home', description: '双按 — 返回主界面' },
  { gesture: 'long_press', action: 'activate_assistant', description: '长按 — 激活 AI 语音助手' },
  { gesture: 'triple_press', action: 'take_photo', description: '三连按 — 快速拍照' },
];

// ─── 汇总映射表 ─────────────────────────────────────────────

/** 按输入源索引的完整手势映射 */
export const GESTURE_MAP: Record<InputSource, GestureMapping[]> = {
  side_touchpad: SIDE_TOUCHPAD_GESTURES,
  voice: VOICE_GESTURES,
  emg_band: EMG_BAND_GESTURES,
  camera_gesture: CAMERA_GESTURE_GESTURES,
  head_tracking: HEAD_TRACKING_GESTURES,
  physical_button: PHYSICAL_BUTTON_GESTURES,
} as const;

/** 按输入源索引的上下文覆盖规则（无覆盖的输入源为空数组） */
export const CONTEXT_OVERRIDES: Record<InputSource, ContextOverride[]> = {
  side_touchpad: SIDE_TOUCHPAD_OVERRIDES,
  voice: [],
  emg_band: EMG_BAND_OVERRIDES,
  camera_gesture: [],
  head_tracking: HEAD_TRACKING_OVERRIDES,
  physical_button: [],
} as const;

// ─── 优先级常量 ─────────────────────────────────────────────

/**
 * 交互输入优先级顺序（从高到低）
 * 与 InteractionManager 中的 DEFAULT_PRIORITY_RULES 保持一致。
 *
 * 需求: 6.2
 */
export const INPUT_PRIORITY_ORDER: InputSource[] = [
  'physical_button',
  'voice',
  'emg_band',
  'side_touchpad',
  'camera_gesture',
  'head_tracking',
];

/** 输入源优先级数值映射 */
export const INPUT_PRIORITY_VALUES: Record<InputSource, number> = {
  physical_button: 6,
  voice: 5,
  emg_band: 4,
  side_touchpad: 3,
  camera_gesture: 2,
  head_tracking: 1,
} as const;

/** 输入响应最大延迟（ms）— 需求 6.3 */
export const MAX_INPUT_LATENCY_MS = 100;
