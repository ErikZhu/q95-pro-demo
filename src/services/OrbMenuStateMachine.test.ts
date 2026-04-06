import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrbMenuStateMachine } from './OrbMenuStateMachine';
import type { OrbMenuState, OrbMenuCallbacks } from './OrbMenuStateMachine';
import { SmartTaskZoneService } from './SmartTaskZone';
import { NavigationEngine } from './NavigationEngine';

describe('OrbMenuStateMachine', () => {
  let sm: OrbMenuStateMachine;
  let stz: SmartTaskZoneService;
  let nav: NavigationEngine;
  let callbacks: Required<OrbMenuCallbacks>;
  let stateChanges: Array<{ from: OrbMenuState; to: OrbMenuState }>;

  beforeEach(() => {
    vi.useFakeTimers();
    stz = new SmartTaskZoneService();
    nav = new NavigationEngine();
    stateChanges = [];
    callbacks = {
      onStateChange: vi.fn((from, to) => stateChanges.push({ from, to })),
      onHintStart: vi.fn(),
      onMenuOpen: vi.fn(),
      onMenuClose: vi.fn(),
      onItemFocused: vi.fn(),
      onItemUnfocused: vi.fn(),
      onAppLaunch: vi.fn(),
      onAppLaunchError: vi.fn(),
    };
    sm = new OrbMenuStateMachine(callbacks, stz, nav);
  });

  afterEach(() => {
    sm.dispose();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts in orb_idle', () => {
      expect(sm.getState()).toBe('orb_idle');
    });

    it('has no focused item', () => {
      expect(sm.getFocusedItem()).toBeNull();
    });

    it('is not blocked when STZ is compact', () => {
      expect(sm.isMenuBlocked()).toBe(false);
    });
  });

  // 需求 2.1: 注视 Orb >0.8s → hint
  describe('GAZE_ORB_START → orb_hint (requirement 2.1)', () => {
    it('transitions to orb_hint after 0.8s gaze', () => {
      sm.send({ type: 'GAZE_ORB_START' });
      expect(sm.getState()).toBe('orb_idle');

      vi.advanceTimersByTime(800);
      expect(sm.getState()).toBe('orb_hint');
      expect(callbacks.onHintStart).toHaveBeenCalledTimes(1);
    });

    it('does not transition if gaze ends before 0.8s', () => {
      sm.send({ type: 'GAZE_ORB_START' });
      vi.advanceTimersByTime(500);
      sm.send({ type: 'GAZE_ORB_END' });
      vi.advanceTimersByTime(500);
      expect(sm.getState()).toBe('orb_idle');
    });
  });

  // 需求 2.2: hint → menu_open after 0.3s continued gaze
  describe('orb_hint → orb_menu_open (requirement 2.2)', () => {
    it('auto-opens menu after 0.3s in hint state', () => {
      sm.send({ type: 'GAZE_ORB_START' });
      vi.advanceTimersByTime(800); // → orb_hint
      expect(sm.getState()).toBe('orb_hint');

      vi.advanceTimersByTime(300); // → orb_menu_open
      expect(sm.getState()).toBe('orb_menu_open');
      expect(callbacks.onMenuOpen).toHaveBeenCalledTimes(1);
    });

    it('GAZE_HINT_CONFIRM opens menu immediately from hint', () => {
      sm.send({ type: 'GAZE_ORB_START' });
      vi.advanceTimersByTime(800);

      sm.send({ type: 'GAZE_HINT_CONFIRM' });
      expect(sm.getState()).toBe('orb_menu_open');
    });
  });

  // 需求 2.6: 视线移开 hint → 取消
  describe('GAZE_ORB_END cancels hint (requirement 2.6)', () => {
    it('returns to orb_idle when gaze ends during hint', () => {
      sm.send({ type: 'GAZE_ORB_START' });
      vi.advanceTimersByTime(800);
      expect(sm.getState()).toBe('orb_hint');

      sm.send({ type: 'GAZE_ORB_END' });
      expect(sm.getState()).toBe('orb_idle');
    });
  });

  // 需求 2.3/2.4: QUICK_OPEN 跳过 hint
  describe('QUICK_OPEN skips hint (requirement 2.3, 2.4)', () => {
    it('opens menu directly from orb_idle', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      expect(sm.getState()).toBe('orb_menu_open');
      expect(callbacks.onMenuOpen).toHaveBeenCalledTimes(1);
    });

    it('opens menu from orb_hint via EMG', () => {
      sm.send({ type: 'GAZE_ORB_START' });
      vi.advanceTimersByTime(800);
      expect(sm.getState()).toBe('orb_hint');

      sm.send({ type: 'QUICK_OPEN', source: 'emg_pinch' });
      expect(sm.getState()).toBe('orb_menu_open');
    });

    it('does not open when STZ is expanded', () => {
      // Force STZ to expanded state
      stz.onGazeEvent({ target: 'smart_task_zone', duration: 0, isGazing: true });
      vi.advanceTimersByTime(1000);
      stz.onConfirmGesture('nod');
      expect(stz.getState()).toBe('expanded');

      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      expect(sm.getState()).toBe('orb_idle');
    });
  });

  // 需求 4.1: 注视菜单项 >0.5s → focused
  describe('GAZE_ITEM → orb_item_focused (requirement 4.1)', () => {
    it('focuses item after 0.5s gaze', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'GAZE_ITEM', itemId: 'camera' });

      vi.advanceTimersByTime(500);
      expect(sm.getState()).toBe('orb_item_focused');
      expect(sm.getFocusedItem()).toBe('camera');
      expect(callbacks.onItemFocused).toHaveBeenCalledWith('camera');
    });

    it('does not focus if gaze ends before 0.5s', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'GAZE_ITEM', itemId: 'camera' });
      vi.advanceTimersByTime(300);
      sm.send({ type: 'GAZE_ITEM_END' });
      vi.advanceTimersByTime(300);
      expect(sm.getState()).toBe('orb_menu_open');
      expect(sm.getFocusedItem()).toBeNull();
    });
  });

  // 需求 4.5: 视线移开菜单项 → 取消聚焦
  describe('GAZE_ITEM_END unfocuses (requirement 4.5)', () => {
    it('returns to orb_menu_open when gaze leaves focused item', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'GAZE_ITEM', itemId: 'music' });
      vi.advanceTimersByTime(500);
      expect(sm.getState()).toBe('orb_item_focused');

      sm.send({ type: 'GAZE_ITEM_END' });
      expect(sm.getState()).toBe('orb_menu_open');
      expect(sm.getFocusedItem()).toBeNull();
      expect(callbacks.onItemUnfocused).toHaveBeenCalled();
    });
  });

  // 需求 4.2/4.3/4.4: CONFIRM_SELECT → 启动应用
  describe('CONFIRM_SELECT → app launch (requirement 4.2, 4.3, 4.4)', () => {
    it('navigates and closes menu on confirm', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'GAZE_ITEM', itemId: 'camera' });
      vi.advanceTimersByTime(500);

      sm.send({ type: 'CONFIRM_SELECT', source: 'nod' });
      expect(sm.getState()).toBe('orb_idle');
      expect(callbacks.onAppLaunch).toHaveBeenCalledWith('camera');
      expect(callbacks.onMenuClose).toHaveBeenCalledWith('app_launched');
      expect(nav.getCurrentRoute()).toBe('camera');
    });

    it('ignores CONFIRM_SELECT when not in orb_item_focused', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'CONFIRM_SELECT', source: 'nod' });
      expect(sm.getState()).toBe('orb_menu_open');
    });
  });

  // 需求 4.6: APP_LAUNCH_FAILED → 保持菜单展开
  describe('APP_LAUNCH_FAILED (requirement 4.6)', () => {
    it('stays in menu_open and notifies error', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'APP_LAUNCH_FAILED', appId: 'broken_app', error: 'crash' });

      expect(sm.getState()).toBe('orb_menu_open');
      expect(callbacks.onAppLaunchError).toHaveBeenCalledWith('broken_app', 'crash');
    });

    it('handles launch failure during CONFIRM_SELECT with bad route', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'GAZE_ITEM', itemId: 'nonexistent_route' });
      vi.advanceTimersByTime(500);

      sm.send({ type: 'CONFIRM_SELECT', source: 'emg_pinch' });
      // NavigationEngine throws for unknown routes → stays in menu_open
      expect(sm.getState()).toBe('orb_menu_open');
      expect(callbacks.onAppLaunchError).toHaveBeenCalled();
    });
  });

  // 需求 5.1: 视线移开 >2s → 自动收起
  describe('gaze away >2s → auto dismiss (requirement 5.1)', () => {
    it('auto-dismisses after 2s gaze away from menu_open', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      // GAZE_ITEM_END triggers gaze away timer
      sm.send({ type: 'GAZE_ITEM_END' });

      vi.advanceTimersByTime(2000);
      expect(sm.getState()).toBe('orb_idle');
      expect(callbacks.onMenuClose).toHaveBeenCalledWith('gaze_away');
    });

    it('resets gaze away timer when gazing at item', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'GAZE_ITEM_END' });
      vi.advanceTimersByTime(1500);

      // Gaze at an item resets the gaze away timer — menu stays open
      sm.send({ type: 'GAZE_ITEM', itemId: 'music' });
      vi.advanceTimersByTime(1500);
      // After 500ms the item gets focused, so state is orb_item_focused (not dismissed)
      expect(sm.getState()).toBe('orb_item_focused');
      expect(sm.getFocusedItem()).toBe('music');
    });
  });

  // 需求 5.2/5.3: 摇头/侧滑 → 立即收起
  describe('DISMISS gestures (requirement 5.2, 5.3)', () => {
    it('head_shake dismisses from menu_open', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'DISMISS', source: 'head_shake' });
      expect(sm.getState()).toBe('orb_idle');
      expect(callbacks.onMenuClose).toHaveBeenCalledWith('head_shake');
    });

    it('side_swipe dismisses from menu_open', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'DISMISS', source: 'side_swipe' });
      expect(sm.getState()).toBe('orb_idle');
      expect(callbacks.onMenuClose).toHaveBeenCalledWith('side_swipe');
    });

    it('dismisses from orb_item_focused', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'GAZE_ITEM', itemId: 'camera' });
      vi.advanceTimersByTime(500);
      expect(sm.getState()).toBe('orb_item_focused');

      sm.send({ type: 'DISMISS', source: 'head_shake' });
      expect(sm.getState()).toBe('orb_idle');
      expect(sm.getFocusedItem()).toBeNull();
    });

    it('dismisses from orb_hint', () => {
      sm.send({ type: 'GAZE_ORB_START' });
      vi.advanceTimersByTime(800);
      expect(sm.getState()).toBe('orb_hint');

      sm.send({ type: 'DISMISS', source: 'head_shake' });
      expect(sm.getState()).toBe('orb_idle');
    });
  });

  // 需求 6.2: STZ expanded 时阻止展开
  describe('mutual exclusion with SmartTaskZone (requirement 6.2)', () => {
    it('blocks menu when STZ is expanded', () => {
      // Get STZ to expanded
      stz.onGazeEvent({ target: 'smart_task_zone', duration: 0, isGazing: true });
      vi.advanceTimersByTime(1000);
      stz.onConfirmGesture('nod');
      expect(stz.getState()).toBe('expanded');

      expect(sm.isMenuBlocked()).toBe(true);
      sm.send({ type: 'GAZE_ORB_START' });
      vi.advanceTimersByTime(1200);
      expect(sm.getState()).toBe('orb_idle');
    });
  });

  // Full state cycle
  describe('full state machine cycle', () => {
    it('completes orb_idle → orb_hint → orb_menu_open → orb_item_focused → orb_idle', () => {
      // idle → hint
      sm.send({ type: 'GAZE_ORB_START' });
      vi.advanceTimersByTime(800);
      expect(sm.getState()).toBe('orb_hint');

      // hint → menu_open
      vi.advanceTimersByTime(300);
      expect(sm.getState()).toBe('orb_menu_open');

      // menu_open → item_focused
      sm.send({ type: 'GAZE_ITEM', itemId: 'settings' });
      vi.advanceTimersByTime(500);
      expect(sm.getState()).toBe('orb_item_focused');
      expect(sm.getFocusedItem()).toBe('settings');

      // item_focused → idle (via confirm)
      sm.send({ type: 'CONFIRM_SELECT', source: 'side_touchpad' });
      expect(sm.getState()).toBe('orb_idle');
      expect(nav.getCurrentRoute()).toBe('settings');

      expect(stateChanges).toEqual([
        { from: 'orb_idle', to: 'orb_hint' },
        { from: 'orb_hint', to: 'orb_menu_open' },
        { from: 'orb_menu_open', to: 'orb_item_focused' },
        { from: 'orb_item_focused', to: 'orb_idle' },
      ]);
    });
  });

  describe('dispose', () => {
    it('clears all timers on dispose', () => {
      sm.send({ type: 'GAZE_ORB_START' });
      sm.dispose();
      vi.advanceTimersByTime(5000);
      expect(sm.getState()).toBe('orb_idle');
    });

    it('clears gaze away timer on dispose', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'GAZE_ITEM_END' });
      sm.dispose();
      vi.advanceTimersByTime(5000);
      // State won't change to idle via timer since it was cleared
      // But state is still orb_menu_open since dispose only clears timers
      expect(sm.getState()).toBe('orb_menu_open');
    });
  });

  describe('switching focused items', () => {
    it('switches focus from one item to another', () => {
      sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
      sm.send({ type: 'GAZE_ITEM', itemId: 'camera' });
      vi.advanceTimersByTime(500);
      expect(sm.getFocusedItem()).toBe('camera');

      // Gaze at different item while focused
      sm.send({ type: 'GAZE_ITEM', itemId: 'music' });
      expect(sm.getState()).toBe('orb_menu_open'); // unfocused first
      expect(sm.getFocusedItem()).toBeNull();

      vi.advanceTimersByTime(500);
      expect(sm.getState()).toBe('orb_item_focused');
      expect(sm.getFocusedItem()).toBe('music');
    });
  });
});
