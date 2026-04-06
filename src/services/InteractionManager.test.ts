import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  InteractionManager,
  DEFAULT_PRIORITY_RULES,
  MAX_RESPONSE_LATENCY_MS,
} from './InteractionManager';
import type { InputSource, InputEvent, PriorityRule } from '../types/interaction';

/** Helper to create an InputEvent */
function makeEvent(
  source: InputSource,
  type = 'tap',
  data: Record<string, unknown> = {},
): InputEvent {
  return { source, type, data, timestamp: Date.now() };
}

describe('InteractionManager', () => {
  let manager: InteractionManager;

  beforeEach(() => {
    manager = new InteractionManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  // ─── 需求 6.1: 六种交互方式的注册和管理 ───

  describe('registerInput / getAvailableInputs (需求 6.1)', () => {
    it('starts with no registered inputs', () => {
      expect(manager.getAvailableInputs()).toEqual([]);
      expect(manager.getRegisteredInputs()).toEqual([]);
    });

    it('registers all six input sources', () => {
      const sources: InputSource[] = [
        'side_touchpad', 'voice', 'emg_band',
        'camera_gesture', 'head_tracking', 'physical_button',
      ];
      for (const s of sources) manager.registerInput(s);

      expect(manager.getRegisteredInputs()).toHaveLength(6);
      expect(manager.getAvailableInputs()).toHaveLength(6);
      for (const s of sources) {
        expect(manager.getAvailableInputs()).toContain(s);
      }
    });

    it('does not duplicate when registering the same source twice', () => {
      manager.registerInput('voice');
      manager.registerInput('voice');
      expect(manager.getRegisteredInputs()).toHaveLength(1);
    });

    it('unregisters an input source', () => {
      manager.registerInput('voice');
      manager.registerInput('emg_band');
      manager.unregisterInput('voice');
      expect(manager.getRegisteredInputs()).toEqual(['emg_band']);
      expect(manager.getAvailableInputs()).toEqual(['emg_band']);
    });
  });

  // ─── 需求 6.2: 优先级队列和冲突解决 ───

  describe('setPriorityRules / getPriority (需求 6.2)', () => {
    it('loads default priority rules on construction', () => {
      expect(manager.getPriority('physical_button')).toBe(6);
      expect(manager.getPriority('voice')).toBe(5);
      expect(manager.getPriority('emg_band')).toBe(4);
      expect(manager.getPriority('side_touchpad')).toBe(3);
      expect(manager.getPriority('camera_gesture')).toBe(2);
      expect(manager.getPriority('head_tracking')).toBe(1);
    });

    it('returns 0 for unknown sources', () => {
      manager.setPriorityRules([]);
      expect(manager.getPriority('voice')).toBe(0);
    });

    it('allows custom priority rules', () => {
      const custom: PriorityRule[] = [
        { sources: ['voice'], priority: 10 },
        { sources: ['head_tracking'], priority: 9 },
      ];
      manager.setPriorityRules(custom);
      expect(manager.getPriority('voice')).toBe(10);
      expect(manager.getPriority('head_tracking')).toBe(9);
      expect(manager.getPriority('physical_button')).toBe(0); // cleared
    });
  });

  describe('resolveConflict (需求 6.2)', () => {
    beforeEach(() => {
      const sources: InputSource[] = [
        'side_touchpad', 'voice', 'emg_band',
        'camera_gesture', 'head_tracking', 'physical_button',
      ];
      for (const s of sources) manager.registerInput(s);
    });

    it('selects physical_button over all others', () => {
      const events = [
        makeEvent('voice', 'command'),
        makeEvent('physical_button', 'press'),
        makeEvent('head_tracking', 'move'),
      ];
      const result = manager.resolveConflict(events);
      expect(result.source).toBe('physical_button');
      expect(result.conflictResolved).toBe(true);
    });

    it('selects voice over emg_band and lower', () => {
      const events = [
        makeEvent('emg_band', 'pinch'),
        makeEvent('voice', 'command'),
        makeEvent('camera_gesture', 'wave'),
      ];
      const result = manager.resolveConflict(events);
      expect(result.source).toBe('voice');
      expect(result.conflictResolved).toBe(true);
    });

    it('selects emg_band over side_touchpad', () => {
      const events = [
        makeEvent('side_touchpad', 'swipe'),
        makeEvent('emg_band', 'pinch'),
      ];
      const result = manager.resolveConflict(events);
      expect(result.source).toBe('emg_band');
    });

    it('returns single event without conflict flag when only one event', () => {
      const events = [makeEvent('head_tracking', 'move')];
      const result = manager.resolveConflict(events);
      expect(result.source).toBe('head_tracking');
      expect(result.conflictResolved).toBe(false);
    });

    it('throws when given empty events array', () => {
      expect(() => manager.resolveConflict([])).toThrow('No events to resolve');
    });

    it('skips unavailable sources and picks next highest priority', () => {
      manager.setSensorAvailable('physical_button', false);
      const events = [
        makeEvent('physical_button', 'press'),
        makeEvent('voice', 'command'),
      ];
      const result = manager.resolveConflict(events);
      expect(result.source).toBe('voice');
      expect(result.conflictResolved).toBe(true);
    });

    it('falls back to highest priority from original list when all unavailable', () => {
      manager.setSensorAvailable('voice', false);
      manager.setSensorAvailable('emg_band', false);
      const events = [
        makeEvent('voice', 'command'),
        makeEvent('emg_band', 'pinch'),
      ];
      const result = manager.resolveConflict(events);
      // Falls back to original list sorted by priority
      expect(result.source).toBe('voice');
    });
  });

  // ─── 需求 6.3: 输入响应延迟 <100ms ───

  describe('processInput latency (需求 6.3)', () => {
    beforeEach(() => {
      manager.registerInput('voice');
      manager.registerInput('physical_button');
      manager.registerInput('side_touchpad');
    });

    it('processes a single input with latency < 100ms', () => {
      const result = manager.processInput(makeEvent('voice', 'command'));
      expect(result.latency).toBeLessThan(MAX_RESPONSE_LATENCY_MS);
      expect(result.source).toBe('voice');
      expect(result.action).toBe('command');
      expect(result.conflictResolved).toBe(false);
    });

    it('resolves conflict with latency < 100ms', () => {
      const events = [
        makeEvent('physical_button', 'press'),
        makeEvent('voice', 'command'),
        makeEvent('side_touchpad', 'swipe'),
      ];
      const result = manager.resolveConflict(events);
      expect(result.latency).toBeLessThan(MAX_RESPONSE_LATENCY_MS);
    });
  });

  // ─── 需求 6.8: 传感器不可用时的自动切换和通知 ───

  describe('sensor availability and auto-switch (需求 6.8)', () => {
    beforeEach(() => {
      manager.registerInput('voice');
      manager.registerInput('emg_band');
      manager.registerInput('side_touchpad');
      manager.registerInput('physical_button');
    });

    it('marks sensor as unavailable', () => {
      manager.setSensorAvailable('voice', false);
      expect(manager.getAvailableInputs()).not.toContain('voice');
      expect(manager.getRegisteredInputs()).toContain('voice'); // still registered
    });

    it('marks sensor as available again', () => {
      manager.setSensorAvailable('voice', false);
      manager.setSensorAvailable('voice', true);
      expect(manager.getAvailableInputs()).toContain('voice');
    });

    it('ignores setSensorAvailable for unregistered sources', () => {
      manager.setSensorAvailable('camera_gesture', false);
      // No error, no change
      expect(manager.getAvailableInputs()).not.toContain('camera_gesture');
    });

    it('notifies callbacks when sensor becomes unavailable', () => {
      const callback = vi.fn();
      manager.onSensorStatusChange(callback);
      manager.setSensorAvailable('voice', false);
      expect(callback).toHaveBeenCalledWith('voice', false);
    });

    it('notifies callbacks when sensor becomes available again', () => {
      const callback = vi.fn();
      manager.onSensorStatusChange(callback);
      manager.setSensorAvailable('voice', false);
      manager.setSensorAvailable('voice', true);
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('voice', true);
    });

    it('does not notify when status does not actually change', () => {
      const callback = vi.fn();
      manager.onSensorStatusChange(callback);
      // voice is already available
      manager.setSensorAvailable('voice', true);
      expect(callback).not.toHaveBeenCalled();
    });

    it('supports multiple callbacks', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      manager.onSensorStatusChange(cb1);
      manager.onSensorStatusChange(cb2);
      manager.setSensorAvailable('emg_band', false);
      expect(cb1).toHaveBeenCalledWith('emg_band', false);
      expect(cb2).toHaveBeenCalledWith('emg_band', false);
    });

    it('removes callback with offSensorStatusChange', () => {
      const cb = vi.fn();
      manager.onSensorStatusChange(cb);
      manager.offSensorStatusChange(cb);
      manager.setSensorAvailable('voice', false);
      expect(cb).not.toHaveBeenCalled();
    });

    it('auto-switches to fallback source when processing unavailable input', () => {
      manager.setSensorAvailable('voice', false);
      const result = manager.processInput(makeEvent('voice', 'command'));
      // Should fall back to highest available: physical_button (priority 6)
      expect(result.source).toBe('physical_button');
      expect(result.conflictResolved).toBe(true);
    });

    it('falls back to next available source by priority', () => {
      manager.setSensorAvailable('voice', false);
      manager.setSensorAvailable('physical_button', false);
      const result = manager.processInput(makeEvent('voice', 'command'));
      // Next highest: emg_band (priority 4)
      expect(result.source).toBe('emg_band');
      expect(result.conflictResolved).toBe(true);
    });

    it('uses original source when no fallback is available', () => {
      manager.setSensorAvailable('voice', false);
      manager.setSensorAvailable('emg_band', false);
      manager.setSensorAvailable('side_touchpad', false);
      manager.setSensorAvailable('physical_button', false);
      const result = manager.processInput(makeEvent('voice', 'command'));
      expect(result.source).toBe('voice');
      expect(result.conflictResolved).toBe(false);
    });
  });

  // ─── 缓冲区和冲突窗口 ───

  describe('bufferInput (conflict window)', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      manager.registerInput('voice');
      manager.registerInput('physical_button');
      manager.registerInput('side_touchpad');
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resolves buffered events after conflict window', async () => {
      const promise = manager.bufferInput(makeEvent('side_touchpad', 'swipe'));
      manager.bufferInput(makeEvent('physical_button', 'press'));

      await vi.advanceTimersByTimeAsync(InteractionManager.CONFLICT_WINDOW_MS);

      const result = await promise;
      // physical_button has higher priority
      expect(result.source).toBe('physical_button');
      expect(result.conflictResolved).toBe(true);
    });

    it('resolves single buffered event without conflict', async () => {
      const promise = manager.bufferInput(makeEvent('voice', 'command'));

      await vi.advanceTimersByTimeAsync(InteractionManager.CONFLICT_WINDOW_MS);

      const result = await promise;
      expect(result.source).toBe('voice');
    });
  });

  // ─── DEFAULT_PRIORITY_RULES 常量 ───

  describe('DEFAULT_PRIORITY_RULES', () => {
    it('defines rules for all six input sources', () => {
      const allSources = DEFAULT_PRIORITY_RULES.flatMap((r) => r.sources);
      expect(allSources).toContain('physical_button');
      expect(allSources).toContain('voice');
      expect(allSources).toContain('emg_band');
      expect(allSources).toContain('side_touchpad');
      expect(allSources).toContain('camera_gesture');
      expect(allSources).toContain('head_tracking');
      expect(allSources).toHaveLength(6);
    });

    it('has strictly descending priorities', () => {
      const priorities = DEFAULT_PRIORITY_RULES.map((r) => r.priority);
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeLessThan(priorities[i - 1]);
      }
    });
  });

  // ─── destroy ───

  describe('destroy', () => {
    it('clears all internal state', () => {
      manager.registerInput('voice');
      const cb = vi.fn();
      manager.onSensorStatusChange(cb);
      manager.destroy();

      // Callbacks should be cleared
      manager.setSensorAvailable('voice', false);
      expect(cb).not.toHaveBeenCalled();
    });
  });
});
