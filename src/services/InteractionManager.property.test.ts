import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InteractionManager, MAX_RESPONSE_LATENCY_MS } from './InteractionManager';
import type { InputSource, InputEvent } from '../types/interaction';

/**
 * 交互管理器属性测试
 * 任务 6.3
 *
 * 属性 7: 优先级冲突解决确定性 — 同时触发多种输入时，始终选择优先级最高的输入
 * 属性 8: 响应延迟约束 — processInput 的延迟始终 <100ms
 */

const ALL_SOURCES: InputSource[] = [
  'physical_button', 'voice', 'emg_band', 'side_touchpad', 'camera_gesture', 'head_tracking',
];

// Priority order (descending): physical_button(6) > voice(5) > emg_band(4) > side_touchpad(3) > camera_gesture(2) > head_tracking(1)
const PRIORITY_ORDER: InputSource[] = [
  'physical_button', 'voice', 'emg_band', 'side_touchpad', 'camera_gesture', 'head_tracking',
];

function makeEvent(source: InputSource, type = 'tap'): InputEvent {
  return { source, type, data: {}, timestamp: Date.now() };
}

describe('InteractionManager 属性测试', () => {
  let manager: InteractionManager;

  beforeEach(() => {
    manager = new InteractionManager();
    for (const s of ALL_SOURCES) manager.registerInput(s);
  });

  afterEach(() => {
    manager.destroy();
  });

  // ── 属性 7: 优先级冲突解决确定性 (需求 6.2) ──
  describe('属性 7: 优先级冲突解决确定性', () => {
    it('任意两种输入同时触发，始终选择优先级更高的', () => {
      for (let i = 0; i < PRIORITY_ORDER.length; i++) {
        for (let j = i + 1; j < PRIORITY_ORDER.length; j++) {
          const high = PRIORITY_ORDER[i];
          const low = PRIORITY_ORDER[j];
          const result = manager.resolveConflict([makeEvent(low), makeEvent(high)]);
          expect(result.source, `${high} 应优先于 ${low}`).toBe(high);
        }
      }
    });

    it('三种输入同时触发，始终选择最高优先级', () => {
      const combos: InputSource[][] = [
        ['voice', 'emg_band', 'head_tracking'],
        ['physical_button', 'camera_gesture', 'side_touchpad'],
        ['emg_band', 'side_touchpad', 'head_tracking'],
      ];
      for (const combo of combos) {
        const events = combo.map((s) => makeEvent(s));
        const result = manager.resolveConflict(events);
        const expectedWinner = combo.reduce((a, b) =>
          PRIORITY_ORDER.indexOf(a) < PRIORITY_ORDER.indexOf(b) ? a : b,
        );
        expect(result.source).toBe(expectedWinner);
      }
    });

    it('所有六种输入同时触发，physical_button 胜出', () => {
      const events = ALL_SOURCES.map((s) => makeEvent(s));
      const result = manager.resolveConflict(events);
      expect(result.source).toBe('physical_button');
      expect(result.conflictResolved).toBe(true);
    });

    it('相同输入重复多次，结果一致（幂等性）', () => {
      const events = [makeEvent('voice'), makeEvent('emg_band')];
      const r1 = manager.resolveConflict(events);
      const r2 = manager.resolveConflict(events);
      expect(r1.source).toBe(r2.source);
    });
  });

  // ── 属性 8: 响应延迟约束 (需求 6.3) ──
  describe('属性 8: 响应延迟 <100ms', () => {
    for (const source of ALL_SOURCES) {
      it(`processInput(${source}) 延迟 <${MAX_RESPONSE_LATENCY_MS}ms`, () => {
        const result = manager.processInput(makeEvent(source));
        expect(result.latency).toBeLessThan(MAX_RESPONSE_LATENCY_MS);
      });
    }

    it('冲突解决延迟 <100ms (所有输入同时)', () => {
      const events = ALL_SOURCES.map((s) => makeEvent(s));
      const result = manager.resolveConflict(events);
      expect(result.latency).toBeLessThan(MAX_RESPONSE_LATENCY_MS);
    });

    it('连续 100 次 processInput 延迟均 <100ms', () => {
      for (let i = 0; i < 100; i++) {
        const source = ALL_SOURCES[i % ALL_SOURCES.length];
        const result = manager.processInput(makeEvent(source));
        expect(result.latency).toBeLessThan(MAX_RESPONSE_LATENCY_MS);
      }
    });
  });
});
