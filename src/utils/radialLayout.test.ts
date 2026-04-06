import { describe, it, expect } from 'vitest';
import { calculateRadialPositions, clampToViewport } from './radialLayout';
import type { RadialLayoutConfig, RadialPosition } from './radialLayout';

/**
 * 环形布局算法单元测试
 * 任务 1.3
 *
 * 需求: 3.1, 3.4, 3.7
 */

/** Helper to create a standard config centered at top-left (Orb position). */
function makeConfig(overrides: Partial<RadialLayoutConfig> = {}): RadialLayoutConfig {
  return {
    centerX: 60,
    centerY: 60,
    radius: 120,
    startAngle: 90,
    endAngle: 270,
    itemCount: 11,
    viewportWidth: 1280,
    viewportHeight: 720,
    ...overrides,
  };
}

describe('calculateRadialPositions', () => {
  // ── 需求 3.1, 3.2: 11 个菜单项标准布局 ──
  describe('11 个菜单项标准布局', () => {
    const config = makeConfig();
    const positions = calculateRadialPositions(config);

    it('返回 11 个位置', () => {
      expect(positions).toHaveLength(11);
    });

    it('第一个菜单项角度为 startAngle (90°)', () => {
      expect(positions[0].angle).toBe(90);
    });

    it('最后一个菜单项角度为 endAngle (270°)', () => {
      expect(positions[10].angle).toBe(270);
    });

    it('相邻菜单项角度间距均匀 (18°)', () => {
      const expectedStep = (270 - 90) / (11 - 1); // 18°
      for (let i = 1; i < positions.length; i++) {
        const gap = positions[i].angle - positions[i - 1].angle;
        expect(gap).toBeCloseTo(expectedStep, 10);
      }
    });

    it('所有角度在 [90°, 270°] 范围内', () => {
      for (const pos of positions) {
        expect(pos.angle).toBeGreaterThanOrEqual(90);
        expect(pos.angle).toBeLessThanOrEqual(270);
      }
    });

    it('位置使用极坐标公式计算 (x = cx + r*cos, y = cy + r*sin)', () => {
      for (const pos of positions) {
        const rad = (pos.angle * Math.PI) / 180;
        expect(pos.x).toBeCloseTo(config.centerX + config.radius * Math.cos(rad), 10);
        expect(pos.y).toBeCloseTo(config.centerY + config.radius * Math.sin(rad), 10);
      }
    });
  });

  // ── 边界情况: 1 个菜单项 ──
  describe('1 个菜单项', () => {
    const config = makeConfig({ itemCount: 1 });
    const positions = calculateRadialPositions(config);

    it('返回 1 个位置', () => {
      expect(positions).toHaveLength(1);
    });

    it('放置在弧线中点 (180°)', () => {
      const midAngle = (90 + 270) / 2; // 180°
      expect(positions[0].angle).toBe(midAngle);
    });

    it('坐标使用中点角度的极坐标公式', () => {
      const rad = (180 * Math.PI) / 180;
      expect(positions[0].x).toBeCloseTo(config.centerX + config.radius * Math.cos(rad), 10);
      expect(positions[0].y).toBeCloseTo(config.centerY + config.radius * Math.sin(rad), 10);
    });
  });

  // ── 边界情况: 0 个菜单项 ──
  describe('0 个菜单项', () => {
    it('返回空数组', () => {
      const config = makeConfig({ itemCount: 0 });
      const positions = calculateRadialPositions(config);
      expect(positions).toEqual([]);
    });

    it('负数 itemCount 也返回空数组', () => {
      const config = makeConfig({ itemCount: -3 });
      const positions = calculateRadialPositions(config);
      expect(positions).toEqual([]);
    });
  });
});

describe('clampToViewport', () => {
  const viewport = { width: 1280, height: 720 };
  const itemSize = 60;
  const halfSize = itemSize / 2;

  it('不修改已在 viewport 内的位置', () => {
    const positions: RadialPosition[] = [
      { x: 200, y: 300, angle: 120 },
      { x: 640, y: 360, angle: 180 },
    ];
    const clamped = clampToViewport(positions, itemSize, viewport);

    expect(clamped[0].x).toBe(200);
    expect(clamped[0].y).toBe(300);
    expect(clamped[1].x).toBe(640);
    expect(clamped[1].y).toBe(360);
  });

  it('修正超出左边界的位置 (x < halfSize)', () => {
    const positions: RadialPosition[] = [{ x: 10, y: 400, angle: 180 }];
    const clamped = clampToViewport(positions, itemSize, viewport);

    expect(clamped[0].x).toBe(halfSize);
    expect(clamped[0].y).toBe(400);
  });

  it('修正超出上边界的位置 (y < halfSize)', () => {
    const positions: RadialPosition[] = [{ x: 400, y: 5, angle: 90 }];
    const clamped = clampToViewport(positions, itemSize, viewport);

    expect(clamped[0].x).toBe(400);
    expect(clamped[0].y).toBe(halfSize);
  });

  it('修正超出右边界的位置 (x > width - halfSize)', () => {
    const positions: RadialPosition[] = [{ x: 1270, y: 400, angle: 0 }];
    const clamped = clampToViewport(positions, itemSize, viewport);

    expect(clamped[0].x).toBe(viewport.width - halfSize);
    expect(clamped[0].y).toBe(400);
  });

  it('修正超出下边界的位置 (y > height - halfSize)', () => {
    const positions: RadialPosition[] = [{ x: 400, y: 710, angle: 270 }];
    const clamped = clampToViewport(positions, itemSize, viewport);

    expect(clamped[0].x).toBe(400);
    expect(clamped[0].y).toBe(viewport.height - halfSize);
  });

  it('同时修正超出多个边界的位置 (左上角)', () => {
    const positions: RadialPosition[] = [{ x: -10, y: -20, angle: 135 }];
    const clamped = clampToViewport(positions, itemSize, viewport);

    expect(clamped[0].x).toBe(halfSize);
    expect(clamped[0].y).toBe(halfSize);
  });

  it('同时修正超出多个边界的位置 (右下角)', () => {
    const positions: RadialPosition[] = [{ x: 1500, y: 800, angle: 315 }];
    const clamped = clampToViewport(positions, itemSize, viewport);

    expect(clamped[0].x).toBe(viewport.width - halfSize);
    expect(clamped[0].y).toBe(viewport.height - halfSize);
  });

  it('保留原始 angle 值不变', () => {
    const positions: RadialPosition[] = [
      { x: -100, y: -100, angle: 123.45 },
      { x: 2000, y: 2000, angle: 267.89 },
    ];
    const clamped = clampToViewport(positions, itemSize, viewport);

    expect(clamped[0].angle).toBe(123.45);
    expect(clamped[1].angle).toBe(267.89);
  });

  it('空数组返回空数组', () => {
    const clamped = clampToViewport([], itemSize, viewport);
    expect(clamped).toEqual([]);
  });
});
