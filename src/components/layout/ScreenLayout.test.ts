import { describe, it, expect } from 'vitest';
import { LayoutManager } from '../../services/LayoutManager';

/**
 * Tests for ScreenLayout zone positioning logic.
 *
 * These tests verify that the LayoutManager-driven zone bounds used by
 * ScreenLayout components produce correct, non-overlapping positions
 * that satisfy the three-zone layout requirements.
 *
 * 需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
describe('ScreenLayout zone positioning', () => {
  const layout = new LayoutManager(1280, 720);

  it('Smart_Task_Zone is positioned at top-left', () => {
    const bounds = layout.getZoneBounds('smart_task_zone');
    expect(bounds.x).toBe(0);
    expect(bounds.y).toBe(0);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });

  it('Status_Bar is positioned at top-right', () => {
    const bounds = layout.getZoneBounds('status_bar');
    const screen = layout.getScreenSize();
    expect(bounds.x + bounds.width).toBe(screen.width);
    expect(bounds.y).toBe(0);
  });

  it('Main_Task_Area is positioned below the top zones', () => {
    const main = layout.getZoneBounds('main_task_area');
    const stz = layout.getZoneBounds('smart_task_zone');
    expect(main.y).toBeGreaterThan(stz.y + stz.height);
  });

  it('all three zones are within screen bounds', () => {
    const screen = layout.getScreenSize();
    const zones = ['smart_task_zone', 'status_bar', 'main_task_area'] as const;

    for (const zone of zones) {
      const b = layout.getZoneBounds(zone);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(screen.width);
      expect(b.y + b.height).toBeLessThanOrEqual(screen.height);
    }
  });

  it('Smart_Task_Zone and Status_Bar do not overlap', () => {
    expect(layout.checkOverlap('smart_task_zone', 'status_bar')).toBe(false);
  });

  it('top zones do not overlap with Main_Task_Area', () => {
    expect(layout.checkOverlap('smart_task_zone', 'main_task_area')).toBe(false);
    expect(layout.checkOverlap('status_bar', 'main_task_area')).toBe(false);
  });

  it('percentage conversion produces valid CSS values', () => {
    const screen = layout.getScreenSize();
    const pct = (px: number, base: number) => `${(px / base) * 100}%`;

    const stz = layout.getZoneBounds('smart_task_zone');
    expect(pct(stz.x, screen.width)).toBe('0%');
    expect(pct(stz.y, screen.height)).toBe('0%');

    const sb = layout.getZoneBounds('status_bar');
    const sbLeft = (sb.x / screen.width) * 100;
    expect(sbLeft).toBeGreaterThan(50); // right side of screen
  });
});
