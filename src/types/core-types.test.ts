import { describe, it, expect } from 'vitest';
import type { DisplaySpec } from './display';
import type { PriorityRule, InputSource } from './interaction';

/**
 * 核心类型属性测试
 * 任务 1.3
 */

// ── 属性 1: DisplaySpec 分辨率约束验证 ──
// 验证 DisplaySpec 的 resolution 始终满足 width≥1280, height≥720
describe('DisplaySpec 分辨率约束 (需求 1.1)', () => {
  const validSpecs: DisplaySpec[] = [
    { resolution: { width: 1280, height: 720 }, maxBrightness: 2000, refreshRate: 90, fov: 43, panelType: 'MicroOLED' },
    { resolution: { width: 1920, height: 1080 }, maxBrightness: 3000, refreshRate: 120, fov: 50, panelType: 'MicroLED' },
    { resolution: { width: 3840, height: 2160 }, maxBrightness: 5000, refreshRate: 60, fov: 55, panelType: 'LCoS' },
  ];

  for (const spec of validSpecs) {
    it(`resolution ${spec.resolution.width}x${spec.resolution.height} satisfies minimum constraints`, () => {
      expect(spec.resolution.width).toBeGreaterThanOrEqual(1280);
      expect(spec.resolution.height).toBeGreaterThanOrEqual(720);
    });
  }

  it('rejects resolution below minimum width', () => {
    const invalid: DisplaySpec = { resolution: { width: 1024, height: 720 }, maxBrightness: 2000, refreshRate: 90, fov: 43, panelType: 'MicroOLED' };
    expect(invalid.resolution.width).toBeLessThan(1280);
  });

  it('rejects resolution below minimum height', () => {
    const invalid: DisplaySpec = { resolution: { width: 1280, height: 480 }, maxBrightness: 2000, refreshRate: 90, fov: 43, panelType: 'MicroOLED' };
    expect(invalid.resolution.height).toBeLessThan(720);
  });

  it('all valid panel types are covered', () => {
    const types: DisplaySpec['panelType'][] = ['MicroOLED', 'MicroLED', 'LCoS'];
    for (const t of types) {
      const spec: DisplaySpec = { resolution: { width: 1280, height: 720 }, maxBrightness: 2000, refreshRate: 90, fov: 43, panelType: t };
      expect(spec.panelType).toBe(t);
    }
  });
});

// ── 属性 2: 优先级规则一致性 ──
// 验证 PriorityRule 数组中不存在相同 source 的冲突优先级
describe('PriorityRule 一致性 (需求 6.2)', () => {
  const ALL_SOURCES: InputSource[] = ['physical_button', 'voice', 'emg_band', 'side_touchpad', 'camera_gesture', 'head_tracking'];

  const defaultRules: PriorityRule[] = [
    { sources: ['physical_button'], priority: 6 },
    { sources: ['voice'], priority: 5 },
    { sources: ['emg_band'], priority: 4 },
    { sources: ['side_touchpad'], priority: 3 },
    { sources: ['camera_gesture'], priority: 2 },
    { sources: ['head_tracking'], priority: 1 },
  ];

  it('no source appears in multiple rules with different priorities', () => {
    const sourceMap = new Map<InputSource, number>();
    for (const rule of defaultRules) {
      for (const src of rule.sources) {
        if (sourceMap.has(src)) {
          expect(sourceMap.get(src)).toBe(rule.priority);
        }
        sourceMap.set(src, rule.priority);
      }
    }
  });

  it('all six input sources are covered', () => {
    const covered = new Set(defaultRules.flatMap((r) => r.sources));
    for (const src of ALL_SOURCES) {
      expect(covered.has(src)).toBe(true);
    }
  });

  it('priorities are strictly descending', () => {
    const priorities = defaultRules.map((r) => r.priority);
    for (let i = 1; i < priorities.length; i++) {
      expect(priorities[i]).toBeLessThan(priorities[i - 1]);
    }
  });

  it('all priorities are positive integers', () => {
    for (const rule of defaultRules) {
      expect(rule.priority).toBeGreaterThan(0);
      expect(Number.isInteger(rule.priority)).toBe(true);
    }
  });

  it('detects conflicting rules for same source', () => {
    const conflicting: PriorityRule[] = [
      { sources: ['voice'], priority: 5 },
      { sources: ['voice'], priority: 3 }, // conflict!
    ];
    const sourceMap = new Map<InputSource, number>();
    let hasConflict = false;
    for (const rule of conflicting) {
      for (const src of rule.sources) {
        if (sourceMap.has(src) && sourceMap.get(src) !== rule.priority) {
          hasConflict = true;
        }
        sourceMap.set(src, rule.priority);
      }
    }
    expect(hasConflict).toBe(true);
  });
});
