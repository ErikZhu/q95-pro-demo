import { describe, it, expect } from 'vitest';
import { LayoutManager } from './LayoutManager';
import type { ScreenZone, Rect } from '../types/display';

/**
 * 布局系统属性测试
 * 任务 2.4
 *
 * 属性 3: 分区不重叠 — 验证 LayoutManager 返回的三个分区 Rect 互不重叠
 * 属性 4: 分区覆盖完整性 — 验证三个分区的联合区域在显示区域内
 */

const ZONES: ScreenZone[] = ['main_task_area', 'smart_task_zone', 'status_bar'];

function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

function rectWithinScreen(r: Rect, screenW: number, screenH: number): boolean {
  return r.x >= 0 && r.y >= 0 && r.x + r.width <= screenW && r.y + r.height <= screenH;
}

// Test across multiple screen sizes
const SCREEN_SIZES: Array<[number, number]> = [
  [1280, 720],
  [1920, 1080],
  [2560, 1440],
  [3840, 2160],
  [1440, 810],
];

describe('LayoutManager 属性测试', () => {
  // ── 属性 3: 分区不重叠 (需求 2.5, 2.6) ──
  describe('属性 3: 分区不重叠', () => {
    for (const [w, h] of SCREEN_SIZES) {
      it(`${w}x${h}: 三个分区互不重叠`, () => {
        const lm = new LayoutManager(w, h);
        const bounds = ZONES.map((z) => ({ zone: z, rect: lm.getZoneBounds(z) }));

        for (let i = 0; i < bounds.length; i++) {
          for (let j = i + 1; j < bounds.length; j++) {
            expect(
              rectsOverlap(bounds[i].rect, bounds[j].rect),
              `${bounds[i].zone} 与 ${bounds[j].zone} 不应重叠`,
            ).toBe(false);
          }
        }
      });
    }
  });

  // ── 属性 4: 分区覆盖完整性 (需求 2.1) ──
  describe('属性 4: 分区在显示区域内', () => {
    for (const [w, h] of SCREEN_SIZES) {
      it(`${w}x${h}: 所有分区在屏幕范围内`, () => {
        const lm = new LayoutManager(w, h);
        for (const zone of ZONES) {
          const rect = lm.getZoneBounds(zone);
          expect(
            rectWithinScreen(rect, w, h),
            `${zone} 应在 ${w}x${h} 屏幕范围内`,
          ).toBe(true);
        }
      });

      it(`${w}x${h}: 分区面积之和不超过屏幕面积`, () => {
        const lm = new LayoutManager(w, h);
        const totalArea = ZONES.reduce((sum, z) => {
          const r = lm.getZoneBounds(z);
          return sum + r.width * r.height;
        }, 0);
        expect(totalArea).toBeLessThanOrEqual(w * h);
      });

      it(`${w}x${h}: Main_Task_Area 占据屏幕面积 >50%`, () => {
        const lm = new LayoutManager(w, h);
        const main = lm.getZoneBounds('main_task_area');
        expect((main.width * main.height) / (w * h)).toBeGreaterThan(0.5);
      });
    }
  });

  // ── 额外属性: 分区尺寸正值 ──
  describe('所有分区尺寸为正值', () => {
    for (const [w, h] of SCREEN_SIZES) {
      it(`${w}x${h}: 所有分区 width/height > 0`, () => {
        const lm = new LayoutManager(w, h);
        for (const zone of ZONES) {
          const rect = lm.getZoneBounds(zone);
          expect(rect.width).toBeGreaterThan(0);
          expect(rect.height).toBeGreaterThan(0);
        }
      });
    }
  });
});
