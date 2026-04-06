import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SmartTaskZoneService } from './SmartTaskZone';
import type { SmartTaskZoneState, SmartTaskZoneCallbacks } from './SmartTaskZone';
import type { GazeEvent } from '../types/data';

/**
 * SmartTaskZone 状态机属性测试
 * 任务 3.4
 *
 * 属性 5: 状态机转换合法性 — 只能按合法路径转换
 * 属性 6: 展开响应时间 — 确认手势到展开不超过 300ms
 */

function makeGaze(isGazing: boolean): GazeEvent {
  return { target: 'smart_task_zone', duration: 0, isGazing };
}

type Transition = { from: SmartTaskZoneState; to: SmartTaskZoneState };

// Legal transitions: compact→confirm_prompt, confirm_prompt→expanded, confirm_prompt→compact, expanded→compact
const LEGAL_TRANSITIONS: Transition[] = [
  { from: 'compact', to: 'confirm_prompt' },
  { from: 'confirm_prompt', to: 'expanded' },
  { from: 'confirm_prompt', to: 'compact' },
  { from: 'expanded', to: 'compact' },
];

function isLegalTransition(from: SmartTaskZoneState, to: SmartTaskZoneState): boolean {
  return LEGAL_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

describe('SmartTaskZone 状态机属性测试', () => {
  let svc: SmartTaskZoneService;
  let transitions: Transition[];
  let callbacks: SmartTaskZoneCallbacks;

  beforeEach(() => {
    vi.useFakeTimers();
    transitions = [];
    callbacks = {
      onStateChange: (from, to) => transitions.push({ from, to }),
      onConfirmPrompt: vi.fn(),
      onExpanded: vi.fn(),
      onCollapsed: vi.fn(),
      onTasksChanged: vi.fn(),
    };
    svc = new SmartTaskZoneService(callbacks);
  });

  afterEach(() => {
    svc.dispose();
    vi.useRealTimers();
  });

  // ── 属性 5: 状态机转换合法性 (需求 3.4, 3.5, 3.6, 3.8) ──
  describe('属性 5: 状态机转换合法性', () => {
    it('完整生命周期: compact → confirm_prompt → expanded → compact 全部合法', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      svc.onConfirmGesture('nod');
      svc.onDismissGesture('head_shake');

      for (const t of transitions) {
        expect(isLegalTransition(t.from, t.to), `${t.from}→${t.to} 应为合法转换`).toBe(true);
      }
    });

    it('confirm_prompt 超时回退: compact → confirm_prompt → compact 合法', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(3000); // timeout

      for (const t of transitions) {
        expect(isLegalTransition(t.from, t.to)).toBe(true);
      }
    });

    it('expanded 视线移开回退: expanded → compact 合法', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      svc.onConfirmGesture('emg_pinch');
      svc.onGazeEvent(makeGaze(false));
      vi.advanceTimersByTime(3000);

      for (const t of transitions) {
        expect(isLegalTransition(t.from, t.to)).toBe(true);
      }
    });

    it('多次循环全部合法', () => {
      for (let i = 0; i < 3; i++) {
        svc.onGazeEvent(makeGaze(true));
        vi.advanceTimersByTime(1000);
        svc.onConfirmGesture('nod');
        svc.onDismissGesture('side_swipe');
      }

      for (const t of transitions) {
        expect(isLegalTransition(t.from, t.to), `${t.from}→${t.to}`).toBe(true);
      }
    });

    it('不允许从 compact 直接跳到 expanded', () => {
      // 尝试在 compact 状态直接确认
      svc.onConfirmGesture('nod');
      expect(svc.getState()).toBe('compact');
      expect(transitions).toHaveLength(0);
    });

    it('不允许从 expanded 跳到 confirm_prompt', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      svc.onConfirmGesture('nod');
      expect(svc.getState()).toBe('expanded');

      // 再次注视不应触发 confirm_prompt
      transitions.length = 0;
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      // Should still be expanded, not confirm_prompt
      const illegalTransition = transitions.find(
        (t) => t.from === 'expanded' && t.to === 'confirm_prompt',
      );
      expect(illegalTransition).toBeUndefined();
    });
  });

  // ── 属性 6: 展开响应时间 (需求 3.5, 3.6) ──
  describe('属性 6: 展开响应时间 ≤300ms', () => {
    it('nod 确认后立即展开 (同步，0ms)', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);
      expect(svc.getState()).toBe('confirm_prompt');

      const before = Date.now();
      svc.onConfirmGesture('nod');
      const after = Date.now();

      expect(svc.getState()).toBe('expanded');
      expect(after - before).toBeLessThanOrEqual(300);
    });

    it('emg_pinch 确认后立即展开 (同步，0ms)', () => {
      svc.onGazeEvent(makeGaze(true));
      vi.advanceTimersByTime(1000);

      const before = Date.now();
      svc.onConfirmGesture('emg_pinch');
      const after = Date.now();

      expect(svc.getState()).toBe('expanded');
      expect(after - before).toBeLessThanOrEqual(300);
    });
  });
});
