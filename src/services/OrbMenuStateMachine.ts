/**
 * OrbMenuStateMachine — Orb 菜单状态机
 *
 * 管理 AI_Status_Orb 环形菜单的完整生命周期：
 *   orb_idle → orb_hint → orb_menu_open → orb_item_focused → orb_idle
 *
 * 计时器阈值：
 *   - 0.8s 注视 Orb → hint 提示
 *   - 0.3s 继续注视 → 菜单展开
 *   - 0.5s 注视菜单项 → 聚焦高亮
 *   - 2s 视线移开 → 自动收起
 *
 * 与 SmartTaskZoneService 通过双向互斥锁协调：
 *   - STZ expanded 时阻止菜单展开
 *   - 菜单展开时锁定 STZ 禁止进入 confirm_prompt/expanded
 *
 * 需求: 2.1-2.6, 4.1-4.6, 5.1-5.4, 6.1-6.6
 */

import type { SmartTaskZoneService } from './SmartTaskZone';
import type { NavigationEngine } from './NavigationEngine';

/** Orb 菜单状态 */
export type OrbMenuState = 'orb_idle' | 'orb_hint' | 'orb_menu_open' | 'orb_item_focused';

/** Orb 菜单事件 */
export type OrbMenuEvent =
  | { type: 'GAZE_ORB_START' }
  | { type: 'GAZE_ORB_END' }
  | { type: 'GAZE_HINT_CONFIRM' }
  | { type: 'QUICK_OPEN'; source: 'side_touchpad' | 'emg_pinch' }
  | { type: 'GAZE_ITEM'; itemId: string }
  | { type: 'GAZE_ITEM_END' }
  | { type: 'CONFIRM_SELECT'; source: 'nod' | 'emg_pinch' | 'side_touchpad' }
  | { type: 'DISMISS'; source: 'gaze_away' | 'head_shake' | 'side_swipe' }
  | { type: 'APP_LAUNCH_FAILED'; appId: string; error: string };

/** 回调接口 */
export interface OrbMenuCallbacks {
  onStateChange?: (from: OrbMenuState, to: OrbMenuState) => void;
  onHintStart?: () => void;
  onMenuOpen?: () => void;
  onMenuClose?: (reason: string) => void;
  onItemFocused?: (itemId: string) => void;
  onItemUnfocused?: () => void;
  onAppLaunch?: (appId: string) => void;
  onAppLaunchError?: (appId: string, error: string) => void;
}

export class OrbMenuStateMachine {
  private state: OrbMenuState = 'orb_idle';
  private focusedItemId: string | null = null;
  private callbacks: OrbMenuCallbacks;
  private smartTaskZone: SmartTaskZoneService;
  private navigationEngine: NavigationEngine;

  // Timer IDs
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  private confirmTimer: ReturnType<typeof setTimeout> | null = null;
  private itemFocusTimer: ReturnType<typeof setTimeout> | null = null;
  private gazeAwayTimer: ReturnType<typeof setTimeout> | null = null;

  // Configurable thresholds (ms)
  readonly HINT_DELAY_MS = 800;          // 需求 2.1: 注视 Orb >0.8s → hint
  readonly CONFIRM_DELAY_MS = 300;       // 需求 2.2: 继续注视 >0.3s → menu open
  readonly ITEM_FOCUS_DELAY_MS = 500;    // 需求 4.1: 注视菜单项 >0.5s → focused
  readonly GAZE_AWAY_DELAY_MS = 2000;    // 需求 5.1: 视线移开 >2s → idle

  constructor(
    callbacks: OrbMenuCallbacks,
    smartTaskZone: SmartTaskZoneService,
    navigationEngine: NavigationEngine,
  ) {
    this.callbacks = callbacks;
    this.smartTaskZone = smartTaskZone;
    this.navigationEngine = navigationEngine;
  }

  /** 获取当前状态 */
  getState(): OrbMenuState {
    return this.state;
  }

  /** 获取当前聚焦的菜单项 ID */
  getFocusedItem(): string | null {
    return this.focusedItemId;
  }

  /** 菜单是否被阻止展开（STZ 处于 expanded 状态） */
  isMenuBlocked(): boolean {
    return this.smartTaskZone.getState() === 'expanded';
  }

  /** 处理事件，驱动状态转换 */
  send(event: OrbMenuEvent): void {
    switch (event.type) {
      case 'GAZE_ORB_START':
        this.handleGazeOrbStart();
        break;
      case 'GAZE_ORB_END':
        this.handleGazeOrbEnd();
        break;
      case 'GAZE_HINT_CONFIRM':
        this.handleGazeHintConfirm();
        break;
      case 'QUICK_OPEN':
        this.handleQuickOpen();
        break;
      case 'GAZE_ITEM':
        this.handleGazeItem(event.itemId);
        break;
      case 'GAZE_ITEM_END':
        this.handleGazeItemEnd();
        break;
      case 'CONFIRM_SELECT':
        this.handleConfirmSelect();
        break;
      case 'DISMISS':
        this.handleDismiss(event.source);
        break;
      case 'APP_LAUNCH_FAILED':
        this.handleAppLaunchFailed(event.appId, event.error);
        break;
    }
  }

  /** 清理所有计时器 */
  dispose(): void {
    this.clearAllTimers();
  }

  // --- Private event handlers ---

  /** 需求 2.1: 注视 Orb 开始 → 启动 0.8s hint 计时器 */
  private handleGazeOrbStart(): void {
    if (this.state !== 'orb_idle') return;
    if (this.isMenuBlocked()) return;

    this.startHintTimer();
  }

  /** 需求 2.6: 视线移开 Orb → 取消 hint 计时器 */
  private handleGazeOrbEnd(): void {
    if (this.state === 'orb_idle') {
      this.clearHintTimer();
    } else if (this.state === 'orb_hint') {
      this.clearConfirmTimer();
      this.transitionTo('orb_idle');
    }
  }

  /** 需求 2.2: hint 状态下继续注视确认 → 展开菜单 */
  private handleGazeHintConfirm(): void {
    if (this.state !== 'orb_hint') return;
    this.clearConfirmTimer();
    this.openMenu();
  }

  /** 需求 2.3/2.4: 触控/EMG 快速展开，跳过 hint */
  private handleQuickOpen(): void {
    if (this.state !== 'orb_idle' && this.state !== 'orb_hint') return;
    if (this.isMenuBlocked()) return;

    this.clearHintTimer();
    this.clearConfirmTimer();
    this.openMenu();
  }

  /** 需求 4.1: 注视菜单项 → 启动 0.5s 聚焦计时器 */
  private handleGazeItem(itemId: string): void {
    if (this.state !== 'orb_menu_open' && this.state !== 'orb_item_focused') return;

    // Reset gaze away timer since user is looking at menu
    this.clearGazeAwayTimer();

    // If already focused on a different item, unfocus first
    if (this.state === 'orb_item_focused' && this.focusedItemId !== itemId) {
      this.unfocusItem();
      this.transitionTo('orb_menu_open');
    }

    // Start focus timer for the new item
    this.clearItemFocusTimer();
    this.startItemFocusTimer(itemId);
  }

  /** 需求 4.5: 视线移开菜单项 → 取消聚焦 */
  private handleGazeItemEnd(): void {
    if (this.state === 'orb_item_focused') {
      this.unfocusItem();
      this.transitionTo('orb_menu_open');
      this.startGazeAwayTimer();
    } else if (this.state === 'orb_menu_open') {
      this.clearItemFocusTimer();
      this.startGazeAwayTimer();
    }
  }

  /** 需求 4.2/4.3/4.4: 确认选择 → 启动应用 → 收起菜单 */
  private handleConfirmSelect(): void {
    if (this.state !== 'orb_item_focused' || !this.focusedItemId) return;

    const appId = this.focusedItemId;
    this.callbacks.onAppLaunch?.(appId);

    try {
      this.navigationEngine.navigate(appId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.handleAppLaunchFailed(appId, errorMsg);
      return;
    }

    this.unfocusItem();
    this.closeMenu('app_launched');
  }

  /** 需求 5.1/5.2/5.3: 收起菜单 */
  private handleDismiss(source: 'gaze_away' | 'head_shake' | 'side_swipe'): void {
    if (this.state === 'orb_menu_open' || this.state === 'orb_item_focused') {
      if (this.state === 'orb_item_focused') {
        this.unfocusItem();
      }
      this.closeMenu(source);
    } else if (this.state === 'orb_hint') {
      this.clearConfirmTimer();
      this.transitionTo('orb_idle');
    }
  }

  /** 需求 4.6: 应用启动失败 → 保持菜单展开，通知错误 */
  private handleAppLaunchFailed(appId: string, error: string): void {
    if (this.state === 'orb_menu_open' || this.state === 'orb_item_focused') {
      // Stay in menu open state
      if (this.state === 'orb_item_focused') {
        this.unfocusItem();
        this.transitionTo('orb_menu_open');
      }
      this.callbacks.onAppLaunchError?.(appId, error);
    }
  }

  // --- Private helpers ---

  private openMenu(): void {
    this.transitionTo('orb_menu_open');
    this.callbacks.onMenuOpen?.();
    this.lockSmartTaskZone(true);
    this.startGazeAwayTimer();
  }

  private closeMenu(reason: string): void {
    this.clearAllTimers();
    this.transitionTo('orb_idle');
    this.callbacks.onMenuClose?.(reason);
    this.lockSmartTaskZone(false);
  }

  private unfocusItem(): void {
    this.focusedItemId = null;
    this.clearItemFocusTimer();
    this.callbacks.onItemUnfocused?.();
  }

  private transitionTo(newState: OrbMenuState): void {
    if (this.state === newState) return;
    const from = this.state;
    this.state = newState;
    this.callbacks.onStateChange?.(from, newState);
  }

  /** 需求 6.3: 菜单展开时锁定 STZ */
  private lockSmartTaskZone(locked: boolean): void {
    if ('setOrbMenuLock' in this.smartTaskZone) {
      (this.smartTaskZone as SmartTaskZoneService & { setOrbMenuLock(locked: boolean): void }).setOrbMenuLock(locked);
    }
  }

  // --- Timer management ---

  private startHintTimer(): void {
    this.clearHintTimer();
    this.hintTimer = setTimeout(() => {
      this.hintTimer = null;
      if (this.state === 'orb_idle' && !this.isMenuBlocked()) {
        this.transitionTo('orb_hint');
        this.callbacks.onHintStart?.();
        this.startConfirmTimer();
      }
    }, this.HINT_DELAY_MS);
  }

  private clearHintTimer(): void {
    if (this.hintTimer !== null) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
  }

  private startConfirmTimer(): void {
    this.clearConfirmTimer();
    this.confirmTimer = setTimeout(() => {
      this.confirmTimer = null;
      if (this.state === 'orb_hint') {
        this.openMenu();
      }
    }, this.CONFIRM_DELAY_MS);
  }

  private clearConfirmTimer(): void {
    if (this.confirmTimer !== null) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = null;
    }
  }

  private startItemFocusTimer(itemId: string): void {
    this.clearItemFocusTimer();
    this.itemFocusTimer = setTimeout(() => {
      this.itemFocusTimer = null;
      if (this.state === 'orb_menu_open') {
        this.focusedItemId = itemId;
        this.transitionTo('orb_item_focused');
        this.callbacks.onItemFocused?.(itemId);
      }
    }, this.ITEM_FOCUS_DELAY_MS);
  }

  private clearItemFocusTimer(): void {
    if (this.itemFocusTimer !== null) {
      clearTimeout(this.itemFocusTimer);
      this.itemFocusTimer = null;
    }
  }

  private startGazeAwayTimer(): void {
    this.clearGazeAwayTimer();
    this.gazeAwayTimer = setTimeout(() => {
      this.gazeAwayTimer = null;
      if (this.state === 'orb_menu_open' || this.state === 'orb_item_focused') {
        this.send({ type: 'DISMISS', source: 'gaze_away' });
      }
    }, this.GAZE_AWAY_DELAY_MS);
  }

  private clearGazeAwayTimer(): void {
    if (this.gazeAwayTimer !== null) {
      clearTimeout(this.gazeAwayTimer);
      this.gazeAwayTimer = null;
    }
  }

  private clearAllTimers(): void {
    this.clearHintTimer();
    this.clearConfirmTimer();
    this.clearItemFocusTimer();
    this.clearGazeAwayTimer();
  }
}
