import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { OrbMenuStateMachine } from './OrbMenuStateMachine';
import type { OrbMenuCallbacks } from './OrbMenuStateMachine';
import { SmartTaskZoneService } from './SmartTaskZone';
import { NavigationEngine, AVAILABLE_ROUTES } from './NavigationEngine';

/**
 * OrbMenuStateMachine 属性测试
 * 任务 2.2
 *
 * 使用 fast-check 对 OrbMenuStateMachine 的核心状态转换属性进行验证。
 *
 * **Validates: Requirements 2.1, 2.2, 2.6, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3**
 */

/** Valid app routes that NavigationEngine accepts (excluding 'launcher' which is the default) */
const NAVIGABLE_ROUTES = AVAILABLE_ROUTES.filter((r) => r !== 'launcher');

/** Arbitrary for dismiss sources */
const dismissSourceArb = fc.constantFrom<'gaze_away' | 'head_shake' | 'side_swipe'>(
  'gaze_away',
  'head_shake',
  'side_swipe',
);

/** Arbitrary for confirm select sources */
const confirmSourceArb = fc.constantFrom<'nod' | 'emg_pinch' | 'side_touchpad'>(
  'nod',
  'emg_pinch',
  'side_touchpad',
);

/** Arbitrary for quick open sources */
const quickOpenSourceArb = fc.constantFrom<'side_touchpad' | 'emg_pinch'>(
  'side_touchpad',
  'emg_pinch',
);

/** Arbitrary for a valid navigable route */
const routeArb = fc.constantFrom(...NAVIGABLE_ROUTES);

function createTestContext() {
  const stz = new SmartTaskZoneService();
  const nav = new NavigationEngine();
  const callbacks: Required<OrbMenuCallbacks> = {
    onStateChange: vi.fn(),
    onHintStart: vi.fn(),
    onMenuOpen: vi.fn(),
    onMenuClose: vi.fn(),
    onItemFocused: vi.fn(),
    onItemUnfocused: vi.fn(),
    onAppLaunch: vi.fn(),
    onAppLaunchError: vi.fn(),
  };
  const sm = new OrbMenuStateMachine(callbacks, stz, nav);
  return { sm, stz, nav, callbacks };
}

describe('OrbMenuStateMachine 属性测试', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── 属性: 初始状态始终为 orb_idle (需求 6.1) ──
  describe('属性: 初始状态始终为 orb_idle', () => {
    /**
     * **Validates: Requirements 6.1**
     */
    it('无论使用何种回调配置，初始状态始终为 orb_idle', () => {
      fc.assert(
        fc.property(fc.nat({ max: 100 }), (_seed) => {
          const { sm } = createTestContext();
          try {
            expect(sm.getState()).toBe('orb_idle');
            expect(sm.getFocusedItem()).toBeNull();
          } finally {
            sm.dispose();
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  // ── 属性: GAZE_ORB_START 后等待 0.8s 进入 orb_hint (需求 2.1, 2.2) ──
  describe('属性: GAZE_ORB_START 后等待 0.8s 进入 orb_hint', () => {
    /**
     * **Validates: Requirements 2.1, 2.2**
     */
    it('从 orb_idle 发送 GAZE_ORB_START 后等待 800ms 进入 orb_hint（STZ 非 expanded）', () => {
      fc.assert(
        fc.property(fc.nat({ max: 50 }), (_seed) => {
          const { sm, callbacks } = createTestContext();
          try {
            sm.send({ type: 'GAZE_ORB_START' });
            expect(sm.getState()).toBe('orb_idle'); // not yet

            vi.advanceTimersByTime(799);
            expect(sm.getState()).toBe('orb_idle'); // still not

            vi.advanceTimersByTime(1);
            expect(sm.getState()).toBe('orb_hint');
            expect(callbacks.onHintStart).toHaveBeenCalled();
          } finally {
            sm.dispose();
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  // ── 属性: STZ expanded 时互斥锁阻止展开 (需求 6.2, 6.3) ──
  describe('属性: STZ expanded 时互斥锁阻止展开', () => {
    /**
     * **Validates: Requirements 6.2, 6.3**
     */
    it('当 STZ 处于 expanded 时，GAZE_ORB_START + 等待不改变 orb_idle 状态', () => {
      fc.assert(
        fc.property(fc.nat({ max: 50 }), (_seed) => {
          const { sm, stz } = createTestContext();
          try {
            // Get STZ into expanded state
            stz.onGazeEvent({ target: 'smart_task_zone', duration: 0, isGazing: true });
            vi.advanceTimersByTime(1000);
            stz.onConfirmGesture('nod');
            expect(stz.getState()).toBe('expanded');

            sm.send({ type: 'GAZE_ORB_START' });
            vi.advanceTimersByTime(2000); // well past hint threshold
            expect(sm.getState()).toBe('orb_idle');
          } finally {
            sm.dispose();
          }
        }),
        { numRuns: 50 },
      );
    });

    it('当 STZ 处于 expanded 时，QUICK_OPEN 不改变 orb_idle 状态', () => {
      fc.assert(
        fc.property(quickOpenSourceArb, (source) => {
          const { sm, stz } = createTestContext();
          try {
            // Get STZ into expanded state
            stz.onGazeEvent({ target: 'smart_task_zone', duration: 0, isGazing: true });
            vi.advanceTimersByTime(1000);
            stz.onConfirmGesture('nod');
            expect(stz.getState()).toBe('expanded');

            sm.send({ type: 'QUICK_OPEN', source });
            expect(sm.getState()).toBe('orb_idle');
          } finally {
            sm.dispose();
          }
        }),
        { numRuns: 20 },
      );
    });
  });

  // ── 属性: orb_menu_open 下 DISMISS 始终回到 orb_idle (需求 5.1, 5.2, 5.3) ──
  describe('属性: orb_menu_open 下 DISMISS 始终回到 orb_idle', () => {
    /**
     * **Validates: Requirements 5.1, 5.2, 5.3**
     */
    it('对于任意 dismiss source，orb_menu_open 状态下 DISMISS 回到 orb_idle', () => {
      fc.assert(
        fc.property(dismissSourceArb, (source) => {
          const { sm, callbacks } = createTestContext();
          try {
            // Get to orb_menu_open via QUICK_OPEN
            sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
            expect(sm.getState()).toBe('orb_menu_open');

            sm.send({ type: 'DISMISS', source });
            expect(sm.getState()).toBe('orb_idle');
            expect(callbacks.onMenuClose).toHaveBeenCalled();
          } finally {
            sm.dispose();
          }
        }),
        { numRuns: 30 },
      );
    });

    it('对于任意 dismiss source，orb_item_focused 状态下 DISMISS 也回到 orb_idle', () => {
      fc.assert(
        fc.property(
          fc.tuple(dismissSourceArb, routeArb),
          ([source, route]) => {
            const { sm } = createTestContext();
            try {
              // Get to orb_item_focused
              sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
              sm.send({ type: 'GAZE_ITEM', itemId: route });
              vi.advanceTimersByTime(500);
              expect(sm.getState()).toBe('orb_item_focused');

              sm.send({ type: 'DISMISS', source });
              expect(sm.getState()).toBe('orb_idle');
              expect(sm.getFocusedItem()).toBeNull();
            } finally {
              sm.dispose();
            }
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  // ── 属性: CONFIRM_SELECT 在 orb_item_focused 下触发应用启动并回到 orb_idle (需求 4.2, 4.3, 4.4) ──
  describe('属性: CONFIRM_SELECT 触发应用启动并回到 orb_idle', () => {
    /**
     * **Validates: Requirements 4.2, 4.3, 4.4**
     */
    it('对于任意确认方式和有效路由，CONFIRM_SELECT 启动应用并回到 orb_idle', () => {
      fc.assert(
        fc.property(
          fc.tuple(confirmSourceArb, routeArb),
          ([source, route]) => {
            const { sm, nav, callbacks } = createTestContext();
            try {
              // Get to orb_item_focused with a valid route
              sm.send({ type: 'QUICK_OPEN', source: 'side_touchpad' });
              sm.send({ type: 'GAZE_ITEM', itemId: route });
              vi.advanceTimersByTime(500);
              expect(sm.getState()).toBe('orb_item_focused');
              expect(sm.getFocusedItem()).toBe(route);

              sm.send({ type: 'CONFIRM_SELECT', source });
              expect(sm.getState()).toBe('orb_idle');
              expect(callbacks.onAppLaunch).toHaveBeenCalledWith(route);
              expect(nav.getCurrentRoute()).toBe(route);
              expect(sm.getFocusedItem()).toBeNull();
            } finally {
              sm.dispose();
            }
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
