import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateRadialPositions, clampToViewport } from './radialLayout';
import type { RadialLayoutConfig } from './radialLayout';

/**
 * 环形布局算法属性测试
 * 任务 1.2
 *
 * 使用 fast-check 对 calculateRadialPositions 和 clampToViewport 进行属性测试。
 *
 * **Validates: Requirements 3.1, 3.4, 3.5, 3.7**
 */

/** Arbitrary for a valid RadialLayoutConfig with itemCount in [1, 11]. */
const radialConfigArb = fc
  .record({
    centerX: fc.double({ min: 0, max: 500, noNaN: true }),
    centerY: fc.double({ min: 0, max: 500, noNaN: true }),
    radius: fc.double({ min: 10, max: 300, noNaN: true }),
    startAngle: fc.double({ min: 0, max: 360, noNaN: true }),
    itemCount: fc.integer({ min: 1, max: 11 }),
    viewportWidth: fc.double({ min: 200, max: 2000, noNaN: true }),
    viewportHeight: fc.double({ min: 200, max: 2000, noNaN: true }),
  })
  .chain((base) =>
    fc
      .double({ min: base.startAngle + 1, max: base.startAngle + 360, noNaN: true })
      .map((endAngle) => ({
        ...base,
        endAngle,
      })),
  );

describe('radialLayout 属性测试', () => {
  // ── 属性: 返回位置数量等于 itemCount (需求 3.1) ──
  describe('属性: 返回位置数量等于 itemCount', () => {
    /**
     * **Validates: Requirements 3.1**
     */
    it('对于任意 itemCount(1-11)，返回的位置数量等于 itemCount', () => {
      fc.assert(
        fc.property(radialConfigArb, (config: RadialLayoutConfig) => {
          const positions = calculateRadialPositions(config);
          expect(positions).toHaveLength(config.itemCount);
        }),
        { numRuns: 200 },
      );
    });
  });

  // ── 属性: 所有 angle 值在 [startAngle, endAngle] 范围内 (需求 3.4) ──
  describe('属性: angle 值在 [startAngle, endAngle] 范围内', () => {
    /**
     * **Validates: Requirements 3.4**
     */
    it('所有返回位置的 angle 值在 [startAngle, endAngle] 范围内', () => {
      fc.assert(
        fc.property(radialConfigArb, (config: RadialLayoutConfig) => {
          const positions = calculateRadialPositions(config);
          for (const pos of positions) {
            expect(pos.angle).toBeGreaterThanOrEqual(config.startAngle - 0.01);
            expect(pos.angle).toBeLessThanOrEqual(config.endAngle + 0.01);
          }
        }),
        { numRuns: 200 },
      );
    });
  });

  // ── 属性: 相邻菜单项之间的角度间距均匀 (需求 3.5) ──
  describe('属性: 相邻菜单项角度间距均匀', () => {
    /**
     * **Validates: Requirements 3.5**
     */
    it('当 itemCount >= 3 时，相邻菜单项之间的角度间距均匀（误差 < 0.01）', () => {
      const configWith3Plus = radialConfigArb.filter((c) => c.itemCount >= 3);

      fc.assert(
        fc.property(configWith3Plus, (config: RadialLayoutConfig) => {
          const positions = calculateRadialPositions(config);
          const gaps: number[] = [];
          for (let i = 1; i < positions.length; i++) {
            gaps.push(positions[i].angle - positions[i - 1].angle);
          }
          const expectedGap = gaps[0];
          for (let i = 1; i < gaps.length; i++) {
            expect(Math.abs(gaps[i] - expectedGap)).toBeLessThan(0.01);
          }
        }),
        { numRuns: 200 },
      );
    });
  });

  // ── 属性: clampToViewport 后所有位置在 viewport 边界内 (需求 3.7) ──
  describe('属性: clampToViewport 后位置在 viewport 内', () => {
    /**
     * **Validates: Requirements 3.7**
     */
    it('clampToViewport 后所有位置在 viewport 边界内', () => {
      const configWithItemSize = fc.tuple(
        radialConfigArb,
        fc.double({ min: 10, max: 80, noNaN: true }),
      );

      fc.assert(
        fc.property(configWithItemSize, ([config, itemSize]) => {
          const positions = calculateRadialPositions(config);
          const viewport = { width: config.viewportWidth, height: config.viewportHeight };
          const clamped = clampToViewport(positions, itemSize, viewport);

          const halfSize = itemSize / 2;
          for (const pos of clamped) {
            expect(pos.x - halfSize).toBeGreaterThanOrEqual(-0.01);
            expect(pos.y - halfSize).toBeGreaterThanOrEqual(-0.01);
            expect(pos.x + halfSize).toBeLessThanOrEqual(viewport.width + 0.01);
            expect(pos.y + halfSize).toBeLessThanOrEqual(viewport.height + 0.01);
          }
        }),
        { numRuns: 200 },
      );
    });
  });
});
